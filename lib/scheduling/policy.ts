import { createClient } from "@supabase/supabase-js";
import { AcademySettings, Tutor } from "@/types/database";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * جلب إعدادات الأكاديمية العامة
 */
export async function getAcademySettings(): Promise<AcademySettings> {
  const { data, error } = await supabase
    .from("academy_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !data) {
    // إعدادات احتياطية في حال لم تكن مسجلة بعد في قاعدة البيانات
    return {
      id: 1,
      min_reschedule_notice_hours: 4,
      meeting_provider: "zoom_static",
      updated_at: new Date().toISOString(),
    };
  }

  return data as AcademySettings;
}

/**
 * التحقق من إمكانية تعديل أو إلغاء الحصة بناءً على سياسة المهلة الزمنية
 */
export async function canRescheduleSession(scheduledAtUtc: string): Promise<{
  allowed: boolean;
  minNoticeHours: number;
  hoursUntilSession: number;
}> {
  const settings = await getAcademySettings();
  const sessionTime = new Date(scheduledAtUtc).getTime();
  const now = Date.now();

  const diffInHours = (sessionTime - now) / (1000 * 60 * 60);

  return {
    allowed: diffInHours >= settings.min_reschedule_notice_hours,
    minNoticeHours: settings.min_reschedule_notice_hours,
    hoursUntilSession: Math.max(0, Number(diffInHours.toFixed(1))),
  };
}

/**
 * تحديد رابط الاجتماع للحصة (Zoom Static أو Dynamic)
 */
export async function resolveMeetingUrl(tutorId: string): Promise<string | null> {
  const settings = await getAcademySettings();

  if (settings.meeting_provider === "zoom_static") {
    const { data: tutor } = await supabase
      .from("tutors")
      .select("zoom_meeting_url")
      .eq("id", tutorId)
      .single();

    return (tutor as Tutor)?.zoom_meeting_url || null;
  }

  // في حال التوسيع لمزود dynamic مثل Google Meet
  return null;
}