"use client";

import { useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const COUNTRY_OPTIONS = [
  { flag: "🇺🇸", name: "USA", code: "+1" },
  { flag: "🇬🇧", name: "UK", code: "+44" },
  { flag: "🇨🇦", name: "Canada", code: "+1" },
  { flag: "🇦🇺", name: "Australia", code: "+61" },
  { flag: "🇸🇦", name: "KSA", code: "+966" },
  { flag: "🇦🇪", name: "UAE", code: "+971" },
  { flag: "🇶🇦", name: "Qatar", code: "+974" },
  { flag: "🇰🇼", name: "Kuwait", code: "+965" },
  { flag: "🇩🇪", name: "Germany", code: "+49" },
  { flag: "🇫🇷", name: "France", code: "+33" },
  { flag: "🇪🇬", name: "Egypt", code: "+20" },
  { flag: "🇲🇾", name: "Malaysia", code: "+60" },
  { flag: "🇸🇬", name: "Singapore", code: "+65" },
];

function LeadFormContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  // قراءة بيانات الحاسبة القادمة من الرابط
  const planClasses = searchParams.get("classes");
  const planDuration = searchParams.get("duration");
  const planPrice = searchParams.get("price");
  const planDiscount = searchParams.get("discount");
  const planStudentsParam = searchParams.get("students");

  // التحقق هل العميل قادم من الحاسبة فعلياً أم يسجل مباشرة
  const isFromCalculator = Boolean(planPrice && planClasses);

  const planStudents = isFromCalculator && planStudentsParam ? Number(planStudentsParam) : 1;
  const planDiscountValue = isFromCalculator && planDiscount ? planDiscount : null;
  const planPriceValue = isFromCalculator && planPrice ? planPrice : null;
  const planSummary = isFromCalculator 
    ? `${planClasses}x/wk (${planDuration}m)` 
    : "Standard Registration";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    const fullName = (formData.get("fullName") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();
    const countryCode = formData.get("countryCode") as string;
    const phoneNumber = (formData.get("phoneNumber") as string)?.trim();
    const courseChoice = formData.get("courseChoice") as string;

    // 1. قراءة التوقيت المفضل من الفورم
    const preferredTime = (formData.get("preferred_time") as string) || "Evening";

    // 2. التقاط المنطقة الزمنية للمتصفح تلقائياً
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

    const fullPhone = `${countryCode} ${phoneNumber}`;

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          countryCode,
          phoneNumber,
          courseName: courseChoice,
          studentsCount: planStudents,
          planName: isFromCalculator ? planSummary : "Direct Form",
          discountApplied: planDiscountValue,
          totalPrice: planPriceValue,
          preferredTime,
          timezone: userTimezone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit lead");
      }

      formRef.current?.reset();

      const waNumber = process.env.NEXT_PUBLIC_WA_PHONE_NUMBER || "201126425304";
      let waMsg =
        `*New Free Trial Booking - Fazakkir Academy*%0A%0A` +
        `*Student Name:* ${encodeURIComponent(fullName)}%0A` +
        `*Email:* ${encodeURIComponent(email)}%0A` +
        `*WhatsApp:* ${encodeURIComponent(fullPhone)}%0A` +
        `*Course Selected:* ${encodeURIComponent(courseChoice)}%0A` +
        `*Preferred Slot:* ${encodeURIComponent(preferredTime)}%0A` +
        `*Timezone:* ${encodeURIComponent(userTimezone)}`;

      if (isFromCalculator && planPriceValue) {
        waMsg += `%0A*Plan Selected:* ${encodeURIComponent(planSummary)} (${planStudents} students)%0A*Estimated Total:* ${encodeURIComponent(planPriceValue)} (Discount: ${encodeURIComponent(planDiscountValue || "None")})`;
      }

      window.open(`https://wa.me/${waNumber}?text=${waMsg}`, "_blank");
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="bg-white rounded-3xl p-7 md:p-8 shadow-2xl shadow-emerald-950/10 border border-slate-200 relative overflow-hidden"
      id="registerForm"
    >
      <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-emerald-500 to-emerald-900 rounded-b"></div>

      <div className="text-center mb-6">
        <h3 className="text-2xl font-extrabold text-emerald-950 tracking-tight">
          Claim Your 2 Free Classes
        </h3>
        
        {isFromCalculator && planPriceValue ? (
          <div className="mt-2 inline-block bg-emerald-50 border border-emerald-300 text-emerald-900 px-3 py-1 rounded-full text-xs font-bold">
            Selected Plan: {planStudents} student(s) • {planPriceValue}/mo ({planDiscountValue || "Standard"})
          </div>
        ) : (
          <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">
            Instant confirmation via WhatsApp • No credit card
          </p>
        )}
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-xs font-bold text-emerald-950 mb-1.5">
            Student / Parent Name
          </label>
          <div className="relative flex items-center">
            <i className="fa-solid fa-user absolute left-4 text-emerald-600 text-sm pointer-events-none"></i>
            <input
              type="text"
              id="fullName"
              name="fullName"
              placeholder="e.g. Abdullah Khan"
              required
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-emerald-950 font-semibold placeholder:text-slate-400 placeholder:font-normal text-sm bg-white outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label htmlFor="emailAddress" className="block text-xs font-bold text-emerald-950 mb-1.5">
            Email Address
          </label>
          <div className="relative flex items-center">
            <i className="fa-solid fa-envelope absolute left-4 text-emerald-600 text-sm pointer-events-none"></i>
            <input
              type="email"
              id="emailAddress"
              name="email"
              placeholder="e.g. family@example.com"
              required
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-emerald-950 font-semibold placeholder:text-slate-400 placeholder:font-normal text-sm bg-white outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label htmlFor="phoneNumber" className="block text-xs font-bold text-emerald-950 mb-1.5">
            WhatsApp Number
          </label>
          <div className="grid grid-cols-[145px_1fr] gap-2">
            <select
              id="countryCode"
              name="countryCode"
              defaultValue="+1"
              required
              className="px-2 py-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-emerald-950 font-semibold text-xs md:text-sm bg-white outline-none transition-all cursor-pointer"
            >
              {COUNTRY_OPTIONS.map((c, i) => (
                <option key={i} value={c.code}>
                  {c.flag} {c.name} ({c.code})
                </option>
              ))}
            </select>

            <div className="relative flex items-center">
              <i className="fa-solid fa-phone absolute left-3.5 text-emerald-600 text-sm pointer-events-none"></i>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                placeholder="555 123 4567"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-emerald-950 font-semibold placeholder:text-slate-400 placeholder:font-normal text-sm bg-white outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="courseChoice" className="block text-xs font-bold text-emerald-950 mb-1.5">
            Choose Course Program
          </label>
          <div className="relative flex items-center">
            <i className="fa-solid fa-book-quran absolute left-4 text-emerald-600 text-sm pointer-events-none"></i>
            <select
              id="courseChoice"
              name="courseChoice"
              required
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-emerald-950 font-semibold text-sm bg-white outline-none transition-all cursor-pointer"
            >
              <option value="Quran Reading (Noorani Qaida)">Quran Reading (Noorani Qaida)</option>
              <option value="Quran Recitation & Tajweed">Quran Recitation & Tajweed</option>
              <option value="Quran Memorization (Hifz)">Quran Memorization (Hifz)</option>
              <option value="Quran Ijazah Program">Quran Ijazah Program</option>
              <option value="Arabic for Non-Arabs">Arabic for Non-Arabs</option>
              <option value="Islamic Studies for Kids">Islamic Studies for Kids</option>
            </select>
          </div>
        </div>

        {/* Preferred Study Time */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">
            Preferred Time Slot
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center justify-center gap-2 p-2.5 border rounded-lg cursor-pointer text-xs font-medium hover:bg-emerald-50 transition border-slate-200 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50/60 has-[:checked]:text-emerald-900">
              <input
                type="radio"
                name="preferred_time"
                value="Morning"
                defaultChecked
                className="text-emerald-600 focus:ring-emerald-500"
              />
              ☀️ Morning
            </label>
            <label className="flex items-center justify-center gap-2 p-2.5 border rounded-lg cursor-pointer text-xs font-medium hover:bg-emerald-50 transition border-slate-200 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50/60 has-[:checked]:text-emerald-900">
              <input
                type="radio"
                name="preferred_time"
                value="Evening"
                className="text-emerald-600 focus:ring-emerald-500"
              />
              🌙 Evening
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-[#25d366] hover:bg-[#1eb954] text-white py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#25d366]/25 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <i className="fa-solid fa-spinner fa-spin text-base"></i>
              <span>Sending...</span>
            </>
          ) : (
            <>
              <i className="fa-brands fa-whatsapp text-lg"></i>
              <span>Get Free Trial on WhatsApp</span>
            </>
          )}
        </button>

        <p className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5 pt-1">
          <i className="fa-solid fa-shield-halved text-emerald-600 text-xs"></i>
          <span>Zero obligation • Confidential data</span>
        </p>
      </form>
    </div>
  );
}

export default function LeadForm() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading form...</div>}>
      <LeadFormContent />
    </Suspense>
  );
}