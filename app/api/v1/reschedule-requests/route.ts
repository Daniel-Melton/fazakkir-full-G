import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { apiSuccess, apiError } from "@/lib/api-response";
import { verifyUserRole } from "@/lib/auth/rbac";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    const { searchParams } = new URL(req.url);
    const filterStatus = searchParams.get("status"); // اختياري: pending, approved, rejected

    let query = supabase
      .from("schedule_change_requests")
      .select(`
        id,
        session_id,
        requested_by,
        reason,
        status,
        supervisor_notes,
        created_at,
        resolved_at,
        requester:requested_by (full_name, email, role),
        session:session_id (
          id,
          scheduled_at_utc,
          duration_minutes,
          tutor:tutor_id (full_name, email),
          student:student_id (student_name, level)
        )
      `)
      .order("created_at", { ascending: false });

    if (filterStatus) {
      query = query.eq("status", filterStatus);
    }

    const { data: requests, error: dbError } = await query;

    if (dbError) {
      return apiError("Failed to fetch reschedule requests", 500, dbError.message);
    }

    return apiSuccess({ requests });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return apiError(message, 500);
  }
}