import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api-response";
import { verifyUserRole } from "@/lib/auth/rbac";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const createSessionSchema = z.object({
  enrollment_id: z.string().uuid(),
  tutor_id: z.string().uuid(),
  student_id: z.string().uuid(),
  scheduled_at_utc: z.string().datetime(),
  duration_minutes: z.union([z.literal(30), z.literal(45), z.literal(60)]),
  meeting_url: z.string().url().optional().nullable(),
});

// GET /api/v1/sessions
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

    let query = supabase.from("class_sessions").select(`
      id,
      scheduled_at_utc,
      duration_minutes,
      meeting_url,
      status,
      created_at,
      students (id, student_name, level),
      profiles:tutor_id (full_name, email)
    `);

    // تطبيق فلترة البيانات حسب الصلاحيات (RBAC)
    if (profile.role === "tutor") {
      query = query.eq("tutor_id", profile.id);
    } else if (profile.role === "parent_student") {
      // جلب معرفات أبناء ولي الأمر أولاً
      const { data: kids } = await supabase
        .from("students")
        .select("id")
        .eq("parent_id", profile.id);
      
      const studentIds = kids?.map((k) => k.id) || [];
      query = query.in("student_id", studentIds);
    }

    const { data: sessions, error: dbError } = await query.order("scheduled_at_utc", {
      ascending: true,
    });

    if (dbError) {
      return apiError("Failed to fetch sessions", 500, dbError.message);
    }

    return apiSuccess({ sessions });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return apiError(message, 500);
  }
}

// POST /api/v1/sessions
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
    const parsed = createSessionSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const { data: newSession, error: insertError } = await supabase
      .from("class_sessions")
      .insert([parsed.data])
      .select()
      .single();

    if (insertError) {
      return apiError("Failed to schedule session", 500, insertError.message);
    }

    return apiSuccess({ session: newSession }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return apiError(message, 500);
  }
}