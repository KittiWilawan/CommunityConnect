"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Image as ImageIcon,
  Calendar,
  Trash2,
  AlertCircle,
  X,
  MapPin,
  Search,
} from "lucide-react";
import CategoryCard from "@/app/components/categorycard";
import { ICON_MAP } from "@/app/lib/icons";
import type { Category } from "@/app/lib/types";
import { createClient } from "@/app/lib/supabase";
import { useSettings } from "@/app/components/SettingsProvider";

export default function DashboardPage() {
  const router = useRouter();
  const { language } = useSettings();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [selectedReportForDetail, setSelectedReportForDetail] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("");


  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories?enabled=true");
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    try {
      const supabase = createClient();
      
      // Ensure we are logged in before fetching
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("No user found, cannot fetch reports");
        return;
      }

      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch reports:", error.message);
        return;
      }
      setReports(data || []);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchReports();
  }, [fetchCategories, fetchReports]);

  const handleLogout = async () => {
    if (confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
      try {
        setIsLoggingOut(true);
        const supabase = createClient();
        const { error } = await supabase.auth.signOut();

        if (error) {
          alert("ไม่สามารถออกจากระบบได้: " + error.message);
          return;
        }
        router.push("/");
        router.refresh();
      } catch (err) {
        alert("เกิดข้อผิดพลาดในการออกจากระบบ");
      } finally {
        setIsLoggingOut(false);
      }
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("reports")
        .update({ status: newStatus })
        .eq("id", reportId);

      if (error) {
        alert("ไม่สามารถอัปเดตสถานะได้: " + error.message);
        return;
      }

      // Find the report to get owner info
      const report = reports.find((r) => r.id === reportId);
      if (report && report.user_id) {
        // Send notification to the report owner (client)
        await supabase.from("notifications").insert({
          user_id: report.user_id,
          title: "อัปเดตสถานะแจ้งเหตุ",
          content: `รายการ "${report.subcategory || report.category_title}" ถูกเปลี่ยนสถานะเป็น "${newStatus}"`,
          report_id: reportId,
          read: false,
        });
      }

      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
      );
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (confirm("คุณต้องการลบรายงานปัญหานี้ออกจากระบบใช่หรือไม่?")) {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from("reports")
          .delete()
          .eq("id", reportId);

        if (error) {
          alert("ไม่สามารถลบรายงานได้: " + error.message);
          return;
        }

        setReports((prev) => prev.filter((r) => r.id !== reportId));
      } catch (err: any) {
        alert("เกิดข้อผิดพลาดในการลบรายการ");
      }
    }
  };

  const pendingCount = reports.filter((r) => r.status === "รอดำเนินการ").length;
  const processingCount = reports.filter(
    (r) => r.status === "กำลังดำเนินการ"
  ).length;
  const infoRequestedCount = reports.filter(
    (r) => r.status === "ขอข้อมูลเพิ่ม"
  ).length;
  const completedCount = reports.filter((r) => r.status === "เสร็จสิ้น").length;

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

  // Get unique categories that actually have reports in them
  const uniqueCategoriesWithReports = reports.reduce((acc: { title: string; color: string }[], report) => {
    if (report.category_title && !acc.some(c => c.title === report.category_title)) {
      acc.push({
        title: report.category_title,
        color: report.category_color || "#64748B"
      });
    }
    return acc;
  }, []);

  const filteredReports = reports.filter((report) => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesSearch = (
        (report.category_title || "").toLowerCase().includes(q) ||
        (report.subcategory || "").toLowerCase().includes(q) ||
        (report.description || "").toLowerCase().includes(q) ||
        (report.contact || "").toLowerCase().includes(q) ||
        (report.status || "").toLowerCase().includes(q)
      );
      if (!matchesSearch) return false;
    }
    
    // 2. Status Filter
    if (selectedStatusFilter && report.status !== selectedStatusFilter) {
      return false;
    }
    
    // 3. Category Filter
    if (selectedCategoryFilter) {
      const matchedCategory = categories.find(c => c.id === selectedCategoryFilter);
      const categoryName = matchedCategory ? `${matchedCategory.subtitle} (${matchedCategory.title})` : "";
      
      const matchesId = report.category_id === selectedCategoryFilter;
      const matchesTitle = categoryName && report.category_title === categoryName;
      
      if (!matchesId && !matchesTitle) {
        return false;
      }
    }
    
    return true;
  });

  const t = {
    title: language === "th" ? "แผงควบคุมหลัก" : "Admin Dashboard",
    subtitle: language === "th" ? "จัดการหมวดหมู่บริการ และตรวจสอบสถานะรายการแจ้งเหตุจากคนในชุมชน" : "Manage service categories and monitor community incident reports",
    loading: language === "th" ? "กำลังโหลด..." : "Loading...",
    noCategory: language === "th" ? "ยังไม่มีหมวดหมู่ที่เปิดใช้งาน" : "No active categories",
    goManage: language === "th" ? "ไปที่หน้า Issue Categories เพื่อเพิ่มหรือเปิดใช้งานหมวดหมู่" : "Go to Issue Categories to add or enable categories",
    realtimeSummary: language === "th" ? "สรุปสถานะเรียลไทม์" : "Real-time Summary",
    realtimeDesc: language === "th" ? "ปริมาณปัญหาแยกตามขั้นตอนการดำเนินงาน" : "Report volume by status stage",
    pending: language === "th" ? "รอดำเนินการ" : "Pending",
    processing: language === "th" ? "กำลังดำเนินการ" : "In Progress",
    infoRequested: language === "th" ? "ขอข้อมูลเพิ่ม" : "Info Requested",
    completed: language === "th" ? "เสร็จสิ้น" : "Completed",
    clearFilters: language === "th" ? "ล้างตัวกรองทั้งหมด" : "Clear All Filters",
    allReports: language === "th" ? "รายการแจ้งเหตุทั้งหมด" : "All Incident Reports",
    searchPlaceholder: language === "th" ? "ค้นหารายการแจ้งเหตุ..." : "Search reports...",
    filterCategory: language === "th" ? "หมวดหมู่:" : "Category:",
    filterAll: language === "th" ? "ทั้งหมด (All)" : "All",
  };

  return (
    <>
    <div className="space-y-8">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">{t.title}</h1>
          <p className="text-slate-500 mt-1.5">
            {t.subtitle}
          </p>
        </div>
      </div>

      {loadingCategories ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-7 h-7 text-slate-400 animate-spin" />
        </div>
      ) : categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const IconComponent = ICON_MAP[cat.iconName];
            return (
              <CategoryCard
                key={cat.id}
                title={`${cat.subtitle}\n(${cat.title})`}
                description={cat.description}
                icon={
                  IconComponent ? (
                    <IconComponent
                      className="w-16 h-16"
                      style={{ color: cat.color }}
                    />
                  ) : null
                }
                color={cat.color}
                subcategories={cat.subcategories}
                onClick={() => { }}
              />
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
          <p className="text-slate-400 text-sm">{t.noCategory}</p>
          <p className="text-slate-300 text-xs mt-1">
            {t.goManage}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 flex items-center justify-between border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-[#0F172A]">
                {t.realtimeSummary}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {t.realtimeDesc}
              </p>
            </div>
          </div>
          <div className="p-6 space-y-4 flex-1 flex flex-col justify-center">
            <button
              onClick={() => setSelectedStatusFilter(prev => prev === "รอดำเนินการ" ? "" : "รอดำเนินการ")}
              className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer text-left w-full ${selectedStatusFilter === "รอดำเนินการ"
                  ? "border-amber-500 bg-amber-100 ring-2 ring-amber-400/20 scale-[1.02] shadow-sm"
                  : "border-amber-100 bg-amber-50/50 hover:bg-amber-100/30"
                }`}
            >
              <div className="flex items-center space-x-2.5">
                <span className="w-3 h-3 bg-amber-500 rounded-full" />
                <span className={`text-sm font-semibold ${selectedStatusFilter === "รอดำเนินการ" ? "text-amber-900 font-bold" : "text-slate-700"}`}>
                  {t.pending}
                </span>
              </div>
              <span className="text-lg font-bold text-amber-700">
                {pendingCount}
              </span>
            </button>

            <button
              onClick={() => setSelectedStatusFilter(prev => prev === "กำลังดำเนินการ" ? "" : "กำลังดำเนินการ")}
              className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer text-left w-full ${selectedStatusFilter === "กำลังดำเนินการ"
                  ? "border-blue-500 bg-blue-100 ring-2 ring-blue-400/20 scale-[1.02] shadow-sm"
                  : "border-blue-100 bg-blue-50/50 hover:bg-blue-100/30"
                }`}
            >
              <div className="flex items-center space-x-2.5">
                <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                <span className={`text-sm font-semibold ${selectedStatusFilter === "กำลังดำเนินการ" ? "text-blue-900 font-bold" : "text-slate-700"}`}>
                  {t.processing}
                </span>
              </div>
              <span className="text-lg font-bold text-blue-700">
                {processingCount}
              </span>
            </button>

            <button
              onClick={() => setSelectedStatusFilter(prev => prev === "ขอข้อมูลเพิ่ม" ? "" : "ขอข้อมูลเพิ่ม")}
              className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer text-left w-full ${selectedStatusFilter === "ขอข้อมูลเพิ่ม"
                  ? "border-purple-500 bg-purple-100 ring-2 ring-purple-400/20 scale-[1.02] shadow-sm"
                  : "border-purple-100 bg-purple-50/50 hover:bg-purple-100/30"
                }`}
            >
              <div className="flex items-center space-x-2.5">
                <span className="w-3 h-3 bg-purple-500 rounded-full" />
                <span className={`text-sm font-semibold ${selectedStatusFilter === "ขอข้อมูลเพิ่ม" ? "text-purple-900 font-bold" : "text-slate-700"}`}>
                  {t.infoRequested}
                </span>
              </div>
              <span className="text-lg font-bold text-purple-700">
                {infoRequestedCount}
              </span>
            </button>

            <button
              onClick={() => setSelectedStatusFilter(prev => prev === "เสร็จสิ้น" ? "" : "เสร็จสิ้น")}
              className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer text-left w-full ${selectedStatusFilter === "เสร็จสิ้น"
                  ? "border-emerald-500 bg-emerald-100 ring-2 ring-emerald-400/20 scale-[1.02] shadow-sm"
                  : "border-emerald-100 bg-emerald-50/50 hover:bg-emerald-100/30"
                }`}
            >
              <div className="flex items-center space-x-2.5">
                <span className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span className={`text-sm font-semibold ${selectedStatusFilter === "เสร็จสิ้น" ? "text-emerald-900 font-bold" : "text-slate-700"}`}>
                  {t.completed}
                </span>
              </div>
              <span className="text-lg font-bold text-emerald-700">
                {completedCount}
              </span>
            </button>

            {(selectedStatusFilter || selectedCategoryFilter) && (
              <button
                onClick={() => {
                  setSelectedStatusFilter("");
                  setSelectedCategoryFilter("");
                }}
                className="w-full mt-2 py-2 px-4 border border-dashed border-red-200 text-red-500 bg-red-50/20 hover:bg-red-50 rounded-xl text-xs font-bold transition cursor-pointer text-center"
              >
                {t.clearFilters}
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-[#0F172A]">
                {t.allReports} ({reports.length})
              </h3>
              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="search-reports"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 focus:bg-white transition duration-200 outline-none"
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
            </div>

            {/* Category Filter Buttons */}
            {!loadingReports && reports.length > 0 && categories.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-400 mr-1 uppercase tracking-wider">{t.filterCategory}</span>
                <button
                  onClick={() => setSelectedCategoryFilter("")}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${selectedCategoryFilter === ""
                      ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                >
                  {t.filterAll}
                </button>
                {categories.map((cat) => {
                  const isActive = selectedCategoryFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryFilter(isActive ? "" : cat.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer`}
                      style={{
                        backgroundColor: isActive ? cat.color : "transparent",
                        borderColor: isActive ? cat.color : "#E2E8F0",
                        color: isActive ? "#FFFFFF" : "#475569",
                        boxShadow: isActive ? `0 2px 4px ${cat.color}33` : "none"
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isActive ? "#FFFFFF" : cat.color }} />
                      <span>{language === "th" ? cat.subtitle || cat.title : cat.title}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {loadingReports ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
            </div>
          ) : reports.length > 0 ? (
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex gap-3 items-start hover:shadow-sm transition"
                >
                  {report.image ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-200 shadow-sm aspect-square">
                      <img
                        src={report.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 shrink-0 border border-slate-200 aspect-square shadow-inner">
                      <ImageIcon className="w-4 h-4 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-grow min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <div className="flex items-center space-x-2">
                        <span
                          className="text-[9px] font-bold px-2 py-0.5 rounded text-white"
                          style={{ backgroundColor: report.category_color }}
                        >
                          {report.category_title}
                        </span>
                        <span className="text-[11px] font-bold text-slate-600 truncate max-w-[120px]">
                          {report.subcategory}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getStatusClass(
                          report.status
                        )}`}
                      >
                        {report.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 break-words whitespace-pre-wrap leading-relaxed">
                      {report.description}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[9px] text-slate-400 pt-1.5 border-t border-slate-200/50">
                      <div className="flex items-center space-x-2">
                        <span>
                          {language === "th" ? "ผู้แจ้ง: " : "Reporter: "}{report.contact || (language === "th" ? "ไม่ได้ระบุชื่อ" : "Anonymous")}
                        </span>
                        <span>|</span>
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-0.5" />
                          {new Date(report.created_at).toLocaleDateString(
                            language === "th" ? "th-TH" : "en-US"
                          )}
                        </span>
                        <span>|</span>
                        <button
                          onClick={() => setSelectedReportForDetail(report)}
                          className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer hover:underline animate-pulse"
                        >
                          {language === "th" ? "ดูรายละเอียด" : "Details"}
                        </button>
                      </div>

                      <div className="flex items-center space-x-1 flex-wrap gap-y-1">
                        <button
                          onClick={() =>
                            handleUpdateStatus(report.id, "รอดำเนินการ")
                          }
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition cursor-pointer ${report.status === "รอดำเนินการ"
                            ? "bg-amber-100 border-amber-300 text-amber-800"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
                            }`}
                        >
                          {language === "th" ? "รอ" : "Wait"}
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateStatus(report.id, "กำลังดำเนินการ")
                          }
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition cursor-pointer ${report.status === "กำลังดำเนินการ"
                            ? "bg-blue-100 border-blue-300 text-blue-800"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
                            }`}
                        >
                          {language === "th" ? "ทำอยู่" : "Doing"}
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateStatus(report.id, "ขอข้อมูลเพิ่ม")
                          }
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition cursor-pointer ${report.status === "ขอข้อมูลเพิ่ม"
                            ? "bg-purple-100 border-purple-300 text-purple-800"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
                            }`}
                        >
                          {language === "th" ? "ขอข้อมูล" : "Info"}
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateStatus(report.id, "เสร็จสิ้น")
                          }
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition cursor-pointer ${report.status === "เสร็จสิ้น"
                            ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
                            }`}
                        >
                          {language === "th" ? "เสร็จ" : "Done"}
                        </button>
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          className="p-1 text-slate-300 hover:text-red-600 transition cursor-pointer ml-0.5"
                          title={language === "th" ? "ลบรายการ" : "Delete"}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {searchQuery && filteredReports.length === 0 && (
                <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Search className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-xs">
                    {language === "th" ? `ไม่พบรายการที่ตรงกับ "${searchQuery}"` : `No reports matching "${searchQuery}"`}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-xs">
                {language === "th" ? "ยังไม่มีรายงานแจ้งเข้ามาในระบบ" : "No reports submitted yet"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Detail Modal */}
      {selectedReportForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]"
            onClick={() => setSelectedReportForDetail(null)}
          />

          {/* Modal Content Box */}
          <div className="relative bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 z-10 my-auto animate-[scaleUp_250ms_ease-out] flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setSelectedReportForDetail(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left side: Image */}
            <div className="w-full md:w-1/2 flex flex-col space-y-4">
              {selectedReportForDetail.image ? (
                <img
                  src={selectedReportForDetail.image}
                  alt="Report detail preview"
                  className="w-full h-64 object-cover rounded-2xl border border-slate-200 shadow-sm"
                />
              ) : (
                <div className="w-full h-64 bg-slate-100 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300">
                  <ImageIcon className="w-12 h-12 mb-2" />
                  <span className="text-xs font-semibold text-slate-400">
                    {language === "th" ? "ไม่มีรูปภาพแนบ" : "No image attached"}
                  </span>
                </div>
              )}

              {/* Status indicator in Modal */}
              <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl flex flex-col space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {language === "th" ? "สถานะการดำเนินงาน" : "Operational Status"}
                </span>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusClass(selectedReportForDetail.status)}`}>
                    {selectedReportForDetail.status}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">ID: {selectedReportForDetail.id.slice(0, 8)}...</span>
                </div>
              </div>
            </div>

            {/* Right side: Info */}
            <div className="w-full md:w-1/2 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                {/* Category tags */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full text-white shadow-sm"
                    style={{ backgroundColor: selectedReportForDetail.category_color }}
                  >
                    {selectedReportForDetail.category_title}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-sm font-bold text-slate-700">
                    {selectedReportForDetail.subcategory}
                  </span>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {language === "th" ? "รายละเอียดปัญหา" : "Incident Details"}
                  </h4>
                  <p className="text-sm text-slate-800 break-words whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto pr-1">
                    {selectedReportForDetail.description}
                  </p>
                </div>

                {/* Contact and Date */}
                <div className="space-y-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{language === "th" ? "ผู้แจ้งเหตุ:" : "Reporter:"}</span>
                    <span className="font-semibold">{selectedReportForDetail.contact || (language === "th" ? "ไม่ได้ระบุชื่อ" : "Anonymous")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{language === "th" ? "วันที่แจ้ง:" : "Reported Date:"}</span>
                    <span className="font-semibold">
                      {new Date(selectedReportForDetail.created_at).toLocaleString(
                        language === "th" ? "th-TH" : "en-US"
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Update Actions */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {language === "th" ? "ปรับปรุงสถานะ" : "Update Status"}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedReportForDetail.id, "รอดำเนินการ");
                      setSelectedReportForDetail((prev: any) => ({ ...prev, status: "รอดำเนินการ" }));
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${selectedReportForDetail.status === "รอดำเนินการ"
                        ? "bg-amber-100 border-amber-300 text-amber-800"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    {language === "th" ? "รอดำเนินการ" : "Pending"}
                  </button>
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedReportForDetail.id, "กำลังดำเนินการ");
                      setSelectedReportForDetail((prev: any) => ({ ...prev, status: "กำลังดำเนินการ" }));
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${selectedReportForDetail.status === "กำลังดำเนินการ"
                        ? "bg-blue-100 border-blue-300 text-blue-800"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    {language === "th" ? "กำลังดำเนินการ" : "In Progress"}
                  </button>
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedReportForDetail.id, "ขอข้อมูลเพิ่ม");
                      setSelectedReportForDetail((prev: any) => ({ ...prev, status: "ขอข้อมูลเพิ่ม" }));
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${selectedReportForDetail.status === "ขอข้อมูลเพิ่ม"
                        ? "bg-purple-100 border-purple-300 text-purple-800"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    {language === "th" ? "ขอข้อมูลเพิ่ม" : "Req Info"}
                  </button>
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedReportForDetail.id, "เสร็จสิ้น");
                      setSelectedReportForDetail((prev: any) => ({ ...prev, status: "เสร็จสิ้น" }));
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${selectedReportForDetail.status === "เสร็จสิ้น"
                        ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    {language === "th" ? "เสร็จสิ้น" : "Completed"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}