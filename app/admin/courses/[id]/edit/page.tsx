"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Level {
  level: string;
  title: string;
  description: string;
}

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // حقول النموذج
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [badge, setBadge] = useState("");
  const [category, setCategory] = useState("Quran");
  const [icon, setIcon] = useState("fa-book-quran");
  const [duration, setDuration] = useState("");
  const [prerequisites, setPrerequisites] = useState("");
  const [summary, setSummary] = useState("");
  const [outcomesText, setOutcomesText] = useState("");
  const [materialsText, setMaterialsText] = useState("");
  const [levels, setLevels] = useState<Level[]>([
    { level: "Level 1", title: "", description: "" },
  ]);

  useEffect(() => {
    const adminKey = sessionStorage.getItem("fazakkir_admin_key");
    if (!adminKey) {
      setMessage({ type: "error", text: "Please log in via the Admin Leads page first." });
      setLoading(false);
      return;
    }

    const fetchCourse = async () => {
      try {
        const res = await fetch(`/api/admin/courses?key=${encodeURIComponent(adminKey)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch courses");

        const target = (data.courses || []).find((c: any) => c.id === courseId);
        if (!target) throw new Error("Course not found");

        setTitle(target.title || "");
        setSlug(target.slug || "");
        setSubtitle(target.subtitle || "");
        setBadge(target.badge || "");
        setCategory(target.category || "Quran");
        setIcon(target.icon || "fa-book-quran");
        setDuration(target.duration || "");
        setPrerequisites(target.prerequisites || "None");
        setSummary(target.summary || "");

        if (Array.isArray(target.levels) && target.levels.length > 0) {
          setLevels(target.levels);
        }
        if (Array.isArray(target.learning_outcomes)) {
          setOutcomesText(target.learning_outcomes.join("\n"));
        }
        if (Array.isArray(target.books_materials)) {
          setMaterialsText(target.books_materials.join("\n"));
        }
      } catch (err: any) {
        setMessage({ type: "error", text: err.message || "Failed to load course details" });
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  const addLevel = () => {
    setLevels([
      ...levels,
      { level: `Level ${levels.length + 1}`, title: "", description: "" },
    ]);
  };

  const updateLevel = (index: number, field: string, val: string) => {
    const updated = [...levels];
    (updated[index] as any)[field] = val;
    setLevels(updated);
  };

  const removeLevel = (index: number) => {
    if (levels.length === 1) return;
    setLevels(levels.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const adminKey = sessionStorage.getItem("fazakkir_admin_key");
    if (!adminKey) {
      setMessage({ type: "error", text: "Session expired. Please log in again." });
      setSaving(false);
      return;
    }

    const payload = {
      key: adminKey,
      id: courseId,
      slug,
      title,
      subtitle,
      badge,
      category,
      icon,
      duration,
      prerequisites,
      summary,
      levels: levels.filter((l) => l.title.trim() !== ""),
      learning_outcomes: outcomesText.split("\n").map((s) => s.trim()).filter(Boolean),
      books_materials: materialsText.split("\n").map((s) => s.trim()).filter(Boolean),
    };

    try {
      const res = await fetch("/api/admin/courses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update course");

      setMessage({ type: "success", text: "Course updated successfully! Redirecting..." });
      setTimeout(() => {
        router.push("/admin/courses");
      }, 1200);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Update failed" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-sm font-bold text-slate-500 flex items-center gap-2">
          <i className="fa-solid fa-spinner fa-spin text-emerald-700 text-lg"></i>
          Loading course data...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/admin/courses" className="text-xs font-bold text-emerald-800 hover:underline">
              ← Back to All Courses
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Edit Course: {title}
            </h1>
          </div>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl mb-6 text-xs sm:text-sm font-bold border ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Course Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-emerald-600 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Slug (URL)</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-emerald-600 bg-slate-50 font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Subtitle / Short Hook</label>
            <input
              type="text"
              required
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-emerald-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Badge Text</label>
              <input
                type="text"
                required
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Duration</label>
              <input
                type="text"
                required
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Prerequisites</label>
              <input
                type="text"
                required
                value={prerequisites}
                onChange={(e) => setPrerequisites(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Course Summary</label>
            <textarea
              rows={4}
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 text-sm outline-none focus:border-emerald-600"
            />
          </div>

          {/* Curriculum Roadmap (Levels) */}
          <div className="border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Curriculum Levels</h3>
              <button
                type="button"
                onClick={addLevel}
                className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                + Add Another Level
              </button>
            </div>

            <div className="space-y-3">
              {levels.map((lvl, index) => (
                <div key={index} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={lvl.level}
                      onChange={(e) => updateLevel(index, "level", e.target.value)}
                      className="w-24 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-emerald-800"
                    />
                    <input
                      type="text"
                      placeholder="Level Title"
                      value={lvl.title}
                      onChange={(e) => updateLevel(index, "title", e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold outline-none"
                    />
                    {levels.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLevel(index)}
                        className="text-rose-500 hover:text-rose-700 text-xs px-2"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Description..."
                    value={lvl.description}
                    onChange={(e) => updateLevel(index, "description", e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded text-xs outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Outcomes & Books */}
          <div className="border-t border-slate-200 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Learning Outcomes (One per line)
              </label>
              <textarea
                rows={4}
                value={outcomesText}
                onChange={(e) => setOutcomesText(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 text-xs outline-none focus:border-emerald-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Books & Materials (One per line)
              </label>
              <textarea
                rows={4}
                value={materialsText}
                onChange={(e) => setMaterialsText(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 text-xs outline-none focus:border-emerald-600 font-mono"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Link
              href="/admin/courses"
              className="w-1/3 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm text-center transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="w-2/3 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-800 hover:from-emerald-700 hover:to-teal-900 text-white font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving Changes..." : "Update Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}