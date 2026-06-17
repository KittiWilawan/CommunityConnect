"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation, Loader2, Search } from "lucide-react";
import {
  BANGKOK_BOUNDS,
  BANGKOK_CENTER,
  clampToBangkok,
  isWithinBangkok,
} from "@/app/lib/bangkok-bounds";
import { useSettings } from "@/app/components/SettingsProvider";

export interface LocationValue {
  latitude: number;
  longitude: number;
  address?: string;
}

interface BangkokLocationPickerProps {
  value: LocationValue | null;
  onChange: (location: LocationValue) => void;
  language?: "th" | "en";
  className?: string;
}

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

const LEAFLET_MAX_BOUNDS: L.LatLngBoundsExpression = [
  [BANGKOK_BOUNDS.south, BANGKOK_BOUNDS.west],
  [BANGKOK_BOUNDS.north, BANGKOK_BOUNDS.east],
];

async function reverseGeocode(
  lat: number,
  lng: number,
  language: "th" | "en"
): Promise<string | undefined> {
  try {
    const res = await fetch(
      `/api/geocode?type=reverse&lat=${lat}&lon=${lng}&lang=${language}`
    );
    if (!res.ok) return undefined;
    const data = await res.json();
    return data.display_name as string | undefined;
  } catch {
    return undefined;
  }
}

