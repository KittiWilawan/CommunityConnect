"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Check, Trash2, ArrowLeft, Loader2, MailOpen, ChevronRight } from "lucide-react";
import { useSettings } from "@/app/components/SettingsProvider";
import {
  AppNotification,
  extractStatusFromNotification,
  getNotificationTarget,
  getStatusBadgeClass,
  isNewReportNotification,
  isStatusUpdateNotification,
} from "@/app/lib/notifications";

export default function AdminNotificationPage() {
  const router = useRouter();
  const { language } = useSettings();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");

      if (res.status === 401) {
        router.push("/");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error loading notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/notifications?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const handleOpenNotification = async (notif: AppNotification) => {
    if (!notif.read) {
      await handleMarkAsRead(notif.id);
    }

    const target = getNotificationTarget(notif, "admin");
    if (target) {
      router.push(target);
    }
  };

  const t = {
    loading: language === "th" ? "กำลังโหลดการแจ้งเตือน..." : "Loading notifications...",
    title: language === "th" ? "การแจ้งเตือน (Admin)" : "Notifications (Admin)",
    newBadge: language === "th" ? "ใหม่" : "New",
    subtitle:
      language === "th"
        ? "ติดตามการแจ้งเหตุใหม่และการเปลี่ยนแปลงสถานะ"
        : "Track new incident reports and status updates",
    markAllRead: language === "th" ? "อ่านทั้งหมดแล้ว" : "Mark all as read",
    viewReport: language === "th" ? "ดูรายการแจ้งเหตุ" : "View Report Details",
    deleteTooltip: language === "th" ? "ลบการแจ้งเตือน" : "Delete notification",
    emptyTitle: language === "th" ? "ไม่มีการแจ้งเตือน" : "No notifications",
    emptyDesc:
      language === "th"
        ? "ไม่มีการแจ้งเตือนใหม่ในขณะนี้"
        : "You have no notifications at this time.",
    newReport: language === "th" ? "รายงานใหม่" : "New report",
    statusUpdate: language === "th" ? "อัปเดตสถานะ" : "Status update",
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-slate-500 text-sm font-medium">{t.loading}</p>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 pt-4 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center space-x-3">
            <Link
              href="/admindashboard"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span>{t.title}</span>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {unreadCount} {t.newBadge}
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">{t.subtitle}</p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Check className="w-4 h-4" />
              <span>{t.markAllRead}</span>
            </button>
          )}
        </div>

        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notif) => {
              const status = extractStatusFromNotification(notif);
              const typeLabel = isNewReportNotification(notif)
                ? t.newReport
                : isStatusUpdateNotification(notif)
                  ? t.statusUpdate
                  : null;

              return (
                <div
                  key={notif.id}
                  onClick={() => handleOpenNotification(notif)}
                  className={`p-4 rounded-2xl border transition flex gap-4 relative group cursor-pointer ${notif.read
                      ? "bg-white border-slate-200 text-slate-700"
                      : "bg-blue-50/60 border-blue-100 text-slate-800 shadow-sm"
                    }`}
                >
                  {!notif.read && (
                    <span className="absolute top-4 left-4 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
                  )}

                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${notif.read ? "bg-slate-50 text-slate-400" : "bg-blue-100 text-blue-600"} ${!notif.read && "ml-4"}`}
                  >
                    <Bell className="w-5 h-5" />
                  </div>

                  <div className="flex-grow space-y-1 pr-8">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-semibold text-sm">{notif.title}</h4>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        {new Date(notif.created_at).toLocaleDateString(
                          language === "th" ? "th-TH" : "en-US"
                        )}
                      </span>
                    </div>

                    {typeLabel && (
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${status ? getStatusBadgeClass(status) : "bg-slate-100 text-slate-600 border-slate-200"}`}
                      >
                        {status || typeLabel}
                      </span>
                    )}

                    <p className="text-xs text-slate-500 whitespace-pre-wrap leading-relaxed">
                      {notif.content}
                    </p>

                    {notif.report_id && (
                      <div className="pt-2 flex items-center gap-1 text-[10px] font-bold text-sky-600">
                        <span>{t.viewReport}</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notif.id);
                    }}
                    className="absolute right-4 bottom-4 p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    title={t.deleteTooltip}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 max-w-md mx-auto px-6">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <MailOpen className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-700">{t.emptyTitle}</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">{t.emptyDesc}</p>
          </div>
        )}
    </div>
  );
}
