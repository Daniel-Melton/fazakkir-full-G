"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Currency = "USD" | "GBP" | "EUR";

const CURRENCY_CONFIG: Record<Currency, { symbol: string; ratePerHalfHour: number }> = {
  USD: { symbol: "$", ratePerHalfHour: 8.5 },
  GBP: { symbol: "£", ratePerHalfHour: 6.8 },
  EUR: { symbol: "€", ratePerHalfHour: 7.9 },
};

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
];

export default function AdminNewLeadPage() {
  const router = useRouter();
  const [adminKey, setAdminKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // بيانات الطالب
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [courseName, setCourseName] = useState("Quran Reading (Noorani Qaida)");
  const [initialStatus, setInitialStatus] = useState("Trial Booked");

  // بيانات الخطة والحاسبة التفاعلية
  const [currency, setCurrency] = useState<Currency>("USD");
  const [studentsCount, setStudentsCount] = useState<number>(1);
  const [classesPerWeek, setClassesPerWeek] = useState<number>(3);
  const [sessionDuration, setSessionDuration] = useState<number>(30);

  useEffect(() => {
    const savedKey = sessionStorage.getItem("fazakkir_admin_key");
    if (savedKey) {
      setAdminKey(savedKey);
    } else {
      router.push("/admin/leads");
    }
  }, [router]);

  // الحسابات المالية الدقيقة
  const currentCfg = CURRENCY_CONFIG[currency];
  const durationMultiplier = sessionDuration === 60 ? 1.85 : 1.0;
  const baseMonthlyPerStudent = Math.round(classesPerWeek * 4.33 * currentCfg.ratePerHalfHour * durationMultiplier);
  const siblingDiscountRate = studentsCount > 1 ? 0.12 : 0;
  const totalBeforeDiscount = baseMonthlyPerStudent * studentsCount;
  const discountAmount = Math.round(totalBeforeDiscount * siblingDiscountRate);
  const totalMonthlyPrice = totalBeforeDiscount - discountAmount;
  const planSummary = `${classesPerWeek}x/wk (${sessionDuration}m)`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: adminKey,
          full_name: fullName,
          email,
          country_code: countryCode,
          phone_number: phoneNumber,
          course_name: courseName,
          status: initialStatus,
          plan_name: planSummary,
          students_count: studentsCount,
          discount_applied: discountAmount > 0 ? "12% Sibling Discount" : "None",
          total_price: `${currentCfg.symbol}${totalMonthlyPrice}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create booking");

      router.push("/admin/leads");
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top Header */}
      <header className="bg-[#022c22] text-white py-4 px-6 border-b border-emerald-950 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/leads"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span>Back to Leads</span>
            </Link>
            <div className="border-l border-emerald-800 pl-3">
              <h1 className="font-extrabold text-lg">Manual Student Registration</h1>
              <p className="text-[11px] text-emerald-300">Custom Plan & Family Discount Builder</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* القسم الأيسر: بيانات الطالب والحاسبة التفاعلية */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* بطاقة معلومات الاتصال */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <i className="fa-solid fa-user-graduate text-emerald-600"></i>
                  <span>Student & Contact Information</span>
                </h2>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Student / Parent Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tariq Mansoor"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. parent@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp / Phone</label>
                    <div className="grid grid-cols-[90px_1fr] gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="px-2 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none text-xs bg-white"
                      >
                        {COUNTRY_OPTIONS.map((c, i) => (
                          <option key={i} value={c.code}>
                            {c.flag} {c.code}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        required
                        placeholder="555 123 4567"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Course Program</label>
                    <select
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none text-xs bg-white"
                    >
                      <option value="Quran Reading (Noorani Qaida)">Quran Reading (Noorani Qaida)</option>
                      <option value="Quran Recitation & Tajweed">Quran Recitation & Tajweed</option>
                      <option value="Quran Memorization (Hifz)">Quran Memorization (Hifz)</option>
                      <option value="Quran Ijazah Program">Quran Ijazah Program</option>
                      <option value="Arabic for Non-Arabs">Arabic for Non-Arabs</option>
                      <option value="Islamic Studies for Kids">Islamic Studies for Kids</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Initial Status</label>
                    <select
                      value={initialStatus}
                      onChange={(e) => setInitialStatus(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none text-xs bg-white font-bold"
                    >
                      <option value="Trial Booked">Trial Booked</option>
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Enrolled">Enrolled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* بطاقة إعداد الخطة والحاسبة */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <i className="fa-solid fa-calculator text-emerald-600"></i>
                    <span>Tuition & Family Plan Customizer</span>
                  </h2>

                  {/* Currency Switcher */}
                  <div className="inline-flex gap-1 p-1 bg-slate-100 rounded-xl">
                    {(["USD", "GBP", "EUR"] as Currency[]).map((curr) => (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => setCurrency(curr)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          currency === curr ? "bg-white text-emerald-950 shadow-sm" : "text-slate-500"
                        }`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Number of Students */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-700">Number of Enrolled Students</label>
                    {studentsCount > 1 && (
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        12% Sibling Discount Applied!
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setStudentsCount(n)}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          studentsCount === n
                            ? "bg-emerald-700 text-white border-emerald-700 shadow-sm"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {n} {n === 1 ? "Student" : "Students"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Classes Per Week */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Classes Per Week (Per Student)</label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setClassesPerWeek(d)}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          classesPerWeek === d
                            ? "bg-emerald-700 text-white border-emerald-700 shadow-sm"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {d}x / wk
                      </button>
                    ))}
                  </div>
                </div>

                {/* Session Duration */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Session Duration</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSessionDuration(30)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        sessionDuration === 30
                          ? "bg-emerald-50 border-emerald-600 text-emerald-950 font-bold"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="text-xs">30 Minutes</div>
                      <div className="text-[10px] text-slate-500 font-normal">Standard focused lessons</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSessionDuration(60)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        sessionDuration === 60
                          ? "bg-emerald-50 border-emerald-600 text-emerald-950 font-bold"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="text-xs">60 Minutes</div>
                      <div className="text-[10px] text-slate-500 font-normal">Intensive & Adult courses</div>
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* القسم الأيمن: ملخص الحساب والتأكيد */}
            <div className="lg:col-span-5">
              <div className="bg-gradient-to-br from-[#022c22] to-[#064e3b] text-white rounded-3xl p-6 sm:p-8 sticky top-24 shadow-xl space-y-6">
                <div className="border-b border-white/10 pb-4">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                    Booking Summary
                  </span>
                  <h3 className="text-xl font-bold mt-1 text-white">{fullName || "Prospective Student"}</h3>
                  <div className="text-xs text-emerald-200 mt-0.5">{courseName}</div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Plan Schedule:</span>
                    <span className="font-bold text-white">{planSummary}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Enrolled Count:</span>
                    <span className="font-bold text-white">{studentsCount} Student(s)</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Gross Monthly:</span>
                    <span className="font-bold text-white">{currentCfg.symbol}{totalBeforeDiscount}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-300 font-semibold">
                      <span>Family Discount (12%):</span>
                      <span>-{currentCfg.symbol}{discountAmount}</span>
                    </div>
                  )}
                  <div className="border-t border-white/10 pt-3 flex justify-between items-baseline">
                    <span className="text-sm font-bold">Total Tuition:</span>
                    <span className="text-3xl font-extrabold text-white">
                      {currentCfg.symbol}{totalMonthlyPrice}
                      <span className="text-xs text-emerald-200 font-normal">/mo</span>
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-extrabold rounded-2xl text-sm shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Saving Booking..." : "Confirm & Save Booking"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}