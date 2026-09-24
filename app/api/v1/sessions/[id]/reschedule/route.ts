import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { apiSuccess, apiError } from "@/lib/api-response";
import { canRescheduleSession } from "@/lib/scheduling/policy";

// عميل الصلاحيات الإدارية لتنفيذ العمليات التي تتجاوز قيود الـ RLS
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const rescheduleRequestSchema = z.object({
  reason: z.string().min(5, "يجب ألا يقل السبب عن 5 أحرف"),
  proposed_time_utc: z.string().datetime().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: sessionId } = await params;

    // 1. استخراج والتحقق من جلسة المستخدم من الكوكيز أو الترويسة
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    let currentUserId = user?.id;

    // فحص احتياطي عبر الترويسة في حال لم تكن الكوكيز متزامنة
    if (!currentUserId) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.replace("Bearer ", "").trim();
        const { data: jwtUser } = await adminSupabase.auth.getUser(token);
        currentUserId = jwtUser?.user?.id;
      }
    }

    if (!currentUserId) {
      return apiError("Missing or invalid authorization token", 401);
    }

    // جلب دور وبيانات بروفايل المستخدم
    const { data: profile, error: profileErr } = await adminSupabase
      .from("profiles")
      .select("id, role, full_name")
      .eq("id", currentUserId)
      .single();

    if (profileErr || !profile) {
      return apiError("User profile not found", 401);
    }

    // 2. جلب تفاصيل الحصة والطالب
    const { data: session, error: sessionError } = await adminSupabase
      .from("class_sessions")
      .select("id, tutor_id, student_id, scheduled_at_utc, status, students!inner(parent_id)")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return apiError("Session not found", 404);
    }

    // 3. التحقق من صلاحية الوصول للحصة
    if (profile.role === "tutor" && session.tutor_id !== profile.id) {
      return apiError("Forbidden: You are not assigned to this session", 403);
    }

    if (profile.role === "parent_student") {
      const studentData = session.students as unknown as { parent_id: string };
      if (studentData?.parent_id !== profile.id) {
        return apiError("Forbidden: You do not have authority over this student", 403);
      }
    }

    // 4. التحقق من سياسة المهلة الزمنية (Notice Policy)
    const isExempt = ["super_admin", "academic_supervisor"].includes(profile.role);
    if (!isExempt) {
      const check = await canRescheduleSession(session.scheduled_at_utc);
      if (!check.allowed) {
        return apiError(
          `لا يمكن إعادة الجدولة قبل الموعد بأقل من ${check.minNoticeHours} ساعات. الساعات المتبقية: ${check.hoursUntilSession}`,
          400,
          { minNoticeHours: check.minNoticeHours, hoursRemaining: check.hoursUntilSession }
        );
      }
    }

    // 5. معالجة وتدقيق سبب الطلب
    const body = await req.json();
    const parsed = rescheduleRequestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("بيانات الطلب غير صالحة", 400, parsed.error.flatten().fieldErrors);
    }

    // 6. تسجيل الطلب في جدول schedule_change_requests
    const { data: requestRecord, error: insertError } = await adminSupabase
      .from("schedule_change_requests")
      .insert([
        {
          session_id: sessionId,
          requested_by: profile.id,
          reason: parsed.data.reason,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Reschedule Request DB Error:", insertError);
      return apiError("Failed to submit reschedule request: " + insertError.message, 500);
    }

    // 7. تحديث حالة الحصة إلى rescheduled مؤقتاً
    await adminSupabase
      .from("class_sessions")
      .update({ status: "rescheduled" })
      .eq("id", sessionId);

    return apiSuccess({ request: requestRecord }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("Reschedule Route Crash:", err);
    return apiError(message, 500);
  }
}