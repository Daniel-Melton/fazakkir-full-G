"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface RescheduleModalProps {
  sessionId: string;
  scheduledAtUtc: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  authToken?: string;
}

export function RescheduleModal({
  sessionId,
  scheduledAtUtc,
  isOpen,
  onClose,
  onSuccess,
  authToken,
}: RescheduleModalProps) {
  const [reason, setReason] = useState("");
  const [proposedDate, setProposedDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // فحص مبدئي سريع للمهلة في الواجهة قبل الإرسال (افتراض 4 ساعات)
  const hoursUntil = (new Date(scheduledAtUtc).getTime() - Date.now()) / (1000 * 60 * 60);
  const isTooLate = hoursUntil < 4;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isTooLate) {
      setErrorMsg("لا يمكن تقديم طلب تعديل الموعد قبل الحصة بأقل من 4 ساعات وفقاً لسياسة الأكاديمية.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // جلب التوكن الحي مباشرة من الجلسة لضمان عدم إرسال قيمة فارغة
      const supabase = createClient();
      let activeToken = authToken;

      if (!activeToken) {
        const { data: { session } } = await supabase.auth.getSession();
        activeToken = session?.access_token;
      }

      if (!activeToken) {
        throw new Error("جلسة الدخول غير صالحة أو منتهية، يرجى إعادة تسجيل الدخول.");
      }

      const res = await fetch(`/api/v1/sessions/${sessionId}/reschedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          reason,
          proposed_time_utc: proposedDate ? new Date(proposedDate).toISOString() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "فشل تقديم طلب إعادة الجدولة");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "حدث خطأ أثناء إرسال الطلب");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 dir-rtl text-right">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-lg font-bold text-gray-900">طلب تعديل موعد الحصة</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>

        {isTooLate && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
            ⚠️ تنبيه: موعد الحصة بعد أقل من 4 ساعات. لا تسمح السياسة المعتمدة بإعادة الجدولة في هذا التوقيت إلا عبر التواصل المباشر مع الإدارة.
          </div>
        )}

        {errorMsg && !isTooLate && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg">{errorMsg}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">سبب طلب التعديل *</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="يرجى كتابة سبب طلب التأجيل أو التقديم..."
              className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">الموعد المقترح البديل (اختياري)</label>
            <input
              type="datetime-local"
              value={proposedDate}
              onChange={(e) => setProposedDate(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isTooLate}
              className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSubmitting ? "جاري الإرسال..." : "إرسال الطلب للمشرف"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}