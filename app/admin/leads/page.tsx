"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Lead {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone_number: string;
  country_code: string;
  course_name: string;
  status: string;
  notes?: string;
  plan_name?: string;
  students_count?: number;
  discount_applied?: string;
  total_price?: string;
  preferred_time?: string | null;
  timezone?: string | null;
  [key: string]: any;
}

const STATUS_COLORS: Record<string, string> = {
  New: "bg-blue-100 text-blue-800 border-blue-300",
  Contacted: "bg-amber-100 text-amber-800 border-amber-300",
  "Trial Booked": "bg-purple-100 text-purple-800 border-purple-300",
  Enrolled: "bg-emerald-100 text-emerald-800 border-emerald-300",
  Cancelled: "bg-rose-100 text-rose-800 border-rose-300",
};

export default function AdminLeadsPage() {
  const [adminKey, setAdminKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  
  // Modal State for Admin Manual Entry
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [newLead, setNewLead] = useState({
    full_name: "",
    email: "",
    country_code: "+1",
    phone_number: "",
    course_name: "Quran Reading (Noorani Qaida)",
    status: "Trial Booked",
    plan_name: "3 Classes / Week",
    students_count: 1,
  });

  const fetchLeads = async (key: string) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/admin/leads?key=${encodeURIComponent(key)}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to authenticate");

      setLeads(data.leads || []);
      setIsAuthenticated(true);
      sessionStorage.setItem("fazakkir_admin_key", key);
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid Admin Key");
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedKey = sessionStorage.getItem("fazakkir_admin_key");
    if (savedKey) {
      setAdminKey(savedKey);
      fetchLeads(savedKey);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey.trim()) return;
    fetchLeads(adminKey.trim());
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: adminKey,
          id,
          status: newStatus,
        }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
        );
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: adminKey,
          ...newLead,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create lead");

      setLeads((prev) => [data.lead, ...prev]);
      setIsModalOpen(false);
      setNewLead({
        full_name: "",
        email: "",
        country_code: "+1",
        phone_number: "",
        course_name: "Quran Reading (Noorani Qaida)",
        status: "Trial Booked",
        plan_name: "3 Classes / Week",
        students_count: 1,
      });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.phone_number?.includes(searchQuery) ||
      l.course_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "ALL" || (l.status || "New") === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl mx-auto mb-4">
            <i className="fa-solid fa-lock"></i>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Admin Portal</h1>
          <p className="text-xs text-slate-500 mt-1 mb-6">Enter administrative key to manage inquiries</p>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl mb-4">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Enter Admin Secret Key"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 outline-none text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Unlock Dashboard"}
            </button>
          </form>
          <Link href="/" className="inline-block mt-6 text-xs text-slate-400 hover:text-slate-600 font-medium">
            ← Back to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-[#022c22] text-white py-4 px-6 sticky top-0 z-50 border-b border-emerald-950 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-lg">
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-tight">Fazakkir Academy</div>
              <div className="text-[11px] text-emerald-300">Admin Leads Management</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* زر حجز الطالب الجديد */}
            <Link
              href="/admin/leads/new"
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <i className="fa-solid fa-user-plus text-[11px]"></i>
              <span>+ Book Student</span>
            </Link>

            {/* أزرار إدارة الكورسات والمقالات */}
            <Link
              href="/admin/courses/new"
              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <i className="fa-solid fa-plus text-[10px]"></i>
              <span>+ Add Course</span>
            </Link>

            <Link
              href="/admin/courses"
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <i className="fa-solid fa-book-open text-[11px]"></i>
              <span>Manage Courses</span>
            </Link>

            <Link
              href="/admin/articles"
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <i className="fa-solid fa-newspaper text-[11px]"></i>
              <span>Articles Hub</span>
            </Link>

            {/* زر التحديث وتسجيل الخروج */}
            <button
              onClick={() => fetchLeads(adminKey)}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Refresh Leads"
            >
              <i className={`fa-solid fa-rotate-right ${loading ? "fa-spin" : ""}`}></i>
            </button>

            <button
              onClick={() => {
                sessionStorage.removeItem("fazakkir_admin_key");
                setIsAuthenticated(false);
              }}
              className="px-3 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-xs font-semibold transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Metrics Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Leads</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">{leads.length}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">New</span>
            <div className="text-3xl font-extrabold text-blue-700 mt-1">
              {leads.filter((l) => (l.status || "New") === "New").length}
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Trials Booked</span>
            <div className="text-3xl font-extrabold text-purple-700 mt-1">
              {leads.filter((l) => l.status === "Trial Booked").length}
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Enrolled</span>
            <div className="text-3xl font-extrabold text-emerald-700 mt-1">
              {leads.filter((l) => l.status === "Enrolled").length}
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, phone..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {["ALL", "New", "Contacted", "Trial Booked", "Enrolled", "Cancelled"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === st
                    ? "bg-emerald-800 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-4 px-6">Student / Parent</th>
                  <th className="py-4 px-6">Contact & WhatsApp</th>
                  <th className="py-4 px-6">Course & Plan</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <i className="fa-solid fa-inbox text-3xl mb-2 block"></i>
                      No leads match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const currentStatus = lead.status || "New";
                    const cleanPhone = (lead.country_code || "") + (lead.phone_number || "");
                    const waLink = `https://wa.me/${cleanPhone.replace(/[^0-9]/g, "")}`;

                    return (
                      <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900">{lead.full_name}</div>
                          <div className="text-xs text-slate-400">{lead.email}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-700">
                            {lead.country_code} {lead.phone_number}
                          </div>
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline mt-0.5"
                          >
                            <i className="fa-brands fa-whatsapp text-emerald-600"></i>
                            <span>Chat on WhatsApp</span>
                          </a>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200">
                            {lead.course_name || "General"}
                          </span>
                          {lead.plan_name && (
                            <div className="text-[11px] text-slate-500 mt-1 font-medium">
                              Plan: {lead.plan_name} ({lead.students_count || 1} std)
                              {lead.total_price && ` • ${lead.total_price}`}
                            </div>
                          )}

                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                              {lead.preferred_time === "Morning" ? "☀️ Morning" : "🌙 Evening"}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              ({lead.timezone || "UTC"})
                            </span>
                          </div>
                        </td>
                        
                        <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap">
                          {lead.created_at
                            ? new Date(lead.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "-"}
                        </td>
                        <td className="py-4 px-6">
                          <select
                            value={currentStatus}
                            onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                            className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border outline-none cursor-pointer ${
                              STATUS_COLORS[currentStatus] || "bg-slate-100 text-slate-800"
                            }`}
                          >
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Trial Booked">Trial Booked</option>
                            <option value="Enrolled">Enrolled</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <a
                            href={`mailto:${lead.email}?subject=Welcome to Fazakkir Academy`}
                            className="p-2 text-slate-400 hover:text-emerald-700 transition-colors inline-block"
                            title="Send Email"
                          >
                            <i className="fa-solid fa-envelope"></i>
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}