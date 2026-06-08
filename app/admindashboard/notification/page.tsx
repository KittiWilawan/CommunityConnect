"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Check, Trash2, ArrowLeft, Loader2, MailOpen } from "lucide-react";
import { createClient } from "@/app/lib/supabase";
import { useSettings } from "@/app/components/SettingsProvider";

export default function AdminNotificationPage() {
  const router = useRouter();
  const { language } = useSettings();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load notifications:", error.message);
      } else {
        setNotifications(data || []);
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
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);

      if (error) {
        console.error("Failed to update notification:", error.message);
        return;
      }

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) {
        console.error("Failed to mark all read:", error.message);
        return;
      }

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Failed to delete notification:", error.message);
        return;
      }

      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const t = {
    loading: language === "th" ? "กำลังโหลดการแจ้งเตือน..." : "Loading notifications...",
    title: language === "th" ? "การแจ้งเตือน (Admin)" : "Notifications (Admin)",
    newBadge: language === "th" ? "ใหม่" : "New",
    subtitle: language === "th" ? "ติดตามการแจ้งเหตุใหม่และการเปลี่ยนแปลงสถานะ" : "Track new incident reports and status updates",
    markAllRead: language === "th" ? "อ่านทั้งหมดแล้ว" : "Mark all as read",
    viewReport: language === "th" ? "ดูรายการแจ้งเหตุ" : "View Report Details",
    deleteTooltip: language === "th" ? "ลบการแจ้งเตือน" : "Delete notification",
    emptyTitle: language === "th" ? "ไม่มีการแจ้งเตือน" : "No notifications",
    emptyDesc: language === "th" ? "ไม่มีการแจ้งเตือนใหม่ในขณะนี้" : "You have no notifications at this time.",
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-slate-500 text-sm font-medium">{t.loading}</p>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 pt-4 px-4">
      {/* Header */}
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

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => !notif.read && handleMarkAsRead(notif.id)}
              className={`p-4 rounded-2xl border transition flex gap-4 relative group ${notif.read
                  ? "bg-white border-slate-200 text-slate-700"
                  : "bg-blue-50/60 border-blue-100 text-slate-800 shadow-sm"
                }`}
            >
              {/* Status dot */}
              {!notif.read && (
                <span className="absolute top-4 left-4 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
              )}

              {/* Icon Container */}
              <div className={`p-2.5 rounded-xl shrink-0 ${notif.read ? "bg-slate-50 text-slate-400" : "bg-blue-100 text-blue-600"} ${!notif.read && "ml-4"}`}>
                <Bell className="w-5 h-5" />
              </div>

              {/* Text content */}
              <div className="flex-grow space-y-1 pr-8">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">{notif.title}</h4>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(notif.created_at).toLocaleDateString(
                      language === "th" ? "th-TH" : "en-US"
                    )}
                  </span>
                </div>
                <p className="text-xs text-slate-500 whitespace-pre-wrap leading-relaxed">
                  {notif.content}
                </p>

                {notif.report_id && (
                  <div className="pt-2">
                    <Link
                      href={`/admindashboard?reportId=${notif.report_id}`}
                      className="inline-flex items-center text-[10px] font-bold text-sky-600 hover:text-sky-800 hover:underline"
                    >
                      {t.viewReport}
                    </Link>
                  </div>
                )}
              </div>

              {/* Actions */}
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
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <MailOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-700">{t.emptyTitle}</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {t.emptyDesc}
          </p>
        </div>
      )}
    </div>
  );
}
