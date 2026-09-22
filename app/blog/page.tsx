import Navbar from "@/components/Navbar";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export const revalidate = 60;

export default async function BlogIndexPage() {
  const { data: articles } = await supabase
    .from("articles")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  const featured = articles && articles.length > 0 ? articles[0] : null;
  const standardArticles = articles && articles.length > 1 ? articles.slice(1) : [];

  return (
    <main className="min-h-screen bg-slate-50 relative">
      <Navbar />

      {/* Header Banner */}
      <section className="pt-12 pb-16 bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#047857] text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-4">
            <i className="fa-solid fa-feather-pointed"></i> Educational Journal
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            Fazakkir Academy Insights
          </h1>
          <p className="text-sm sm:text-base text-emerald-100/90 mt-3 max-w-2xl mx-auto leading-relaxed">
            Expert guidance on Tajweed, Quran retention, and raising righteous Muslim youth in Western societies.
          </p>
        </div>
      </section>

      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* 1. Featured Article */}
        {featured && (
          <div className="mb-14">
            <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-md hover:shadow-xl transition-all grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-7 h-64 sm:h-80 lg:h-full relative overflow-hidden">
                <img
                    src={featured.cover_image || "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=1200&q=80"}
                    alt={featured.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
              </div>

              <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider">
                      Featured • {featured.category}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{featured.reading_time}</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug hover:text-emerald-800 transition-colors">
                    <Link href={`/blog/${featured.slug}`}>{featured.title}</Link>
                  </h2>

                  <p className="text-slate-600 text-xs sm:text-sm mt-3 leading-relaxed line-clamp-3">
                    {featured.excerpt}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between mt-6">
                  <div>
                    <div className="text-xs font-bold text-slate-900">{featured.author}</div>
                    <div className="text-[11px] text-slate-400">{featured.author_role || "Scholar & Tutor"}</div>
                  </div>
                  <Link
                    href={`/blog/${featured.slug}`}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all"
                  >
                    Read Story
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {standardArticles.map((art) => (
            <article
              key={art.slug}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={art.cover_image}
                    alt={art.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                    {art.category}
                  </span>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mb-2">
                    <span>{art.reading_time}</span>
                    <span>•</span>
                    <span>{new Date(art.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 leading-snug mb-2 group-hover:text-emerald-800 transition-colors line-clamp-2">
                    <Link href={`/blog/${art.slug}`}>{art.title}</Link>
                  </h3>

                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                    {art.excerpt}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">{art.author}</span>
                <Link
                  href={`/blog/${art.slug}`}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                >
                  <span>Read</span>
                  <i className="fa-solid fa-arrow-right text-[10px]"></i>
                </Link>
              </div>
            </article>
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