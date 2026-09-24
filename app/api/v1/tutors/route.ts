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

    // جلب المعلمين مع معالجة الربط التلقائي بجدول profiles
    const { data: tutors, error: dbError } = await supabase
      .from("tutors")
      .select(`
        id,
        is_active,
        specialties,
        zoom_meeting_url,
        profiles (
          full_name,
          email,
          phone
        )
      `)
      .eq("is_active", true);

    if (dbError) {
      // بديل احتياطي في حال عدم وجود foreign key مباشر بين tutors و profiles:
      // جلب المعلمين ثم دمج بيانات profiles يدوياً لضمان عدم توقف الواجهة أبداً
      console.warn("Direct relation query failed, attempting manual join fallback:", dbError.message);

      const { data: rawTutors, error: rawError } = await supabase
        .from("tutors")
        .select("*")
        .eq("is_active", true);

      if (rawError) {
        return apiError("Failed to fetch tutors", 500, rawError.message);
      }

      // جمع المعرفات لجلب بيانات الحسابات المقابلة
      const targetIds = (rawTutors || []).map((t: any) => t.user_id || t.profile_id || t.id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone")
        .in("id", targetIds);

      const profilesMap = new Map((profilesData || []).map((p) => [p.id, p]));

      const mappedTutors = (rawTutors || []).map((t: any) => ({
        ...t,
        profiles: profilesMap.get(t.user_id || t.profile_id || t.id) || null,
      }));

      return apiSuccess({ tutors: mappedTutors });
    }

    return apiSuccess({ tutors });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return apiError(message, 500);
  }
}