"use client";

import { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const articleId = resolvedParams.id;
  const router = useRouter();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inlineImageInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);
  const [msg, setMsg] = useState("");

  // حقول المقال
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("");
  const [author, setAuthor] = useState("");
  const [authorRole, setAuthorRole] = useState("");
  const [readingTime, setReadingTime] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    const adminKey = sessionStorage.getItem("fazakkir_admin_key");
    if (!adminKey) {
      setMsg("Please login from Admin Leads dashboard first.");
      setLoading(false);
      return;
    }

    const fetchArticle = async () => {
      try {
        const res = await fetch(`/api/admin/articles?key=${encodeURIComponent(adminKey)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch articles");

        const target = (data.articles || []).find((a: any) => a.id === articleId);
        if (!target) throw new Error("Article not found");

        setTitle(target.title || "");
        setSlug(target.slug || "");
        setExcerpt(target.excerpt || "");
        setCategory(target.category || "Quran & Tajweed");
        setAuthor(target.author || "");
        setAuthorRole(target.author_role || "");
        setReadingTime(target.reading_time || "5 min read");
        setCoverImage(target.cover_image || "");
        setContent((target.content || "").replace(/\\n/g, "\n"));
      } catch (err: any) {
        setMsg(err.message || "Failed to load article");
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [articleId]);

  const insertFormatting = (prefix: string, suffix: string = "", placeholder: string = "") => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selectedText = el.value.substring(start, end) || placeholder;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newContent = el.value.substring(0, start) + replacement + el.value.substring(end);
    setContent(newContent);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 50);
  };

  const uploadImageFile = async (file: File): Promise<string> => {
    const adminKey = sessionStorage.getItem("fazakkir_admin_key") || "";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("key", adminKey);

    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Image upload failed");
    return data.url;
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadImageFile(file);
      setCoverImage(url);
    } catch (err: any) {
      alert("Failed to upload cover: " + err.message);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingInline(true);
    try {
      const url = await uploadImageFile(file);
      insertFormatting(`\n\n![${file.name.split(".")[0]}](${url})\n*Image: ${file.name.split(".")[0]}*\n\n`);
    } catch (err: any) {
      alert("Failed to upload inline image: " + err.message);
    } finally {
      setUploadingInline(false);
      if (inlineImageInputRef.current) inlineImageInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");

    const adminKey = sessionStorage.getItem("fazakkir_admin_key");
    if (!adminKey) {
      setMsg("Session expired. Please log in again.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/articles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: adminKey,
          id: articleId,
          slug,
          title,
          excerpt,
          content,
          category,
          author,
          author_role: authorRole,
          reading_time: readingTime,
          cover_image: coverImage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update article");

      router.push(`/blog/${slug}`);
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-sm font-bold text-slate-500 flex items-center gap-2">
          <i className="fa-solid fa-spinner fa-spin text-emerald-700 text-lg"></i>
          Loading article data...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/admin/articles" className="text-xs font-bold text-emerald-800 hover:underline">
              ← Back to Articles Hub
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Edit Article</h1>
          </div>
        </div>

        {msg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl mb-6">
            {msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          {/* Title & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Article Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Slug URL</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono bg-slate-50 outline-none"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Excerpt</label>
            <textarea
              rows={2}
              required
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 text-xs outline-none focus:border-emerald-600"
            />
          </div>

          {/* Cover Image Replacement */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Cover Image</label>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 items-center">
                <input
                  type="file"
                  accept="image/*"
                  ref={coverImageInputRef}
                  onChange={handleCoverUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => coverImageInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <i className={`fa-solid ${uploadingCover ? "fa-spinner fa-spin" : "fa-upload"}`}></i>
                  <span>{uploadingCover ? "Uploading New Cover..." : "Replace from Device"}</span>
                </button>
              </div>

              <div className="flex gap-3 items-center">
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:border-emerald-600 font-mono"
                />
                {coverImage && (
                  <img src={coverImage} alt="Preview" className="w-16 h-10 object-cover rounded-lg border border-slate-200" />
                )}
              </div>
            </div>
          </div>

          {/* Meta Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Author Name</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reading Time</label>
              <input
                type="text"
                value={readingTime}
                onChange={(e) => setReadingTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Rich Content Editor */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Article Body</label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-100 rounded-t-xl border border-b-0 border-slate-300">
              <button
                type="button"
                onClick={() => insertFormatting("\n## ", "\n", "Heading 2")}
                className="px-2.5 py-1 bg-white hover:bg-slate-200 border rounded text-xs font-bold text-slate-800"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("\n### ", "\n", "Heading 3")}
                className="px-2.5 py-1 bg-white hover:bg-slate-200 border rounded text-xs font-bold text-slate-800"
              >
                H3
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("**", "**", "Bold text")}
                className="px-2.5 py-1 bg-white hover:bg-slate-200 border rounded text-xs font-bold text-slate-800"
              >
                <b>B</b>
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('<span class="text-emerald-700 font-semibold">', '</span>', 'Green text')}
                className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded text-xs font-bold"
              >
                Emerald
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('<span class="text-amber-700 font-semibold">', '</span>', 'Amber text')}
                className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded text-xs font-bold"
              >
                Amber
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("\n> 📖 *« ", " »* — (Surah ...)\n", "Ayah")}
                className="px-2 py-1 bg-white hover:bg-emerald-50 border rounded text-xs font-bold text-emerald-800"
              >
                📖 Quote
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("\n> 💡 **Key Takeaway:** ", "\n", "Takeaway")}
                className="px-2 py-1 bg-white hover:bg-amber-50 border rounded text-xs font-bold text-amber-800"
              >
                💡 Callout
              </button>

              <input
                type="file"
                accept="image/*"
                ref={inlineImageInputRef}
                onChange={handleInlineImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => inlineImageInputRef.current?.click()}
                disabled={uploadingInline}
                className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <i className={`fa-solid ${uploadingInline ? "fa-spinner fa-spin" : "fa-image"}`}></i>
                <span>{uploadingInline ? "Inserting..." : "Insert Image Inside Article"}</span>
              </button>
            </div>

            <textarea
              ref={textareaRef}
              rows={14}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-4 rounded-b-xl border border-slate-300 text-sm font-sans leading-relaxed outline-none focus:border-emerald-600 font-mono"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <Link
              href="/admin/articles"
              className="w-1/3 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm text-center transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="w-2/3 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-800 hover:from-emerald-700 hover:to-teal-900 text-white font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {saving ? "Updating Article..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}