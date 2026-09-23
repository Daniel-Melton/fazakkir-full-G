"use client";

import React, { useState, useEffect } from "react";
import RescheduleModal from "@/components/scheduling/RescheduleModal";

interface SessionReport {
  attendance_status: string;
  surah_name: string | null;
  from_ayah: number | null;
  to_ayah: number | null;
  rating: number | null;
  homework: string | null;
  notes: string | null;
}

interface UpcomingSession {
  id: string;
  scheduled_at_utc: string;
  duration_minutes: number;
  meeting_url: string | null;
  status: string;
  students: { student_name: string } | null;
  tutors: { id: string; profiles: { full_name: string } | null } | null;
}

interface PastSession {
  id: string;
  scheduled_at_utc: string;
  duration_minutes: number;
  status: string;
  students: { student_name: string } | null;
  tutors: { profiles: { full_name: string } | null } | null;
  session_reports: SessionReport[] | null;
}

interface StudentItem {
  id: string;
  student_name: string;
  level: string;
}

export default function ParentDashboardPage() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingSession[]>([]);
  const [past, setPast] = useState<PastSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessionForReschedule, setSelectedSessionForReschedule] = useState<UpcomingSession | null>(null);

  const loadData = async () => {
    try {
      const res = await fetch("/api/v1/parent/overview");
      const json = await res.json();
      if (json.success && json.data) {
        setStudents(json.data.students);
        setUpcoming(json.data.upcoming_sessions);
        setPast(json.data.past_sessions);
      }
    } catch (err) {
      console.error("Failed to load parent overview:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-xs text-gray-500">جاري تحميل بيانات المتابعة...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 dir-rtl text-right">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">متابعة الأبناء والحصص</h1>
        <p className="text-xs text-gray-500 mt-1">
          جدول الحصص القادمة، روابط الفصول الافتراضية، وتقارير الإنجاز اليومية.
        </p>
      </div>

      {/* قائمة الأبناء المسجلين */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {students.map((st) => (
          <div key={st.id} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-1">
            <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
              طالب مسجل
            </span>
            <h3 className="font-bold text-sm text-gray-800">{st.student_name}</h3>
            <p className="text-xs text-gray-500">المستوى: {st.level || "تأسيس"}</p>
          </div>
        ))}
      </div>

      {/* الحصص القادمة */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-800">الحصص القادمة</h2>
        {upcoming.length === 0 ? (
          <div className="p-6 bg-white border border-gray-100 rounded-2xl text-center text-xs text-gray-400">
            لا توجد حصص مجدولة قادمة حالياً.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map((s) => {
              const sessionDate = new Date(s.scheduled_at_utc);
              return (
                <div key={s.id} className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-900">{s.students?.student_name}</span>
                      <p className="text-[11px] text-gray-500">
                        المعلم: {s.tutors?.profiles?.full_name || "غير محدد"}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      {s.duration_minutes} دقيقة
                    </span>
                  </div>

                  <div className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl flex items-center justify-between">
                    <span>
                      {sessionDate.toLocaleDateString("ar-EG", {
                        weekday: "long",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="font-bold">
                      {sessionDate.toLocaleTimeString("ar-EG", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {s.meeting_url ? (
                      <a
                        href={s.meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl transition"
                      >
                        دخول الحصة
                      </a>
                    ) : (
                      <span className="flex-1 text-center py-2 bg-gray-100 text-gray-400 text-xs rounded-xl">
                        الرابط غير متاح
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedSessionForReschedule(s)}
                      className="px-3 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs rounded-xl transition"
                    >
                      طلب تأجيل
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* سجل الحصص والتقارير */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-800">تقارير الحصص السابقة وإنجاز الحفظ</h2>
        {past.length === 0 ? (
          <div className="p-6 bg-white border border-gray-100 rounded-2xl text-center text-xs text-gray-400">
            لا توجد تقارير سابقة مسجلة بعد.
          </div>
        ) : (
          <div className="space-y-3">
            {past.map((ps) => {
              const report = ps.session_reports?.[0];
              const dateObj = new Date(ps.scheduled_at_utc);
              return (
                <div key={ps.id} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-800">
                      {ps.students?.student_name} - {ps.tutors?.profiles?.full_name}
                    </span>
                    <span className="text-gray-400">
                      {dateObj.toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}
                    </span>
                  </div>

                  {report ? (
                    <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl text-xs space-y-1.5 text-gray-700">
                      <div className="flex items-center justify-between">
                        <span>
                          <strong>ما تم إنجازه:</strong> سورة {report.surah_name || "---"} (الآيات{" "}
                          {report.from_ayah || 1} إلى {report.to_ayah || 1})
                        </span>
                        {report.rating && (
                          <span className="text-amber-600 font-bold">التقييم: {report.rating}/5 ★</span>
                        )}
                      </div>
                      {report.homework && (
                        <div className="text-[11px] text-gray-600">
                          <strong>الواجب المنزلي:</strong> {report.homework}
                        </div>
                      )}
                      {report.notes && (
                        <div className="text-[11px] text-gray-500 italic">
                          <strong>ملاحظات المعلم:</strong> {report.notes}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-400 italic bg-gray-50 p-2 rounded-lg">
                      لم يتم تدوين تقرير لهذه الحصة.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* نافذة إعادة الجدولة المعتمدة على محرك السياسات */}
      {selectedSessionForReschedule && (
        <RescheduleModal
          sessionId={selectedSessionForReschedule.id}
          currentScheduledAt={selectedSessionForReschedule.scheduled_at_utc}
          isOpen={true}
          onClose={() => setSelectedSessionForReschedule(null)}
          onSuccess={() => {
            setSelectedSessionForReschedule(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}