"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";

type Currency = "USD" | "GBP" | "EUR";

const CURRENCY_CONFIG: Record<Currency, { symbol: string; ratePerHalfHour: number }> = {
  USD: { symbol: "$", ratePerHalfHour: 8.5 }, // متوسط 8.5$ لنصف ساعة (تنافسي جداً)
  GBP: { symbol: "£", ratePerHalfHour: 6.8 },
  EUR: { symbol: "€", ratePerHalfHour: 7.9 },
};

export default function PricingPage() {
  const [currency, setCurrency] = useState<Currency>("USD");
  
  // Calculator States
  const [studentsCount, setStudentsCount] = useState<number>(1);
  const [classesPerWeek, setClassesPerWeek] = useState<number>(3);
  const [sessionDuration, setSessionDuration] = useState<number>(30); // 30 mins or 60 mins

  const currentCfg = CURRENCY_CONFIG[currency];

  // الحسبة الشهرية: (عدد الأسابيع 4.33 * الحصص * سعر المدة)
  const durationMultiplier = sessionDuration === 60 ? 1.85 : 1.0; // خصم طفيف لحصة الساعة
  const baseMonthlyPerStudent = Math.round(classesPerWeek * 4.33 * currentCfg.ratePerHalfHour * durationMultiplier);
  
  // حساب خصم الأشقاء: لو أكثر من طالب يُطبق خصم 10% إلى 15%
  const siblingDiscountRate = studentsCount > 1 ? 0.12 : 0;
  const totalBeforeDiscount = baseMonthlyPerStudent * studentsCount;
  const discountAmount = Math.round(totalBeforeDiscount * siblingDiscountRate);
  const totalMonthlyPrice = totalBeforeDiscount - discountAmount;
  const pricePerClass = (totalMonthlyPrice / (classesPerWeek * 4.33 * studentsCount)).toFixed(1);

  return (
    <main className="min-h-screen bg-slate-50 relative">
      <Navbar />

      {/* Header Banner */}
      <section className="pt-12 pb-16 bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#047857] text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-4">
            <i className="fa-solid fa-hand-holding-dollar"></i> Transparent & Affordable Tuition
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            Simple, Honest & Flexible Pricing
          </h1>
          <p className="text-sm sm:text-base text-emerald-100/90 mt-3 max-w-2xl mx-auto leading-relaxed">
            Start with 2 free trial classes. Zero lock-in contracts, monthly billing, and full family discounts.
          </p>

          {/* Currency Switcher */}
          <div className="inline-flex items-center gap-1 p-1 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 mt-6">
            {(["USD", "GBP", "EUR"] as Currency[]).map((curr) => (
              <button
                key={curr}
                type="button"
                onClick={() => setCurrency(curr)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currency === curr
                    ? "bg-white text-emerald-950 shadow-md"
                    : "text-white/80 hover:text-white"
                }`}
              >
                {curr === "USD" ? "USD ($)" : curr === "GBP" ? "GBP (£)" : "EUR (€)"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 1. Pre-built Popular Plans */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Recommended Monthly Plans</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Prices based on 1 student with 30-minute private sessions. Flexible scheduling 24/7.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          
          {/* Plan 1: Starter */}
          <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Starter</span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">2 Classes / Week</h3>
              <p className="text-xs text-slate-500 mt-2 mb-6">Ideal for young beginners starting Qaida without fatigue.</p>
              
              <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-slate-100">
                <span className="text-4xl font-extrabold text-slate-900">
                  {currentCfg.symbol}{Math.round(2 * 4.33 * currentCfg.ratePerHalfHour)}
                </span>
                <span className="text-xs font-semibold text-slate-500">/ month</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-700 font-medium mb-8">
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-emerald-600 text-[11px]"></i>
                  <span>8–9 One-on-One Sessions Monthly</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-emerald-600 text-[11px]"></i>
                  <span>30-minute focused attention</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-emerald-600 text-[11px]"></i>
                  <span>Male or Female Azhari Tutor</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-emerald-600 text-[11px]"></i>
                  <span>Monthly Progress Report</span>
                </li>
              </ul>
            </div>

            <Link
              href={`/?students=1&classes=2&duration=30&price=${currentCfg.symbol}${Math.round(2 * 4.33 * currentCfg.ratePerHalfHour)}&discount=None#registerForm`}
              className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs text-center transition-all"
            >
              Start Free Trial First
            </Link>
          </div>

          {/* Plan 2: Balanced (Most Popular) */}
          <div className="bg-gradient-to-b from-emerald-50/60 to-white rounded-2xl p-7 border-2 border-emerald-500 shadow-xl shadow-emerald-900/10 flex flex-col justify-between relative">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-600 text-white rounded-full text-[11px] font-extrabold uppercase tracking-wide shadow-md">
              Most Popular Choice
            </span>

            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Balanced Momentum</span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">3 Classes / Week</h3>
              <p className="text-xs text-slate-500 mt-2 mb-6">The sweet spot for steady Tajweed fluency and memorization.</p>
              
              <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-emerald-100">
                <span className="text-4xl font-extrabold text-emerald-950">
                  {currentCfg.symbol}{Math.round(3 * 4.33 * currentCfg.ratePerHalfHour)}
                </span>
                <span className="text-xs font-semibold text-slate-500">/ month</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-800 font-medium mb-8">
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-emerald-600 text-[11px]"></i>
                  <span>12–13 One-on-One Sessions Monthly</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-emerald-600 text-[11px]"></i>
                  <span>Customized learning pace</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-emerald-600 text-[11px]"></i>
                  <span>Make-up classes guaranteed</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-emerald-600 text-[11px]"></i>
                  <span>Direct WhatsApp Tutor & Coordinator line</span>
                </li>
              </ul>
            </div>

              <Link
                href={`/?students=1&classes=3&duration=30&price=${currentCfg.symbol}${Math.round(3 * 4.33 * currentCfg.ratePerHalfHour)}&discount=None#registerForm`}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs text-center shadow-md transition-all"
              >
                Claim 2 Free Classes
              </Link>
          </div>

          {/* Plan 3: Intensive */}
          <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Intensive Hifz / Arabic</span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">5 Classes / Week</h3>
              <p className="text-xs text-slate-500 mt-2 mb-6">Designed for rapid Quran memorization and Ijazah aspirants.</p>
              
              <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-slate-100">
                <span className="text-4xl font-extrabold text-slate-900">
                  {currentCfg.symbol}{Math.round(5 * 4.33 * currentCfg.ratePerHalfHour)}
                </span>
                <span className="text-xs font-semibold text-slate-500">/ month</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-700 font-medium mb-8">
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-emerald-600 text-[11px]"></i>
                  <span>21–22 One-on-One Sessions Monthly</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-emerald-600 text-[11px]"></i>
                  <span>Daily Sabaq & revision cycle</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-emerald-600 text-[11px]"></i>
                  <span>Senior Sanad-authorized Sheikh/Sheikha</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-emerald-600 text-[11px]"></i>
                  <span>Comprehensive oral Ijazah prep</span>
                </li>
              </ul>
            </div>

               <Link
                  href={`/?students=1&classes=5&duration=30&price=${currentCfg.symbol}${Math.round(5 * 4.33 * currentCfg.ratePerHalfHour)}&discount=None#registerForm`}
                  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs text-center transition-all"
                >
                  Start Free Trial First
                </Link>
          </div>

        </div>
      </section>

      {/* 2. Interactive Custom Tuition Calculator */}
      <section className="py-16 bg-slate-100/80 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-3">
              <i className="fa-solid fa-calculator"></i> Custom Tuition Calculator
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Calculate Your Family Plan
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Adjust number of students, weekly sessions, and class duration to see your exact estimated monthly tuition.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-lg grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Controls (Left) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Students Count */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">Number of Students / Children</label>
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {studentsCount} {studentsCount === 1 ? "Student" : "Students"}
                  </span>
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
                      {n} {n === 1 ? "Child" : "Children"}
                    </button>
                  ))}
                </div>
                {studentsCount > 1 && (
                  <p className="text-[11px] font-bold text-emerald-600 mt-2 flex items-center gap-1.5">
                    <i className="fa-solid fa-tags"></i>
                    <span>Family / Sibling discount applied (12% off total)!</span>
                  </p>
                )}
              </div>

              {/* Classes Per Week */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">Classes Per Week (Per Student)</label>
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {classesPerWeek} Days / Week
                  </span>
                </div>
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
                        ? "bg-emerald-50 border-emerald-600 text-emerald-950"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="font-bold text-xs">30 Minutes</div>
                    <div className="text-[10px] text-slate-500">Best for children (high focus)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSessionDuration(60)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      sessionDuration === 60
                        ? "bg-emerald-50 border-emerald-600 text-emerald-950"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="font-bold text-xs">60 Minutes</div>
                    <div className="text-[10px] text-slate-500">Ideal for adults & intensive Hifz</div>
                  </button>
                </div>
              </div>

            </div>

            {/* Price Result Box (Right) */}
            <div className="lg:col-span-5 bg-gradient-to-br from-[#022c22] to-[#064e3b] text-white rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-xl">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300">
                Estimated Monthly Total
              </span>

              <div className="flex items-center justify-center gap-1">
                <span className="text-4xl sm:text-5xl font-extrabold text-white">
                  {currentCfg.symbol}{totalMonthlyPrice}
                </span>
                <span className="text-xs text-emerald-200 font-semibold">/ month</span>
              </div>

              {discountAmount > 0 && (
                <div className="text-xs text-emerald-300 bg-white/10 py-1.5 px-3 rounded-full inline-block font-semibold">
                  You save {currentCfg.symbol}{discountAmount} with Sibling Discount!
                </div>
              )}

              <p className="text-xs text-slate-300 leading-relaxed border-t border-white/10 pt-3">
                ~{currentCfg.symbol}{pricePerClass} per 1-on-1 private lesson. No commitment until your 2 trial classes are completed.
              </p>

              <Link
                href={`/?students=${studentsCount}&classes=${classesPerWeek}&duration=${sessionDuration}&price=${currentCfg.symbol}${totalMonthlyPrice}&discount=${discountAmount > 0 ? '12% Sibling Discount' : 'None'}#registerForm`}
                className="w-full block py-3.5 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-extrabold rounded-xl text-xs shadow-lg transition-all"
              >
                Book 2 Free Assessment Classes
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Pricing FAQ & Guarantees */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">Payment & Pricing Questions</h3>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "Do I have to enter my credit card for the free trial?",
              a: "Never. The 2 free trial classes are completely free with zero financial obligation. You only pay after you meet the tutor and decide to continue.",
            },
            {
              q: "Can I pause or stop my subscription anytime?",
              a: "Yes. All tuition is billed on a month-to-month basis with no long-term contracts. You can pause lessons during school vacations or stop anytime.",
            },
            {
              q: "What payment methods do you accept?",
              a: "We accept all major Credit/Debit Cards, PayPal, Stripe, and direct bank transfers for students located in the USA, UK, Canada, and Europe.",
            },
            {
              q: "What happens if we miss a class?",
              a: "As long as you give your tutor or academic coordinator advance notice, make-up classes are provided at no extra cost.",
            },
          ].map((item, i) => (
            <details key={i} className="bg-white rounded-xl border border-slate-200 p-4 group cursor-pointer shadow-sm">
              <summary className="font-bold text-slate-900 text-xs sm:text-sm flex justify-between items-center list-none">
                <span>{item.q}</span>
                <i className="fa-solid fa-chevron-down text-emerald-600 transition-transform group-open:rotate-180 text-xs"></i>
              </summary>
              <p className="text-xs text-slate-600 mt-2.5 leading-relaxed border-t border-slate-100 pt-2">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#022c22] text-[#a7f3d0] py-10 text-center text-sm border-t border-emerald-950">
        <p>© 2026 Fazakkir Academy. All rights reserved.</p>
      </footer>
    </main>
  );
}