"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// ❌ ลบการ import L แบบปกติออกเพื่อไม่ให้เซิร์ฟเวอร์ตื่นตระหนก
// import L from "leaflet"; 
import "leaflet/dist/leaflet.css";
import { Loader2 } from "lucide-react";
import {
  BANGKOK_BOUNDS,
  BANGKOK_CENTER,
} from "@/app/lib/bangkok-bounds";
import {
  REPORT_STATUSES,
  getStatusColor,
  getStatusLabel,
} from "@/app/lib/report-status";

export interface MapReportPin {
  id: string;
  latitude: number;
  longitude: number;
  location_address?: string | null;
  status: string;
  subcategory: string;
  category_title: string;
  category_color: string;
  description: string;
  created_at: string;
}

interface IncidentStatusMapProps {
  reports: MapReportPin[];
  language: "th" | "en";
  className?: string;
  heightClass?: string;
}

// 🟢 ปรับฟังก์ชันสร้าง Icon ให้ปลอดภัย: ส่งผ่านตัวแปร L จากใน useEffect แทนการเรียกใช้ตรงๆ ทั่วโลก
function createPinIcon(L: any, color: string) {
  return L.divIcon({
    className: "",
    html: `<span style="
      display:block;
      width:14px;
      height:14px;
      background:${color};
      border:2px solid white;
      border-radius:50%;
      box-shadow:0 1px 4px rgba(0,0,0,0.35);
    "></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  });
}

function hasValidCoords(report: MapReportPin): boolean {
  return (
    typeof report.latitude === "number" &&
    typeof report.longitude === "number" &&
    !Number.isNaN(report.latitude) &&
    !Number.isNaN(report.longitude)
  );
}

export default function IncidentStatusMap({
  reports,
  language,
  className = "",
  heightClass = "h-80",
}: IncidentStatusMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null); // เปลี่ยนจาก L.Map เป็น any เพื่อเลี่ยงการตรวจของประเภทข้อมูล
  const markersLayerRef = useRef<any>(null);

  // 🟢 สร้าง State สำหรับเก็บไลบรารี Leaflet ที่โหลดแบบไดนามิกเฉพาะบนเบราว์เซอร์
  const [L, setL] = useState<any>(null);

  const [activeStatuses, setActiveStatuses] = useState<Set<string>>(
    () => new Set(REPORT_STATUSES)
  );

  // 🟢 ดึงข้อมูล Leaflet เข้ามาทำงานใน UseEffect (รันเฉพาะฝั่ง Client แน่นอน 100%)
  useEffect(() => {
    import("leaflet").then((leaflet) => {
      setL(leaflet.default ? leaflet.default : leaflet);
    });
  }, []);

  const locatedReports = useMemo(
    () => reports.filter(hasValidCoords),
    [reports]
  );

  const filteredReports = useMemo(
    () => locatedReports.filter((r) => activeStatuses.has(r.status)),
    [locatedReports, activeStatuses]
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const status of REPORT_STATUSES) {
      counts[status] = locatedReports.filter((r) => r.status === status).length;
    }
    return counts;
  }, [locatedReports]);

  const toggleStatus = (status: string) => {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        if (next.size === 1) return prev;
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  const showOnlyStatus = (status: string) => {
    setActiveStatuses(new Set([status]));
  };

  const resetFilters = () => {
    setActiveStatuses(new Set(REPORT_STATUSES));
  };

  const t = useMemo(() => ({
    filterHint:
      language === "th"
        ? "กดเพื่อกรองสถานะ (กดซ้าย = เฉพาะสถานะนั้น)"
        : "Click to filter (left = only that status)",
    showAll: language === "th" ? "แสดงทั้งหมด" : "Show all",
    noPins:
      language === "th"
        ? "ยังไม่มีจุดปักหมุดจากการแจ้งเหตุ"
        : "No pinned locations from reports yet",
    viewHistory: language === "th" ? "ดูใน History" : "View in History",
    noLocationData:
      language === "th"
        ? "รายการที่เลือกไม่มีตำแหน่งบนแผนที่"
        : "Selected reports have no map location",
  }), [language]);

  const updateMarkers = useCallback(() => {
    // 🟢 ถ้าตัวแปร L ยังไม่พร้อมทำงาน ให้ข้ามฟังก์ชันนี้ไปก่อนเพื่อความปลอดภัย
    if (!L) return;

    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    if (filteredReports.length === 0) return;

    const bounds = L.latLngBounds([]);

    for (const report of filteredReports) {
      const latlng: [number, number] = [report.latitude, report.longitude];
      bounds.extend(latlng);

      const marker = L.marker(latlng, {
        icon: createPinIcon(L, getStatusColor(report.status)), // ส่ง L เข้าไปทำงานด้วย
      });

      const dateStr = new Date(report.created_at).toLocaleString(
        language === "th" ? "th-TH" : "en-US"
      );

      const popupHtml = `
        <div style="min-width:180px;font-family:inherit">
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">
            <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;color:white;background:${report.category_color}">
              ${report.subcategory}
            </span>
            <span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:999px;border:1px solid #e2e8f0;color:${getStatusColor(report.status)}">
              ${getStatusLabel(report.status, language)}
            </span>
          </div>
          <p style="font-size:11px;color:#475569;margin:0 0 6px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">
            ${report.description}
          </p>
          ${report.location_address
          ? `<p style="font-size:10px;color:#94a3b8;margin:0 0 6px;line-height:1.3">${report.location_address}</p>`
          : ""
        }
          <p style="font-size:10px;color:#94a3b8;margin:0 0 8px">${dateStr}</p>
          <a href="/reportissue/historys?report=${report.id}" style="font-size:10px;font-weight:700;color:#2563eb;text-decoration:none">
            ${t.viewHistory} →
          </a>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 260 });
      marker.addTo(layer);
    }

    if (filteredReports.length === 1) {
      map.setView(
        [filteredReports[0].latitude, filteredReports[0].longitude],
        15,
        { animate: true }
      );
    } else if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: true });
    }
  }, [filteredReports, language, t.viewHistory, L]);

  useEffect(() => {
    // 🟢 ต้องมีตัวแปร L (Leaflet) ตื่นขึ้นมาก่อน ถึงจะเริ่มประกอบร่างสร้างแผนที่
    if (!mapContainerRef.current || mapRef.current || !L) return;

    const LEAFLET_MAX_BOUNDS = [
      [BANGKOK_BOUNDS.south, BANGKOK_BOUNDS.west],
      [BANGKOK_BOUNDS.north, BANGKOK_BOUNDS.east],
    ];

    const map = L.map(mapContainerRef.current, {
      center: [BANGKOK_CENTER.lat, BANGKOK_CENTER.lng],
      zoom: 12,
      minZoom: 11,
      maxZoom: 18,
      maxBounds: LEAFLET_MAX_BOUNDS,
      maxBoundsViscosity: 1,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    }).addTo(map);

    L.control.zoom({ position: "bottomleft" }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, [L]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [heightClass]);

  // 🟢 แสดงสถานะการโหลดชั่วคราวระหว่างรอแผนที่ตื่นตัวบนเบราว์เซอร์ เพื่อความปลอดภัย 100% ตอน Build
  if (!L) {
    return (
      <div className={`${heightClass} bg-slate-100 flex items-center justify-center`}>
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin mr-2" />
        <span className="text-xs text-slate-400">กำลังโหลดระบบแผนที่...</span>
      </div>
    );
  }

  const allActive = activeStatuses.size === REPORT_STATUSES.length;

  return (
    <div className={`relative ${className}`}>
      <div
        className={`${heightClass} relative overflow-hidden bg-slate-100`}
      >
        <div ref={mapContainerRef} className="absolute inset-0 z-0" />

        {locatedReports.length === 0 && (
          <div className="absolute inset-0 z-[300] flex items-center justify-center bg-slate-100/80 backdrop-blur-[1px] pointer-events-none">
            <p className="text-xs font-medium text-slate-500 px-6 text-center">
              {t.noPins}
            </p>
          </div>
        )}

        {locatedReports.length > 0 && filteredReports.length === 0 && (
          <div className="absolute inset-0 z-[300] flex items-center justify-center bg-slate-100/60 backdrop-blur-[1px] pointer-events-none">
            <p className="text-xs font-medium text-slate-500 px-6 text-center">
              {t.noLocationData}
            </p>
          </div>
        )}

        <div className="absolute top-3 left-3 z-[500] bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-md border border-slate-200/50 w-56 space-y-2">
          <p className="text-[10px] text-slate-400 font-medium leading-snug">
            {t.filterHint}
          </p>
          {REPORT_STATUSES.map((status) => {
            const active = activeStatuses.has(status);
            const color = getStatusColor(status);
            return (
              <div key={status} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleStatus(status)}
                  className={`flex-1 flex items-center space-x-2 text-left rounded-lg px-2 py-1.5 transition cursor-pointer ${active
                    ? "bg-slate-50 ring-1 ring-slate-200"
                    : "opacity-40 hover:opacity-60"
                    }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs font-medium text-slate-700 truncate">
                    {getStatusLabel(status, language)}
                  </span>
                  <span className="text-xs font-bold text-slate-500 ml-auto">
                    {statusCounts[status] ?? 0}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => showOnlyStatus(status)}
                  title={
                    language === "th"
                      ? `แสดงเฉพาะ${status}`
                      : `Show only ${getStatusLabel(status, language)}`
                  }
                  className="text-[9px] font-bold text-slate-400 hover:text-blue-600 px-1.5 py-1 rounded border border-slate-200 hover:border-blue-200 transition cursor-pointer shrink-0"
                >
                  {language === "th" ? "เฉพาะ" : "Only"}
                </button>
              </div>
            );
          })}
          {!allActive && (
            <button
              type="button"
              onClick={resetFilters}
              className="w-full text-[10px] font-bold text-blue-600 hover:text-blue-800 pt-1 cursor-pointer"
            >
              {t.showAll}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function IncidentStatusMapLoading({
  heightClass = "h-80",
}: {
  heightClass?: string;
}) {
  return (
    <div
      className={`${heightClass} bg-slate-100 flex items-center justify-center`}
    >
      <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
    </div>
  );
}