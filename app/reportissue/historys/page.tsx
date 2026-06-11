"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Trash2,
  AlertCircle,
  FileText,
  ChevronRight,
  Image as ImageIcon,
  ChevronLeft,
  Search,
  X,
} from "lucide-react";
import { createClient } from "@/app/lib/supabase";
import { useSettings } from "@/app/components/SettingsProvider";
import HistoryContent from "./HistoryContent";

interface Report {
  id: string;
  categoryId: string;
  categoryTitle: string;
  categoryColor: string;
  subcategory: string;
  description: string;
  contact: string;
  image: string | null;
  status: string;
  timestamp: string;
}

export default function HistoryPage() {
  const { language } = useSettings();
  const router = useRouter();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Load reports from Supabase
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const supabase = createClient();

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          // Not logged in — let Middleware handle redirect, just stop loading
          setLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from("reports")
          .select("id, category_id, category_title, category_color, subcategory, description, contact, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        // Note: image field is excluded to reduce payload size. Fetch separately if needed for detail view.

        if (fetchError) {
          console.error("Failed to load reports:", fetchError.message);
          setError(
            language === "th"
              ? "ไม่สามารถโหลดประวัติได้: " + fetchError.message
              : "Failed to load history: " + fetchError.message
          );
          return;
        }

        // Format database structure to frontend structure
        const formatted: Report[] = (data || []).map((item: any) => ({
          id: item.id,
          categoryId: item.category_id,
          categoryTitle: item.category_title,
          categoryColor: item.category_color,
          subcategory: item.subcategory,
          description: item.description,
          contact: item.contact,
          image: item.image || null,
          status: item.status,
          timestamp: new Date(item.created_at).toLocaleString("th-TH"),
        }));

        setReports(formatted);
      } catch (err) {
        console.error("Failed to load reports from database:", err);
        setError(
          language === "th"
            ? "เกิดข้อผิดพลาดในการโหลดข้อมูล"
            : "An error occurred while loading data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, language]);

  const t = {
    confirmDelete:
      language === "th"
        ? "คุณต้องการลบประวัติการแจ้งเหตุนี้ใช่หรือไม่?"
        : "Are you sure you want to delete this report from history?",
    deleteError:
      language === "th" ? "ไม่สามารถลบข้อมูลได้: " : "Failed to delete: ",
    deleteErrorCatch:
      language === "th"
        ? "เกิดข้อผิดพลาดในการลบประวัติ"
        : "Error deleting history",
    headerTitle:
      language === "th"
        ? "ประวัติการแจ้งเหตุของคุณ"
        : "Your Reported Issues History",
    headerSubtitle:
      language === "th"
        ? "ประวัติการแจ้งเหตุของคุณ"
        : "My Reported Issues History",
    searchPlaceholder:
      language === "th" ? "ค้นหาประวัติการแจ้งเหตุ..." : "Search history...",
    backBtn: language === "th" ? "กลับหน้าหลัก" : "Back to Home",
    reportNewBtn: language === "th" ? "แจ้งเรื่องใหม่" : "Report New Issue",
    noImage: language === "th" ? "ไม่มีรูปภาพแนบ" : "No image attached",
    contactPrefix: language === "th" ? "ติดต่อ: " : "Contact: ",
    deleteTooltip:
      language === "th" ? "ลบออกจากประวัติ" : "Delete from history",
    emptyTitle:
      language === "th"
        ? "ยังไม่มีประวัติการแจ้งเหตุ"
        : "No history yet",
    emptyDesc:
      language === "th"
        ? "คุณยังไม่ได้สร้างรายงานแจ้งปัญหาการใช้งานสาธารณูปโภคใดๆ คุณสามารถเริ่มทำรายงานได้ง่ายๆ ตอนนี้"
        : "You haven't submitted any utility issue reports yet. You can submit one easily now.",
    emptyReportBtn:
      language === "th" ? "แจ้งรายงานปัญหาแรก" : "Report First Issue",
    noResults:
      language === "th"
        ? "ไม่พบประวัติการแจ้งเหตุที่ตรงกับ"
        : "No history found matching",
  };

  const handleDeleteReport = async (id: string) => {
    if (confirm(t.confirmDelete)) {
      try {
        const supabase = createClient();
        const { error: deleteError } = await supabase
          .from("reports")
          .delete()
          .eq("id", id);
        if (deleteError) {
          alert(t.deleteError + deleteError.message);
          return;
        }
        setReports((prev) => prev.filter((r) => r.id !== id));
      } catch (err: any) {
        alert(t.deleteErrorCatch);
      }
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "เสร็จสิ้น":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
      case "กำลังดำเนินการ":
        return "bg-blue-50 text-blue-700 border-blue-200/50";
      case "ขอข้อมูลเพิ่ม":
        return "bg-purple-50 text-purple-700 border-purple-200/50";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200/50";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B82F6]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3 text-center px-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-slate-600 text-sm font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-blue-500 text-xs underline cursor-pointer"
        >
          {language === "th" ? "ลองใหม่" : "Try again"}
        </button>
      </div>
    );
  }

  const filteredReports = reports.filter((report) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (report.categoryTitle || "").toLowerCase().includes(q) ||
      (report.subcategory || "").toLowerCase().includes(q) ||
      (report.description || "").toLowerCase().includes(q) ||
      (report.contact || "").toLowerCase().includes(q) ||
      (report.status || "").toLowerCase().includes(q)
    );
  });
  function HistoryLoading() {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B82F6]" />
      </div>
    );
  }
}

