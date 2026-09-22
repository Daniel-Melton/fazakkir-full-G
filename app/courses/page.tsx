import Navbar from "@/components/Navbar";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export const revalidate = 60;

export default async function AllCoursesPage() {
  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <main className="min-h-screen bg-slate-50 relative">
      <Navbar />

      {/* Header Banner */}
      <section className="pt-12 pb-16 bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#047857] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 mb-3">
            <Link href="/" className="hover:underline">Home</Link>
            <span>/</span>
            <span className="text-white">All Courses</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Comprehensive Quran & Arabic Catalog
          </h1>
          <p className="text-sm sm:text-base text-emerald-100/90 mt-2 max-w-2xl">
            Explore all specialized 1-on-1 pathways designed for kids and adults, taught by certified Azhari scholars.
          </p>
        </div>
      </section>

      {/* All Courses Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {courses?.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl p-7 sm:p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-300 hover:-translate-y-1.5 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center text-xl mb-4">
                    <i className={`fa-solid ${c.icon || "fa-book-open"}`}></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{c.title}</h3>
                  <span className="text-xs font-bold text-emerald-700 mb-3 block">{c.badge}</span>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">{c.summary}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100">
                  <Link
                    href={`/courses/${c.slug}`}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs text-center transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Syllabus</span>
                    <i className="fa-solid fa-arrow-up-right-from-square text-[10px] text-slate-500"></i>
                  </Link>

                  <Link
                    href="/#registerForm"
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-xs text-center shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Free Trial</span>
                    <i className="fa-solid fa-arrow-right text-[10px]"></i>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#022c22] text-[#a7f3d0] py-10 text-center text-sm border-t border-emerald-950">
        <p>© 2026 Fazakkir Academy. All rights reserved.</p>
      </footer>
    </main>
  );
}