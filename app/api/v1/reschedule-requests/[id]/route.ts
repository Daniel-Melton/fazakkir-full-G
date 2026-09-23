import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api-response";
import { verifyUserRole } from "@/lib/auth/rbac";
import { resolveMeetingUrl } from "@/lib/scheduling/policy";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resolveRequestSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  supervisor_notes: z.string().optional().nullable(),
  new_scheduled_at_utc: z.string().datetime().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: requestId } = await params;

    const authHeader = req.headers.get("authorization");
    const { error, profile, status } = await verifyUserRole(authHeader, [
      "super_admin",
      "academic_supervisor",
    ]);

    if (error || !profile) {
      return apiError(error || "Unauthorized", status);
    }

    const body = await req.json();
    const parsed = resolveRequestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const { status: decision, supervisor_notes, new_scheduled_at_utc } = parsed.data;

    // 1. جلب تفاصيل طلب إعادة الجدولة والحصة المرتبطة به
    const { data: requestRecord, error: requestError } = await supabase
      .from("schedule_change_requests")
      .select("id, session_id, requested_by, status")
      .eq("id", requestId)
      .single();

    if (requestError || !requestRecord) {
      return apiError("Reschedule request not found", 404);
    }

    if (requestRecord.status !== "pending") {
      return apiError(`Request is already resolved (${requestRecord.status})`, 400);
    }

    // 2. معالجة حالة القبول (Approved)
    if (decision === "approved") {
      if (!new_scheduled_at_utc) {
        return apiError("new_scheduled_at_utc is required when approving a reschedule request", 400);
      }

      const { data: session } = await supabase
        .from("class_sessions")
        .select("tutor_id, student_id")
        .eq("id", requestRecord.session_id)
        .single();

      const meetingUrl = session ? await resolveMeetingUrl(session.tutor_id) : null;

      // تحديث الحصة بالموعد الجديد وإعادتها لحالة scheduled
      const { error: sessionUpdateError } = await supabase
        .from("class_sessions")
        .update({
          scheduled_at_utc: new_scheduled_at_utc,
          status: "scheduled",
          ...(meetingUrl ? { meeting_url: meetingUrl } : {}),
        })
        .eq("id", requestRecord.session_id);

      if (sessionUpdateError) {
        return apiError("Failed to update session schedule", 500, sessionUpdateError.message);
      }
    } else {
      // في حالة الرفض، إعادة الحصة لحالتها الأصلية scheduled
      await supabase
        .from("class_sessions")
        .update({ status: "scheduled" })
        .eq("id", requestRecord.session_id);
    }

    // 3. تحديث سجل الطلب بقرار المشرف
    const { data: updatedRequest, error: updateError } = await supabase
      .from("schedule_change_requests")
      .update({
        status: decision,
        supervisor_notes: supervisor_notes || null,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .select()
      .single();

    if (updateError) {
      return apiError("Failed to update request record", 500, updateError.message);
    }

    // 4. إرسال إشعار لصاحب الطلب بالقرار
    await supabase.from("notifications").insert([
      {
        user_id: requestRecord.requested_by,
        type: "reschedule_decision",
        title: decision === "approved" ? "تم قبول طلب تعديل الموعد" : "تم رفض طلب تعديل الموعد",
        body: supervisor_notes || (decision === "approved" ? "تم تحديث موعد الحصة بنجاح." : "تعذر تعديل الموعد الحالي."),
        link: `/dashboard/sessions/${requestRecord.session_id}`,
      },
    ]);

    return apiSuccess({ request: updatedRequest });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return apiError(message, 500);
  }
}