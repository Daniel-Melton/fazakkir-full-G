"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UserRole } from "@/types/database";
import { NotificationBell } from "@/components/dashboard/notification-bell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const [role, setRole] = useState<UserRole | null>(null);
  const [token, setToken] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const pathname = usePathname();

  useEffect(() => {
    async function loadUser() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setLoading(false);
          return;
        }

        setToken(session.access_token);

        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          setRole(profile.role as UserRole);
          setUserName(profile.full_name || "المعلم");
        }
      } catch (err) {
        console.error("Failed to load user profile in layout:", err);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const isSupervisorOrAdmin =
    role === "super_admin" || role === "academic_supervisor";

  const getRoleLabel = (r: UserRole | null) => {
    switch (r) {
      case "super_admin":
        return "مدير النظام";
      case "academic_supervisor":
        return "مشرف أكاديمي";
      case "tutor":
        return "معلم";
      case "parent_student":
        return "ولي أمر / طالب";
      default:
        return "جاري التحميل...";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col dir-rtl text-right">
      {/* الشريط العلوي للوحة التحكم */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* الجانب الأيمن: الشعار والروابط */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard/sessions" className="flex items-center gap-2">
              <span className="text-xl font-extrabold text-emerald-600">فذكّر</span>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                البوابة
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/dashboard/sessions"
                className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                  pathname === "/dashboard/sessions"
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-gray-600 hover:text-emerald-600 hover:bg-gray-50"
                }`}
              >
                جدول الحصص
              </Link>

              {role === "tutor" && (
                <Link
                  href="/dashboard/tutor/availability"
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                    pathname === "/dashboard/tutor/availability"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-600 hover:text-emerald-600 hover:bg-gray-50"
                  }`}
                >
                  أوقات التفرغ
                </Link>
              )}

              {isSupervisorOrAdmin && (
                <>
                  <Link
                    href="/dashboard/supervisor/reschedule"
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                      pathname === "/dashboard/supervisor/reschedule"
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-gray-600 hover:text-emerald-600 hover:bg-gray-50"
                    }`}
                  >
                    طلبات إعادة الجدولة
                  </Link>

                  <Link
                    href="/dashboard/supervisor/enrollments"
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                      pathname === "/dashboard/supervisor/enrollments"
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-gray-600 hover:text-emerald-600 hover:bg-gray-50"
                    }`}
                  >
                    تسكين الطلاب
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* الجانب الأيسر: الإشعارات والمستخدم */}
          <div className="flex items-center gap-4">
            {token && <NotificationBell authToken={token} />}

            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-gray-800">
                {userName || "أحمد محمود"}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">
                {getRoleLabel(role)}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 hover:text-rose-600 bg-gray-100 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition"
            >
              خروج
            </button>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 py-8">{children}</main>
    </div>
  );
}