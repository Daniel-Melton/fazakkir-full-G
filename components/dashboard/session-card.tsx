"use client";

import React, { useState } from "react";
import { UserRole } from "@/types/database";

interface SessionCardProps {
  session: {
    id: string;
    scheduled_at_utc: string;
    duration_minutes: number;
    meeting_url: string | null;
    status: string;
    students?: { id: string; student_name: string; level: string } | null;
    profiles?: { full_name: string; email: string } | null;
  };
  currentUserRole: UserRole;
  onOpenReportModal?: (sessionId: string) => void;
  onOpenRescheduleModal?: (sessionId: string, scheduledAt: string) => void;
}

export function SessionCard({
  session,
  currentUserRole,
  onOpenReportModal,
  onOpenRescheduleModal,
}: SessionCardProps) {
  const [loading, setLoading] = useState(false);

  const sessionDate = new Date(session.scheduled_at_utc);
  const formattedDate = sessionDate.toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = sessionDate.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">مجدولة</span>;
      case "completed":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">مكتملة</span>;
      case "rescheduled":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">قيد إعادة الجدولة</span>;
      case "cancelled_by_student":
      case "cancelled_by_tutor":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">ملغاة</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-right dir-rtl">
      <div className="flex justify-between items-start mb-3">
        {getStatusBadge(session.status)}
        <div className="text-sm font-semibold text-gray-900">
          {session.students?.student_name ? `الطالب: ${session.students.student_name}` : "حصة فردية"}
        </div>
      </div>

      <div className="space-y-1.5 text-sm text-gray-600 mb-4">
        <p className="flex items-center justify-end gap-2">
          <span>{formattedDate} - الساعة {formattedTime}</span>
          <span className="text-gray-400">📅</span>
        </p>
        <p className="flex items-center justify-end gap-2">
          <span>المدة: {session.duration_minutes} دقيقة</span>
          <span className="text-gray-400">⏱️</span>
        </p>
        {session.profiles?.full_name && (
          <p className="flex items-center justify-end gap-2">
            <span>المعلم: {session.profiles.full_name}</span>
            <span className="text-gray-400">👨‍🏫</span>
          </p>
        )}
      </div>

      <div className="pt-3 border-t border-gray-50 flex flex-wrap items-center justify-end gap-2">
        {/* زر رابط الاجتماع */}
        {session.meeting_url && session.status === "scheduled" && (
          <a
            href={session.meeting_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3.5 py-1.5 text-xs font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 transition"
          >
            دخول الحصة
          </a>
        )}

        {/* أزرار المعلم */}
        {currentUserRole === "tutor" && session.status === "scheduled" && onOpenReportModal && (
          <button
            onClick={() => onOpenReportModal(session.id)}
            className="inline-flex items-center px-3.5 py-1.5 text-xs font-medium rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition"
          >
            تسجيل التقرير
          </button>
        )}

        {/* أزرار ولي الأمر أو المعلم لإعادة الجدولة */}
        {session.status === "scheduled" && onOpenRescheduleModal && (
          <button
            onClick={() => onOpenRescheduleModal(session.id, session.scheduled_at_utc)}
            className="inline-flex items-center px-3.5 py-1.5 text-xs font-medium rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
          >
            طلب تعديل الموعد
          </button>
        )}
      </div>
    </div>
  );
}