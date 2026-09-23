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

    const { data: tutors, error: dbError } = await supabase
      .from("tutors")
      .select(`
        id,
        is_active,
        specialties,
        zoom_meeting_url,
        profiles:id (
          full_name,
          email,
          phone
        )
      `)
      .eq("is_active", true);

    if (dbError) {
      return apiError("Failed to fetch tutors", 500, dbError.message);
    }

    return apiSuccess({ tutors });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return apiError(message, 500);
  }
}