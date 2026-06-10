"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Maximize2, Loader2, ChevronRight, Clock, FileText, X } from "lucide-react";
import CategoryCard from "@/app/components/categorycard";
import { ICON_MAP } from "@/app/lib/icons";
import type { Category } from "@/app/lib/types";
import { useSettings } from "@/app/components/SettingsProvider";
import { getStatusClass } from "@/app/lib/report-status";
import type { MapReportPin } from "@/app/components/IncidentStatusMap";
import { IncidentStatusMapLoading } from "@/app/components/IncidentStatusMap";

const IncidentStatusMap = dynamic(
  () => import("@/app/components/IncidentStatusMap"),
  {
    ssr: false,
    loading: () => <IncidentStatusMapLoading heightClass="h-80" />,
  }
);

interface ReportItem extends MapReportPin { }

export default function DashboardPage() {
  const router = useRouter();
  const { language } = useSettings();
  const [categories, setCategories] = useState<Category[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [mapExpanded, setMapExpanded] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories?enabled=true");
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch("/api/reports");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        setReports(data);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchReports();
  }, [fetchCategories, fetchReports]);

  useEffect(() => {
    const onFocus = () => fetchReports();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchReports]);

  const handleSelectCategory = (id: string) => {
    router.push(`/reportissue?category=${id}`);
  };

  const recentReports = reports.slice(0, 5);

  const t = {
    welcome: language === "th" ? "ยินดีต้อนรับกลับมา" : "Welcome Back",
    subWelcome:
      language === "th"
        ? "เลือกประเภทบริการที่คุณต้องการแจ้งปัญหาหรือตรวจสอบสถานะ"
        : "Select a service category to report an issue or check status",
    noCategory:
      language === "th" ? "ยังไม่มีหมวดหมู่ที่เปิดใช้งาน" : "No active service categories",
    addCategory:
      language === "th"
        ? "ไปที่หน้า Issue Categories เพื่อเพิ่มหรือเปิดใช้งานหมวดหมู่"
        : "Go to Issue Categories to add or enable categories",
    mapTitle: language === "th" ? "แผนที่สถานะเรียลไทม์" : "Real-time Status Map",
    mapDesc:
      language === "th"
        ? "ดูจุดที่แจ้งเหตุบนแผนที่ กรองตามสถานะได้"
        : "View reported locations on the map, filter by status",
    expandMap: language === "th" ? "ขยายแผนที่" : "Maximize Map",
    closeMap: language === "th" ? "ปิด" : "Close",
    recentHistory: language === "th" ? "ประวัติล่าสุด" : "Recent History",
    viewAll: language === "th" ? "ดูทั้งหมด" : "View All",
    noHistory:
      language === "th"
        ? "ยังไม่มีประวัติการแจ้งปัญหา"
        : "No report history yet",
    reportFirst:
      language === "th" ? "แจ้งปัญหาแรกของคุณ" : "Submit your first report",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A]">{t.welcome}</h1>
        <p className="text-slate-500 mt-1.5">{t.subWelcome}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-7 h-7 text-slate-400 animate-spin" />
        </div>
      ) : categories.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 w-full">
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
                      className="w-8 h-8"
                      style={{ color: cat.color }}
                    />
                  ) : null
                }
                color={cat.color}
                subcategories={cat.subcategories}
                onClick={() => handleSelectCategory(cat.id)}
              />
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
          <p className="text-slate-400 text-sm">{t.noCategory}</p>
          <p className="text-slate-300 text-xs mt-1">{t.addCategory}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 flex items-center justify-between border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-[#0F172A]">{t.mapTitle}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{t.mapDesc}</p>
            </div>
            <button
              type="button"
              onClick={() => setMapExpanded(true)}
              className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{t.expandMap}</span>
            </button>
          </div>
          {loadingReports ? (
            <IncidentStatusMapLoading heightClass="h-80" />
          ) : (
            <IncidentStatusMap
              reports={reports}
              language={language}
              heightClass="h-80"
            />
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#0F172A]">{t.recentHistory}</h3>
            {reports.length > 0 && (
              <Link
                href="/reportissue/historys"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-0.5"
              >
                <span>{t.viewAll}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {loadingReports ? (
            <div className="flex items-center justify-center flex-1 py-8">
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
            </div>
          ) : recentReports.length > 0 ? (
            <div className="space-y-3 flex-1">
              {recentReports.map((report) => (
                <Link
                  key={report.id}
                  href={`/reportissue/historys?report=${report.id}`}
                  className="block p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shrink-0"
                          style={{ backgroundColor: report.category_color }}
                        >
                          {report.subcategory}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${getStatusClass(report.status)}`}
                        >
                          {report.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {report.description}
                      </p>
                      <div className="flex items-center space-x-1 mt-1.5 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(report.created_at).toLocaleString(
                            language === "th" ? "th-TH" : "en-US"
                          )}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 py-8 text-center space-y-3">
              <FileText className="w-10 h-10 text-slate-200" />
              <p className="text-sm text-slate-400">{t.noHistory}</p>
              <Link
                href="/reportissue"
                className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-2 rounded-lg transition"
              >
                {t.reportFirst}
              </Link>
            </div>
          )}
        </div>
      </div>

      {mapExpanded && (
        <div className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 flex items-center justify-between border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-[#0F172A]">{t.mapTitle}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{t.mapDesc}</p>
              </div>
              <button
                type="button"
                onClick={() => setMapExpanded(false)}
                className="p-2 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <IncidentStatusMap
                reports={reports}
                language={language}
                heightClass="h-[70vh]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
