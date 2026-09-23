"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { UserRole } from "@/types/database";
import { SessionCard } from "@/components/dashboard/session-card";
import { ReportModal } from "@/components/dashboard/report-modal";
import { RescheduleModal } from "@/components/dashboard/reschedule-modal";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SessionItem {
  id: string;
  scheduled_at_utc: string;
  duration_minutes: number;
  meeting_url: string | null;
  status: string;
  students?: { id: string; student_name: string; level: string } | null;
  profiles?: { full_name: string; email: string } | null;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [role, setRole] = useState<UserRole>("parent_student");
  const [token, setToken] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // التحكم في النوافذ المنبثقة
  const [reportSessionId, setReportSessionId] = useState<string | null>(null);
  const [rescheduleData, setRescheduleData] = useState<{ id: string; time: string } | null>(null);

  const fetchSessions = useCallback(async (authToken: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/sessions", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const result = await res.json();
      if (result.success && result.data?.sessions) {
        setSessions(result.data.sessions);
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function initUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      setToken(session.access_token);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profile?.role) {
        setRole(profile.role as UserRole);
      }

      await fetchSessions(session.access_token);
    }

    initUser();
  }, [fetchSessions]);

  return (
    <div className="max-w-6xl mx-auto p-6 dir-rtl text-right">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">جدول الحصص</h1>
          <p className="text-sm text-gray-500 mt-1">متابعة الحصص المجدولة ومواعيدها وروابط الانضمام</p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400">جاري تحميل الحصص...</div>
      ) : sessions.length === 0 ? (
        <div className="py-20 text-center bg-white border border-dashed rounded-2xl">
          <p className="text-gray-500">لا توجد حصص مجدولة حالياً.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              currentUserRole={role}
              onOpenReportModal={(id) => setReportSessionId(id)}
              onOpenRescheduleModal={(id, time) => setRescheduleData({ id, time })}
            />
          ))}
        </div>
      )}

      {/* نافذة التقرير للمعلم */}
      {reportSessionId && (
        <ReportModal
          sessionId={reportSessionId}
          isOpen={Boolean(reportSessionId)}
          onClose={() => setReportSessionId(null)}
          onSuccess={() => token && fetchSessions(token)}
          authToken={token}
        />
      )}

      {/* نافذة إعادة الجدولة */}
      {rescheduleData && (
        <RescheduleModal
          sessionId={rescheduleData.id}
          scheduledAtUtc={rescheduleData.time}
          isOpen={Boolean(rescheduleData)}
          onClose={() => setRescheduleData(null)}
          onSuccess={() => token && fetchSessions(token)}
          authToken={token}
        />
      )}
    </div>
  );
}