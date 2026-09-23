import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api-response";
import { resolveMeetingUrl } from "@/lib/scheduling/policy";
import { dispatchNotification } from "@/lib/notifications/dispatcher";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const trialBookingSchema = z.object({
  parent_name: z.string().min(2, "اسم ولي الأمر مطلوب"),
  parent_email: z.string().email("البريد الإلكتروني غير صحيح"),
  parent_phone: z.string().min(6, "رقم الهاتف مطلوب"),
  student_name: z.string().min(2, "اسم الطالب مطلوب"),
  student_level: z.string().default("مبتدئ"),
  student_gender: z.enum(["male", "female"]).optional(),
  tutor_id: z.string().uuid("معرف المعلم غير صحيح"),
  scheduled_at_utc: z.string().datetime("تنسيق التاريخ والوقت غير صحيح"),
  duration_minutes: z.literal(30).default(30),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = trialBookingSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const {
      parent_name,
      parent_email,
      parent_phone,
      student_name,
      student_level,
      student_gender,
      tutor_id,
      scheduled_at_utc,
      duration_minutes,
    } = parsed.data;

    const requestedStartTime = new Date(scheduled_at_utc);
    const requestedEndTime = new Date(
      requestedStartTime.getTime() + duration_minutes * 60000
    );

    // 1. التحقق من عدم وجود تعارض زمني لدى المعلم في هذا الموعد
    const { data: conflicts, error: conflictErr } = await supabase
      .from("class_sessions")
      .select("id")
      .eq("tutor_id", tutor_id)
      .in("status", ["scheduled", "completed"])
      .gte("scheduled_at_utc", requestedStartTime.toISOString())
      .lt("scheduled_at_utc", requestedEndTime.toISOString());

    if (conflictErr) {
      return apiError("Database error during conflict check", 500, conflictErr.message);
    }

    if (conflicts && conflicts.length > 0) {
      return apiError("الموعد المختار محجوز بالفعل، يرجى اختيار موعد آخر", 409);
    }

    // 2. البحث عن ولي الأمر أو إنشاؤه عبر الـ Admin Auth
    let parentUserId: string;
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", parent_email)
      .maybeSingle();

    if (existingUser) {
      parentUserId = existingUser.id;
    } else {
      // إنشاء مستخدم جديد دون الحاجة لكلمة مرور مبدئية
      const { data: authUser, error: createAuthErr } =
        await supabase.auth.admin.createUser({
          email: parent_email,
          email_confirm: true,
          user_metadata: {
            full_name: parent_name,
            role: "parent_student",
          },
        });

      if (createAuthErr || !authUser.user) {
        return apiError("فشل إنشاء حساب ولي الأمر", 500, createAuthErr?.message);
      }

      parentUserId = authUser.user.id;

      // تحديث رقم الهاتف والملف الشخصي
      await supabase
        .from("profiles")
        .update({ phone: parent_phone, full_name: parent_name })
        .eq("id", parentUserId);
    }

    // 3. إنشاء سجل الطالب
    const { data: studentRecord, error: studentErr } = await supabase
      .from("students")
      .insert({
        parent_id: parentUserId,
        student_name,
        level: student_level,
        gender: student_gender || null,
      })
      .select("id")
      .single();

    if (studentErr || !studentRecord) {
      return apiError("فشل إنشاء ملف الطالب", 500, studentErr?.message);
    }

    // 4. إنشاء سجل الاشتراك التجريبي
    const { data: enrollmentRecord, error: enrollErr } = await supabase
      .from("enrollments")
      .insert({
        student_id: studentRecord.id,
        tutor_id,
        status: "trial_pending",
        plan_tier: "حصة تجريبية",
        weekly_classes_count: 1,
        class_duration_minutes: duration_minutes,
      })
      .select("id")
      .single();

    if (enrollErr || !enrollmentRecord) {
      return apiError("فشل تسجيل الاشتراك التجريبي", 500, enrollErr?.message);
    }

    // 5. استخراج رابط الحصة وحجزها
    const meetingUrl = await resolveMeetingUrl(tutor_id);

    const { data: sessionRecord, error: sessionErr } = await supabase
      .from("class_sessions")
      .insert({
        enrollment_id: enrollmentRecord.id,
        tutor_id,
        student_id: studentRecord.id,
        scheduled_at_utc: requestedStartTime.toISOString(),
        duration_minutes,
        meeting_url: meetingUrl,
        status: "scheduled",
      })
      .select("id, scheduled_at_utc, meeting_url")
      .single();

    if (sessionErr || !sessionRecord) {
      return apiError("فشل جدولة الحصة التجريبية", 500, sessionErr?.message);
    }

    // 6. إرسال إشعار فوري للمعلم المشترك
    const { data: tutorProfile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", tutor_id)
      .single();

    await dispatchNotification({
      userId: tutor_id,
      userEmail: tutorProfile?.email,
      type: "new_trial_booked",
      title: "حصة تجريبية جديدة محجوزة",
      body: `تم حجز حصة تجريبية جديدة للطالب ${student_name} بتاريخ ${requestedStartTime.toLocaleString("ar-EG")}.`,
      link: "/dashboard/sessions",
    });

    return apiSuccess({
      message: "تم حجز الحصة التجريبية بنجاح",
      booking: {
        session_id: sessionRecord.id,
        student_name,
        scheduled_at_utc: sessionRecord.scheduled_at_utc,
        meeting_url: sessionRecord.meeting_url,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return apiError(message, 500);
  }
}