"use client";

import React, { useState } from "react";

interface RescheduleModalProps {
  sessionId: string;
  currentScheduledAt: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RescheduleModal({
  sessionId,
  currentScheduledAt,
  isOpen,
  onClose,
  onSuccess,
}: RescheduleModalProps) {
  const [newTime, setNewTime] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // التحقق المبدئي في الواجهة من شرط الـ 4 ساعات
  const sessionTime = new Date(currentScheduledAt).getTime();
  const diffHours = (sessionTime - Date.now()) / (1000 * 60 * 60);
  const isViolatingPolicy = diffHours < 4;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTime) {
      setErrorMsg("يرجى تحديد الموعد الجديد المقترح");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/v1/sessions/${sessionId}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposed_time_utc: new Date(newTime).toISOString(),
          reason,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "فشل إرسال طلب إعادة الجدولة");
      }

      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "حدث خطأ أثناء إرسال الطلب";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 dir-rtl text-right">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-bold text-sm text-gray-900">طلب إعادة جدولة الحصة</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        {isViolatingPolicy && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl">
            <strong>تنبيه سياسة الإلغاء:</strong> الحصة ستبدأ خلال أقل من 4 ساعات. قد يتطلب
            تأكيد الطلب موافقة استثنائية من الإدارة الأكاديمية أو تُحسب الحصة.
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              الموعد الجديد المقترح *
            </label>
            <input
              type="datetime-local"
              required
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-xl p-2.5 outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              سبب طلب التأجيل (اختياري)
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثال: ظرف طارئ للطالب..."
              className="w-full text-xs border border-gray-200 rounded-xl p-2.5 outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl transition disabled:opacity-50"
            >
              {submitting ? "جاري الإرسال..." : "تأكيد وإرسال الطلب"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs rounded-xl transition"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}