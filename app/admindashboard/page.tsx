"use client";

import dynamic from "next/dynamic";
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/app/components/SettingsProvider";
import RejectModal from "@/app/components/RejectModal";
import type { MapReportPin } from "@/app/components/IncidentStatusMap";
import { IncidentStatusMapLoading } from "@/app/components/IncidentStatusMap";
import {
  MapPin,
  Loader2,
  Image as ImageIcon,
  Calendar,
  Trash2,
  AlertCircle,
  X,
  Search,
  PlusCircle,
  CheckCircle,
  Camera,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/app/lib/supabase";
import { compressImage } from "@/app/lib/image-utils";

export default function DashboardPage() {
  const router = useRouter();
  const { language } = useSettings();
  const [categories, setCategories] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [selectedReportForDetail, setSelectedReportForDetail] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("");
  const [completionTargetId, setCompletionTargetId] = useState<string | null>(null);
  const [completionImage, setCompletionImage] = useState<string | null>(null);
  const [savingCompletion, setSavingCompletion] = useState(false);
  const completionFileRef = useRef<HTMLInputElement>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activePinIndex, setActivePinIndex] = useState<number>(0);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingReportId, setRejectingReportId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'admin' | 'user'>('admin');

  interface MapReportPinLocal {
    id: string;
    latitude: number;
    longitude: number;
    location_address: string | null;
    status: string;
    subcategory: string;
    category_title: string;
    category_color: string;
    description: string;
    created_at: string;
  }

  const IncidentStatusMap = dynamic(
    () => import("@/app/components/IncidentStatusMap"),
    {
      ssr: false,
      loading: () => <IncidentStatusMapLoading heightClass="h-72" />,
    }
  );

  const mapReports: MapReportPinLocal[] = useMemo(
    () =>
      reports
        .filter(
          (r) =>
            typeof r.latitude === "number" &&
            typeof r.longitude === "number"
        )
        .map((r) => ({
          id: r.id,
          latitude: r.latitude as number,
          longitude: r.longitude as number,
          location_address: r.location_address,
          status: r.status,
          subcategory: r.subcategory,
          category_title: r.category_title,
          category_color: r.category_color,
          description: r.description,
          created_at: r.created_at,
        })),
    [reports]
  );

  const handleRejectReport = async (reportId: string, reason: string) => {
    if (!reportId) {
      alert(language === "th" ? "ไม่พบรายการที่ต้องการปฎิเสธ" : "Missing report id");
      setShowRejectModal(false);
      setRejectingReportId(null);
      return;
    }

    try {
      // Call server API to avoid client-side RLS issues and ensure response handling.
      // Add a hard timeout so the UI never stays "loading" forever.
      const controller = new AbortController();
      const timeoutMs = 20000;
      let timeoutId: number | undefined;

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => {
          try {
            controller.abort();
          } catch {
            // ignore
          }
          reject(new Error("timeout"));
        }, timeoutMs);
      });

      const res = (await Promise.race([
        fetch(`/api/reports/${reportId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "ปฎิเสธ",
            rejection_reason: reason,
          }),
          signal: controller.signal,
        }),
        timeoutPromise,
      ])) as Response;

      if (timeoutId) window.clearTimeout(timeoutId);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(
          (language === "th" ? "ไม่สามารถปฎิเสธรายการได้: " : "Failed to reject report: ") +
          (body.error || res.statusText)
        );
        return;
      }

      const updated = await res.json().catch(() => null);
      if (updated && updated.id) {
        setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, ...updated } : r)));
        if (selectedReportForDetail?.id === reportId) {
          setSelectedReportForDetail((prev: any) => ({ ...(prev || {}), ...updated }));
        }
      } else {
        // Fallback if server didn't return the updated row
        setReports((prev) =>
          prev.map((r) =>
            r.id === reportId
              ? {
                ...r,
                status: "ปฎิเสธ",
                rejection_reason: reason,
                rejected_at: new Date().toISOString(),
              }
              : r
          )
        );
      }
    } catch (err: any) {
      if (err?.name === "AbortError" || err?.message === "timeout") {
        alert(
          language === "th"
            ? "การปฏิเสธใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง"
            : "Reject request timed out. Please try again."
        );
      } else {
        alert(language === "th" ? "เกิดข้อผิดพลาดในการปฎิเสธ" : "Error rejecting report");
      }
    } finally {
      setShowRejectModal(false);
      setRejectingReportId(null);
    }
  };

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories?enabled=true");
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch("/api/reports?all=true");

      if (res.status === 401) {
        router.push("/");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setReports(Array.isArray(data) ? data : []);
      } else {
        const body = await res.json().catch(() => ({}));
        console.error("Failed to fetch reports:", body.error || res.statusText);
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoadingReports(false);
    }
  }, [router]);

  useEffect(() => {
    fetchCategories();
    fetchReports();
  }, [fetchCategories, fetchReports]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const reportId = params.get("report") || params.get("reportId");
    if (!reportId || reports.length === 0) return;

    const report = reports.find((r) => r.id === reportId);
    if (report) {
      setSelectedReportForDetail(report);
    }
  }, [reports]);

  useEffect(() => {
    if (selectedReportForDetail || completionTargetId || showRejectModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedReportForDetail, completionTargetId, showRejectModal]);

  const handleUpdateStatus = async (
    reportId: string,
    newStatus: string,
    evidenceImage?: string
  ) => {
    if (newStatus === "เสร็จสิ้น" && !evidenceImage) {
      setCompletionTargetId(reportId);
      setCompletionImage(null);
      return;
    }

    const previousReports = reports;
    const previousDetail = selectedReportForDetail;

    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
            ...r,
            status: newStatus,
            ...(evidenceImage ? { completion_image: evidenceImage } : {}),
          }
          : r
      )
    );
    if (selectedReportForDetail?.id === reportId) {
      setSelectedReportForDetail({
        ...selectedReportForDetail,
        status: newStatus,
        ...(evidenceImage ? { completion_image: evidenceImage } : {}),
      });
    }

    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          ...(evidenceImage ? { completion_image: evidenceImage } : {}),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setReports(previousReports);
        setSelectedReportForDetail(previousDetail);
        alert(
          (language === "th" ? "ไม่สามารถอัปเดตสถานะได้: " : "Failed to update status: ") +
          (body.error || res.statusText)
        );
      }
    } catch {
      setReports(previousReports);
      setSelectedReportForDetail(previousDetail);
      alert(
        language === "th" ? "เกิดข้อผิดพลาดในการอัปเดตสถานะ" : "Error updating status"
      );
    }
  };

  const handleCompletionImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const compressed = await compressImage(dataUrl, 600, 0.6);
      setCompletionImage(compressed);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmCompletion = async () => {
    if (!completionTargetId || !completionImage) return;

    setSavingCompletion(true);
    await handleUpdateStatus(completionTargetId, "เสร็จสิ้น", completionImage);
    setSavingCompletion(false);
    setCompletionTargetId(null);
    setCompletionImage(null);
  };

  const handleDeleteReport = async (reportId: string) => {
    const confirmMsg =
      language === "th"
        ? "คุณต้องการลบรายงานปัญหานี้ออกจากระบบใช่หรือไม่?\n\nหมายเหตุ: การลบเป็นการลบถาวร และไม่สามารถกู้คืนได้"
        : "Are you sure you want to delete this report?\n\nNote: This action is permanent and cannot be undone.";

    if (confirm(confirmMsg)) {
      try {
        const controller = new AbortController();
        const timeoutMs = 20000;
        let timeoutId: number | undefined;

        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = window.setTimeout(() => {
            try {
              controller.abort();
            } catch {
              // ignore
            }
            reject(new Error("timeout"));
          }, timeoutMs);
        });

        const res = (await Promise.race([
          fetch(`/api/reports?id=${encodeURIComponent(reportId)}`, {
            method: "DELETE",
            signal: controller.signal,
          }),
          timeoutPromise,
        ])) as Response;

        if (timeoutId) window.clearTimeout(timeoutId);

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          alert(
            (language === "th" ? "ไม่สามารถลบรายงานได้: " : "Failed to delete report: ") +
            (body.error || res.statusText)
          );
          return;
        }

        setReports((prev) => prev.filter((r) => r.id !== reportId));
      } catch (err: any) {
        if (err?.name === "AbortError" || err?.message === "timeout") {
          alert(
            language === "th"
              ? "การลบใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง"
              : "Delete request timed out. Please try again."
          );
        } else {
          alert(language === "th" ? "เกิดข้อผิดพลาดในการลบรายการ" : "Error deleting report");
        }
      }
    }
  };

  const pendingCount = reports.filter((r) => r.status === "รอดำเนินการ").length;
  const processingCount = reports.filter((r) => r.status === "กำลังดำเนินการ").length;
  const infoRequestedCount = reports.filter((r) => r.status === "ขอข้อมูลเพิ่ม").length;
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

  const activeReports = reports.filter((r) => r.status !== "เสร็จสิ้น");

  const filteredReports = reports.filter((report) => {
    if (!selectedStatusFilter && report.status === "เสร็จสิ้น") {
      return false;
    }

    if (viewMode === 'user' && currentUserId) {
      if (report.user_id !== currentUserId) return false;
    }

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

    if (selectedStatusFilter && report.status !== selectedStatusFilter) {
      return false;
    }

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
    title: language === "th" ? "แผงควบคุมหลักสำหรับผู้ดูแลระบบ" : "Admin Dashboard",
    subtitle: language === "th" ? "ตรวจสอบสถานะ และจัดการรายการแจ้งเหตุจากคนในชุมชนเรียบไทม์" : "Monitor and manage community incident reports in real-time",
    loading: language === "th" ? "กำลังโหลด..." : "Loading...",
    realtimeSummary: language === "th" ? "สรุปสถานะเรียลไทม์" : "Real-time Summary",
    realtimeDesc: language === "th" ? "ปริมาณปัญหาแยกตามขั้นตอน" : "Report volume by stage",
    pending: language === "th" ? "รอดำเนินการ" : "Pending",
    processing: language === "th" ? "กำลังดำเนินการ" : "In Progress",
    infoRequested: language === "th" ? "ขอข้อมูลเพิ่ม" : "Info Requested",
    completed: language === "th" ? "เสร็จสิ้น" : "Completed",
    clearFilters: language === "th" ? "ล้างตัวกรองทั้งหมด" : "Clear All Filters",
    allReports: language === "th" ? "รายการแจ้งเหตุทั้งหมด" : "All Incident Reports",
    searchPlaceholder: language === "th" ? "ค้นหารายการแจ้งเหตุ..." : "Search reports...",
    filterCategory: language === "th" ? "หมวดหมู่:" : "Category:",
    filterAll: language === "th" ? "ทั้งหมด (All)" : "All",
    mapTitle: language === "th" ? "แผนที่ตำแหน่งที่แจ้งเหตุ" : "Reported Locations Map",
    mapDesc: language === "th" ? "จุดปักหมุดจากการแจ้งเหตุของคุณ กรองตามสถานะได้" : "Pins from your reports, filterable by status",
    issueLocation: language === "th" ? "ตำแหน่งที่เกิดปัญหา" : "Issue location",
    noLocation: language === "th" ? "ไม่มีข้อมูลตำแหน่ง" : "No location data",
    prevPin: language === "th" ? "หมุดก่อนหน้า" : "Previous pin",
    nextPin: language === "th" ? "หมุดถัดไป" : "Next pin",
  };

  return (
    <>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-[#0F172A]">{t.title}</h1>
            <p className="text-slate-500 mt-1.5">
              {t.subtitle}
            </p>
          </div>
        </div>

        {/* Map Section */}
        {mapReports.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">{t.mapTitle}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{t.mapDesc}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {mapReports.length > 0 && (
                  <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: mapReports[activePinIndex]?.category_color }}
                    />
                    <span className="text-[10px] font-bold text-slate-600 max-w-[120px] truncate">
                      {mapReports[activePinIndex]?.subcategory}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({activePinIndex + 1}/{mapReports.length})
                    </span>
                  </div>
                )}

                <button
                  onClick={() => {
                    const newIndex = (activePinIndex - 1 + mapReports.length) % mapReports.length;
                    setActivePinIndex(newIndex);
                  }}
                  disabled={mapReports.length <= 1}
                  title={t.prevPin}
                  className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="sm:hidden text-xs font-bold text-slate-500">
                  {activePinIndex + 1}/{mapReports.length}
                </span>

                {/* Right button */}
                <button
                  onClick={() => {
                    const newIndex = (activePinIndex + 1) % mapReports.length;
                    setActivePinIndex(newIndex);
                  }}
                  disabled={mapReports.length <= 1}
                  title={t.nextPin}
                  className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>


            </div>

            {/* Map */}
            <IncidentStatusMap
              reports={mapReports}
              language={language}
              activeReportId={mapReports[activePinIndex]?.id}
            />

            {/* Pin list (scrollable dots) */}
            {mapReports.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 py-2 px-4 border-t border-slate-100">
                {mapReports.map((pin, idx) => (
                  <button
                    key={pin.id}
                    onClick={() => {
                      setActivePinIndex(idx);
                    }}
                    title={pin.subcategory}
                    className={`w-2 h-2 rounded-full transition-all duration-200 cursor-pointer ${idx === activePinIndex ? "scale-150" : "opacity-50 hover:opacity-80"}`}
                    style={{ backgroundColor: pin.category_color }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dashboard Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: Real-time Status Counter */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 flex items-center justify-between border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-[#0F172A]">{t.realtimeSummary}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{t.realtimeDesc}</p>
              </div>
            </div>
            <div className="p-6 space-y-4 flex-1 flex flex-col justify-center">
              <button
                onClick={() => setSelectedStatusFilter((prev) => (prev === "รอดำเนินการ" ? "" : "รอดำเนินการ"))}
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
                <span className="text-lg font-bold text-amber-700">{pendingCount}</span>
              </button>

              <button
                onClick={() => setSelectedStatusFilter((prev) => (prev === "กำลังดำเนินการ" ? "" : "กำลังดำเนินการ"))}
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
                <span className="text-lg font-bold text-blue-700">{processingCount}</span>
              </button>

              <button
                onClick={() => setSelectedStatusFilter((prev) => (prev === "ขอข้อมูลเพิ่ม" ? "" : "ขอข้อมูลเพิ่ม"))}
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
                <span className="text-lg font-bold text-purple-700">{infoRequestedCount}</span>
              </button>

              <button
                onClick={() => setSelectedStatusFilter((prev) => (prev === "เสร็จสิ้น" ? "" : "เสร็จสิ้น"))}
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
                <span className="text-lg font-bold text-emerald-700">{completedCount}</span>
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


          {/* Right Column: Reports Table and Filters */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-[#0F172A]">
                  {selectedStatusFilter === "เสร็จสิ้น"
                    ? `${t.completed} (${filteredReports.length})`
                    : `${t.allReports} (${filteredReports.length})`}
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
                          boxShadow: isActive ? `0 2px 4px ${cat.color}33` : "none",
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

            {/* Incident Reports List */}
            {loadingReports ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
              </div>
            ) : reports.length > 0 ? (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1 mt-3">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className="p-2 bg-white rounded-xl border border-slate-200/80 flex gap-2 items-start hover:shadow-md hover:border-slate-300 transition-all duration-200"
                  >
                    {report.image ? (
                      <div className="w-8 h-8 rounded-md overflow-hidden shrink-0 border border-slate-200 shadow-sm aspect-square">
                        <img
                          src={report.image}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-slate-50 rounded-md flex items-center justify-center text-slate-400 shrink-0 border border-slate-200 aspect-square shadow-inner">
                        <ImageIcon className="w-3 h-3 text-slate-400" />
                      </div>
                    )}
                    <div className="flex-grow min-w-0 space-y-1">
                      {/* Row 1: Category badge + subcategory + status */}
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="text-[8px] font-bold px-1.5 py-0.5 rounded text-white shrink-0"
                            style={{ backgroundColor: report.category_color }}
                          >
                            {report.category_title}
                          </span>
                          <span className="text-[9px] font-bold text-slate-700 truncate max-w-[100px]">
                            {report.subcategory}
                          </span>
                        </div>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${getStatusClass(report.status)}`}>
                          {report.status}
                        </span>
                      </div>

                      {/* Row 2: Description */}
                      <p className="text-[9px] text-slate-600 line-clamp-2 leading-relaxed">
                        {report.description}
                      </p>

                      {/* Row 3: Location */}
                      {(report.location_address || (report.latitude && report.longitude)) && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-[#C92A2A] shrink-0" />
                          <span className="text-[8px] text-slate-500 truncate">
                            {report.location_address ||
                              (report.latitude != null && report.longitude != null
                                ? `${Number(report.latitude).toFixed(4)}, ${Number(report.longitude).toFixed(4)}`
                                : "")}
                          </span>
                        </div>
                      )}

                      {/* Row 4: Meta + actions */}
                      <div className="flex items-center justify-between gap-1 text-[8px] text-slate-400 pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-1">
                          <span>
                            {language === "th" ? "ผู้แจ้ง: " : "By: "}<span className="text-slate-600 font-medium">{report.contact || (language === "th" ? "ไม่ระบุ" : "Anon")}</span>
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-0.5">
                            <Calendar className="w-2 h-2" />
                            {new Date(report.created_at).toLocaleDateString(language === "th" ? "th-TH" : "en-US")}
                          </span>
                          <span>·</span>
                          <button
                            onClick={() => setSelectedReportForDetail(report)}
                            className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer hover:underline"
                          >
                            {language === "th" ? "ดูรายละเอียด" : "Details"}
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <select
                            value={report.status}
                            onChange={(e) => handleUpdateStatus(report.id, e.target.value)}
                            className={`px-1 py-0.5 rounded text-[8px] font-bold border cursor-pointer outline-none transition duration-150 ${getStatusClass(report.status)}`}
                          >
                            <option value="รอดำเนินการ">{language === "th" ? "รอดำเนินการ" : "Pending"}</option>
                            <option value="กำลังดำเนินการ">{language === "th" ? "กำลังดำเนินการ" : "In Progress"}</option>
                            <option value="ขอข้อมูลเพิ่ม">{language === "th" ? "ขอข้อมูลเพิ่ม" : "Req Info"}</option>
                            <option value="เสร็จสิ้น">{language === "th" ? "เสร็จสิ้น" : "Completed"}</option>
                          </select>
                          <button
                            onClick={() => {
                              setRejectingReportId(report.id);
                              setShowRejectModal(true);
                            }}
                            className="p-1 text-slate-300 hover:text-red-600 transition cursor-pointer ml-0.5"
                            title={language === "th" ? "ปฎิเสธรายการ" : "Reject"}
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {report.status === "ปฎิเสธ" && (
                            <button
                              onClick={() => handleDeleteReport(report.id)}
                              className="p-1 text-slate-300 hover:text-red-600 transition cursor-pointer ml-0.5"
                              title={language === "th" ? "ลบรายการที่ถูกปฎิเสธ" : "Delete rejected report"}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredReports.length === 0 && (
                  <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    {searchQuery ? (
                      <>
                        <Search className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-400 text-xs">
                          {language === "th" ? `ไม่พบรายการที่ตรงกับ "${searchQuery}"` : `No reports matching "${searchQuery}"`}
                        </p>
                      </>
                    ) : selectedStatusFilter === "เสร็จสิ้น" ? (
                      <>
                        <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-400 text-xs">{language === "th" ? "ยังไม่มีรายการที่เสร็จสิ้น" : "No completed reports yet"}</p>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-400 text-xs">
                          {language === "th"
                            ? 'ไม่มีรายการที่กำลังดำเนินการ — กด "เสร็จสิ้น" เพื่อดูงานที่ปิดแล้ว'
                            : 'No active reports — click "Completed" to view finished items'}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400 text-xs">{language === "th" ? "ยังไม่มีรายงานแจ้งเข้ามาในระบบ" : "No reports submitted yet"}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedReportForDetail && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]" onClick={() => setSelectedReportForDetail(null)} />
          <div className="relative bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 z-10 my-auto animate-[scaleUp_250ms_ease-out] flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedReportForDetail(null)} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <div className="w-full md:w-1/2 flex flex-col space-y-4">
              {selectedReportForDetail.image ? (
                <img src={selectedReportForDetail.image} alt="Report detail preview" className="w-full h-64 object-cover rounded-2xl border border-slate-200 shadow-sm" />
              ) : (
                <div className="w-full h-64 bg-slate-100 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300">
                  <ImageIcon className="w-12 h-12 mb-2" />
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

              {selectedReportForDetail.status === "เสร็จสิ้น" &&
                selectedReportForDetail.completion_image && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {language === "th"
                        ? "หลักฐานการแก้ไขเสร็จสิ้น"
                        : "Completion evidence"}
                    </p>
                    <img
                      src={selectedReportForDetail.completion_image}
                      alt="Completion evidence"
                      className="w-full h-40 object-cover rounded-xl border border-emerald-200"
                    />
                  </div>
                )}
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
                  {(() => {
                    const created = new Date(selectedReportForDetail.created_at);
                    const inProgress = selectedReportForDetail.in_progress_at
                      ? new Date(selectedReportForDetail.in_progress_at)
                      : new Date(created.getTime() + 60 * 60 * 1000);
                    const completed = selectedReportForDetail.completed_at
                      ? new Date(selectedReportForDetail.completed_at)
                      : new Date(created.getTime() + 6 * 60 * 60 * 1000);
                    const locale = language === "th" ? "th-TH" : "en-US";
                    const fmtTime = (d: Date) =>
                      d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

                    return (
                      <div className="pt-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          {language === "th" ? "เวลาทำการ" : "Working timeline"}
                        </p>
                        <div className="mt-1 grid grid-cols-3 gap-2">
                          <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-2">
                            <p className="text-[10px] font-bold text-slate-500">
                              {language === "th" ? "รับเรื่อง" : "Received"}
                            </p>
                            <p className="text-xs font-semibold text-slate-700">{fmtTime(created)}</p>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-2">
                            <p className="text-[10px] font-bold text-slate-500">
                              {language === "th" ? "กำลังดำเนินการ" : "In progress"}
                            </p>
                            <p className="text-xs font-semibold text-slate-700">{fmtTime(inProgress)}</p>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-2">
                            <p className="text-[10px] font-bold text-slate-500">
                              {language === "th" ? "เสร็จสิ้น" : "Completed"}
                            </p>
                            <p className="text-xs font-semibold text-slate-700">{fmtTime(completed)}</p>
                          </div>
                        </div>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {language === "th"
                            ? "* เวลาข้างต้นเป็นเวลาโดยประมาณ หากยังไม่มีการบันทึกเวลาในระบบ"
                            : "* Times are approximate if the system hasn't recorded timestamps yet."}
                        </p>
                      </div>
                    );
                  })()}
                  {/* Location */}
                  {(selectedReportForDetail.location_address || (selectedReportForDetail.latitude && selectedReportForDetail.longitude)) && (
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#C92A2A] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{language === "th" ? "ตำแหน่งที่เกิดเหตุ" : "Issue Location"}</p>
                        <p className="text-xs text-slate-600 leading-relaxed break-words">
                          {selectedReportForDetail.location_address ||
                            `${Number(selectedReportForDetail.latitude).toFixed(5)}, ${Number(selectedReportForDetail.longitude).toFixed(5)}`}
                        </p>
                      </div>
                    </div>
                  )}
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
                    onClick={() =>
                      handleUpdateStatus(selectedReportForDetail.id, "เสร็จสิ้น")
                    }
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

      {/* Completion Evidence Modal */}
      {completionTargetId && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => {
              setCompletionTargetId(null);
              setCompletionImage(null);
            }}
          />
          <div className="relative bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 z-10 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">
                {language === "th"
                  ? "แนบรูปหลักฐานการแก้ไข"
                  : "Attach completion evidence"}
              </h3>
              <button
                onClick={() => {
                  setCompletionTargetId(null);
                  setCompletionImage(null);
                }}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              {language === "th"
                ? "กรุณาแนบรูปภาพหลักฐานแสดงว่าการแก้ไขเสร็จสมบูรณ์แล้ว ก่อนเปลี่ยนสถานะเป็นเสร็จสิ้น"
                : "Please attach a photo proving the issue has been resolved before marking as complete."}
            </p>

            {completionImage ? (
              <div className="relative">
                <img
                  src={completionImage}
                  alt="Evidence preview"
                  className="w-full h-48 object-cover rounded-xl border border-emerald-200"
                />
                <button
                  onClick={() => setCompletionImage(null)}
                  className="absolute top-2 right-2 p-1 bg-white/90 rounded-full text-red-500 hover:bg-white shadow cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => completionFileRef.current?.click()}
                className="w-full h-40 border-2 border-dashed border-emerald-200 rounded-xl flex flex-col items-center justify-center text-emerald-400 hover:border-emerald-400 hover:bg-emerald-50/50 transition cursor-pointer"
              >
                <Camera className="w-10 h-10 mb-2" />
                <span className="text-xs font-bold">
                  {language === "th" ? "เลือกรูปหลักฐาน" : "Select evidence photo"}
                </span>
              </div>
            )}
            <input
              ref={completionFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCompletionImageChange}
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCompletionTargetId(null);
                  setCompletionImage(null);
                }}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                {language === "th" ? "ยกเลิก" : "Cancel"}
              </button>
              <button
                onClick={handleConfirmCompletion}
                disabled={!completionImage || savingCompletion}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingCompletion ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {language === "th" ? "ยืนยันเสร็จสิ้น" : "Confirm complete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      <RejectModal
        isOpen={showRejectModal}
        reportId={rejectingReportId || ""}
        onClose={() => setShowRejectModal(false)}
        onConfirm={(reason) => handleRejectReport(rejectingReportId || "", reason)}
        language={language}
      />
    </>
  );
}
