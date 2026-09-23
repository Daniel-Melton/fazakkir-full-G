import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api-response";
import { verifyUserRole } from "@/lib/auth/rbac";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const sessionReportSchema = z.object({
  attended: z.boolean(),
  surah_from: z.string().optional().nullable(),
  ayah_from: z.number().int().positive().optional().nullable(),
  surah_to: z.string().optional().nullable(),
  ayah_to: z.number().int().positive().optional().nullable(),
  grade_performance: z.number().int().min(1).max(5).optional().nullable(),
  tutor_feedback: z.string().optional().nullable(),
  homework: z.string().optional().nullable(),
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
    ]);

    if (error || !profile) {
      return apiError(error || "Unauthorized", status);
    }

    // 1. التحقق من وجود الحصة وصلاحية المعلم عليها
    const { data: session, error: sessionFetchError } = await supabase
      .from("class_sessions")
      .select("id, tutor_id, status")
      .eq("id", sessionId)
      .single();

    if (sessionFetchError || !session) {
      return apiError("Session not found", 404);
    }

    if (profile.role === "tutor" && session.tutor_id !== profile.id) {
      return apiError("Forbidden: You can only submit reports for your own sessions", 403);
    }

    // 2. التحقق من صحة البيانات المدخلة
    const body = await req.json();
    const parsed = sessionReportSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    // 3. إدراج أو تحديث تقرير الحصة (Upsert)
    const reportPayload = {
      session_id: sessionId,
      ...parsed.data,
    };

    const { data: report, error: reportError } = await supabase
      .from("session_reports")
      .upsert([reportPayload], { onConflict: "session_id" })
      .select()
      .single();

    if (reportError) {
      return apiError("Failed to save session report", 500, reportError.message);
    }

    // 4. تحديث حالة الحصة تلقائياً إلى مكتملة (completed) إذا لم تكن كذلك
    await supabase
      .from("class_sessions")
      .update({ status: "completed" })
      .eq("id", sessionId);

    return apiSuccess({ report }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return apiError(message, 500);
  }
}