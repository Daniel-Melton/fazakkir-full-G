import { createClient } from "@supabase/supabase-js";
import { resolveMeetingUrl } from "@/lib/scheduling/policy";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface WeeklyScheduleRule {
  day_of_week: number; // 0 = الأحد, 6 = السبت
  time_utc: string;    // "16:00"
}

export interface GenerateScheduleParams {
  enrollment_id: string;
  rules: WeeklyScheduleRule[];
  weeks_ahead?: number; // الافتراضي 4 أسابيع
  start_date?: Date;
}

export async function generateRecurringSessions({
  enrollment_id,
  rules,
  weeks_ahead = 4,
  start_date = new Date(),
}: GenerateScheduleParams) {
  // 1. جلب بيانات الاشتراك والطالب والمعلم
  const { data: enrollment, error: enrollError } = await supabase
    .from("enrollments")
    .select("id, student_id, tutor_id, class_duration_minutes, status")
    .eq("id", enrollment_id)
    .single();

  if (enrollError || !enrollment) {
    throw new Error("لم يتم العثور على الاشتراك المحدد");
  }

  if (!enrollment.tutor_id) {
    throw new Error("لا يمكن توليد الحصص قبل تسكين معلم للاشتراك");
  }

  const tutorId = enrollment.tutor_id;
  const durationMinutes = enrollment.class_duration_minutes || 30;

  // استخراج رابط الاجتماع المعتمد للمعلم
  const meetingUrl = await resolveMeetingUrl(tutorId);

  const sessionsToInsert: Array<{
    enrollment_id: string;
    tutor_id: string;
    student_id: string;
    scheduled_at_utc: string;
    duration_minutes: number;
    meeting_url: string | null;
    status: "scheduled";
  }> = [];

  const skippedConflicts: string[] = [];

  // 2. تكرار الحسابات عبر الأسابيع المطلوبة
  const baseDate = new Date(start_date);

  for (let week = 0; week < weeks_ahead; week++) {
    for (const rule of rules) {
      const [hours, minutes] = rule.time_utc.split(":").map(Number);

      // حساب اليوم المطلوب في هذا الأسبوع
      const sessionDate = new Date(baseDate);
      const currentDay = sessionDate.getUTCDay();
      let dayDiff = rule.day_of_week - currentDay;

      // إذا كان اليوم قد مضى في نفس الأسبوع الأساسي
      if (week === 0 && dayDiff < 0) {
        dayDiff += 7;
      }

      sessionDate.setUTCDate(sessionDate.getUTCDate() + (week * 7) + dayDiff);
      sessionDate.setUTCHours(hours, minutes, 0, 0);

      // تجاهل أي موعد يقع في الماضي
      if (sessionDate.getTime() <= Date.now()) {
        continue;
      }

      const sessionStartTime = sessionDate.toISOString();
      const sessionEndTime = new Date(
        sessionDate.getTime() + durationMinutes * 60000
      ).toISOString();

      // 3. فحص التعارض الزمني للمعلم مع أي حصة مجدولة سابقة
      const { data: conflicts } = await supabase
        .from("class_sessions")
        .select("id")
        .eq("tutor_id", tutorId)
        .in("status", ["scheduled", "completed"])
        .gte("scheduled_at_utc", sessionStartTime)
        .lt("scheduled_at_utc", sessionEndTime);

      if (conflicts && conflicts.length > 0) {
        skippedConflicts.push(sessionStartTime);
        continue;
      }

      sessionsToInsert.push({
        enrollment_id,
        tutor_id: tutorId,
        student_id: enrollment.student_id,
        scheduled_at_utc: sessionStartTime,
        duration_minutes: durationMinutes,
        meeting_url: meetingUrl,
        status: "scheduled",
      });
    }
  }

  // 4. إدراج الحصص دفعة واحدة
  if (sessionsToInsert.length > 0) {
    const { error: insertErr } = await supabase
      .from("class_sessions")
      .insert(sessionsToInsert);

    if (insertErr) {
      throw new Error(`فشل إدراج الحصص: ${insertErr.message}`);
    }
  }

  return {
    inserted_count: sessionsToInsert.length,
    skipped_conflicts_count: skippedConflicts.length,
    skipped_conflicts: skippedConflicts,
  };
}