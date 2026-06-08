"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  Pencil,
  Camera,
  Send,
  Loader2,
  CheckCircle,
  MapPin,
} from "lucide-react";
import { useSettings } from "@/app/components/SettingsProvider";
import { compressImage } from "@/app/lib/image-utils";
import { getStatusClass } from "@/app/lib/report-status";
import type { MapReportPin } from "@/app/components/IncidentStatusMap";
import { IncidentStatusMapLoading } from "@/app/components/IncidentStatusMap";

const IncidentStatusMap = dynamic(
  () => import("@/app/components/IncidentStatusMap"),
  {
    ssr: false,
    loading: () => <IncidentStatusMapLoading heightClass="h-72" />,
  }
);

interface Report {
  id: string;
  categoryId: string;
  categoryTitle: string;
  categoryColor: string;
  subcategory: string;
  description: string;
  contact: string;
  image: string | null;
  completionImage: string | null;
  status: string;
  timestamp: string;
  createdAt: string;
  latitude: number | null;
  longitude: number | null;
  locationAddress: string | null;
}

export default function HistoryContent() {
  const { language } = useSettings();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [highlightedReportId, setHighlightedReportId] = useState<string | null>(null);

  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editImage, setEditImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchReports = async () => {
      try {
        const res = await fetch("/api/reports");

        if (res.status === 401) {
          router.replace("/");
          return;
        }

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (!cancelled) {
            setError(
              language === "th"
                ? "ไม่สามารถโหลดประวัติได้: " + (body.error || res.statusText)
                : "Failed to load history: " + (body.error || res.statusText)
            );
          }
          return;
        }

        const data = await res.json();
        const items = Array.isArray(data) ? data : [];

        const formatted: Report[] = items.map((item: any) => ({
          id: item.id,
          categoryId: item.category_id,
          categoryTitle: item.category_title,
          categoryColor: item.category_color,
          subcategory: item.subcategory,
          description: item.description,
          contact: item.contact,
          image: item.image || null,
          completionImage: item.completion_image || null,
          status: item.status,
          timestamp: new Date(item.created_at).toLocaleString("th-TH"),
          createdAt: item.created_at,
          latitude:
            typeof item.latitude === "number" ? item.latitude : null,
          longitude:
            typeof item.longitude === "number" ? item.longitude : null,
          locationAddress: item.location_address || null,
        }));

        if (!cancelled) {
          setReports(formatted);
        }
      } catch {
        if (!cancelled) {
          setError(
            language === "th"
              ? "เกิดข้อผิดพลาดในการโหลดข้อมูล"
              : "An error occurred while loading data"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchReports();

    return () => {
      cancelled = true;
    };
  }, [router, language]);

  useEffect(() => {
    const reportId = searchParams.get("report");
    if (!reportId || reports.length === 0) return;

    setHighlightedReportId(reportId);
    const timer = window.setTimeout(() => {
      document
        .getElementById(`report-${reportId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);

    const clearTimer = window.setTimeout(() => setHighlightedReportId(null), 4000);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(clearTimer);
    };
  }, [searchParams, reports]);

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
    editTooltip: language === "th" ? "แก้ไขข้อมูล" : "Edit report",
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
    infoRequestedBanner:
      language === "th"
        ? "เจ้าหน้าที่ขอข้อมูลเพิ่มเติม — กรุณาแก้ไขและส่งข้อมูลให้เจ้าหน้าที่"
        : "Admin requested more info — please edit and submit your updated details",
    editAndSubmit: language === "th" ? "แก้ไขและส่งข้อมูล" : "Edit & Submit",
    editTitle: language === "th" ? "แก้ไขรายการแจ้งเหตุ" : "Edit Report",
    descriptionLabel: language === "th" ? "รายละเอียดปัญหา" : "Issue details",
    contactLabel: language === "th" ? "ข้อมูลติดต่อ" : "Contact info",
    imageLabel: language === "th" ? "รูปภาพประกอบ" : "Attached image",
    changeImage: language === "th" ? "เปลี่ยนรูปภาพ" : "Change image",
    addImage: language === "th" ? "เพิ่มรูปภาพ" : "Add image",
    removeImage: language === "th" ? "ลบรูปภาพ" : "Remove image",
    cancel: language === "th" ? "ยกเลิก" : "Cancel",
    save: language === "th" ? "บันทึกและส่ง" : "Save & Submit",
    saveError: language === "th" ? "ไม่สามารถบันทึกได้: " : "Failed to save: ",
    completionEvidence:
      language === "th" ? "หลักฐานการแก้ไขเสร็จสิ้น" : "Completion evidence",
    mapTitle:
      language === "th" ? "แผนที่ตำแหน่งที่แจ้งเหตุ" : "Reported Locations Map",
    mapDesc:
      language === "th"
        ? "จุดปักหมุดจากการแจ้งเหตุของคุณ กรองตามสถานะได้"
        : "Pins from your reports, filterable by status",
    issueLocation:
      language === "th" ? "ตำแหน่งที่เกิดปัญหา" : "Issue location",
    noLocation:
      language === "th" ? "ไม่มีข้อมูลตำแหน่ง" : "No location data",
  };

  const handleDeleteReport = async (id: string) => {
    if (confirm(t.confirmDelete)) {
      try {
        const res = await fetch(`/api/reports?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          alert(t.deleteError + (body.error || res.statusText));
          return;
        }
        setReports((prev) => prev.filter((r) => r.id !== id));
      } catch {
        alert(t.deleteErrorCatch);
      }
    }
  };

  const openEditModal = (report: Report) => {
    setEditingReport(report);
    setEditDescription(report.description);
    setEditContact(report.contact || "");
    setEditImage(report.image);
  };

  const closeEditModal = () => {
    setEditingReport(null);
    setEditDescription("");
    setEditContact("");
    setEditImage(null);
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const compressed = await compressImage(dataUrl, 600, 0.6);
      setEditImage(compressed);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = async () => {
    if (!editingReport || !editDescription.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/reports/${editingReport.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: editDescription.trim(),
          contact: editContact.trim(),
          image: editImage,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(t.saveError + (body.error || res.statusText));
        return;
      }

      const updated = await res.json();
      setReports((prev) =>
        prev.map((r) =>
          r.id === editingReport.id
            ? {
                ...r,
                description: updated.description,
                contact: updated.contact,
                image: updated.image || null,
                status: updated.status,
              }
            : r
        )
      );
      closeEditModal();
    } catch {
      alert(
        language === "th"
          ? "เกิดข้อผิดพลาดในการบันทึก"
          : "An error occurred while saving"
      );
    } finally {
      setSaving(false);
    }
  };

  const mapReports: MapReportPin[] = useMemo(
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
          location_address: r.locationAddress,
          status: r.status,
          subcategory: r.subcategory,
          category_title: r.categoryTitle,
          category_color: r.categoryColor,
          description: r.description,
          created_at: r.createdAt,
        })),
    [reports]
  );

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

      {mapReports.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-base font-bold text-[#0F172A]">{t.mapTitle}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{t.mapDesc}</p>
          </div>
          <IncidentStatusMap
            reports={mapReports}
            language={language}
            heightClass="h-72"
          />
        </div>
      )}

      {reports.length > 0 ? (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              id={`report-${report.id}`}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col md:flex-row ${
                highlightedReportId === report.id
                  ? "border-blue-400 ring-2 ring-blue-200 shadow-md"
                  : "border-slate-200"
              }`}
            >
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

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  {report.status === "ขอข้อมูลเพิ่ม" && (
                    <div className="flex items-center justify-between gap-3 p-3 bg-purple-50 border border-purple-200 rounded-xl">
                      <p className="text-xs font-semibold text-purple-800 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {t.infoRequestedBanner}
                      </p>
                      <button
                        onClick={() => openEditModal(report)}
                        className="shrink-0 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        {t.editAndSubmit}
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 justify-between">
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

                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full border flex items-center space-x-1.5 ${getStatusClass(
                        report.status
                      )}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      <span>{report.status}</span>
                    </span>
                  </div>

                  <div className="pt-1">
                    <p className="text-sm text-slate-600 leading-relaxed break-words whitespace-pre-wrap">
                      {report.description}
                    </p>
                  </div>

                  <div className="flex items-start gap-1.5 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#C92A2A] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        {t.issueLocation}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {report.locationAddress ||
                          (report.latitude != null && report.longitude != null
                            ? `${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}`
                            : t.noLocation)}
                      </p>
                    </div>
                  </div>

                  {report.status === "เสร็จสิ้น" && report.completionImage && (
                    <div className="pt-2 space-y-1.5">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {t.completionEvidence}
                      </p>
                      <img
                        src={report.completionImage}
                        alt="Completion evidence"
                        className="w-full max-w-xs h-32 object-cover rounded-xl border border-emerald-200"
                      />
                    </div>
                  )}
                </div>

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

                  <div className="flex items-center gap-1">
                    {report.status !== "เสร็จสิ้น" && (
                      <button
                        onClick={() => openEditModal(report)}
                        className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition active:scale-95 cursor-pointer"
                        title={t.editTooltip}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
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

      {/* Edit Modal */}
      {editingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={closeEditModal}
          />
          <div className="relative bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 z-10 my-auto space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">{t.editTitle}</h3>
              <button
                onClick={closeEditModal}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editingReport.status === "ขอข้อมูลเพิ่ม" && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs font-semibold text-purple-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {t.infoRequestedBanner}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t.descriptionLabel}
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t.contactLabel}
              </label>
              <input
                type="text"
                value={editContact}
                onChange={(e) => setEditContact(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t.imageLabel}
              </label>
              {editImage ? (
                <div className="relative">
                  <img
                    src={editImage}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded-xl border border-slate-200"
                  />
                  <button
                    onClick={() => setEditImage(null)}
                    className="absolute top-2 right-2 p-1 bg-white/90 rounded-full text-red-500 hover:bg-white shadow cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-blue-300 hover:text-blue-400 transition cursor-pointer"
                >
                  <Camera className="w-8 h-8 mb-1" />
                  <span className="text-xs font-semibold">{t.addImage}</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              {editImage && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-blue-500 font-semibold hover:underline cursor-pointer"
                >
                  {t.changeImage}
                </button>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={closeEditModal}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving || !editDescription.trim()}
                className="flex-1 py-3 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white text-sm font-bold transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
