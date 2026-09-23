"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface TutorItem {
  id: string;
  profiles?: { full_name: string; email: string } | null;
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
  tutor?: { id: string; full_name: string; email: string } | null;
}

export default function SupervisorEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [tutors, setTutors] = useState<TutorItem[]>([]);
  const [token, setToken] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchData = useCallback(async (authToken: string) => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setToken(session.access_token);
        await fetchData(session.access_token);
      } else {
        setLoading(false);
      }
    }
    init();
  }, [fetchData]);

  const handleAssignTutor = async (enrollmentId: string, tutorId: string) => {
    setSavingId(enrollmentId);
    try {
      const res = await fetch("/api/v1/enrollments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enrollment_id: enrollmentId,
          tutor_id: tutorId || null,
        }),
      });

      if (res.ok) {
        await fetchData(token);
      }
    } catch (err) {
      console.error("Failed to assign tutor:", err);
    } finally {
      setSavingId(null);
    }
  };

  const handleStatusChange = async (enrollmentId: string, newStatus: string) => {
    setSavingId(enrollmentId);
    try {
      const res = await fetch("/api/v1/enrollments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enrollment_id: enrollmentId,
          status: newStatus,
        }),
      });

      if (res.ok) {
        await fetchData(token);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 dir-rtl text-right">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">تسكين الطلاب وإدارة الاشتراكات</h1>
          <p className="text-sm text-gray-500 mt-1">تحديد المعلمين للطلاب الجدد وتحديث حالات الاشتراكات</p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400">جاري تحميل البيانات...</div>
      ) : enrollments.length === 0 ? (
        <div className="py-20 text-center bg-white border border-dashed rounded-2xl">
          <p className="text-gray-500">لا توجد اشتراكات مسجلة حالياً.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs border-b">
                <tr>
                  <th className="p-4">الطالب</th>
                  <th className="p-4">ولي الأمر</th>
                  <th className="p-4">الباقة والخطة</th>
                  <th className="p-4">الحالة الحالية</th>
                  <th className="p-4">المعلم المخصص</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {enrollments.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-semibold text-gray-900">
                      <div>{item.students?.student_name || "—"}</div>
                      <div className="text-xs text-gray-400 font-normal">المستوى: {item.students?.level || "غير محدد"}</div>
                    </td>
                    <td className="p-4 text-xs text-gray-600">
                      <div>{item.students?.parent?.full_name || "—"}</div>
                      <div className="text-gray-400">{item.students?.parent?.email || ""}</div>
                    </td>
                    <td className="p-4 text-xs text-gray-700">
                      <div>{item.plan_tier}</div>
                      <div className="text-gray-400">{item.weekly_classes_count} حصص/أسبوع ({item.class_duration_minutes} د)</div>
                    </td>
                    <td className="p-4">
                      <select
                        value={item.status}
                        disabled={savingId === item.id}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg p-1.5 bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                      >
                        <option value="trial_pending">حصة تجريبية معلقة</option>
                        <option value="trial_completed">تمت التجربة</option>
                        <option value="active">اشتراك نشط</option>
                        <option value="paused">موقف مؤقتاً</option>
                        <option value="cancelled">ملغي</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <select
                        value={item.tutor_id || ""}
                        disabled={savingId === item.id}
                        onChange={(e) => handleAssignTutor(item.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg p-1.5 bg-white focus:ring-1 focus:ring-emerald-500 outline-none w-44"
                      >
                        <option value="">-- اختر المعلم --</option>
                        {tutors.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.profiles?.full_name || t.id.slice(0, 8)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}