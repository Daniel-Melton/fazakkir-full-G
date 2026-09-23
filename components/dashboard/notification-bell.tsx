"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Notification } from "@/types/database";

interface NotificationBellProps {
  authToken: string;
}

export function NotificationBell({ authToken }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!authToken) return;
    try {
      const res = await fetch("/api/v1/notifications", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success && data.data?.notifications) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.notifications.filter((n: Notification) => !n.is_read).length);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // تحديث كل دقيقة
    return () => clearInterval(interval);
  }, [authToken]);

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

  return (
    <div className="relative dir-rtl" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-gray-600 hover:text-emerald-600 hover:bg-gray-100 transition focus:outline-none"
        aria-label="التنبيهات"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
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

          <div className="max-h-72 overflow-y-auto space-y-2 divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">لا توجد إشعارات جديدة</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`pt-2 ${!n.is_read ? "font-semibold" : ""}`}>
                  {n.link ? (
                    <Link
                      href={n.link}
                      onClick={() => setIsOpen(false)}
                      className="block hover:bg-gray-50 p-1.5 rounded-lg transition"
                    >
                      <div className="text-xs text-gray-900">{n.title}</div>
                      {n.body && <div className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{n.body}</div>}
                    </Link>
                  ) : (
                    <div className="p-1.5">
                      <div className="text-xs text-gray-900">{n.title}</div>
                      {n.body && <div className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{n.body}</div>}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}