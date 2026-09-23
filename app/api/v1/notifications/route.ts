import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { apiSuccess, apiError } from "@/lib/api-response";
import { verifyUserRole } from "@/lib/auth/rbac";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/v1/notifications
export async function GET(req: NextRequest) {
  try {
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

    const { data: notifications, error: dbError } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (dbError) {
      return apiError("Failed to fetch notifications", 500, dbError.message);
    }

    return apiSuccess({ notifications });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return apiError(message, 500);
  }
}