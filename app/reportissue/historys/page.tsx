"use client";

import React, { useState, useEffect } from "react";
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
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

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
          image: item.image,
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">
            {t.headerTitle}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {t.headerSubtitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition duration-200 outline-none text-gray-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Link
            href="/Dashboard"
            className="text-black text-xs font-bold px-4 py-2.5 rounded-xl transition duration-200 shadow-md hover:shadow-lg active:scale-95 flex items-center space-x-1.5 cursor-pointer bg-white border border-slate-200"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>{t.backBtn}</span>
          </Link>

          <Link
            href="/reportissue"
            className="bg-[#3B82F6] hover:bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition duration-200 shadow-md hover:shadow-lg active:scale-95 flex items-center space-x-1.5 cursor-pointer"
          >
            <span>{t.reportNewBtn}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
      {reports.length > 0 ? (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col md:flex-row"
            >
              {/* Image Preview */}
              {report.image ? (
                <div className="w-full md:w-48 h-48 md:h-auto relative shrink-0">
                  <img
                    src={report.image}
                    alt="Report"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full md:w-48 h-32 md:h-auto bg-slate-50 border-r border-slate-100 flex flex-col items-center justify-center text-slate-300 space-y-1.5 p-4 shrink-0">
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-[10px] font-semibold text-slate-400">
                    {t.noImage}
                  </span>
                </div>
              )}

              {/* Main Content Area */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 justify-between">
                    {/* Category Label */}
                    <div className="flex items-center space-x-2">
                      <span
                        className="text-xs font-bold px-3 py-1 rounded-full text-white shadow-sm"
                        style={{ backgroundColor: report.categoryColor }}
                      >
                        {report.categoryTitle}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="text-sm font-bold text-slate-700">
                        {report.subcategory}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full border flex items-center space-x-1.5 ${getStatusClass(
                        report.status
                      )}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      <span>{report.status}</span>
                    </span>
                  </div>

                  {/* Description */}
                  <div className="pt-1">
                    <p className="text-sm text-slate-600 leading-relaxed break-words whitespace-pre-wrap">
                      {report.description}
                    </p>
                  </div>
                </div>

                {/* Footer Info Row */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 font-medium">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{report.timestamp.split(" ")[0]}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{report.timestamp.split(" ")[1] || ""}</span>
                    </div>
                    {report.contact && (
                      <div className="flex items-center space-x-1 text-slate-500">
                        <FileText className="w-3.5 h-3.5" />
                        <span>
                          {t.contactPrefix}
                          {report.contact}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => handleDeleteReport(report.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition active:scale-95 cursor-pointer"
                    title={t.deleteTooltip}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredReports.length === 0 && (
            <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 max-w-md mx-auto px-6">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-xs font-semibold">
                {t.noResults} &quot;{searchQuery}&quot;
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-16 text-center max-w-lg mx-auto px-6">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-700">
            {t.emptyTitle}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {t.emptyDesc}
          </p>
          <div className="mt-6">
            <Link
              href="/reportissue"
              className="bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold px-6 py-3 rounded-xl transition duration-200 shadow-md inline-block cursor-pointer"
            >
              {t.emptyReportBtn}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
