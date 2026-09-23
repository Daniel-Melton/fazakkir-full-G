"use client";

import React, { useState } from "react";

interface ReportModalProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  authToken: string;
}

export function ReportModal({ sessionId, isOpen, onClose, onSuccess, authToken }: ReportModalProps) {
  const [attended, setAttended] = useState(true);
  const [surahFrom, setSurahFrom] = useState("");
  const [ayahFrom, setAyahFrom] = useState<number | "">("");
  const [surahTo, setSurahTo] = useState("");
  const [ayahTo, setAyahTo] = useState<number | "">("");
  const [grade, setGrade] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [homework, setHomework] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/v1/sessions/${sessionId}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          attended,
          surah_from: surahFrom || null,
          ayah_from: ayahFrom ? Number(ayahFrom) : null,
          surah_to: surahTo || null,
          ayah_to: ayahTo ? Number(ayahTo) : null,
          grade_performance: Number(grade),
          tutor_feedback: feedback || null,
          homework: homework || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "فشل إرسال التقرير");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 dir-rtl text-right">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-lg font-bold text-gray-900">تسجيل تقرير إنجاز الحصة</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg">{errorMsg}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="attended"
              checked={attended}
              onChange={(e) => setAttended(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="attended" className="text-sm font-medium text-gray-700">حضر الطالب الحصة</label>
          </div>

          {attended && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">من سورة</label>
                  <input
                    type="text"
                    value={surahFrom}
                    onChange={(e) => setSurahFrom(e.target.value)}
                    placeholder="مثال: البقرة"
                    className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">آية</label>
                  <input
                    type="number"
                    value={ayahFrom}
                    onChange={(e) => setAyahFrom(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="1"
                    className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">إلى سورة</label>
                  <input
                    type="text"
                    value={surahTo}
                    onChange={(e) => setSurahTo(e.target.value)}
                    placeholder="مثال: البقرة"
                    className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">آية</label>
                  <input
                    type="number"
                    value={ayahTo}
                    onChange={(e) => setAyahTo(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="25"
                    className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">التقييم (من 1 إلى 5 نجوم)</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                  className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (ممتاز)</option>
                  <option value={4}>⭐⭐⭐⭐ (جيد جداً)</option>
                  <option value={3}>⭐⭐⭐ (جيد)</option>
                  <option value={2}>⭐⭐ (يحتاج متابعة)</option>
                  <option value={1}>⭐ (ضعيف)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">الواجب المنزلي</label>
                <input
                  type="text"
                  value={homework}
                  onChange={(e) => setHomework(e.target.value)}
                  placeholder="مراجعة من آية كذا إلى كذا..."
                  className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ملاحظات المعلم وتوجيهاته</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={2}
                  placeholder="أداء ممتاز مع التركيز على مخارج حروف..."
                  className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
            </>
          )}

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
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSubmitting ? "جاري الحفظ..." : "حفظ التقرير"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}