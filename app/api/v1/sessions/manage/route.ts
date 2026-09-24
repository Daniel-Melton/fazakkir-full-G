import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api-response";
import { verifyUserRole } from "@/lib/auth/rbac";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const manageSchema = z.object({
  session_id: z.string().uuid(),
  action: z.enum(["reschedule", "cancel"]),
  new_scheduled_at_utc: z.string().optional(),
  new_tutor_id: z.string().optional().nullable(),
});

// PATCH /api/v1/sessions/manage
export async function PATCH(req: NextRequest) {
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
    const parsed = manageSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const { session_id, action, new_scheduled_at_utc, new_tutor_id } = parsed.data;

    // 1. جلب بيانات الحصة والاشتراك
    const { data: session, error: sessionFetchErr } = await supabase
      .from("class_sessions")
      .select(`
        id,
        enrollment_id,
        tutor_id,
        student_id,
        scheduled_at_utc,
        meeting_url,
        students (student_name, parent_id)
      `)
      .eq("id", session_id)
      .maybeSingle();

    if (sessionFetchErr || !session) {
      return apiError("Session not found", 404);
    }

    const studentName = (session.students as any)?.student_name || "الطالب";
    const parentId = (session.students as any)?.parent_id;
    const oldTutorId = session.tutor_id;

    // جلب الـ user_id الحقيقي للمعلم لإرسال الإشعار لحسابه
    let tutorUserId: string | null = null;
    if (oldTutorId) {
      const { data: tutorRecord } = await supabase
        .from("tutors")
        .select("user_id")
        .eq("id", oldTutorId)
        .maybeSingle();
      tutorUserId = tutorRecord?.user_id || oldTutorId;
    }

    // ==========================================
    // 2. معالجة الإلغاء (Cancel)
    // ==========================================
    if (action === "cancel") {
      const { error: cancelErr } = await supabase
        .from("class_sessions")
        .update({ 
          status: "cancelled",
          updated_at: new Date().toISOString() 
        })
        .eq("id", session_id);

      if (cancelErr) {
        console.error("DEBUG CANCEL ERROR class_sessions:", cancelErr);
        return apiError("Failed to cancel session: " + cancelErr.message, 500, cancelErr);
      }

      // تحرير حالة الاشتراك لتمكين المشرف من إعادة الجدولة مع الحفاظ على updated_at
      if (session.enrollment_id) {
        const { error: enrollErr } = await supabase
          .from("enrollments")
          .update({ 
            status: "trial_pending",
            updated_at: new Date().toISOString()
          })
          .eq("id", session.enrollment_id);

        if (enrollErr) {
          console.error("DEBUG CANCEL ERROR enrollments:", enrollErr);
        }
      }

      // إرسال إشعارات الإلغاء المباشرة
      const cancelNotifs = [];
      if (parentId) {
        cancelNotifs.push({
          user_id: parentId,
          type: "session_cancelled",
          title: "تم إلغاء موعد الحصة التجريبية",
          body: `تم إلغاء موعد الحصة التجريبية المقررة للطالب ${studentName}.`,
          link: "/dashboard/sessions",
          is_read: false,
        });
      }
      if (tutorUserId) {
        cancelNotifs.push({
          user_id: tutorUserId,
          type: "session_cancelled",
          title: "إلغاء حصة تجريبية",
          body: `تم إلغاء الحصة التجريبية الخاصة بالطالب ${studentName}.`,
          link: "/dashboard/tutor/sessions",
          is_read: false,
        });
      }

      if (cancelNotifs.length > 0) {
        await supabase.from("notifications").insert(cancelNotifs);
      }

      return apiSuccess({ message: "Session cancelled successfully" });
    }

    // ==========================================
    // 3. معالجة إعادة الجدولة وتغيير المعلم (Reschedule)
    // ==========================================
    if (action === "reschedule") {
      if (!new_scheduled_at_utc) {
        return apiError("New schedule date is required", 400);
      }

      const targetTutorId = new_tutor_id || oldTutorId;
      let meetingUrl = session.meeting_url;
      let targetTutorUserId = tutorUserId;

      // جلب رابط اجتماع ومعرف المعلم الجديد في حال تغييره
      if (new_tutor_id && new_tutor_id !== oldTutorId) {
        const { data: newTutorRecord } = await supabase
          .from("tutors")
          .select("zoom_meeting_url, user_id")
          .eq("id", new_tutor_id)
          .maybeSingle();

        if (newTutorRecord?.zoom_meeting_url) {
          meetingUrl = newTutorRecord.zoom_meeting_url;
        }
        if (newTutorRecord?.user_id) {
          targetTutorUserId = newTutorRecord.user_id;
        }
      }

      // تحديث بيانات الحصة مع الاحتفاظ الكامل بـ updated_at
      const { error: updateErr } = await supabase
        .from("class_sessions")
        .update({
          scheduled_at_utc: new_scheduled_at_utc,
          tutor_id: targetTutorId,
          meeting_url: meetingUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session_id);

      if (updateErr) {
        console.error("DEBUG RESCHEDULE ERROR class_sessions:", updateErr);
        return apiError("Failed to reschedule session: " + updateErr.message, 500, updateErr);
      }

      // تحديث المعلم في جدول الاشتراكات إذا تم اختياره مع updated_at
      if (new_tutor_id && session.enrollment_id) {
        await supabase
          .from("enrollments")
          .update({ 
            tutor_id: new_tutor_id, 
            updated_at: new Date().toISOString() 
          })
          .eq("id", session.enrollment_id);
      }

      const formattedDate = new Date(new_scheduled_at_utc).toLocaleString("ar-EG", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: "UTC",
      });

      // دالة ذكية: وسم الإشعار القديم كملغي ليظهر مشطوباً، وإدراج إشعار الموعد الجديد
      const recordRescheduledNotification = async (
        userId: string,
        newTitle: string,
        newBodyText: string,
        link: string
      ) => {
        // 1. البحث عن الإشعار القديم غير المشطوب لنفس الطالب وتحويله إلى ملغي
        const { data: oldNotif } = await supabase
          .from("notifications")
          .select("id, title")
          .eq("user_id", userId)
          .ilike("body", `%${studentName}%`)
          .not("title", "like", "%[ملغي]%")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (oldNotif) {
          await supabase
            .from("notifications")
            .update({
              title: `[ملغي] ${oldNotif.title}`,
              type: "session_cancelled",
              is_read: true,
            })
            .eq("id", oldNotif.id);
        }

        // 2. إدراج إشعار الموعد الجديد النشط
        await supabase.from("notifications").insert([
          {
            user_id: userId,
            type: "session_rescheduled",
            title: newTitle,
            body: newBodyText,
            link: link,
            is_read: false,
          },
        ]);
      };

      // 1. إشعار ولي الأمر بالموعد الجديد وشطب القديم
      if (parentId) {
        await recordRescheduledNotification(
          parentId,
          "تم تعديل موعد الحصة التجريبية",
          `الموعد الجديد للطالب ${studentName}: ${formattedDate} بتوقيت UTC. رابط الحصة: ${meetingUrl}`,
          "/dashboard/sessions"
        );
      }

      // 2. إشعار المعلم المعتمد للحصة وشطب القديم
      if (targetTutorUserId) {
        await recordRescheduledNotification(
          targetTutorUserId,
          "تعديل موعد حصة تجريبية",
          `الموعد الجديد للحصة التجريبية للطالب ${studentName}: ${formattedDate} بتوقيت UTC.`,
          "/dashboard/tutor/sessions"
        );
      }

      // 3. إشعار المعلم السابق بإلغاء الإسناد إذا تم التغيير
      if (new_tutor_id && new_tutor_id !== oldTutorId && tutorUserId) {
        await supabase.from("notifications").insert([
          {
            user_id: tutorUserId,
            type: "session_cancelled",
            title: "إلغاء إسناد حصة تجريبية",
            body: `تم تحويل موعد الحصة التجريبية للطالب ${studentName} إلى معلم آخر.`,
            link: "/dashboard/tutor/sessions",
            is_read: false,
          },
        ]);
      }

      return apiSuccess({ message: "Session rescheduled successfully" });
    }

    return apiError("Invalid action", 400);
  } catch (err: unknown) {
    console.error("DEBUG MANAGE ROUTE EXCEPTION:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return apiError(message, 500);
  }
}