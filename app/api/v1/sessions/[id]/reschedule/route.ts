import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api-response";
import { verifyUserRole } from "@/lib/auth/rbac";
import { canRescheduleSession } from "@/lib/scheduling/policy";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const rescheduleRequestSchema = z.object({
  reason: z.string().min(5, "Reason must be at least 5 characters long"),
  proposed_time_utc: z.string().datetime().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: sessionId } = await params;

    const authHeader = req.headers.get("authorization");
    const { error, profile, status } = await verifyUserRole(authHeader, [
      "super_admin",
      "academic_supervisor",
      "tutor",
      "parent_student",
    ]);

    if (error || !profile) {
      return apiError(error || "Unauthorized", status);
    }

    // 1. جلب تفاصيل الحصة والطالب
    const { data: session, error: sessionError } = await supabase
      .from("class_sessions")
      .select("id, tutor_id, student_id, scheduled_at_utc, status, students!inner(parent_id)")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return apiError("Session not found", 404);
    }

    // 2. التحقق من صلاحية الوصول للحصة بالتحديد
    if (profile.role === "tutor" && session.tutor_id !== profile.id) {
      return apiError("Forbidden: You are not assigned to this session", 403);
    }

    if (profile.role === "parent_student") {
      const studentData = session.students as unknown as { parent_id: string };
      if (studentData?.parent_id !== profile.id) {
        return apiError("Forbidden: You do not have authority over this student", 403);
      }
    }

    // 3. التحقق من سياسة المهلة الزمنية (Notice Policy)
    // الإدارة والمشرفون معفيون من شرط المهلة لحالات الطوارئ
    const isExempt = ["super_admin", "academic_supervisor"].includes(profile.role);
    if (!isExempt) {
      const check = await canRescheduleSession(session.scheduled_at_utc);
      if (!check.allowed) {
        return apiError(
          `Rescheduling is not allowed within ${check.minNoticeHours} hours of the session. Hours remaining: ${check.hoursUntilSession}`,
          400,
          { minNoticeHours: check.minNoticeHours, hoursRemaining: check.hoursUntilSession }
        );
      }
    }

    // 4. معالجة وتدقيق سبب الطلب
    const body = await req.json();
    const parsed = rescheduleRequestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    // 5. تسجيل الطلب في جدول schedule_change_requests
    const { data: requestRecord, error: insertError } = await supabase
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
      return apiError("Failed to submit reschedule request", 500, insertError.message);
    }

    // 6. تحديث حالة الحصة إلى rescheduled مؤقتاً أو انتظار الاعتماد
    await supabase
      .from("class_sessions")
      .update({ status: "rescheduled" })
      .eq("id", sessionId);

    return apiSuccess({ request: requestRecord }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return apiError(message, 500);
  }
}