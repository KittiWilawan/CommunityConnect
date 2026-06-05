"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Maximize2, Loader2 } from "lucide-react";
import CategoryCard from "@/app/components/categorycard";
import { ICON_MAP } from "@/app/lib/icons";
import type { Category } from "@/app/lib/types";
import { useSettings } from "@/app/components/SettingsProvider";

export default function DashboardPage() {
  const router = useRouter();
  const { language } = useSettings();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories?enabled=true");
      if (!res.ok) {
        throw new Error(`Failed to fetch categories: ${res.statusText}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        console.error("Categories data is not an array:", data);
        setCategories([]);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSelectCategory = (id: string) => {
    router.push(`/reportissue?category=${id}`);
  };

  const t = {
    welcome: language === "th" ? "ยินดีต้อนรับกลับมา" : "Welcome Back",
    subWelcome: language === "th" ? "เลือกประเภทบริการที่คุณต้องการแจ้งปัญหาหรือตรวจสอบสถานะ" : "Select a service category to report an issue or check status",
    noCategory: language === "th" ? "ยังไม่มีหมวดหมู่ที่เปิดใช้งาน" : "No active service categories",
    addCategory: language === "th" ? "ไปที่หน้า Issue Categories เพื่อเพิ่มหรือเปิดใช้งานหมวดหมู่" : "Go to Issue Categories to add or enable categories",
    mapTitle: language === "th" ? "แผนที่สถานะเรียลไทม์" : "Real-time Status Map",
    mapDesc: language === "th" ? "ตรวจสอบจุดที่กำลังดำเนินการซ่อมแซมใกล้คุณ" : "Check active repair spots near you",
    expandMap: language === "th" ? "ขยายแผนที่" : "Maximize Map",
    urgentRepairs: language === "th" ? "จุดซ่อมแซมเร่งด่วน" : "Urgent Repair Spots",
    inProgress: language === "th" ? "กำลังดำเนินการ" : "In Progress",
    recentHistory: language === "th" ? "ประวัติล่าสุด" : "Recent History",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A]">
          {t.welcome}
        </h1>
        <p className="text-slate-500 mt-1.5">
          {t.subWelcome}
        </p>
      </div>

      {loading ? (
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
                onClick={() => handleSelectCategory(cat.id)}
              />
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
          <p className="text-slate-400 text-sm">
            {t.noCategory}
          </p>
          <p className="text-slate-300 text-xs mt-1">
            {t.addCategory}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 flex items-center justify-between border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-[#0F172A]">
                {t.mapTitle}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {t.mapDesc}
              </p>
            </div>
            <button className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer">
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{t.expandMap}</span>
            </button>
          </div>
          <div className="h-64 bg-slate-100 relative p-4 flex flex-col justify-end">
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] bg-slate-200" />
            <div className="relative bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-md border border-slate-200/50 w-56 space-y-2 text-xs font-medium">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-red-600 rounded-full" />
                <span className="text-slate-700">
                  {t.urgentRepairs} (0)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                <span className="text-slate-700">{t.inProgress} (0)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between relative">
          <div>
            <h3 className="text-lg font-bold text-[#0F172A] mb-4">
              {t.recentHistory}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}