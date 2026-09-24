import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return apiError("Unauthorized", 401);
    }

    // جلب دور المستخدم المسجل
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;

    // استعلام مبسط للحصص لضمان عدم حدوث تعارض في العلاقات
    let query = supabase.from("class_sessions").select(`
      id,
      scheduled_at_utc,
      duration_minutes,
      meeting_url,
      status,
      student_id,
      tutor_id,
      students (
        id,
        student_name
      )
    `);

    if (role === "tutor") {
      query = query.eq("tutor_id", user.id);
    } else if (role === "parent_student") {
      const { data: students } = await supabase
        .from("students")
        .select("id")
        .eq("parent_id", user.id);

      const studentIds = (students || []).map((s) => s.id);
      query = query.in("student_id", studentIds);
    } else if (role !== "super_admin" && role !== "academic_supervisor") {
      return apiError("Forbidden", 403);
    }

    const { data: sessions, error: dbErr } = await query.order(
      "scheduled_at_utc",
      { ascending: true }
    );

    if (dbErr) {
      console.error("DB Query Error in /api/v1/sessions:", dbErr);
      return apiError("Database error: " + dbErr.message, 500);
    }

    return apiSuccess(sessions || []);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("Server Crash in /api/v1/sessions:", err);
    return apiError(message, 500);
  }
}