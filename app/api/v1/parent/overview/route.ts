import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return apiError("Unauthorized", 401);
    }

    // 1. جلب بيانات الطلاب التابعين لهذا المستخدم
    const { data: students, error: studentsErr } = await supabase
      .from("students")
      .select("id, student_name, level, gender, created_at")
      .eq("parent_id", user.id);

    if (studentsErr) {
      return apiError("Database error", 500, studentsErr.message);
    }

    const studentIds = (students || []).map((s) => s.id);

    if (studentIds.length === 0) {
      return apiSuccess({ students: [], upcoming_sessions: [], past_sessions: [] });
    }

    // 2. جلب الحصص القادمة
    const nowIso = new Date().toISOString();
    const { data: upcomingSessions } = await supabase
      .from("class_sessions")
      .select(`
        id,
        scheduled_at_utc,
        duration_minutes,
        meeting_url,
        status,
        student_id,
        students ( student_name ),
        tutors (
          id,
          profiles ( full_name )
        )
      `)
      .in("student_id", studentIds)
      .eq("status", "scheduled")
      .gte("scheduled_at_utc", nowIso)
      .order("scheduled_at_utc", { ascending: true })
      .limit(10);

    // 3. جلب الحصص السابقة مع التقارير
    const { data: pastSessions } = await supabase
      .from("class_sessions")
      .select(`
        id,
        scheduled_at_utc,
        duration_minutes,
        status,
        student_id,
        students ( student_name ),
        tutors (
          profiles ( full_name )
        ),
        session_reports (
          attendance_status,
          surah_name,
          from_ayah,
          to_ayah,
          rating,
          homework,
          notes
        )
      `)
      .in("student_id", studentIds)
      .in("status", ["completed", "missed_by_student", "missed_by_tutor"])
      .order("scheduled_at_utc", { ascending: false })
      .limit(15);

    return apiSuccess({
      students: students || [],
      upcoming_sessions: upcomingSessions || [],
      past_sessions: pastSessions || [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return apiError(message, 500);
  }
}