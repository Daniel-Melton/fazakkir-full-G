"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Notification } from "@/types/database";
import { createBrowserClient } from "@supabase/ssr";

interface NotificationBellProps {
  authToken: string;
}

// نغمة رسائل شبيهة بـ WhatsApp / Messenger خفيفة وواضحة جداً
function playPopTone() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const playTone = (freq: number, start: number, duration: number, volume: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration);
    };

    // نغمتان متتاليتان سريعتان بنمط Pop المألوف في تطبيقات المحادثة
    playTone(830.61, now, 0.12, 0.25);        // نغمة G#5
    playTone(1244.51, now + 0.08, 0.22, 0.35); // نغمة D#6 المرتفعة
  } catch (err) {
    console.warn("Audio playback blocked:", err);
  }
}

export function NotificationBell({ authToken }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchNotifications = useCallback(async () => {
    if (!authToken) return;
    try {
      const res = await fetch("/api/v1/notifications", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success && data.data?.notifications) {
        setNotifications(data.data.notifications);
        setUnreadCount(
          data.data.notifications.filter((n: Notification) => !n.is_read).length
        );
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, [authToken]);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel("user-notifications-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          // تشغيل صوت الـ Pop الخاص بالرسائل فوراً
          playPopTone();
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authToken, fetchNotifications]);

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // دالة تعليم الإشعارات كمقروءة وإخفاء العداد فور فتح القائمة
  const handleToggleBell = async () => {
    const nextState = !isOpen;
    setIsOpen(nextState);

    // إذا كانت القائمة ستفتح وكان هناك إشعارات غير مقروءة
    if (nextState && unreadCount > 0) {
      // 1. تصفير العداد وتحديث الواجهة فورياً
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

      // 2. تحديث حالة القراءة في الـ Backend
      try {
        await fetch("/api/v1/notifications", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ mark_all_as_read: true }),
        });
      } catch (err) {
        console.error("Failed to mark notifications as read:", err);
      }
    }
  };

  return (
    <div className="relative dir-rtl" ref={dropdownRef}>
      <button
        onClick={handleToggleBell}
        className="relative p-2 rounded-full text-gray-600 hover:text-emerald-600 hover:bg-gray-100 transition focus:outline-none"
        aria-label="التنبيهات"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-black/5 z-50 text-right">
          <div className="flex items-center justify-between border-b pb-2 mb-2">
            <span className="text-sm font-bold text-gray-800">التنبيهات</span>
            <span className="text-xs text-gray-400">{unreadCount} غير مقروء</span>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1.5 divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">لا توجد إشعارات جديدة</div>
            ) : (
              notifications.map((n) => {
                const isCancelled =
                  n.type === "session_cancelled" ||
                  n.title.includes("[ملغي]") ||
                  n.title.includes("إلغاء");

                return (
                  <div
                    key={n.id}
                    className={`pt-2 transition-all ${
                      isCancelled
                        ? "opacity-60 bg-rose-50/40 rounded-xl p-2 my-1"
                        : !n.is_read
                        ? "font-semibold"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {/* علامة التمييز: دائرة حمراء بداخلها X للملغي، أو نقطة خضراء لغير المقروء */}
                      {isCancelled ? (
                        <span className="flex-shrink-0 mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-100 text-rose-600 text-[10px] font-bold border border-rose-200">
                          ✕
                        </span>
                      ) : !n.is_read ? (
                        <span className="flex-shrink-0 mt-1.5 h-2 w-2 rounded-full bg-emerald-500" />
                      ) : (
                        <span className="flex-shrink-0 mt-1.5 h-2 w-2 rounded-full bg-transparent" />
                      )}

                      <div className="flex-1 min-w-0">
                        {n.link && !isCancelled ? (
                          <Link
                            href={n.link}
                            onClick={() => setIsOpen(false)}
                            className="block hover:bg-gray-50 p-1 rounded-lg transition"
                          >
                            <div className="text-xs text-gray-900">{n.title}</div>
                            {n.body && (
                              <div className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 font-normal">
                                {n.body}
                              </div>
                            )}
                          </Link>
                        ) : (
                          <div className="p-1">
                            <div
                              className={`text-xs ${
                                isCancelled
                                  ? "line-through text-gray-400 decoration-rose-500 decoration-2"
                                  : "text-gray-900"
                              }`}
                            >
                              {n.title.replace("[ملغي]", "").trim()}
                            </div>
                            {n.body && (
                              <div
                                className={`text-[11px] mt-0.5 line-clamp-2 font-normal ${
                                  isCancelled ? "line-through text-gray-400" : "text-gray-500"
                                }`}
                              >
                                {n.body}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}