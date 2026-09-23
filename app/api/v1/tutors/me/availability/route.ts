import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/api-response";

const availabilitySchema = z.array(
  z.object({
    day_of_week: z.number().min(0).max(6),
    start_time_utc: z.string().regex(/^\d{2}:\d{2}$/, "تنسيق الوقت غير صحيح (HH:MM)"),
    end_time_utc: z.string().regex(/^\d{2}:\d{2}$/, "تنسيق الوقت غير صحيح (HH:MM)"),
    is_active: z.boolean().default(true),
  })
);

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return apiError("Unauthorized", 401);
    }

    const { data: slots, error } = await supabase
      .from("tutor_availability")
      .select("id, day_of_week, start_time_utc, end_time_utc, is_active")
      .eq("tutor_id", user.id)
      .order("day_of_week", { ascending: true });

    if (error) {
      return apiError("Database error", 500, error.message);
    }

    return apiSuccess({ slots: slots || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return apiError(message, 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return apiError("Unauthorized", 401);
    }

    // التحقق من أن المستخدم مسجل كمعلم
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "tutor" && profile?.role !== "super_admin") {
      return apiError("Forbidden: only tutors can update availability", 403);
    }

    const body = await req.json();
    const parsed = availabilitySchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    // استبدال أوقات التفرغ السابقة بالمواعيد الجديدة
    const { error: deleteErr } = await supabase
      .from("tutor_availability")
      .delete()
      .eq("tutor_id", user.id);

    if (deleteErr) {
      return apiError("Failed to update availability", 500, deleteErr.message);
    }

    if (parsed.data.length > 0) {
      const inserts = parsed.data.map((item) => ({
        tutor_id: user.id,
        day_of_week: item.day_of_week,
        start_time_utc: `${item.start_time_utc}:00`,
        end_time_utc: `${item.end_time_utc}:00`,
        is_active: item.is_active,
      }));

      const { error: insertErr } = await supabase
        .from("tutor_availability")
        .insert(inserts);

      if (insertErr) {
        return apiError("Failed to insert availability slots", 500, insertErr.message);
      }
    }

    return apiSuccess({ message: "تم تحديث جدول التفرغ بنجاح" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return apiError(message, 500);
  }
}