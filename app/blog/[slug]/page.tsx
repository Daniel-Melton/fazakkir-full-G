import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=1600&q=80";

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  const { data: post, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !post) {
    notFound();
  }

  const cleanContent = (post.content || "").replace(/\\n/g, "\n");
  const coverImage =
    post.cover_image && !post.cover_image.includes("coffee")
      ? post.cover_image
      : FALLBACK_IMAGE;

  return (
    <main className="min-h-screen bg-slate-50 relative selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar />

      <article className="pt-10 pb-16">
        {/* Header Section */}
        <header className="max-w-4xl mx-auto px-4 sm:px-6 mb-8 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-semibold text-emerald-800 mb-4">
            <Link href="/" className="hover:underline">Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:underline">Articles</Link>
            <span>/</span>
            <span className="text-slate-400 truncate max-w-[200px]">{post.category}</span>
          </div>

          <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-extrabold uppercase tracking-wider mb-4">
            {post.category}
          </span>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.25] mb-6">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center md:justify-between gap-4 border-y border-slate-200 py-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-base shadow-sm">
                {post.author ? post.author.charAt(0) : "F"}
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900">{post.author}</div>
                <div className="text-xs text-slate-500">{post.author_role || "Senior Azhari Scholar"}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
              <span>
                <i className="fa-regular fa-clock mr-1 text-emerald-700"></i> {post.reading_time}
              </span>
              <span>•</span>
              <span>
                {new Date(post.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </header>

        {/* Cover Image */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-12">
          <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-200 aspect-[16/9] w-full relative bg-slate-200">
            <img
              src={coverImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Article Body & Sidebar */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-8 bg-white p-7 sm:p-12 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="prose prose-slate sm:prose-lg max-w-none 
              prose-headings:font-extrabold prose-headings:text-slate-900 
              prose-h2:text-2xl sm:prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-slate-100 prose-h2:pb-2
              prose-h3:text-xl sm:prose-h3:text-2xl prose-h3:text-emerald-900 prose-h3:mt-6 prose-h3:mb-3
              prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-5
              prose-strong:text-slate-900 prose-strong:font-extrabold
              prose-blockquote:border-emerald-600 prose-blockquote:bg-emerald-50 prose-blockquote:text-emerald-950 prose-blockquote:p-4 prose-blockquote:rounded-2xl prose-blockquote:not-italic
              prose-li:text-slate-700 prose-li:my-1
              prose-img:rounded-2xl prose-img:shadow-md prose-img:my-6
            ">
              <ReactMarkdown rehypePlugins={[rehypeRaw]}>{cleanContent}</ReactMarkdown>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-6 rounded-2xl">
              <div className="w-14 h-14 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
                {post.author ? post.author.charAt(0) : "F"}
              </div>
              <div className="text-center sm:text-left">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Published by Academic Board
                </div>
                <div className="text-base font-extrabold text-slate-900">{post.author}</div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {post.author_role || "Azhari Scholar"} specializing in Quran Tajweed curriculum and early childhood Arabic pedagogy.
                </p>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-4 sticky top-24 space-y-6">
            <div className="bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#047857] text-white p-7 rounded-3xl shadow-xl text-center space-y-4 border border-emerald-800">
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-emerald-300 flex items-center justify-center text-xl mx-auto">
                <i className="fa-solid fa-graduation-cap"></i>
              </div>
              <h3 className="font-extrabold text-lg leading-snug">
                Put These Insights into Practice
              </h3>
              <p className="text-xs text-emerald-100/90 leading-relaxed">
                Connect your child with certified Al-Azhar instructors for personalized 1-on-1 recitation classes.
              </p>
              <ul className="text-left text-xs space-y-2 border-y border-white/10 py-3 text-emerald-100">
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-circle-check text-emerald-400 text-[10px]"></i>
                  <span>2 Free Assessment Sessions</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-circle-check text-emerald-400 text-[10px]"></i>
                  <span>Zero commitment or credit card</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-circle-check text-emerald-400 text-[10px]"></i>
                  <span>Male & Female Native Tutors</span>
                </li>
              </ul>
              <Link
                href="/#registerForm"
                className="block w-full py-3.5 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 text-slate-950 font-extrabold rounded-xl text-xs shadow-md transition-all uppercase tracking-wider"
              >
                Claim 2 Free Classes
              </Link>
            </div>
          </aside>
        </div>
      </article>

      <footer className="bg-[#022c22] text-[#a7f3d0] py-8 text-center text-sm border-t border-emerald-950">
        <p>© 2026 Fazakkir Academy. All rights reserved.</p>
      </footer>
    </main>
  );
}