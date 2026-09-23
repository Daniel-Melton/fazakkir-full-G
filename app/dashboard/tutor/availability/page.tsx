"use client";

import React, { useState, useEffect } from "react";

interface SlotItem {
  day_of_week: number;
  start_time_utc: string;
  end_time_utc: string;
  is_active: boolean;
}

const DAYS = [
  { id: 0, name: "الأحد" },
  { id: 1, name: "الإثنين" },
  { id: 2, name: "الثلاثاء" },
  { id: 3, name: "الأربعاء" },
  { id: 4, name: "الخميس" },
  { id: 5, name: "الجمعة" },
  { id: 6, name: "السبت" },
];

export default function TutorAvailabilityPage() {
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/v1/tutors/me/availability");
        const json = await res.json();
        if (json.success && json.data?.slots) {
          const formatted = json.data.slots.map((s: { day_of_week: number; start_time_utc: string; end_time_utc: string; is_active: boolean }) => ({
            day_of_week: s.day_of_week,
            start_time_utc: s.start_time_utc.slice(0, 5),
            end_time_utc: s.end_time_utc.slice(0, 5),
            is_active: s.is_active,
          }));
          setSlots(formatted);
        }
      } catch (err) {
        console.error("Failed to load availability:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const addSlot = (dayId: number) => {
    setSlots([
      ...slots,
      {
        day_of_week: dayId,
        start_time_utc: "16:00",
        end_time_utc: "20:00",
        is_active: true,
      },
    ]);
  };

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, key: keyof SlotItem, value: unknown) => {
    const updated = [...slots];
    updated[index] = { ...updated[index], [key]: value };
    setSlots(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/v1/tutors/me/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slots),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الحفظ");

      setMessage({ text: "تم حفظ أوقات التفرغ الأسبوعية بنجاح", type: "success" });
    } catch (err: unknown) {
      const text = err instanceof Error ? err.message : "حدث خطأ أثناء الحفظ";
      setMessage({ text, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-gray-500">جاري تحميل جدول التفرغ...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 dir-rtl text-right">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">أوقات التفرغ الأسبوعية</h1>
          <p className="text-xs text-gray-500 mt-1">
            حدد الفترات الزمنية المتاحة لديك لتمكين الطلاب من حجز الحصص دون تعارض.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl transition disabled:opacity-50"
        >
          {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
      </div>

      {message && (
        <div
          className={`p-3 text-xs rounded-lg border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-100"
              : "bg-rose-50 text-rose-800 border-rose-100"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        {DAYS.map((day) => {
          const daySlots = slots
            .map((slot, index) => ({ slot, index }))
            .filter((item) => item.slot.day_of_week === day.id);

          return (
            <div key={day.id} className="p-4 bg-white border border-gray-100 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-gray-800">{day.name}</span>
                <button
                  type="button"
                  onClick={() => addSlot(day.id)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  + إضافة فترة
                </button>
              </div>

              {daySlots.length === 0 ? (
                <div className="text-[11px] text-gray-400">غير متاح في هذا اليوم</div>
              ) : (
                <div className="space-y-2">
                  {daySlots.map(({ slot, index }) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <span>من:</span>
                        <input
                          type="time"
                          value={slot.start_time_utc}
                          onChange={(e) => updateSlot(index, "start_time_utc", e.target.value)}
                          className="border border-gray-200 rounded p-1 text-xs outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <span>إلى:</span>
                        <input
                          type="time"
                          value={slot.end_time_utc}
                          onChange={(e) => updateSlot(index, "end_time_utc", e.target.value)}
                          className="border border-gray-200 rounded p-1 text-xs outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeSlot(index)}
                        className="text-rose-500 hover:text-rose-700 text-xs px-2"
                      >
                        حذف
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}