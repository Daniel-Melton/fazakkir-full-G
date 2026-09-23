import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { generateRecurringSessions } from "@/lib/scheduling/generator";

const scheduleSchema = z.object({
  rules: z.array(
    z.object({
      day_of_week: z.number().min(0).max(6),
      time_utc: z.string().regex(/^\d{2}:\d{2}$/, "تنسيق الوقت غير صحيح (HH:MM)"),
    })
  ).min(1, "يجب تحديد موعد أسبوعي واحد على الأقل"),
  weeks_ahead: z.number().min(1).max(12).default(4),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: enrollmentId } = await params;

    // 1. التحقق من صلاحيات الجلسة
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return apiError("Unauthorized", 401);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      profile?.role !== "super_admin" &&
      profile?.role !== "academic_supervisor"
    ) {
      return apiError("Forbidden: Academic supervisors only", 403);
    }

    // 2. التحقق من المدخلات
    const body = await req.json();
    const parsed = scheduleSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    // 3. تشغيل محرك التوليد الآلي
    const result = await generateRecurringSessions({
      enrollment_id: enrollmentId,
      rules: parsed.data.rules,
      weeks_ahead: parsed.data.weeks_ahead,
    });

    return apiSuccess({
      message: `تم توليد ${result.inserted_count} حصة بنجاح`,
      ...result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return apiError(message, 500);
  }
}