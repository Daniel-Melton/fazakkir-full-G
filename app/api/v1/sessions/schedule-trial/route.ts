import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api-response";
import { verifyUserRole } from "@/lib/auth/rbac";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const scheduleSchema = z.object({
  enrollment_id: z.string().uuid(),
  tutor_id: z.any().transform((val) => String(val)),
  scheduled_at_utc: z.string(),
  duration_minutes: z.number().default(30),
});

// POST /api/v1/sessions/schedule-trial
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const { error, profile, status } = await verifyUserRole(authHeader, [
      "super_admin",
      "academic_supervisor",
    ]);

    if (error || !profile) {
      return apiError(error || "Unauthorized", status);
    }

    const body = await req.json();
    const parsed = scheduleSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const { enrollment_id, tutor_id, scheduled_at_utc, duration_minutes } = parsed.data;

    // 1. جلب بيانات الاشتراك والطالب
    const { data: enrollment, error: enrollErr } = await supabase
      .from("enrollments")
      .select(`
        id,
        student_id,
        students (
          id,
          student_name,
          parent_id
        )
      `)
      .eq("id", enrollment_id)
      .single();

    if (enrollErr || !enrollment) {
      return apiError("Enrollment not found", 404);
    }

    // 2. جلب رابط اجتماع المعلم ومعرف حسابه
    const { data: tutorData } = await supabase
      .from("tutors")
      .select("id, zoom_meeting_url, user_id")
      .eq("id", tutor_id)
      .maybeSingle();

    const meetingUrl = tutorData?.zoom_meeting_url || "https://zoom.us/join";
    const student = enrollment.students as any;
    const studentName = student?.student_name || "الطالب";
    const parentId = student?.parent_id;

    // 3. إدراج الحصة في جدول class_sessions
    const { data: sessionData, error: sessionErr } = await supabase
      .from("class_sessions")
      .insert([
        {
          enrollment_id,
          tutor_id,
          student_id: enrollment.student_id,
          scheduled_at_utc,
          duration_minutes,
          meeting_url: meetingUrl,
          status: "scheduled",
        },
      ])
      .select()
      .single();

    if (sessionErr) {
      return apiError("Failed to create class session", 500, sessionErr.message);
    }

    // 4. تحديث حالة الاشتراك إلى trial_pending وتثبيت المعلم
    await supabase
      .from("enrollments")
      .update({
        tutor_id,
        status: "trial_pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", enrollment_id);

    // تنسيق التاريخ والوقت لرسائل الإشعارات
    const formattedDate = new Date(scheduled_at_utc).toLocaleString("ar-EG", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "UTC",
    });

    // 5. إدراج الإشعارات في جدول notifications
    const notificationsToInsert = [];

    // إشعار ولي الأمر
    if (parentId) {
      notificationsToInsert.push({
        user_id: parentId,
        type: "trial_scheduled",
        title: "تم تحديد موعد الحصة التجريبية",
        body: `تم تحديد موعد الحصة التجريبية للطالب ${studentName} بتاريخ ${formattedDate} بتوقيت UTC. رابط الحصة: ${meetingUrl}`,
        link: "/dashboard/sessions",
        is_read: false,
      });
    }

    // إشعار المعلم
    const tutorUserId = tutorData?.user_id || tutor_id;
    if (tutorUserId) {
      notificationsToInsert.push({
        user_id: tutorUserId,
        type: "trial_scheduled",
        title: "حصة تجريبية جديدة مسندة إليك",
        body: `لديك حصة تجريبية جديدة مع الطالب ${studentName} بتاريخ ${formattedDate} بتوقيت UTC.`,
        link: "/dashboard/tutor/sessions",
        is_read: false,
      });
    }

    if (notificationsToInsert.length > 0) {
      await supabase.from("notifications").insert(notificationsToInsert);
    }

    return apiSuccess({
      session: sessionData,
      message: "Trial session scheduled successfully",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return apiError(message, 500);
  }
}