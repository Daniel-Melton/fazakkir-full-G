"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const NAV_ITEMS = [
  { label: "Why 1-on-1", href: "/#why-fazakkir" },
  { label: "Our Standards", href: "/#tutor-standards" },
  { label: "Courses", href: "/#courses" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "FAQs", href: "/#faq" },
];

export default function Navbar() {
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 160;
      const sections = NAV_ITEMS.map((item) => item.href.replace("/#", "").replace("#", ""));
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            return;
          }
        }
      }
      if (window.scrollY < 200) setActiveSection("");
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-[999] bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3.5 flex-shrink-0 group py-1">
          {/* حاوية الرمز الطولي بأبعاد متناسقة دون انكماش */}
          <div className="relative h-16 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
            <Image
              src="/logo.png"
              alt="Fazakkir Logo"
              fill
              sizes="64px"
              className="object-contain"
              priority
            />
          </div>

          {/* نصوص اسم الأكاديمية المصاحبة للرمز */}
          {/* <div className="flex flex-col justify-center select-none">
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">
                Fazakkir
              </span>
              <span className="font-serif text-base sm:text-lg md:text-xl font-bold text-emerald-600 leading-none">
                فَذَكِّرْ
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] font-extrabold tracking-[0.25em] text-emerald-800 uppercase mt-1 leading-none">
              Academy
            </span>
          </div> */}
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.href.substring(1);
            return (
              <a
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-full transition-all text-sm font-semibold ${
                  isActive
                    ? "bg-emerald-50 text-emerald-900 border border-emerald-200 font-extrabold shadow-sm"
                    : "text-slate-600 hover:text-emerald-600"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Action Button (Responsive for Mobile) */}
        <a
          href="#registerForm"
          className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-emerald-600 to-teal-800 text-white px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/25 hover:shadow-lg hover:-translate-y-0.5 transition-all flex-shrink-0"
        >
          <span>Free Trial</span>
          <i className="fa-solid fa-arrow-right text-[10px] sm:text-xs"></i>
        </a>
      </div>
    </header>
  );
}