import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { apiSuccess, apiError } from "@/lib/api-response";
import { dispatchNotification } from "@/lib/notifications/dispatcher";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RawSessionItem {
  id: string;
  scheduled_at_utc: string;
  meeting_url: string | null;
  tutor_id: string;
  student_id: string;
  students: any;
  tutors: any;
}

// دالة مساعدة لفك الكائنات والمصفوفات بأمان
function normalizeSessionRelations(session: RawSessionItem) {
  const studentData = Array.isArray(session.students)
    ? session.students[0]
    : session.students;

  const parentProfile = studentData
    ? Array.isArray(studentData.profiles)
      ? studentData.profiles[0]
      : studentData.profiles
    : null;

  const tutorData = Array.isArray(session.tutors)
    ? session.tutors[0]
    : session.tutors;

  const tutorProfile = tutorData
    ? Array.isArray(tutorData.profiles)
      ? tutorData.profiles[0]
      : tutorData.profiles
    : null;

  return {
    studentName: studentData?.student_name || "الطالب",
    parentId: studentData?.parent_id as string | undefined,
    parentEmail: parentProfile?.email as string | undefined,
    tutorEmail: tutorProfile?.email as string | undefined,
  };
}

export async function GET(req: NextRequest) {
  try {
    // 1. التحقق من مفتاح الحماية للـ Cron Job لمنع الوصول العشوائي
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "cron_dev_secret";

    if (authHeader !== `Bearer ${cronSecret}`) {
      return apiError("Unauthorized: Invalid Cron Secret", 401);
    }

    const now = new Date();
    const sentCount = { reminders_24h: 0, reminders_2h: 0 };

    // --- أ. فحص تذكير الـ 24 ساعة (الحصص التي تبدأ بين 23.5 إلى 24.5 ساعة من الآن) ---
    const window24hStart = new Date(now.getTime() + 23.5 * 60 * 60 * 1000).toISOString();
    const window24hEnd = new Date(now.getTime() + 24.5 * 60 * 60 * 1000).toISOString();

    const { data: rawSessions24h } = await supabase
      .from("class_sessions")
      .select(`
        id,
        scheduled_at_utc,
        meeting_url,
        tutor_id,
        student_id,
        students ( student_name, parent_id, profiles:parent_id ( email ) ),
        tutors ( profiles:id ( email, full_name ) )
      `)
      .eq("status", "scheduled")
      .eq("reminder_24h_sent", false)
      .gte("scheduled_at_utc", window24hStart)
      .lte("scheduled_at_utc", window24hEnd);

    const sessions24h = (rawSessions24h as unknown as RawSessionItem[]) || [];

    for (const session of sessions24h) {
      const { studentName, parentId, parentEmail, tutorEmail } =
        normalizeSessionRelations(session);
      const sessionDate = new Date(session.scheduled_at_utc).toLocaleString("ar-EG");

      // إشعار ولي الأمر
      if (parentId) {
        await dispatchNotification({
          userId: parentId,
          userEmail: parentEmail,
          type: "session_reminder",
          title: "تذكير: موعد الحصة غداً",
          body: `نذكركم بموعد حصة الطالب ${studentName} غداً في تمام ${sessionDate}.`,
          link: "/dashboard/parent",
        });
      }

      // إشعار المعلم
      if (session.tutor_id) {
        await dispatchNotification({
          userId: session.tutor_id,
          userEmail: tutorEmail,
          type: "session_reminder",
          title: "تذكير: موعد حصة غداً",
          body: `لديك حصة مجدولة غداً مع الطالب ${studentName} في تمام ${sessionDate}.`,
          link: "/dashboard/sessions",
        });
      }

      await supabase
        .from("class_sessions")
        .update({ reminder_24h_sent: true })
        .eq("id", session.id);

      sentCount.reminders_24h++;
    }

    // --- ب. فحص تذكير الساعتين العاجل (الحصص التي تبدأ بين 1.5 إلى 2.5 ساعة من الآن) ---
    const window2hStart = new Date(now.getTime() + 1.5 * 60 * 60 * 1000).toISOString();
    const window2hEnd = new Date(now.getTime() + 2.5 * 60 * 60 * 1000).toISOString();

    const { data: rawSessions2h } = await supabase
      .from("class_sessions")
      .select(`
        id,
        scheduled_at_utc,
        meeting_url,
        tutor_id,
        student_id,
        students ( student_name, parent_id, profiles:parent_id ( email ) ),
        tutors ( profiles:id ( email, full_name ) )
      `)
      .eq("status", "scheduled")
      .eq("reminder_2h_sent", false)
      .gte("scheduled_at_utc", window2hStart)
      .lte("scheduled_at_utc", window2hEnd);

    const sessions2h = (rawSessions2h as unknown as RawSessionItem[]) || [];

    for (const session of sessions2h) {
      const { studentName, parentId, parentEmail, tutorEmail } =
        normalizeSessionRelations(session);

      // إشعار عاجل لولي الأمر مع الرابط
      if (parentId) {
        await dispatchNotification({
          userId: parentId,
          userEmail: parentEmail,
          type: "session_reminder",
          title: "تذكير عاجل: الحصة تبدأ خلال ساعتين",
          body: `حصة الطالب ${studentName} ستبدأ قريباً. يرجى الاستعداد والتأكد من الاتصال بالإنترنت.`,
          link: session.meeting_url || "/dashboard/parent",
        });
      }

      // إشعار عاجل للمعلم
      if (session.tutor_id) {
        await dispatchNotification({
          userId: session.tutor_id,
          userEmail: tutorEmail,
          type: "session_reminder",
          title: "تذكير عاجل: حصة خلال ساعتين",
          body: `حصتك القادمة مع ${studentName} تبدأ خلال ساعتين.`,
          link: session.meeting_url || "/dashboard/sessions",
        });
      }

      await supabase
        .from("class_sessions")
        .update({ reminder_2h_sent: true })
        .eq("id", session.id);

      sentCount.reminders_2h++;
    }

    return apiSuccess({
      message: "Cron execution completed successfully",
      stats: sentCount,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return apiError(message, 500);
  }
}