"use client";
import { createClient } from "@/lib/supabase/client";
import React, { useState, useEffect, useCallback } from "react";

interface Tutor {
  id: string;
  specialties: string[];
  profiles: { full_name: string; email: string } | null;
}

interface AvailableSlot {
  start_time: string;
  end_time: string;
  available: boolean;
}

export default function TrialBookingPage() {
  const supabase = createClient();
  // بيانات المعلمين والمواعيد
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [selectedTutor, setSelectedTutor] = useState<string>("");
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");

  // بيانات المستخدم
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentLevel, setStudentLevel] = useState("مبتدئ");
  const [studentGender, setStudentGender] = useState<"male" | "female">("male");

  // حالات التحميل والإرسال
  const [loadingTutors, setLoadingTutors] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<Record<string, unknown> | null>(null);

  // جلب قائمة المعلمين المتاحين
  useEffect(() => {
    async function loadTutors() {
      try {
        const res = await fetch("/api/v1/tutors");
        const data = await res.json();
        if (data.success && data.data?.tutors) {
          setTutors(data.data.tutors);
          if (data.data.tutors.length > 0) {
            setSelectedTutor(data.data.tutors[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load tutors:", err);
      } finally {
        setLoadingTutors(false);
      }
    }
    loadTutors();
  }, []);

  // جلب الأوقات المتاحة عند اختيار المعلم
  const loadSlots = useCallback(async (tutorId: string) => {
    if (!tutorId) return;
    setLoadingSlots(true);
    setSelectedSlot("");
    try {
      const res = await fetch(`/api/v1/tutors/${tutorId}/availability?duration=30`);
      const data = await res.json();
      if (data.success && data.data?.slots) {
        // عرض الأوقات المتاحة فقط
        const availableOnly = data.data.slots.filter((s: AvailableSlot) => s.available);
        setSlots(availableOnly);
      }
    } catch (err) {
      console.error("Failed to load slots:", err);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTutor) {
      loadSlots(selectedTutor);
    }
  }, [selectedTutor, loadSlots]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setErrorMsg("يرجى اختيار الموعد المناسب للحصة التجريبية");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/v1/bookings/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parent_name: parentName,
          parent_email: parentEmail,
          parent_phone: parentPhone,
          student_name: studentName,
          student_level: studentLevel,
          student_gender: studentGender,
          tutor_id: selectedTutor,
          scheduled_at_utc: selectedSlot,
          duration_minutes: 30,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "فشل حجز الحصة");
      }

      setBookingSuccess(data.data?.booking);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "حدث خطأ أثناء إتمام الحجز");
    } finally {
      setSubmitting(false);
    }
  };

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 dir-rtl text-right">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm max-w-md w-full p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <h2 className="text-xl font-bold text-gray-900">تم حجز حصتك التجريبية بنجاح!</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            تم تسجيل موعد الحصة للطالب <strong>{studentName}</strong> بتاريخ{" "}
            <strong>{new Date(selectedSlot).toLocaleString("ar-EG")}</strong>.
          </p>
          <div className="pt-4 border-t border-gray-100">
            <a
              href="/login"
              className="inline-block w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl transition"
            >
              تسجيل الدخول لمتابعة الحصة
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 dir-rtl text-right">
      <div className="max-w-2xl mx-auto bg-white border border-gray-100 rounded-2xl shadow-sm p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">احجز حصتك التجريبية المجانية</h1>
          <p className="text-xs text-gray-500 mt-1">
            اختر المعلم والموعد المناسب لتقييم مستوى الطالب وبدء رحلة التعلّم
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-100">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* اختيار المعلم */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">1. اختر المعلم المفضل</label>
            {loadingTutors ? (
              <div className="text-xs text-gray-400">جاري تحميل قائمة المعلمين...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tutors.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setSelectedTutor(t.id)}
                    className={`p-3 text-right rounded-xl border text-xs transition flex flex-col justify-between ${
                      selectedTutor === t.id
                        ? "border-emerald-600 bg-emerald-50/50 text-emerald-900 font-semibold"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    <span>{t.profiles?.full_name || "معلم معتمد"}</span>
                    <span className="text-[10px] text-gray-400 font-normal mt-1">
                      {t.specialties?.join("، ") || "قرآن كريم ولغة عربية"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* اختيار الموعد الشاغر */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">2. اختر الموعد المتاح (30 دقيقة)</label>
            {loadingSlots ? (
              <div className="text-xs text-gray-400">جاري فحص المواعيد المتاحة...</div>
            ) : slots.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-xl text-xs text-gray-500 text-center">
                لا توجد مواعيد شاغرة لهذا المعلم خلال الأيام القادمة، يرجى اختيار معلم آخر.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border rounded-xl">
                {slots.map((slot) => {
                  const dateObj = new Date(slot.start_time);
                  const isSelected = selectedSlot === slot.start_time;
                  return (
                    <button
                      type="button"
                      key={slot.start_time}
                      onClick={() => setSelectedSlot(slot.start_time)}
                      className={`p-2 rounded-lg text-xs transition border text-center ${
                        isSelected
                          ? "bg-emerald-600 text-white border-emerald-600 font-semibold"
                          : "bg-white text-gray-700 border-gray-200 hover:border-emerald-400"
                      }`}
                    >
                      <div className="font-medium">
                        {dateObj.toLocaleDateString("ar-EG", { weekday: "short", day: "numeric", month: "short" })}
                      </div>
                      <div className="text-[10px] mt-0.5 opacity-90">
                        {dateObj.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* بيانات الطالب وولي الأمر */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-700">3. بيانات التواصل وبيانات الطالب</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-gray-600 mb-1">اسم ولي الأمر *</label>
                <input
                  type="text"
                  required
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="محمد أحمد"
                  className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-600 mb-1">رقم الهاتف (واتساب) *</label>
                <input
                  type="tel"
                  required
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="+2010XXXXXXXX"
                  className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none focus:border-emerald-500 text-left dir-ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-gray-600 mb-1">البريد الإلكتروني *</label>
              <input
                type="email"
                required
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                placeholder="parent@example.com"
                className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none focus:border-emerald-500 text-left dir-ltr"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] text-gray-600 mb-1">اسم الطالب *</label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="عمر محمد"
                  className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-600 mb-1">المستوى الحالي</label>
                <select
                  value={studentLevel}
                  onChange={(e) => setStudentLevel(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="مبتدئ">مبتدئ (تأسيس نور بيان)</option>
                  <option value="متوسط">متوسط (حفظ وتلاوة)</option>
                  <option value="متقدم">متقدم (إتقان وأحكام تجويد)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-gray-600 mb-1">الجنس</label>
                <select
                  value={studentGender}
                  onChange={(e) => setStudentGender(e.target.value as "male" | "female")}
                  className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !selectedSlot}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
          >
            {submitting ? "جاري تأكيد الحجز..." : "تأكيد حجز الحصة التجريبية"}
          </button>
        </form>
      </div>
    </div>
  );
}