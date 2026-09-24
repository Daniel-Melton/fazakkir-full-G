import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api-response";
import { verifyUserRole } from "@/lib/auth/rbac";
import { dispatchNotification } from "@/lib/notifications/dispatcher";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const updateEnrollmentSchema = z.object({
  enrollment_id: z.string().uuid(),
  tutor_id: z
    .any()
    .transform((val) => (!val || val === "" ? null : String(val)))
    .nullable()
    .optional(),
  status: z
    .enum(["trial_pending", "trial_completed", "active", "paused", "cancelled"])
    .optional(),
});
// GET /api/v1/enrollments
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const { error, profile, status } = await verifyUserRole(authHeader, [
      "super_admin",
      "academic_supervisor",
    ]);

    if (error || !profile) {
      return apiError(error || "Unauthorized", status);
    }

    const { data: enrollments, error: dbError } = await supabase
      .from("enrollments")
      .select(`
        id,
        status,
        plan_tier,
        weekly_classes_count,
        class_duration_minutes,
        created_at,
        tutor_id,
        preferred_tutor_id,
        students (
          id,
          student_name,
          level,
          gender,
          parent:parent_id (
            id,
            full_name,
            email,
            phone
          )
        ),
        class_sessions (
          id,
          scheduled_at_utc,
          meeting_url,
          status
        )
      `)
      .order("created_at", { ascending: false });

    if (dbError) {
      return apiError("Failed to fetch enrollments", 500, dbError.message);
    }

    return apiSuccess({ enrollments });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return apiError(message, 500);
  }
}

// // PATCH /api/v1/enrollments
// export async function PATCH(req: NextRequest) {
//   try {
//     const authHeader = req.headers.get("authorization");
//     const { error, profile, status } = await verifyUserRole(authHeader, [
//       "super_admin",
//       "academic_supervisor",
//     ]);

//     if (error || !profile) {
//       return apiError(error || "Unauthorized", status);
//     }

//     const body = await req.json();
//     const parsed = updateEnrollmentSchema.safeParse(body);

//     if (!parsed.success) {
//       return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
//     }

//     const { enrollment_id, tutor_id, status: newStatus } = parsed.data;

//     const updatePayload: Record<string, unknown> = {
//       updated_at: new Date().toISOString(),
//     };
//     if (tutor_id !== undefined) updatePayload.tutor_id = tutor_id;
//     if (newStatus !== undefined) updatePayload.status = newStatus;

//     const { data: updatedEnrollment, error: updateError } = await supabase
//       .from("enrollments")
//       .update(updatePayload)
//       .eq("id", enrollment_id)
//       .select(`
//         id,
//         status,
//         students (
//           student_name,
//           parent_id,
//           profiles:parent_id (email, full_name)
//         )
//       `)
//       .single();

//     if (updateError || !updatedEnrollment) {
//       return apiError("Failed to update enrollment", 500, updateError?.message);
//     }

//     // إشعار ولي الأمر عند تعيين المعلم
//     type ParentData = {
//       student_name: string;
//       parent_id: string;
//       profiles: { email: string; full_name: string } | null;
//     };
//     const studentInfo = updatedEnrollment.students as unknown as ParentData;

//     if (studentInfo?.parent_id && tutor_id) {
//       await dispatchNotification({
//         userId: studentInfo.parent_id,
//         userEmail: studentInfo.profiles?.email,
//         type: "session_reminder",
//         title: "تم تعيين المعلم الخاص بالطالب",
//         body: `تم تعيين المعلم وتحديث بيانات اشتراك ${studentInfo.student_name}. يمكنك الآن مراجعة الجدول.`,
//         link: "/dashboard/sessions",
//       });
//     }

//     return apiSuccess({ enrollment: updatedEnrollment });
//   } catch (err: unknown) {
//     const message = err instanceof Error ? err.message : "Internal Server Error";
//     return apiError(message, 500);
//   }
// }

// PATCH /api/v1/enrollments
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
    console.log("--> PATCH enrollment payload received:", body);

    const parsed = updateEnrollmentSchema.safeParse(body);

    if (!parsed.success) {
      console.error("--> Validation error on PATCH:", parsed.error.flatten());
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const { enrollment_id, tutor_id, status: newStatus } = parsed.data;

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (tutor_id !== undefined) updatePayload.tutor_id = tutor_id;
    if (newStatus !== undefined) updatePayload.status = newStatus;

    // تحديث السجل في قاعدة البيانات
    const { data: updatedEnrollment, error: updateError } = await supabase
      .from("enrollments")
      .update(updatePayload)
      .eq("id", enrollment_id)
      .select("*")
      .single();

    if (updateError || !updatedEnrollment) {
      console.error("--> Supabase Update Error:", updateError);
      return apiError(updateError?.message || "Failed to update enrollment", 500, updateError);
    }

    console.log("--> Successfully updated enrollment:", updatedEnrollment.id);

    // محاولة إرسال إشعار إذا تم تحديد المعلم
    if (tutor_id) {
      try {
        const { data: studentData } = await supabase
          .from("students")
          .select("student_name, parent_id, profiles:parent_id (email, full_name)")
          .eq("id", updatedEnrollment.student_id)
          .maybeSingle();

        const parentProfile = (studentData as any)?.profiles;
        if (studentData?.parent_id) {
          await dispatchNotification({
            userId: studentData.parent_id,
            userEmail: parentProfile?.email,
            type: "session_reminder",
            title: "تم تعيين المعلم الخاص بالطالب",
            body: `تم تعيين المعلم وتحديث بيانات اشتراك ${studentData.student_name}. يمكنك الآن مراجعة الجدول.`,
            link: "/dashboard/sessions",
          });
        }
      } catch (notifErr) {
        console.warn("--> Failed to send notification (non-critical):", notifErr);
      }
    }

    return apiSuccess({ enrollment: updatedEnrollment });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("--> Unexpected error in PATCH enrollment:", err);
    return apiError(message, 500);
  }
}