async function searchPlaces(
  query: string,
  language: "th" | "en"
): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `/api/geocode?type=search&q=${encodeURIComponent(query)}&lang=${language}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default function BangkokLocationPicker({
  value,
  onChange,
  language = "th",
  className = "",
}: BangkokLocationPickerProps) {
  const { darkMode } = useSettings();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const geocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [address, setAddress] = useState(value?.address ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);
  onChangeRef.current = onChange;

  const t = {
    issueLoc: language === "th" ? "ตำแหน่งที่เกิดปัญหา" : "Issue Location",
    currentLoc: language === "th" ? "ตำแหน่งปัจจุบัน" : "Current Location",
    searchPlaceholder:
      language === "th" ? "ค้นหาสถานที่ในกรุงเทพฯ..." : "Search places in Bangkok...",
    noResults:
      language === "th" ? "ไม่พบสถานที่" : "No places found",
    dragHint:
      language === "th"
        ? "เลื่อนแผนที่เพื่อปักหมุดตำแหน่ง"
        : "Drag the map to set the pin",
    bangkokOnly:
      language === "th"
        ? "เลือกตำแหน่งได้เฉพาะในเขตกรุงเทพมหานคร"
        : "Location must be within Bangkok",
    outsideBangkok:
      language === "th"
        ? "ตำแหน่งอยู่นอกเขตกรุงเทพมหานคร"
        : "Location is outside Bangkok",
    locating: language === "th" ? "กำลังค้นหาตำแหน่ง..." : "Finding location...",
  };

  const overlayClass = darkMode
    ? "bg-slate-800/95 border-slate-600 text-slate-100"
    : "bg-white/95 border-slate-200 text-slate-700";

  const hintMutedClass = darkMode ? "text-slate-400" : "text-slate-400";
  const addressClass = darkMode ? "text-slate-200" : "text-slate-600";

  const emitLocation = useCallback(
    (lat: number, lng: number, addr?: string) => {
      onChangeRef.current({
        latitude: lat,
        longitude: lng,
        address: addr,
      });
    },
    []
  );

  const scheduleGeocode = useCallback(
    (lat: number, lng: number) => {
      if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
      setGeocoding(true);
      geocodeTimerRef.current = setTimeout(async () => {
        const addr = await reverseGeocode(lat, lng, language);
        setAddress(addr ?? "");
        emitLocation(lat, lng, addr);
        setGeocoding(false);
      }, 500);
    },
    [emitLocation, language]
  );

  const updateFromCenter = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const center = map.getCenter();
    const { lat, lng } = clampToBangkok(center.lat, center.lng);
    if (!isWithinBangkok(center.lat, center.lng)) {
      map.panTo([lat, lng], { animate: true });
    }
    scheduleGeocode(lat, lng);
  }, [scheduleGeocode]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      setShowResults(false);
      return;
    }

    setSearching(true);
    setShowResults(true);
    searchTimerRef.current = setTimeout(async () => {
      const results = await searchPlaces(query.trim(), language);
      setSearchResults(results);
      setSearching(false);
    }, 600);
  };

  const handleSelectResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const { lat: clampedLat, lng: clampedLng } = clampToBangkok(lat, lng);

    const map = mapRef.current;
    if (map) {
      map.setView([clampedLat, clampedLng], 16, { animate: true });
    }

    setAddress(result.display_name);
    emitLocation(clampedLat, clampedLng, result.display_name);
    setSearchQuery(result.display_name);
    setShowResults(false);
    setSearchResults([]);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: value
        ? [value.latitude, value.longitude]
        : [BANGKOK_CENTER.lat, BANGKOK_CENTER.lng],
      zoom: 15,
      minZoom: 11,
      maxZoom: 18,
      maxBounds: LEAFLET_MAX_BOUNDS,
      maxBoundsViscosity: 1,
      zoomControl: false,
      scrollWheelZoom: false,
      dragging: false,
      touchZoom: false,
      doubleClickZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    }).addTo(map);

    L.control.zoom({ position: "bottomleft" }).addTo(map);

    map.on("moveend", updateFromCenter);

    mapRef.current = map;

    const initial = value
      ? { lat: value.latitude, lng: value.longitude }
      : BANGKOK_CENTER;
    scheduleGeocode(initial.lat, initial.lng);

    return () => {
      if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (isInteractive) {
      map.dragging?.enable();
      map.scrollWheelZoom?.enable();
      map.touchZoom?.enable();
      map.doubleClickZoom?.enable();
    } else {
      map.dragging?.disable();
      map.scrollWheelZoom?.disable();
      map.touchZoom?.disable();
      map.doubleClickZoom?.disable();
    }
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [isInteractive]);

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(
        language === "th"
          ? "เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง"
          : "Geolocation is not supported"
      );
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { lat, lng } = clampToBangkok(pos.coords.latitude, pos.coords.longitude);
        const map = mapRef.current;
        if (map) {
          map.setView([lat, lng], 16, { animate: true });
        }
        if (!isWithinBangkok(pos.coords.latitude, pos.coords.longitude)) {
          alert(t.outsideBangkok);
        }
        setLocating(false);
      },
      () => {
        alert(
          language === "th"
            ? "ไม่สามารถระบุตำแหน่งได้ กรุณาอนุญาตการเข้าถึงตำแหน่ง"
            : "Could not get location. Please allow location access."
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div 
      className={`relative ${className}`}
      onMouseLeave={() => setIsInteractive(false)}
      onClick={() => setIsInteractive(true)}
      onTouchStart={() => setIsInteractive(true)}
    >
      <div
        className={`rounded-2xl h-64 relative overflow-hidden border shadow-inner ${
          darkMode ? "border-slate-600" : "border-slate-200"
        }`}
      >
        <div ref={mapContainerRef} className="absolute inset-0 z-0" />

        {!isInteractive && (
          <div className="absolute inset-0 z-[350] flex flex-col items-center justify-end pb-6 pointer-events-none">
            <div className="bg-slate-800/80 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-sm backdrop-blur-sm animate-pulse">
              {language === "th" ? "แตะเพื่อเลื่อนแผนที่" : "Tap to interact"}
            </div>
          </div>
        )}




        <div className="absolute inset-0 z-[400] pointer-events-none flex items-center justify-center">
          <div className="relative -mt-8">
            <MapPin className="w-10 h-10 text-[#C92A2A] drop-shadow-lg fill-[#C92A2A]/20" />
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-3 h-1.5 bg-black/20 rounded-full blur-[2px]" />
          </div>
        </div>

        <div
          ref={searchContainerRef}
          className="absolute top-3 left-3 right-3 md:w-96 md:max-w-full z-[500]"
        >

          <div
            className={`flex items-center rounded-xl shadow-sm border backdrop-blur-sm overflow-hidden ${overlayClass}`}
          >

            <span className="pl-3 pr-1 shrink-0">
              <MapPin className="w-4 h-4 text-[#C92A2A]" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setShowResults(true);
              }}
              placeholder={t.searchPlaceholder}
              className={`flex-1 py-2 pr-3 text-xs font-medium bg-transparent border-0 outline-none placeholder:font-normal ${darkMode
                ? "text-slate-100 placeholder:text-slate-400"
                : "text-slate-800 placeholder:text-slate-400"
                }`}
            />

            {searching && (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-3 shrink-0 text-slate-400" />
            )}
            {!searching && searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setShowResults(false);
                }}
                className={`mr-2 p-1 rounded-md text-[10px] font-bold ${darkMode
                  ? "text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  }`}
              >
                ✕
              </button>
            )}
          </div>

          {showResults && searchQuery.trim().length >= 2 && (
            <div
              className={`mt-1 rounded-xl shadow-lg border overflow-hidden max-h-40 overflow-y-auto ${darkMode
                ? "bg-slate-800 border-slate-600"
                : "bg-white border-slate-200"
                }`}
            >
              {searching ? (
                <div
                  className={`px-3 py-2.5 text-xs flex items-center gap-2 ${darkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {language === "th" ? "กำลังค้นหา..." : "Searching..."}
                </div>
              ) : searchResults.length === 0 ? (
                <div
                  className={`px-3 py-2.5 text-xs ${darkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                >
                  {t.noResults}
                </div>
              ) : (
                searchResults.map((result) => (
                  <button
                    key={result.place_id}
                    type="button"
                    onClick={() => handleSelectResult(result)}
                    className={`w-full text-left px-3 py-2.5 text-xs leading-relaxed border-b last:border-b-0 transition cursor-pointer ${darkMode
                      ? "text-slate-200 hover:bg-slate-700 border-slate-700"
                      : "text-slate-700 hover:bg-slate-50 border-slate-100"
                      }`}
                  >
                    <span className="flex items-start gap-2">
                      <Search className="w-3 h-3 mt-0.5 shrink-0 text-[#C92A2A]" />
                      <span className="line-clamp-2">{result.display_name}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div
          className={`absolute bottom-14 right-3 z-[500] backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-sm border text-[10px] font-medium ${darkMode
            ? "bg-slate-800/90 border-slate-600 text-slate-300"
            : "bg-white/90 border-slate-200 text-slate-500"
            }`}
        >
          {t.bangkokOnly}
        </div>

        <button
          type="button"
          onClick={handleCurrentLocation}
          disabled={locating}
          className={`absolute bottom-3 right-3 z-[500] px-3 py-2 rounded-lg shadow-md flex items-center space-x-1.5 text-xs font-semibold transition active:scale-95 cursor-pointer disabled:opacity-70 ${darkMode
            ? "bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600"
            : "bg-[#0F172A] hover:bg-slate-800 text-white"
            }`}
        >
          {locating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Navigation className={`w-3.5 h-3.5 ${darkMode ? "" : "fill-white"}`} />
          )}
          <span>{locating ? t.locating : t.currentLoc}</span>
        </button>
      </div>

      <div className="mt-2 px-1">
        <p className={`text-[11px] font-medium ${hintMutedClass}`}>{t.dragHint}</p>
        {(address || geocoding) && (
          <p className={`text-xs mt-1 leading-relaxed line-clamp-2 ${addressClass}`}>
            {geocoding ? (
              <span className={`inline-flex items-center gap-1.5 ${hintMutedClass}`}>
                <Loader2 className="w-3 h-3 animate-spin" />
                {language === "th" ? "กำลังค้นหาที่อยู่..." : "Looking up address..."}
              </span>
            ) : (
              address
            )}
          </p>
        )}
      </div>
    </div>
  );
}
