"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface RescheduleItem {
  id: string;
  session_id: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  supervisor_notes: string | null;
  created_at: string;
  requester?: { full_name: string; email: string; role: string } | null;
  session?: {
    id: string;
    scheduled_at_utc: string;
    duration_minutes: number;
    tutor?: { full_name: string; email: string } | null;
    student?: { student_name: string; level: string } | null;
  } | null;
}

export default function SupervisorReschedulePage() {
  const [requests, setRequests] = useState<RescheduleItem[]>([]);
  const [token, setToken] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");

  // نافذة اتخاذ القرار
  const [activeRequest, setActiveRequest] = useState<RescheduleItem | null>(null);
  const [decision, setDecision] = useState<"approved" | "rejected">("approved");
  const [newDate, setNewDate] = useState("");
  const [supervisorNotes, setSupervisorNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchRequests = useCallback(async (authToken: string, statusFilter: string) => {
    try {
      setLoading(true);
      const url = statusFilter
        ? `/api/v1/reschedule-requests?status=${statusFilter}`
        : "/api/v1/reschedule-requests";
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success && data.data?.requests) {
        setRequests(data.data.requests);
      }
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setToken(session.access_token);
        await fetchRequests(session.access_token, filter);
      } else {
        setLoading(false);
      }
    }
    init();
  }, [fetchRequests, filter]);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequest) return;
    if (decision === "approved" && !newDate) {
      setErrorMsg("يرجى تحديد الموعد الجديد للحصة عند الموافقة.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/v1/reschedule-requests/${activeRequest.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: decision,
          supervisor_notes: supervisorNotes || null,
          new_scheduled_at_utc: decision === "approved" ? new Date(newDate).toISOString() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "فشل تسجيل القرار");
      }

      setActiveRequest(null);
      setNewDate("");
      setSupervisorNotes("");
      await fetchRequests(token, filter);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 dir-rtl text-right">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">طلبات إعادة جدولة الحصص</h1>
          <p className="text-sm text-gray-500 mt-1">مراجعة واعتماد أو رفض طلبات تغيير المواعيد المقدمة من الطلاب والمعلمين</p>
        </div>

        {/* فلاتر الحالة */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setFilter("pending")}
            className={`px-3 py-1.5 rounded-lg transition ${filter === "pending" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-600"}`}
          >
            المعلقة (Pending)
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`px-3 py-1.5 rounded-lg transition ${filter === "approved" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-600"}`}
          >
            المقبولة (Approved)
          </button>
          <button
            onClick={() => setFilter("rejected")}
            className={`px-3 py-1.5 rounded-lg transition ${filter === "rejected" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-600"}`}
          >
            المرفوضة (Rejected)
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400">جاري تحميل الطلبات...</div>
      ) : requests.length === 0 ? (
        <div className="py-20 text-center bg-white border border-dashed rounded-2xl">
          <p className="text-gray-500">لا توجد طلبات تطابق الفلتر المحدد حالياً.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs border-b">
                <tr>
                  <th className="p-4">الطالب</th>
                  <th className="p-4">المعلم</th>
                  <th className="p-4">مقدم الطلب</th>
                  <th className="p-4">الموعد الحالي</th>
                  <th className="p-4">السبب</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-semibold text-gray-900">
                      {r.session?.student?.student_name || "غير محدد"}
                    </td>
                    <td className="p-4 text-gray-600">
                      {r.session?.tutor?.full_name || "غير محدد"}
                    </td>
                    <td className="p-4 text-xs text-gray-500">
                      {r.requester?.full_name || "—"} ({r.requester?.role === "tutor" ? "معلم" : "ولي أمر"})
                    </td>
                    <td className="p-4 text-xs text-gray-600">
                      {r.session?.scheduled_at_utc
                        ? new Date(r.session.scheduled_at_utc).toLocaleString("ar-EG", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "—"}
                    </td>
                    <td className="p-4 text-xs text-gray-700 max-w-xs truncate" title={r.reason}>
                      {r.reason}
                    </td>
                    <td className="p-4">
                      {r.status === "pending" && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800">معلق</span>
                      )}
                      {r.status === "approved" && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800">مقبول</span>
                      )}
                      {r.status === "rejected" && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-rose-100 text-rose-800">مرفوض</span>
                      )}
                    </td>
                    <td className="p-4">
                      {r.status === "pending" ? (
                        <button
                          onClick={() => {
                            setActiveRequest(r);
                            setDecision("approved");
                            setErrorMsg(null);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
                        >
                          بت في الطلب
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">مكتمل</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* نافذة اتخاذ القرار للمشرف */}
      {activeRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 dir-rtl text-right">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">مراجعة طلب إعادة الجدولة</h3>
              <button
                onClick={() => setActiveRequest(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl text-xs space-y-1.5 text-gray-700">
              <p><strong>الطالب:</strong> {activeRequest.session?.student?.student_name}</p>
              <p><strong>سبب الطلب:</strong> {activeRequest.reason}</p>
              <p>
                <strong>الموعد الأصلي:</strong>{" "}
                {activeRequest.session?.scheduled_at_utc
                  ? new Date(activeRequest.session.scheduled_at_utc).toLocaleString("ar-EG")
                  : "—"}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg">{errorMsg}</div>
            )}

            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">القرار *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="approved"
                      checked={decision === "approved"}
                      onChange={() => setDecision("approved")}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>قبول الطلب وتحديد الموعد</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="rejected"
                      checked={decision === "rejected"}
                      onChange={() => setDecision("rejected")}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span>رفض الطلب</span>
                  </label>
                </div>
              </div>

              {decision === "approved" && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">الموعد الجديد المعتمد *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ملاحظات المشرف (تصل لصاحب الطلب)</label>
                <textarea
                  rows={2}
                  value={supervisorNotes}
                  onChange={(e) => setSupervisorNotes(e.target.value)}
                  placeholder="سبب الرفض أو تأكيد التوقيت الجديد..."
                  className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setActiveRequest(null)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 text-xs font-medium text-white rounded-lg transition disabled:opacity-50 ${
                    decision === "approved"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {submitting ? "جاري الحفظ..." : "تأكيد القرار"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}