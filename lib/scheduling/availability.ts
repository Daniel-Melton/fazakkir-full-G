import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TimeSlot {
  start_time: string; // ISO String
  end_time: string;   // ISO String
  available: boolean;
}

export async function getTutorAvailableSlots(
  tutorId: string,
  startDateUtc: Date,
  endDateUtc: Date,
  slotDurationMinutes: number = 30
): Promise<TimeSlot[]> {
  // 1. جلب جدول التفرغ الأسبوعي للمعلم
  const { data: recurringRules, error: rulesError } = await supabase
    .from("tutor_availability")
    .select("day_of_week, start_time_utc, end_time_utc")
    .eq("tutor_id", tutorId)
    .eq("is_active", true);

  if (rulesError || !recurringRules) {
    return [];
  }

  // 2. جلب الحصص المحجوزة بالفعل في هذا النطاق الزمني
  const { data: bookedSessions, error: sessionsError } = await supabase
    .from("class_sessions")
    .select("scheduled_at_utc, duration_minutes, status")
    .eq("tutor_id", tutorId)
    .gte("scheduled_at_utc", startDateUtc.toISOString())
    .lte("scheduled_at_utc", endDateUtc.toISOString())
    .in("status", ["scheduled", "completed"]);

  if (sessionsError) {
    return [];
  }

  const generatedSlots: TimeSlot[] = [];
  const currentDate = new Date(startDateUtc);

  // 3. توليد الشرائح الزمنية ومطابقتها مع الحجوزات
  while (currentDate <= endDateUtc) {
    const dayOfWeek = currentDate.getUTCDay();
    const rulesForDay = recurringRules.filter((r) => r.day_of_week === dayOfWeek);

    for (const rule of rulesForDay) {
      const [startH, startM] = rule.start_time_utc.split(":").map(Number);
      const [endH, endM] = rule.end_time_utc.split(":").map(Number);

      const slotStart = new Date(currentDate);
      slotStart.setUTCHours(startH, startM, 0, 0);

      const ruleEnd = new Date(currentDate);
      ruleEnd.setUTCHours(endH, endM, 0, 0);

      while (slotStart.getTime() + slotDurationMinutes * 60000 <= ruleEnd.getTime()) {
        const slotEnd = new Date(slotStart.getTime() + slotDurationMinutes * 60000);

        // هل هذه الشريحة تتعارض مع حصة محجوزة؟
        const isConflict = bookedSessions?.some((session) => {
          const sessionStart = new Date(session.scheduled_at_utc).getTime();
          const sessionEnd = sessionStart + session.duration_minutes * 60000;
          return (
            slotStart.getTime() < sessionEnd && slotEnd.getTime() > sessionStart
          );
        });

        // التأكد من أن الموعد ليس في الماضي
        const isFuture = slotStart.getTime() > Date.now();

        generatedSlots.push({
          start_time: slotStart.toISOString(),
          end_time: slotEnd.toISOString(),
          available: !isConflict && isFuture,
        });

        slotStart.setMinutes(slotStart.getMinutes() + slotDurationMinutes);
      }
    }

    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return generatedSlots;
}