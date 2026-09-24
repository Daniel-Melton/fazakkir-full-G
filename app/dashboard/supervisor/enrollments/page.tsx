"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { NotificationBell } from "@/components/dashboard/notification-bell";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface TutorItem {
  id: string;
  profiles?: { full_name: string; email: string } | null;
}

interface ActiveSession {
  id: string;
  scheduled_at_utc: string;
  meeting_url: string;
  status: string;
}

interface EnrollmentItem {
  id: string;
  status: string;
  plan_tier: string;
  weekly_classes_count: number;
  class_duration_minutes: number;
  tutor_id: string | null;
  students?: {
    id: string;
    student_name: string;
    level: string;
    gender: string | null;
    parent?: { full_name: string; email: string; phone: string | null } | null;
  } | null;
  class_sessions?: ActiveSession[];
}

interface SlotItem {
  start: string;
  end: string;
}

export default function SupervisorEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [tutors, setTutors] = useState<TutorItem[]>([]);
  const [token, setToken] = useState<string>("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // تبويبات الـ Navigation العلوية
  const [activeTab, setActiveTab] = useState<"dashboard" | "enrollments" | "calendar" | "tutors">("dashboard");

  // حالة النوافذ المنبثقة
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentItem | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [activeSessionToManage, setActiveSessionToManage] = useState<ActiveSession | null>(null);
  const [targetTutorId, setTargetTutorId] = useState<string>("");

  const [scheduleDate, setScheduleDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // جلب البيانات
  const loadData = useCallback(async (authToken: string) => {
    try {
      const [resEnrollments, resTutors] = await Promise.all([
        fetch("/api/v1/enrollments", { headers: { Authorization: `Bearer ${authToken}` } }),
        fetch("/api/v1/tutors", { headers: { Authorization: `Bearer ${authToken}` } }),
      ]);

      const dataEnrollments = await resEnrollments.json();
      const dataTutors = await resTutors.json();

      if (dataEnrollments.success && dataEnrollments.data?.enrollments) {
        setEnrollments(dataEnrollments.data.enrollments);
      }
      if (dataTutors.success && dataTutors.data?.tutors) {
        setTutors(dataTutors.data.tutors);
      }
    } catch (err) {
      console.error("Failed to load supervisor data:", err);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        setToken(session.access_token);
        await loadData(session.access_token);
      } else {
        try {
          const authRes = await fetch("/api/auth/session");
          const authData = await authRes.json();
          if (authData?.access_token) {
            setToken(authData.access_token);
            await loadData(authData.access_token);
            return;
          }
        } catch (e) {
          console.error("Auth session fetch error", e);
        }
        setInitialLoading(false);
      }
    }
    init();
  }, [loadData]);

  // إحصائيات سريعة للبطاقات العلوية
  const stats = {
    scheduledCount: enrollments.filter((e) => e.class_sessions?.some((s) => s.status === "scheduled")).length,
    pendingTrials: enrollments.filter((e) => e.status === "trial_pending").length,
    totalStudents: enrollments.length,
  };

  const fetchTutorSlots = async (tutorId: string, dateStr: string) => {
    if (!tutorId) {
      setSlots([]);
      setSelectedSlot("");
      return;
    }
    try {
      setSlotsLoading(true);
      const from = `${dateStr}T00:00:00.000Z`;
      const to = `${dateStr}T23:59:59.999Z`;

      const res = await fetch(
        `/api/v1/tutors/${tutorId}/availability?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&duration=30`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();

      if (data.success && Array.isArray(data.data?.slots)) {
        const parsedSlots: SlotItem[] = data.data.slots
          .map((s: any) => {
            if (!s) return null;
            if (typeof s === "string") return { start: s, end: "" };
            const startTime = s.start || s.start_time || s.startTime || "";
            const endTime = s.end || s.end_time || s.endTime || "";
            return startTime ? { start: String(startTime), end: String(endTime) } : null;
          })
          .filter(Boolean) as SlotItem[];

        setSlots(parsedSlots);
        setSelectedSlot(parsedSlots[0]?.start || "");
      } else {
        setSlots([]);
        setSelectedSlot("");
      }
    } catch (e) {
      console.error("Failed to fetch slots:", e);
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const openScheduleModal = (item: EnrollmentItem) => {
    if (!item.tutor_id) {
      alert("يرجى اختيار المعلم أولاً قبل فتح الجدولة");
      return;
    }
    setSelectedEnrollment(item);
    setTargetTutorId(item.tutor_id);
    setIsRescheduling(false);
    setActiveSessionToManage(null);
    setScheduleModalOpen(true);
    fetchTutorSlots(item.tutor_id, scheduleDate);
  };

  const openManageModal = (item: EnrollmentItem, session: ActiveSession) => {
    setSelectedEnrollment(item);
    setActiveSessionToManage(session);
    setTargetTutorId(item.tutor_id || "");
    setManageModalOpen(true);
  };

  const confirmSchedule = async () => {
    if (!selectedEnrollment || !targetTutorId || !selectedSlot) {
      alert("يرجى تحديد المعلم والوقت المناسب");
      return;
    }

    try {
      setActionLoading(true);
      const scheduledIso = selectedSlot.includes("T")
        ? selectedSlot
        : `${scheduleDate}T${selectedSlot}:00Z`;

      if (isRescheduling && activeSessionToManage) {
        const res = await fetch("/api/v1/sessions/manage", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            session_id: activeSessionToManage.id,
            action: "reschedule",
            new_scheduled_at_utc: scheduledIso,
            new_tutor_id: targetTutorId,
          }),
        });

        if (res.ok) {
          setScheduleModalOpen(false);
          await loadData(token);
        } else {
          const err = await res.json();
          alert(`فشل التعديل: ${err.error || "خطأ غير متوقع"}`);
        }
      } else {
        const res = await fetch("/api/v1/sessions/schedule-trial", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            enrollment_id: selectedEnrollment.id,
            tutor_id: targetTutorId,
            scheduled_at_utc: scheduledIso,
            duration_minutes: selectedEnrollment.class_duration_minutes || 30,
          }),
        });

        if (res.ok) {
          setScheduleModalOpen(false);
          await loadData(token);
        } else {
          const err = await res.json();
          alert(`فشل الحجز: ${err.error || "خطأ غير متوقع"}`);
        }
      }
    } catch (e) {
      console.error("Schedule error:", e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSession = async () => {
    if (!activeSessionToManage) return;

    const confirmed = confirm("هل أنت متأكد من إلغاء هذه الحصة؟ سيتم إشعار المعلم وولي الأمر.");
    if (!confirmed) return;

    try {
      setActionLoading(true);
      const res = await fetch("/api/v1/sessions/manage", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: activeSessionToManage.id,
          action: "cancel",
        }),
      });

      if (res.ok) {
        setManageModalOpen(false);
        await loadData(token);
      } else {
        const err = await res.json();
        alert(`فشل الإلغاء: ${err.error || "خطأ غير متوقع"}`);
      }
    } catch (e) {
      console.error("Cancel error:", e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignTutor = async (enrollmentId: string, tutorId: string) => {
    const formattedTutorId = tutorId.trim() === "" ? null : tutorId;
    setUpdatingId(enrollmentId);

    setEnrollments((prev) =>
      prev.map((item) =>
        item.id === enrollmentId ? { ...item, tutor_id: formattedTutorId } : item
      )
    );

    try {
      const res = await fetch("/api/v1/enrollments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enrollment_id: enrollmentId,
          tutor_id: formattedTutorId,
        }),
      });

      if (!res.ok) await loadData(token);
    } catch {
      await loadData(token);
    } finally {
      setUpdatingId(null);
    }
  };

  // قائمة الحصص القادمة للمنطقة الجانبية
  const upcomingSessions = enrollments
    .flatMap((e) =>
      (e.class_sessions || [])
        .filter((s) => s.status === "scheduled")
        .map((s) => ({
          ...s,
          studentName: e.students?.student_name || "طالب",
          tutorName: tutors.find((t) => t.id === e.tutor_id)?.profiles?.full_name || "المعلم",
          enrollment: e,
        }))
    )
    .sort((a, b) => new Date(a.scheduled_at_utc).getTime() - new Date(b.scheduled_at_utc).getTime())
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-[#F4F5F9] p-4 md:p-8 dir-rtl text-right font-sans text-slate-800">
      {/* الإطار الأبيض العائم المستدير */}
      <div className="max-w-[1400px] mx-auto bg-white rounded-[32px] shadow-sm border border-slate-200/60 p-6 md:p-10">
        
        {/* 1. الشريط العلوي الكبسولي (Header & Capsule Nav) */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 pb-8 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              ف
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              أكاديمية فذكّر
            </span>
          </div>

          {/* كبسولات التنقل */}
          <nav className="flex items-center bg-slate-50 p-1.5 rounded-full border border-slate-100 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-5 py-2 rounded-full transition-all ${
                activeTab === "dashboard"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              الرئيسية
            </button>
            <button
              onClick={() => setActiveTab("enrollments")}
              className={`px-5 py-2 rounded-full transition-all ${
                activeTab === "enrollments"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              الاشتراكات
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={`px-5 py-2 rounded-full transition-all ${
                activeTab === "calendar"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              التقويم
            </button>
            <button
              onClick={() => setActiveTab("tutors")}
              className={`px-5 py-2 rounded-full transition-all ${
                activeTab === "tutors"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              المعلمون
            </button>
          </nav>

          {/* أدوات التحكم العلوية: بحث، جرس إشعارات، بروفايل */}
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition">
              🔍
            </button>
            
            {/* جرس الإشعارات مع صوت الـ Pop والتحديث اللحظي */}
            <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition">
              <NotificationBell authToken={token} />
            </div>

            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
              مشرف
            </div>
          </div>
        </header>

        {/* 2. قسم المحتوى الداخلي وشبكة التوزيع */}
        <main className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* العمود الرئيسي (8 أعمدة): الإحصائيات + قائمة الطلاب وتسكين الحصص */}
          <section className="lg:col-span-8 space-y-8">
            
            {/* بطاقات الإحصائيات الـ 3 المستوحاة من التصميم */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              
              <div className="p-6 rounded-3xl bg-slate-50/60 border border-slate-100 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400">الحصص المجدولة</span>
                  <p className="text-xs text-slate-400 mt-0.5">الحصص القائمة حالياً</p>
                </div>
                <div className="flex items-baseline justify-between mt-6">
                  <span className="text-3xl font-black text-slate-900">{stats.scheduledCount}</span>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                    نشطة
                  </span>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-slate-50/60 border border-slate-100 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400">تجارب معلقة</span>
                  <p className="text-xs text-slate-400 mt-0.5">بانتظار تخصيص موعد</p>
                </div>
                <div className="flex items-baseline justify-between mt-6">
                  <span className="text-3xl font-black text-slate-900">{stats.pendingTrials}</span>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                    معلقة
                  </span>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-slate-50/60 border border-slate-100 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400">إجمالي الاشتراكات</span>
                  <p className="text-xs text-slate-400 mt-0.5">الطلاب المقيدون</p>
                </div>
                <div className="flex items-baseline justify-between mt-6">
                  <span className="text-3xl font-black text-slate-900">{stats.totalStudents}</span>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                    طالب
                  </span>
                </div>
              </div>

            </div>

            {/* بطاقة تسكين الطلاب وإدارة الحصص */}
            <div className="border border-slate-100 rounded-3xl p-6 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">تسكين وجدولة الطلاب</h2>
                  <p className="text-xs text-slate-400 mt-0.5">تعيين المعلمين وإدارة مواعيد الحصص التجريبية</p>
                </div>
                <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                  {enrollments.length} اشتراك
                </span>
              </div>

              {initialLoading ? (
                <div className="py-16 text-center text-xs text-slate-400">جاري تحميل المنظومة...</div>
              ) : enrollments.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  لا توجد طلبات اشتراك حالياً.
                </div>
              ) : (
                <div className="space-y-3">
                  {enrollments.map((item) => {
                    const activeSession = item.class_sessions?.find((s) => s.status === "scheduled");
                    const isLocked = Boolean(activeSession);

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col md:flex-row items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/40 transition gap-4"
                      >
                        {/* بيانات الطالب */}
                        <div className="flex items-center gap-3 w-full md:w-auto">
                          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                            {item.students?.student_name?.charAt(0) || "ط"}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">
                              {item.students?.student_name || "طالب بدون اسم"}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">
                              المستوى: {item.students?.level || "مبتدئ"} • ولي الأمر: {item.students?.parent?.full_name || "—"}
                            </div>
                          </div>
                        </div>

                        {/* تخصيص المعلم: مغلق 🔒 إذا كانت الحصة مجدولة */}
                        <div className="w-full md:w-auto">
                          {isLocked ? (
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100/70 border border-slate-200 px-3.5 py-2 rounded-xl">
                              <span>🔒</span>
                              <span className="truncate max-w-[140px]">
                                {tutors.find((t) => t.id === item.tutor_id)?.profiles?.full_name || "المعلم المخصص"}
                              </span>
                            </div>
                          ) : (
                            <select
                              value={item.tutor_id || ""}
                              onChange={(e) => handleAssignTutor(item.id, e.target.value)}
                              className={`text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-slate-900 transition-opacity ${
                                updatingId === item.id ? "opacity-50" : "opacity-100"
                              }`}
                            >
                              <option value="">-- تخصيص معلم --</option>
                              {tutors.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.profiles?.full_name || t.id.slice(0, 8)}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        {/* زر الجدولة أو كبسولة الموعد القائم */}
                        <div className="w-full md:w-auto text-left">
                          {activeSession ? (
                            (() => {
                              const d = new Date(activeSession.scheduled_at_utc);
                              const timeStr = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
                              const dateStr = `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;

                              return (
                                <button
                                  type="button"
                                  onClick={() => openManageModal(item, activeSession)}
                                  className="inline-flex items-center gap-2 text-xs px-3.5 py-2 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm"
                                >
                                  <span>📅</span>
                                  <span>{dateStr} • {timeStr} UTC</span>
                                </button>
                              );
                            })()
                          ) : (
                            <button
                              type="button"
                              onClick={() => openScheduleModal(item)}
                              disabled={!item.tutor_id}
                              className={`text-xs px-4 py-2 rounded-xl font-bold transition ${
                                item.tutor_id
                                  ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
                                  : "bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed"
                              }`}
                            >
                              جدولة تجربة
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </section>

          {/* العمود الجانبي (4 أعمدة): التقويم المصغر + الحصص القادمة */}
          <aside className="lg:col-span-4 space-y-6">
            
            {/* 1. التقويم المصغر (July 2026 / Calendar Widget) */}
            <div className="border border-slate-100 rounded-3xl p-6 bg-slate-50/40">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-400">‹</span>
                <span className="text-sm font-extrabold text-slate-800">سبتمبر 2026</span>
                <span className="text-xs font-bold text-slate-400">›</span>
              </div>

              {/* أسماء الأيام */}
              <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400 mb-2">
                <span>س</span><span>ح</span><span>ن</span><span>ث</span><span>ر</span><span>خ</span><span>ج</span>
              </div>

              {/* أيام الشهر مع إبراز اليوم المحدد بكبسولة ناعمة */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-700">
                <span className="p-2 text-slate-300">29</span>
                <span className="p-2 text-slate-300">30</span>
                <span className="p-2">1</span>
                <span className="p-2">2</span>
                <span className="p-2">3</span>
                <span className="p-2">4</span>
                <span className="p-2">5</span>
                <span className="p-2">6</span>
                <span className="p-2">7</span>
                <span className="p-2">8</span>
                <span className="p-2">9</span>
                <span className="p-2">10</span>
                <span className="p-2">11</span>
                <span className="p-2">12</span>
                <span className="p-2">13</span>
                <span className="p-2">14</span>
                <span className="p-2">15</span>
                <span className="p-2">16</span>
                <span className="p-2">17</span>
                <span className="p-2">18</span>
                <span className="p-2">19</span>
                <span className="p-2">20</span>
                <span className="p-2">21</span>
                <span className="p-2">22</span>
                <span className="p-2">23</span>
                <span className="p-2 rounded-full bg-blue-500 text-white font-bold shadow-sm">24</span>
                <span className="p-2">25</span>
                <span className="p-2">26</span>
                <span className="p-2">27</span>
                <span className="p-2">28</span>
                <span className="p-2">29</span>
                <span className="p-2">30</span>
              </div>
            </div>

            {/* 2. ويدجت الحصص القادمة المماثلة لـ Upcoming Bookings */}
            <div className="border border-slate-100 rounded-3xl p-6 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">الحصص القادمة</h3>
                <span className="text-xs font-bold text-slate-400">›</span>
              </div>

              {upcomingSessions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">لا توجد حصص قادمة مجدولة</div>
              ) : (
                <div className="space-y-4">
                  {upcomingSessions.map((session, idx) => {
                    const sessionDate = new Date(session.scheduled_at_utc);
                    const time = sessionDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
                    const dateFormatted = sessionDate.toLocaleDateString("ar-EG", { month: "short", day: "numeric", timeZone: "UTC" });

                    return (
                      <div
                        key={idx}
                        onClick={() => openManageModal(session.enrollment, session)}
                        className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 cursor-pointer transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                            📖
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{session.studentName}</div>
                            <div className="text-[10px] text-slate-400">{session.tutorName}</div>
                          </div>
                        </div>

                        <div className="text-left">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                            {time} UTC
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">{dateFormatted}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </aside>

        </main>
      </div>

      {/* مودال 1: إدارة الحصة القائمة (تعديل أو إلغاء) */}
      {manageModalOpen && selectedEnrollment && activeSessionToManage && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900 mb-2">تفاصيل وإدارة الحصة</h3>
            
            <div className="bg-slate-50 rounded-2xl p-4 mb-4 text-xs space-y-2 border border-slate-100">
              <div>
                <span className="text-slate-400">الطالب:</span>{" "}
                <span className="font-bold text-slate-800">{selectedEnrollment.students?.student_name}</span>
              </div>
              <div>
                <span className="text-slate-400">المعلم:</span>{" "}
                <span className="font-bold text-slate-800">
                  {tutors.find((t) => t.id === selectedEnrollment.tutor_id)?.profiles?.full_name || "المعلم"}
                </span>
              </div>
              <div>
                <span className="text-slate-400">الموعد:</span>{" "}
                <span className="font-bold text-emerald-600">
                  {new Date(activeSessionToManage.scheduled_at_utc).toLocaleString("ar-EG", {
                    dateStyle: "full",
                    timeStyle: "short",
                    timeZone: "UTC",
                  })}{" "}
                  UTC
                </span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">رابط اللقاء المباشر:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={activeSessionToManage.meeting_url}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-600 outline-none"
                />
                <a
                  href={activeSessionToManage.meeting_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl whitespace-nowrap hover:bg-slate-800 transition"
                >
                  فتح
                </a>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleCancelSession}
                className="text-xs px-3.5 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl font-bold transition"
              >
                {actionLoading ? "جاري الإلغاء..." : "إلغاء الحصة ✕"}
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setManageModalOpen(false)}
                  className="text-xs px-3.5 py-2 text-slate-600 border border-slate-200 rounded-xl font-semibold hover:bg-slate-50"
                >
                  إغلاق
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setManageModalOpen(false);
                    setIsRescheduling(true);
                    setScheduleModalOpen(true);
                    setTargetTutorId(selectedEnrollment.tutor_id || "");
                    fetchTutorSlots(selectedEnrollment.tutor_id || "", scheduleDate);
                  }}
                  className="text-xs px-3.5 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
                >
                  تعديل الموعد ⟳
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مودال 2: الجدولة والتعديل واختيار المعلم */}
      {scheduleModalOpen && selectedEnrollment && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              {isRescheduling ? "تعديل موعد الحصة التجريبية" : "جدولة حصة تجريبية"}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              الطالب: <span className="font-bold text-slate-800">{selectedEnrollment.students?.student_name}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">المعلم المخصص:</label>
                <select
                  value={targetTutorId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setTargetTutorId(newId);
                    fetchTutorSlots(newId, scheduleDate);
                  }}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  <option value="">-- اختر معلماً --</option>
                  {tutors.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.profiles?.full_name || t.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">التاريخ:</label>
                <input
                  type="date"
                  value={scheduleDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    setScheduleDate(e.target.value);
                    if (targetTutorId) fetchTutorSlots(targetTutorId, e.target.value);
                  }}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">الفترات المتاحة (UTC):</label>
                {slotsLoading ? (
                  <div className="text-xs text-slate-400 py-4 text-center">جاري جلب فترات التفرغ...</div>
                ) : !targetTutorId ? (
                  <div className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl border border-dashed text-center">
                    يرجى تحديد المعلم أولاً لعرض الفترات.
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100">
                    لا توجد فترات شاغرة في هذا اليوم.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
                    {slots.map((s, idx) => {
                      const rawStart = s?.start || "";
                      const displayTime = rawStart.includes("T")
                        ? rawStart.split("T")[1]?.substring(0, 5) || rawStart
                        : rawStart;

                      if (!rawStart) return null;

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedSlot(rawStart)}
                          className={`text-xs py-2 rounded-xl border text-center font-bold transition ${
                            selectedSlot === rawStart
                              ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                              : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                          }`}
                        >
                          {displayTime} UTC
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setScheduleModalOpen(false)}
                className="text-xs px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={actionLoading || !selectedSlot || !targetTutorId}
                onClick={confirmSchedule}
                className="text-xs px-5 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition disabled:opacity-40"
              >
                {actionLoading ? "جاري المعالجة..." : isRescheduling ? "حفظ التعديل" : "تأكيد الموعد"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}