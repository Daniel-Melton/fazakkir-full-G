"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Article {
  id: string;
  slug: string;
  title: string;
  category: string;
  author: string;
  reading_time: string;
  cover_image: string;
  published: boolean;
  created_at: string;
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminKey, setAdminKey] = useState("");

  const loadArticles = async (key: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/articles?key=${encodeURIComponent(key)}`);
      const data = await res.json();
      if (res.ok) setArticles(data.articles || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const key = sessionStorage.getItem("fazakkir_admin_key");
    if (key) {
      setAdminKey(key);
      loadArticles(key);
    } else {
      setLoading(false);
    }
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/articles?key=${encodeURIComponent(adminKey)}&id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) setArticles(articles.filter((a) => a.id !== id));
    } catch (err) {
      alert("Delete failed");
    }
  };

  const togglePublish = async (id: string, currentVal: boolean) => {
    try {
      const res = await fetch("/api/admin/articles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: adminKey, id, published: !currentVal }),
      });
      if (res.ok) {
        setArticles(articles.map((a) => (a.id === id ? { ...a, published: !currentVal } : a)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <Link href="/admin/leads" className="text-xs font-bold text-emerald-800 hover:underline">
              ← Back to Leads Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Articles & Content Hub
            </h1>
          </div>
          <Link
            href="/admin/articles/new"
            className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md flex items-center gap-2"
          >
            <i className="fa-solid fa-feather-pointed"></i>
            <span>Write New Article</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                <th className="py-4 px-6">Article</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Author</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">Loading articles...</td>
                </tr>
              ) : articles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">No articles created yet.</td>
                </tr>
              ) : (
                articles.map((articleItem) => (
                  <tr key={articleItem.id} className="hover:bg-slate-50/80">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={articleItem.cover_image || "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=1200&q=80"}
                          alt=""
                          className="w-12 h-10 rounded-lg object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-900 line-clamp-1">{articleItem.title}</div>
                          <Link href={`/blog/${articleItem.slug}`} target="_blank" className="text-xs text-emerald-700 hover:underline">
                            /blog/{articleItem.slug} ↗
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                        {articleItem.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600 font-medium">{articleItem.author}</td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => togglePublish(articleItem.id, articleItem.published)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-full cursor-pointer transition-all ${
                          articleItem.published
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-slate-100 text-slate-500 border border-slate-300"
                        }`}
                      >
                        {articleItem.published ? "Published" : "Draft"}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <Link
                        href={`/admin/articles/${articleItem.id}/edit`}
                        className="inline-block px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 text-xs font-bold transition-all"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(articleItem.id, articleItem.title)}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold cursor-pointer transition-all"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}