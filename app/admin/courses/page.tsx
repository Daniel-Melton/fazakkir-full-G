"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Course {
  id: string;
  slug: string;
  title: string;
  badge: string;
  duration: string;
  category: string;
}

export default function ManageCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [adminKey, setAdminKey] = useState("");

  const loadCourses = async (key: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/courses?key=${encodeURIComponent(key)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch courses");
      setCourses(data.courses || []);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const key = sessionStorage.getItem("fazakkir_admin_key");
    if (key) {
      setAdminKey(key);
      loadCourses(key);
    } else {
      setErrorMsg("Please login from Admin Leads page first.");
      setLoading(false);
    }
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/courses?key=${encodeURIComponent(adminKey)}&id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setCourses(courses.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(err.message);
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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Manage All Courses</h1>
          </div>
          <Link
            href="/admin/courses/new"
            className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md flex items-center gap-2"
          >
            <i className="fa-solid fa-plus"></i>
            <span>Add New Course</span>
          </Link>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl mb-6">
            {errorMsg}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                <th className="py-4 px-6">Course Name</th>
                <th className="py-4 px-6">Badge / Level</th>
                <th className="py-4 px-6">Duration</th>
                <th className="py-4 px-6">Slug</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">Loading courses...</td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">No courses found in database.</td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50">
                    <td className="py-4 px-6 font-bold text-slate-900">{course.title}</td>
                    <td className="py-4 px-6 text-xs text-slate-600">{course.badge}</td>
                    <td className="py-4 px-6 text-xs text-slate-600">{course.duration}</td>
                    <td className="py-4 px-6 text-xs font-mono text-emerald-800">
                      <Link href={`/courses/${course.slug}`} target="_blank" className="hover:underline">
                        /{course.slug} ↗
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <Link
                        href={`/admin/courses/${course.id}/edit`}
                        className="inline-block px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 text-xs font-bold transition-all"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(course.id, course.title)}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-bold cursor-pointer transition-all"
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