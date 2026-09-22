import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import LeadForm from "@/components/LeadForm";
import { supabase } from "@/lib/supabaseClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;

  const { data: course, error } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !course) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 relative">
      <Navbar />

      {/* Course Banner */}
      <section className="pt-10 sm:pt-14 pb-14 sm:pb-16 bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#047857] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 mb-4">
            <Link href="/" className="hover:underline">Home</Link>
            <span>/</span>
            <Link href="/#courses" className="hover:underline">Courses</Link>
            <span>/</span>
            <span className="text-white">{course.title}</span>
          </div>

          <div className="max-w-3xl space-y-4">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold uppercase tracking-wider">
              {course.badge}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.2]">
              {course.title}
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-emerald-100/90 leading-relaxed">
              {course.subtitle}
            </p>

            <div className="flex flex-wrap gap-4 sm:gap-6 pt-3 text-xs sm:text-sm font-semibold text-emerald-200">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-clock text-emerald-400"></i>
                <span>{course.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-graduation-cap text-emerald-400"></i>
                <span>{course.prerequisites}</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-certificate text-emerald-400"></i>
                <span>Official Azhari Certificate</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="py-14 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          
          {/* Left Column: Curriculum & Details */}
          <div className="lg:col-span-7 space-y-8 sm:space-y-10">
            
            {/* Overview */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-3">Course Overview</h2>
              <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed">
                {course.summary}
              </p>
            </div>

            {/* Curriculum Roadmap */}
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Curriculum Roadmap</h2>
              <div className="space-y-3">
                {course.levels?.map((lvl: any, idx: number) => (
                  <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex-shrink-0">
                        {lvl.level}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 flex-1">{lvl.title}</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 pl-1">{lvl.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Outcomes */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-4">What You Will Master</h2>
              <ul className="grid grid-cols-1 gap-3">
                {course.learning_outcomes?.map((out: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
                    <i className="fa-solid fa-circle-check text-emerald-600 mt-0.5 text-sm flex-shrink-0"></i>
                    <span>{out}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Materials & Books */}
            <div className="bg-emerald-50/70 p-6 rounded-2xl border border-emerald-200">
              <h3 className="text-sm sm:text-base font-bold text-emerald-950 mb-3 flex items-center gap-2">
                <i className="fa-solid fa-book-bookmark text-emerald-600"></i>
                <span>Accredited Teaching Materials</span>
              </h3>
              <ul className="space-y-2">
                {course.books_materials?.map((bk: string, idx: number) => (
                  <li key={idx} className="text-xs sm:text-sm text-emerald-900 flex items-center gap-2">
                    <i className="fa-solid fa-arrow-right text-[10px] text-emerald-600"></i>
                    <span>{bk}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Right Column: Sticky Booking Box */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 space-y-4">
              <LeadForm />
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#022c22] text-[#a7f3d0] py-10 text-center text-sm border-t border-emerald-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-2">
          <p>© 2026 Fazakkir Academy. All rights reserved.</p>
          <p className="text-xs text-emerald-400/80">
            Contact: <a href="mailto:lonelywolf1452@gmail.com" className="hover:underline text-emerald-300">lonelywolf1452@gmail.com</a>
          </p>
        </div>
      </footer>
    </main>
  );
}