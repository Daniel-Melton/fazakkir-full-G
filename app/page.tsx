"use client";

import Navbar from "@/components/Navbar";
import LeadForm from "@/components/LeadForm";
import Image from "next/image";
import Link from "next/link"; 

export default function Home() {
  const chooseCourse = (courseTitle: string) => {
    const select = document.getElementById("courseChoice") as HTMLSelectElement;
    if (select) {
      select.value = courseTitle;
    }
    document.getElementById("registerForm")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-slate-50 relative">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-10 sm:pt-14 pb-16 sm:pb-20 overflow-hidden bg-[radial-gradient(120%_120%_at_50%_-10%,#d1fae5_0%,#f8fafc_100%)]">
        
        {/* Soft Ambient Corner Glow (GroVest style) */}
        <div className="absolute -top-24 -left-24 w-80 sm:w-96 h-80 sm:h-96 bg-gradient-to-br from-[#bef264]/40 via-[#86efac]/35 to-transparent rounded-full blur-3xl pointer-events-none z-0"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-emerald-200 text-emerald-800 text-xs font-bold shadow-sm">
              <i className="fa-solid fa-star-and-crescent text-emerald-600"></i>
              <span>Official Al-Azhar Certified Tutors • 2 Free Classes</span>
            </div>

            {/* Typography Hierarchy: font-light for dark text, font-black for green part */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl text-slate-900 tracking-tight leading-[1.2]">
              <span className="font-light">Master Quran, Tajweed & Arabic with </span>
              <span className="font-black bg-gradient-to-r from-emerald-600 to-teal-800 bg-clip-text text-transparent drop-shadow-sm inline-block">
                Personalized 1-on-1 Guidance
              </span>
            </h1>

            <p className="text-slate-600 text-sm sm:text-base md:text-lg leading-relaxed">
              Empowering Muslim families across the USA, UK, Canada & Europe to recite with confidence, memorize with precision, and understand Quranic Arabic from certified Azhari scholars.
            </p>

            {/* Visual Blob & Live Floating Badge */}
            <div className="flex flex-row items-center gap-4 sm:gap-6 pt-1 pb-1">
              <div className="w-24 h-24 sm:w-36 sm:h-36 relative flex-shrink-0">
                <Image
                  src="https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=400&q=80"
                  alt="Quran Recitation"
                  width={150}
                  height={150}
                  className="w-full h-full object-cover rounded-[60%_40%_30%_70%/60%_30%_70%_40%] shadow-xl shadow-emerald-900/15 border-2 border-white animate-[morphBlob_7s_ease-in-out_infinite]"
                />
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-100 flex items-center gap-3 animate-[floatBadge_4s_ease-in-out_infinite]">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-emerald-100 to-emerald-200 text-emerald-900 flex items-center justify-center text-base sm:text-xl flex-shrink-0">
                  <i className="fa-solid fa-mosque"></i>
                </div>
                <div>
                  <div className="text-xs sm:text-base font-extrabold text-slate-900">Certified Azhar Scholars</div>
                  <div className="text-[10px] sm:text-xs text-slate-500">Connected Sanad & Native Accent</div>
                </div>
              </div>
            </div>

            {/* Bullets */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
              {[
                "Male & Female Teachers Available",
                "100% Customized 24/7 Timings",
                "Authentic Sanad & Ijazah Pathways",
                "Interactive Classrooms for Children",
              ].map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-800">
                  <i className="fa-solid fa-check text-emerald-600 bg-emerald-50 border border-emerald-200 p-1.5 rounded-full text-[9px] sm:text-[10px]"></i>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column: Lead Form */}
          <div className="lg:col-span-5 w-full">
            <LeadForm />
          </div>

        </div>
      </section>

      {/* 1. Core Commitments & Quality Guarantees (White/Gray Gradient Cards) */}
      <section className="bg-gradient-to-r from-[#022c22] to-[#064e3b] py-12 px-4 sm:px-6 border-y border-emerald-950 shadow-inner">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: "fa-certificate",
              title: "Al-Azhar Verified",
              desc: "Authentic Sanad with direct chain of transmission to the Prophet ﷺ.",
            },
            {
              icon: "fa-chalkboard-user",
              title: "1-on-1 Focus",
              desc: "100% dedicated teacher attention, personalized pace & instant feedback.",
            },
            {
              icon: "fa-clock",
              title: "Flexible Scheduling",
              desc: "Available 24/7 matching USA, UK, Canada & Europe family routines.",
            },
            {
              icon: "fa-shield-halved",
              title: "Zero Obligation",
              desc: "2 free trial lessons with no credit card or advance payment required.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="guarantee-card group flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-b from-white via-slate-50 to-slate-100/95 border border-white/60 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.2)] hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-800 text-white flex-shrink-0 flex items-center justify-center text-lg font-bold shadow-md shadow-emerald-900/20 group-hover:scale-110 transition-transform">
                <i className={`fa-solid ${item.icon}`}></i>
              </div>
              <div>
                <h4 className="guarantee-title font-extrabold text-slate-900 text-base mb-1">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Interactive Comparison: 1-on-1 vs Weekend Schools */}
      <section id="why-fazakkir" className="py-16 sm:py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
            <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-3">
              <i className="fa-solid fa-scale-balanced"></i> Honest Comparison
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900">Why Families Prefer 1-on-1 Mentorship</h2>
            <p className="text-slate-500 text-xs sm:text-sm md:text-base mt-2">See how our dedicated Azhari instruction compares to traditional crowded weekend classrooms.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* The Traditional Way */}
            <div className="bg-slate-50 rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm relative">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-lg flex-shrink-0">
                  <i className="fa-solid fa-users-slash"></i>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Traditional Weekend Schools</h3>
                  <span className="text-xs text-slate-500">Crowded group environments</span>
                </div>
              </div>

              <ul className="space-y-3.5 sm:space-y-4">
                {[
                  "15 to 20 students packed per classroom.",
                  "Only 2-3 minutes of individual recitation per child.",
                  "Fixed weekend rush hours & tedious driving commutes.",
                  "Generic pacing where quiet students get left behind.",
                ].map((point, i) => (
                  <li key={i} className="flex items-start gap-3 text-xs sm:text-sm text-slate-600">
                    <i className="fa-solid fa-xmark text-rose-500 font-bold mt-1 text-sm flex-shrink-0"></i>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Fazakkir 1-on-1 Advantage */}
            <div className="bg-gradient-to-b from-emerald-50/70 to-white rounded-2xl p-6 sm:p-7 border-2 border-emerald-400 shadow-lg shadow-emerald-900/5 relative">
              <span className="absolute -top-3.5 right-6 px-3 py-1 bg-emerald-600 text-white rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wide shadow">
                Recommended Choice
              </span>

              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-emerald-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg shadow-sm flex-shrink-0">
                  <i className="fa-solid fa-hand-holding-heart"></i>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-emerald-950">Fazakkir 1-on-1 Experience</h3>
                  <span className="text-xs text-emerald-700 font-semibold">Customized individual education</span>
                </div>
              </div>

              <ul className="space-y-3.5 sm:space-y-4">
                {[
                  "100% private session dedicated solely to your child.",
                  "30-45 continuous minutes of practical recitation and correction.",
                  "Comfort of your home at any hour that suits your schedule.",
                  "Tailored curriculum adapting strictly to student's pace and retention.",
                ].map((point, i) => (
                  <li key={i} className="flex items-start gap-3 text-xs sm:text-sm text-slate-800 font-medium">
                    <i className="fa-solid fa-check text-emerald-600 font-bold mt-1 text-sm flex-shrink-0"></i>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 3D Flip Cards: Tutor Quality & Vetting Standards */}
      <section id="tutor-standards" className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
            <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-3">
              <i className="fa-solid fa-user-graduate"></i> Academic Excellence
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900">How We Handpick Our Tutors</h2>
            <p className="text-slate-500 text-xs sm:text-sm md:text-base mt-2">
              Hover or tap on each card to discover the rigorous vetting steps every Fazakkir scholar undergoes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: "fa-mosque",
                badge: "Requirement 01",
                title: "Al-Azhar Certification",
                short: "Graduates of Islamic & Quranic studies from Al-Azhar University.",
                backTitle: "Authentic Pedigree",
                backDetails: "Every teacher holds an authentic connected Sanad back to the Prophet ﷺ, guaranteeing pristine articulation and Tajweed rules.",
              },
              {
                icon: "fa-comments",
                badge: "Requirement 02",
                title: "Fluent English Skills",
                short: "Native-level communication to effortlessly engage Western students.",
                backTitle: "Zero Language Barrier",
                backDetails: "We screen rigorously for English clarity so young children raised in the US, UK, and Canada feel completely comfortable and understood.",
              },
              {
                icon: "fa-heart-pulse",
                badge: "Requirement 03",
                title: "Child Psychology",
                short: "Specialized in patience, positive encouragement & engagement.",
                backTitle: "Gentle Mentorship",
                backDetails: "Teachers are trained in child psychology to foster a loving relationship with the Quran, replacing strictness with motivating rewards.",
              },
              {
                icon: "fa-user-shield",
                badge: "Requirement 04",
                title: "Safe & Monitored",
                short: "Background verified with dedicated female tutors for sisters.",
                backTitle: "Family Peace of Mind",
                backDetails: "Dedicated certified female scholars are available for sisters and young girls, with supervisory quality checks conducted routinely.",
              },
            ].map((card, i) => (
              <div key={i} className="group perspective-1000 h-72 cursor-pointer">
                <div className="relative w-full h-full duration-500 transform-style-3d group-hover:rotate-y-180 transition-transform">
                  {/* Front Side */}
                  <div className="absolute inset-0 w-full h-full bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between backface-hidden">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center text-xl font-bold">
                          <i className={`fa-solid ${card.icon}`}></i>
                        </div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100/60 px-2.5 py-1 rounded-full">
                          {card.badge}
                        </span>
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-900 mb-2">{card.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{card.short}</p>
                    </div>

                    <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5 pt-2 border-t border-slate-100">
                      <span>Hover / Tap for details</span>
                      <i className="fa-solid fa-arrow-rotate-right text-[10px]"></i>
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-emerald-800 to-teal-950 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between rotate-y-180 backface-hidden">
                    <div>
                      <div className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
                        {card.backTitle}
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">{card.backDetails}</p>
                    </div>

                    <div className="text-[11px] font-semibold text-emerald-300/80 flex items-center gap-1.5 border-t border-white/10 pt-2">
                      <i className="fa-solid fa-circle-check text-emerald-400"></i>
                      <span>Verified standard</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. How Learning Works (Red Theme 1, 2, 3) */}
      <section id="how-it-works" className="py-20 sm:py-24 bg-gradient-to-b from-[#fff1f2] to-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
            <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold uppercase tracking-wider mb-3">
              <i className="fa-solid fa-compass"></i> Seamless Onboarding
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900">How Learning Works With Us</h2>
            <p className="text-slate-500 text-xs sm:text-sm md:text-base mt-2">A proven, student-centered approach to help you and your children start Quranic education with zero friction.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                num: "1",
                icon: "fa-clipboard-list",
                title: "Book Free Assessment",
                desc: "Submit your details. Our academic coordinator connects with you on WhatsApp within 15 minutes to evaluate current proficiency levels.",
              },
              {
                num: "2",
                icon: "fa-handshake-angle",
                title: "Take 2 Free Trial Lessons",
                desc: "Experience our live 1-on-1 virtual classroom with a matched Azhari tutor. Witness first-hand teaching quality before any payment.",
              },
              {
                num: "3",
                icon: "fa-award",
                title: "Custom Schedule & Growth",
                desc: "Set a weekly timetable that fits your timezone. Receive monthly milestone reports and accredited completion certificates.",
              },
            ].map((st, i) => (
              <div
                key={i}
                className="step-card bg-white rounded-2xl p-7 sm:p-9 border-2 border-rose-100 shadow-[0_15px_30px_-8px_rgba(225,29,72,0.18)] relative text-center hover:-translate-y-2 hover:border-rose-300 transition-all group"
              >
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-tr from-rose-600 to-rose-700 text-white font-extrabold text-base flex items-center justify-center shadow-lg shadow-rose-600/40">
                  {st.num}
                </div>
                <div className="icon-badge-box icon-duo mx-auto mt-2">
                  <i className={`fa-solid ${st.icon}`}></i>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-2">{st.title}</h4>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Courses Grid (Accredited Curriculums) */}
      <section id="courses" className="py-20 sm:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-3">
              <i className="fa-solid fa-book-open"></i> Accredited Curriculums
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900">
              Structured Courses for All Levels
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm md:text-base mt-2">
              Select your specialized pathway taught 1-on-1 by certified Al-Azhar instructors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                title: "Noorani Qaida & Basics",
                badge: "Beginner • Kids & Adults",
                icon: "fa-cubes",
                slug: "noorani-qaida-basics",
                desc: "Master Arabic phonetics, Makharij articulation points, and letter connecting rules to read the Quran independently.",
                features: [
                  "Accurate phonetics pronunciation",
                  "Interactive digital whiteboards",
                  "Read short Surahs with confidence",
                ],
                targetCourse: "Quran Reading (Noorani Qaida)",
              },
              {
                title: "Recitation & Tajweed",
                badge: "Intermediate • All Ages",
                icon: "fa-book-quran",
                slug: "quran-recitation-tajweed",
                desc: "Refine your recitation applying rigorous practical Tajweed rules (Ghunnah, Ikhfa, Idgham, Madd, and Waqf stopping signs).",
                features: [
                  "Error-free fluent recitation",
                  "Melodious rhythmic recitation",
                  "Study Tuhfat Al-Atfal poem",
                ],
                targetCourse: "Quran Recitation & Tajweed",
              },
              {
                title: "Quran Memorization (Hifz)",
                badge: "Custom Pace • Kids & Adults",
                icon: "fa-heart-pulse",
                slug: "quran-memorization-hifz",
                desc: "A systematic dual retention approach combining daily new verses (Sabaq) with strict past revision (Manzil) to prevent forgetting.",
                features: [
                  "Daily revision tracking plans",
                  "Mutashabihat mastery guidance",
                  "Periodic oral retention exams",
                ],
                targetCourse: "Quran Memorization (Hifz)",
              },
              {
                title: "Quran Ijazah Program",
                badge: "Advanced • Traced Sanad to Prophet ﷺ",
                icon: "fa-scroll",
                slug: "quran-ijazah-program",
                desc: "Recite the Holy Quran from memory to an authorized scholar to earn an accredited Sanad connected directly to Prophet Muhammad ﷺ.",
                features: [
                  "Hafs 'an 'Asim, Warsh & 10 Qira'at",
                  "Comprehensive oral theory exam",
                  "Accredited official Ijazah certificate",
                ],
                targetCourse: "Quran Ijazah Program",
              },
              {
                title: "Arabic for Non-Arabs",
                badge: "Modern Standard & Quranic Arabic",
                icon: "fa-language",
                slug: "arabic-for-non-arabs",
                desc: "Gain conversational fluency and grasp the exact meanings of Quranic verses directly without translation barriers.",
                features: [
                  "Direct Quranic vocabulary immersion",
                  "Simplified Nahw & Sarf grammar",
                  "Immersive conversation practice",
                ],
                targetCourse: "Arabic for Non-Arabs",
              },
              {
                title: "Islamic Studies for Kids",
                badge: "Youth Curriculum • Fun & Engaging",
                icon: "fa-seedling",
                slug: "islamic-studies-for-kids",
                desc: "Nurture genuine Islamic identity through inspiring stories of the Prophets, Seerah, daily Sunnah etiquette, and Fiqh of Salah.",
                features: [
                  "Practical Salah & Wudu workshops",
                  "Inspiring Akhlaq & character building",
                  "Positive & safe virtual space",
                ],
                targetCourse: "Islamic Studies for Kids",
              },
            ].map((c, i) => (
              <div
                key={i}
                className="course-card bg-white rounded-2xl p-7 sm:p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-300 hover:-translate-y-2 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="icon-badge-box icon-duo mb-4">
                    <i className={`fa-solid ${c.icon}`}></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{c.title}</h3>
                  <span className="text-xs font-bold text-emerald-700 mb-3 block">{c.badge}</span>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">{c.desc}</p>
                  
                  {/* Features */}
                  <ul className="space-y-2.5 border-t border-dashed border-slate-200 pt-4 mb-6">
                    {c.features.map((f, idx) => (
                      <li key={idx} className="flex items-center gap-2.5 text-[12.5px] font-medium text-slate-700">
                        <i className="fa-solid fa-circle-check text-emerald-600 text-[11px] flex-shrink-0"></i>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  {c.slug ? (
                    <Link
                      href={`/courses/${c.slug}`}
                      className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs text-center transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Syllabus</span>
                      <i className="fa-solid fa-arrow-up-right-from-square text-[10px] text-slate-500"></i>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => chooseCourse(c.targetCourse)}
                      className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs text-center transition-all"
                    >
                      Details
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => chooseCourse(c.targetCourse)}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs text-center shadow-md shadow-emerald-700/20 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Free Trial</span>
                    <i className="fa-solid fa-arrow-right text-[10px]"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View All Courses Button */}
        <div className="mt-12 text-center">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-white border-2 border-emerald-600 text-emerald-950 hover:bg-emerald-600 hover:text-white font-extrabold text-sm shadow-sm hover:shadow-md transition-all group"
          >
            <span>Explore All Academy Courses</span>
            <i className="fa-solid fa-arrow-right text-xs group-hover:translate-x-1 transition-transform"></i>
          </Link>
        </div>
      </section>

      {/* 6. FAQ Accordion */}
      <section id="faq" className="py-20 sm:py-24 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14 sm:mb-16">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-3">
              <i className="fa-solid fa-circle-question"></i> Answers & Support
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
            <p className="text-slate-500 text-xs sm:text-sm md:text-base mt-2">Everything you need to know about our classes, schedules, and tutors.</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Are the 2 trial classes really 100% free?",
                a: "Yes, completely free. You are never required to enter any payment or credit card details. If you decide not to continue after the 2 trial sessions, there is zero commitment.",
              },
              {
                q: "Can I request a female teacher for myself or my daughters?",
                a: "Yes, absolutely. We have an extensive team of certified female Azhari teachers available for sisters and young daughters.",
              },
              {
                q: "What happens if we need to reschedule a class?",
                a: "We understand family emergencies and changing schedules. Simply notify your coordinator or tutor prior to the class time, and a make-up class will be scheduled for you.",
              },
              {
                q: "What software or equipment do I need?",
                a: "Any laptop, tablet, or smartphone with internet access and Zoom or Google Meet installed is all you need to join our live interactive classes.",
              },
              {
                q: "What are the qualifications of your teachers?",
                a: "All our tutors are graduates of Al-Azhar University, hold authentic Ijazaat with connected Sanad, and are fluent in English with years of teaching students in Western countries.",
              },
            ].map((f, i) => (
              <details key={i} className="bg-slate-50 rounded-xl border border-slate-200 p-4 sm:p-5 group cursor-pointer">
                <summary className="font-bold text-slate-900 text-sm sm:text-base flex justify-between items-center list-none">
                  <span>{f.q}</span>
                  <i className="fa-solid fa-chevron-down text-emerald-600 transition-transform group-open:rotate-180 text-xs sm:text-sm"></i>
                </summary>
                <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed border-t border-slate-200/60 pt-3">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Floating WhatsApp Action */}
      <a
        href={`https://wa.me/${process.env.NEXT_PUBLIC_WA_PHONE_NUMBER || "201000000000"}?text=${encodeURIComponent("Salam Alaikum Fazakkir Academy! I would like to book my 2 Free Trial Classes.")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 sm:bottom-7 sm:right-7 z-50 w-14 h-14 sm:w-16 sm:h-16 bg-[#25d366] text-white rounded-full flex items-center justify-center text-2xl sm:text-3xl shadow-[0_8px_24px_rgba(37,211,102,0.45)] hover:scale-110 transition-transform animate-[pulseRing_2.5s_infinite]"
        title="Chat on WhatsApp"
      >
        <i className="fa-brands fa-whatsapp"></i>
      </a>

      {/* Footer */}
      <footer className="bg-[#022c22] text-[#a7f3d0] py-12 text-sm border-t border-emerald-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
              <span className="text-lg font-extrabold text-white">Fazakkir Academy</span>
              <span className="font-amiri text-emerald-400 font-bold">فَذَكِّرْ</span>
            </div>
            <p className="text-xs text-emerald-400/80">
              Personalized 1-on-1 Quran, Tajweed & Arabic mentorship by certified Azhari scholars.
            </p>
          </div>

          {/* Legal and Quick Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-emerald-300 font-medium">
            <Link href="/pricing" className="hover:text-white transition-colors">
              Tuition & Plans
            </Link>
            <Link href="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms & Refunds
            </Link>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WA_PHONE_NUMBER || "201000000000"}?text=${encodeURIComponent("Salam Alaikum Fazakkir Academy Support, I have an inquiry.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Support
            </a>
          </div>

          <p className="text-xs text-emerald-500">
            © 2026 Fazakkir Academy. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}