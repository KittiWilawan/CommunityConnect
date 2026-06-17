"use client";

import React, { useEffect } from "react";
import { X, Image as ImageIcon, Calendar } from "lucide-react";

interface ReportDetailModalProps {
  report: {
    id: string;
    category_title: string;
    category_color: string;
    subcategory: string;
    description: string;
    contact?: string | null;
    image?: string | null;
    status: string;
    created_at: string;
  };
  language: "th" | "en";
  onClose: () => void;
  getStatusClass: (status: string) => string;
  showAdminActions?: boolean;
  onUpdateStatus?: (status: string) => void;
}

export default function ReportDetailModal({
  report,
  language,
  onClose,
  getStatusClass,
  showAdminActions = false,
  onUpdateStatus,
}: ReportDetailModalProps) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const t = {
    noImage: language === "th" ? "ไม่มีรูปภาพแนบ" : "No image attached",
    statusLabel: language === "th" ? "สถานะการดำเนินงาน" : "Status",
    details: language === "th" ? "รายละเอียดปัญหา" : "Issue details",
    reporter: language === "th" ? "ผู้แจ้งเหตุ:" : "Reporter:",
    anonymous: language === "th" ? "ไม่ได้ระบุชื่อ" : "Anonymous",
    date: language === "th" ? "วันที่แจ้ง:" : "Reported:",
    updateStatus: language === "th" ? "ปรับปรุงสถานะ" : "Update status",
    pending: language === "th" ? "รอดำเนินการ" : "Pending",
    inProgress: language === "th" ? "กำลังดำเนินการ" : "In progress",
    needInfo: language === "th" ? "ขอข้อมูลเพิ่ม" : "Need info",
    done: language === "th" ? "เสร็จสิ้น" : "Done",
    tracking: language === "th" ? "ติดตามสถานะการแก้ไข" : "Track repair progress",
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 z-10 my-auto flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-full md:w-1/2 flex flex-col space-y-4">
          {report.image ? (
            <img
              src={report.image}
              alt="Report"
              className="w-full h-64 object-cover rounded-2xl border border-slate-200 shadow-sm"
            />
          ) : (
            <div className="w-full h-64 bg-slate-100 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300">
              <ImageIcon className="w-12 h-12 mb-2" />
              <span className="text-xs font-semibold text-slate-400">{t.noImage}</span>
            </div>
          )}

          <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {showAdminActions ? t.statusLabel : t.tracking}
            </span>
            <span className={`inline-flex text-xs font-bold px-3 py-1 rounded-full border ${getStatusClass(report.status)}`}>
              {report.status}
            </span>
          </div>
        </div>

        <div className="w-full md:w-1/2 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="text-xs font-bold px-3 py-1 rounded-full text-white shadow-sm"
                style={{ backgroundColor: report.category_color }}
              >
                {report.category_title}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-sm font-bold text-slate-700">{report.subcategory}</span>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t.details}
              </h4>
              <p className="text-sm text-slate-800 break-words whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {report.description}
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{t.reporter}</span>
                <span className="font-semibold">{report.contact || t.anonymous}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {t.date}
                </span>
                <span className="font-semibold">
                  {new Date(report.created_at).toLocaleString(
                    language === "th" ? "th-TH" : "en-US"
                  )}
                </span>
              </div>
            </div>
          </div>

          {showAdminActions && onUpdateStatus && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t.updateStatus}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "รอดำเนินการ", label: t.pending },
                  { value: "กำลังดำเนินการ", label: t.inProgress },
                  { value: "ขอข้อมูลเพิ่ม", label: t.needInfo },
                  { value: "เสร็จสิ้น", label: t.done },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => onUpdateStatus(item.value)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${report.status === item.value ? getStatusClass(item.value) : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
