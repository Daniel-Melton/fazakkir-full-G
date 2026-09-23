import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey && !resendApiKey.includes("dummy") ? new Resend(resendApiKey) : null;

interface NotificationPayload {
  userId: string;
  userEmail?: string | null;
  type: "session_reminder" | "reschedule_request" | "reschedule_decision" | "session_report";
  title: string;
  body: string;
  link?: string;
}

export async function dispatchNotification({
  userId,
  userEmail,
  type,
  title,
  body,
  link,
}: NotificationPayload): Promise<{ inAppSuccess: boolean; emailSuccess: boolean }> {
  let inAppSuccess = false;
  let emailSuccess = false;

  // 1. تسجيل الإشعار داخل النظام (In-App)
  try {
    const { error: dbError } = await supabase.from("notifications").insert([
      {
        user_id: userId,
        type,
        title,
        body,
        link: link || null,
        is_read: false,
      },
    ]);

    if (!dbError) inAppSuccess = true;
  } catch (err) {
    console.error("Failed to insert in-app notification:", err);
  }

  // 2. إرسال البريد الإلكتروني عبر Resend (في حال توفر إيميل ومفتاح حقيقي)
  if (userEmail && resend) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fazakkir.com";
      const actionButton = link
        ? `<div style="margin-top: 20px;"><a href="${baseUrl}${link}" style="background-color: #059669; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">عرض التفاصيل</a></div>`
        : "";

      await resend.emails.send({
        from: "أكاديمية فذكّر <notifications@fazakkir.com>",
        to: userEmail,
        subject: title,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
            <h2 style="color: #059669; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">${title}</h2>
            <p style="font-size: 15px; margin: 15px 0;">${body}</p>
            ${actionButton}
            <p style="margin-top: 30px; font-size: 12px; color: #9ca3af;">هذا البريد تم إرساله تلقائياً من نظام منصة فذكّر التعليمية.</p>
          </div>
        `,
      });
      emailSuccess = true;
    } catch (err) {
      console.error("Failed to send notification email:", err);
    }
  }

  return { inAppSuccess, emailSuccess };
}