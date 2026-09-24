"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/dashboard/sessions";
  const authError = searchParams.get("error");

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.user) {
        // فحص دور المستخدم لتوجيهه للوجهة المحددة أو افتراضياً حسب الدور
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        let targetUrl = redirectTarget;

        if (profile?.role === "super_admin" || profile?.role === "academic_supervisor") {
          targetUrl = "/dashboard/supervisor/enrollments";
        } else if (profile?.role === "parent_student") {
          targetUrl = "/dashboard/parent";
        } else if (profile?.role === "tutor") {
          targetUrl = "/dashboard/sessions";
        }

        window.location.href = targetUrl;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "فشل تسجيل الدخول";
      setErrorMessage(
        msg === "Invalid login credentials"
          ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
          : msg
      );
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTarget)}`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "فشل الاتصال بـ Google");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 dir-rtl text-right">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm max-w-md w-full p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-emerald-600">فذكّر</h1>
          <p className="text-sm text-gray-500">تسجيل الدخول إلى البوابة الأكاديمية</p>
        </div>

        {(errorMessage || authError) && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-100">
            {errorMessage || "فشل التحقق من الجلسة، يرجى المحاولة مرة أخرى."}
          </div>
        )}

        {/* زر الدخول السريع عبر Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full py-2.5 px-4 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-3 transition"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>المتابعة باستخدام Google</span>
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-3 text-gray-400 text-xs">أو باستخدام البريد</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* نموذج البريد وكلمة المرور */}
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@fazakkir.com"
              className="w-full text-sm border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">كلمة المرور</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-sm border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
          >
            {loading ? "جاري الدخول..." : "تسجيل الدخول"}
          </button>
        </form>
      </div>
    </div>
  );
}