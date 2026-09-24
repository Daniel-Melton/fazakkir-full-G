import { NextRequest } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { apiSuccess, apiError } from "@/lib/api-response";

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    // 1. التحقق من جلسة المشرف / المدير
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    let currentUserId = user?.id;

    if (!currentUserId) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.replace("Bearer ", "").trim();
        const { data: jwtUser } = await adminSupabase.auth.getUser(token);
        currentUserId = jwtUser?.user?.id;
      }
    }

    if (!currentUserId) {
      return apiError("Unauthorized", 401);
    }

    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", currentUserId)
      .single();

    if (!profile || !["super_admin", "academic_supervisor"].includes(profile.role)) {
      return apiError("Forbidden: Insufficient privileges", 403);
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    // 2. جلب الطلبات من جدول schedule_change_requests
    let query = adminSupabase
      .from("schedule_change_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data: rawRequests, error: reqErr } = await query;

    if (reqErr) {
      console.error("DB Error in schedule_change_requests:", reqErr);
      return apiError("Database error: " + reqErr.message, 500);
    }

    if (!rawRequests || rawRequests.length === 0) {
      return apiSuccess([]);
    }

    // 3. تجميع المعرفات لجلب بيانات الحصص والطلاب والمقدمين بسلاسة ودون JOIN معقد
    const sessionIds = Array.from(new Set(rawRequests.map((r) => r.session_id).filter(Boolean)));
    const requesterIds = Array.from(new Set(rawRequests.map((r) => r.requested_by).filter(Boolean)));

    // جلب الحصص
    const { data: sessions } = await adminSupabase
      .from("class_sessions")
      .select(`
        id,
        scheduled_at_utc,
        duration_minutes,
        student_id,
        tutor_id,
        students (
          id,
          student_name
        )
      `)
      .in("id", sessionIds);

    const sessionMap = new Map((sessions || []).map((s) => [s.id, s]));

    // جلب بروفايلات المعلمين والراغبين في الطلب
    const tutorIds = (sessions || []).map((s) => s.tutor_id).filter(Boolean);
    const allProfileIds = Array.from(new Set([...requesterIds, ...tutorIds]));

    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("id, full_name, email, role")
      .in("id", allProfileIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    // 4. بناء هيكل البيانات المتوافق مع شاشة المشرف
    const formattedRequests = rawRequests.map((r) => {
      const s = sessionMap.get(r.session_id);
      const requester = profileMap.get(r.requested_by);
      const tutor = s?.tutor_id ? profileMap.get(s.tutor_id) : null;
      const studentData = Array.isArray(s?.students) ? s?.students[0] : s?.students;

      return {
        id: r.id,
        session_id: r.session_id,
        reason: r.reason,
        status: r.status,
        supervisor_notes: r.supervisor_notes || null,
        created_at: r.created_at,
        requester: requester
          ? {
              full_name: requester.full_name,
              email: requester.email,
              role: requester.role,
            }
          : null,
        session: s
          ? {
              id: s.id,
              scheduled_at_utc: s.scheduled_at_utc,
              duration_minutes: s.duration_minutes,
              tutor: tutor
                ? { full_name: tutor.full_name, email: tutor.email }
                : null,
              student: studentData
                ? { student_name: studentData.student_name, level: "مبتدئ" }
                : null,
            }
          : null,
      };
    });

    return apiSuccess(formattedRequests);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    console.error("Crash in GET /api/v1/reschedule-requests:", err);
    return apiError(msg, 500);
  }
}