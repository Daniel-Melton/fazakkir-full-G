import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const fullName = body.fullName || body.parentName;
    const email = body.email;
    const countryCode = body.countryCode || "";
    const phoneNumber = body.phoneNumber || body.phone || "";
    const courseName = body.courseName || body.preferredCourse;

    // الحقول الجديدة للتوقيت المفضل والمنطقة الزمنية
    const preferredTime = body.preferredTime || body.preferred_time || "Evening";
    const timezone = body.timezone || "UTC";

    // حقول حاسبة الأسعار والخصومات
    const studentsCount = Number(body.studentsCount || body.student_count || 1);
    const planName = body.planName || "Standard";
    const discountApplied = body.discountApplied || "0%";

    // استخراج العملة والأرقام بشكل مستقل
    const rawPriceStr = body.totalPrice ? String(body.totalPrice) : "";
    const rawNumeric = rawPriceStr.replace(/[^0-9.]/g, "");
    const totalPrice = rawNumeric && !isNaN(Number(rawNumeric)) ? Number(rawNumeric) : null;

    const currency = rawPriceStr.includes("£") ? "GBP" 
                  : rawPriceStr.includes("€") ? "EUR" 
                  : "USD";

    const fullPhone = phoneNumber.startsWith("+")
      ? phoneNumber
      : `${countryCode} ${phoneNumber}`.trim();

    if (!fullName || !email || !phoneNumber || !courseName) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    // 1. حفظ بيانات الطالب في Supabase مع مطابقة كامل الأعمدة وإضافة التوقيت
    const { data: leadData, error: dbError } = await supabase
      .from("leads")
      .insert([
        {
          parent_name: fullName,
          full_name: fullName,
          email: email,
          phone: fullPhone,
          phone_number: phoneNumber,
          country_code: countryCode,
          country: countryCode || "Unknown",
          student_count: studentsCount,
          students_count: studentsCount,
          preferred_course: courseName,
          course_name: courseName,
          plan_name: planName,
          discount_applied: discountApplied,
          total_price: totalPrice,
          currency: currency,
          preferred_time: preferredTime,
          timezone: timezone,
          status: "New",
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error("Supabase error:", dbError);
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }

    // 2. إرسال الإشعار البريدي متضمناً تفاصيل الخصم والباقة والتوقيت
    const targetEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "lonelywolf1452@gmail.com";

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: "Fazakkir Academy <info@fazakkir.com>",
        to: targetEmail,
        subject: `🎓 New Lead / Booking: ${fullName} (${courseName})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #064e3b; margin-top: 0;">New Academy Booking Request</h2>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">Name:</td>
                <td style="padding: 8px 0; color: #334155;">${fullName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">Email:</td>
                <td style="padding: 8px 0; color: #334155;"><a href="mailto:${email}">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">WhatsApp:</td>
                <td style="padding: 8px 0; color: #334155;">${fullPhone}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">Course:</td>
                <td style="padding: 8px 0; color: #065f46; font-weight: bold;">${courseName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">Plan / Students:</td>
                <td style="padding: 8px 0; color: #334155;">${planName} (${studentsCount} Student/s)</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">Preferred Slot:</td>
                <td style="padding: 8px 0; color: #334155;">${preferredTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">Timezone:</td>
                <td style="padding: 8px 0; color: #334155;">${timezone}</td>
              </tr>
              ${
                discountApplied !== "0%"
                  ? `<tr>
                      <td style="padding: 8px 0; font-weight: bold; color: #b91c1c;">Discount Applied:</td>
                      <td style="padding: 8px 0; color: #b91c1c; font-weight: bold;">${discountApplied} (${totalPrice})</td>
                    </tr>`
                  : ""
              }
            </table>
            <a href="https://wa.me/${fullPhone.replace(/[^0-9]/g, "")}" style="display: inline-block; background-color: #25d366; color: #ffffff; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Chat on WhatsApp
            </a>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true, lead: leadData });
  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to submit lead" },
      { status: 500 }
    );
  }
}