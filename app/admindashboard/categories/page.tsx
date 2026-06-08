"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PlusCircle, Trash2, Loader2 } from "lucide-react";
import { ICON_MAP } from "@/app/lib/icons";
import type { Category } from "@/app/lib/types";
import { useSettings } from "@/app/components/SettingsProvider";

export default function CategoriesPage() {
    const { darkMode, largeText, language } = useSettings();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const t = {
        title: language === "th" ? "จัดการหมวดหมู่ปัญหา" : "Issue Categories",
        subtitle: language === "th" ? "จัดการการเปิด/ปิดใช้งาน และลบหมวดหมู่บริการแจ้งปัญหา" : "Manage utility services, visibility, and deletion.",
        confirmDelete: language === "th" ? "ลบ?" : "Delete?",
        confirmBtn: language === "th" ? "ยืนยัน" : "Confirm",
        cancelBtn: language === "th" ? "ยกเลิก" : "Cancel",
        deleteTooltip: language === "th" ? "ลบหมวดหมู่" : "Delete Category",
        noCategories: language === "th" ? "ยังไม่มีหมวดหมู่บริการ" : "No categories created yet",
        noCategoriesDesc: language === "th" ? "กดปุ่มด้านล่างเพื่อเพิ่มหมวดหมู่ใหม่" : "Click the button below to add a new category",
        addCategoryBtn: language === "th" ? "เพิ่มหมวดหมู่ใหม่" : "Add New Category",
        addCategoryDesc: language === "th" ? "สร้างหมวดหมู่หลักและหมวดหมู่ย่อย" : "Create new main category and subcategories",
        loading: language === "th" ? "กำลังโหลดข้อมูลหมวดหมู่..." : "Loading categories...",
    };

    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch("/api/categories");
            const data = await res.json();
            setCategories(data);
        } catch (err) {
            console.error("Failed to fetch categories:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // Toggle enabled state
    const toggleService = async (id: string) => {
        const cat = categories.find((c) => c.id === id);
        if (!cat) return;

        // Optimistic update
        setCategories((prev) =>
            prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
        );

        try {
            await fetch("/api/categories", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, enabled: !cat.enabled }),
            });
        } catch {
            // Rollback on error
            setCategories((prev) =>
                prev.map((c) => (c.id === id ? { ...c, enabled: cat.enabled } : c))
            );
        }
    };

    // Delete category 💣
    const deleteCategory = async (id: string) => {
        setDeletingId(id);
        try {
            await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
            setCategories((prev) => prev.filter((c) => c.id !== id));
        } catch (err) {
            console.error("Failed to delete:", err);
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-2">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-xs text-slate-500">{t.loading}</p>
            </div>
        );
    }

    return (
        <div className="mx-auto space-y-6">
            <div>
                <h1 className={`font-bold transition-colors ${largeText ? 'text-3xl' : 'text-2xl'} ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                    {t.title}
                </h1>
                <p className={`text-slate-500 transition-colors ${largeText ? 'text-base' : 'text-sm'}`}>
                    {t.subtitle}
                </p>
            </div>

            <div className="space-y-3">
                {categories.map((service) => {
                    const IconComponent = ICON_MAP[service.iconName];
                    const isConfirming = confirmDeleteId === service.id;
                    const isDeleting = deletingId === service.id;

                    return (
                        <div
                            key={service.id}
                            className={`rounded-2xl border shadow-sm p-4 transition-all duration-300 ${service.enabled
                                ? darkMode
                                    ? "bg-slate-800 border-slate-700 text-white"
                                    : "bg-white border-slate-200 text-slate-850"
                                : darkMode
                                    ? "bg-slate-800/40 border-slate-800 opacity-60 text-slate-400"
                                    : "bg-white border-slate-100 opacity-60"
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div
                                        className="w-14 h-14 rounded-xl flex items-center justify-center shadow-inner transition-colors"
                                        style={{
                                            backgroundColor: service.color + "20",
                                            color: service.color,
                                        }}
                                    >
                                        {IconComponent && <IconComponent className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h3 className={`font-bold transition-colors ${largeText ? 'text-lg' : 'text-base'} ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                                            {service.title}
                                        </h3>
                                        <p className="text-xs text-slate-500 font-medium">
                                            {service.subtitle}
                                        </p>
                                        {service.subcategories.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {service.subcategories.map((sub, i) => (
                                                    <span
                                                        key={i}
                                                        className="text-[10px] font-semibold px-2.5 py-1 rounded-full animate-[fadeIn_200ms_ease-out]"
                                                        style={{
                                                            backgroundColor: service.color + "12",
                                                            color: service.color,
                                                        }}
                                                    >
                                                        {sub}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    {/* Delete Button */}
                                    {isConfirming ? (
                                        <div className="flex items-center space-x-2 animate-[fadeIn_200ms_ease-out]">
                                            <span className="text-xs text-red-500 font-semibold">
                                                {t.confirmDelete}
                                            </span>
                                            <button
                                                onClick={() => deleteCategory(service.id)}
                                                disabled={isDeleting}
                                                className="px-3 py-1.5 rounded-lg border border-red-500 bg-transparent text-red-600 text-xs font-bold hover:bg-red-600 hover:text-white transition disabled:opacity-50 cursor-pointer"
                                            >
                                                {isDeleting ? (
                                                    <Loader2 className="w-3 h-3 animate-spin " />
                                                ) : (
                                                    t.confirmBtn
                                                )}
                                            </button>
                                            <button
                                                onClick={() => setConfirmDeleteId(null)}
                                                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
                                            >
                                                {t.cancelBtn}
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmDeleteId(service.id)}
                                            className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50/50 transition cursor-pointer"
                                            title={t.deleteTooltip}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}

                                    {/* Toggle Switch */}
                                    <label className="relative inline-flex items-center cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={service.enabled}
                                            onChange={() => toggleService(service.id)}
                                            className="sr-only peer"
                                        />
                                        <div className={`w-14 h-7 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${darkMode
                                            ? 'bg-slate-700 peer-checked:bg-blue-600'
                                            : 'bg-slate-200 peer-checked:bg-[#0066B2]'
                                            }`} />
                                    </label>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {categories.length === 0 && (
                    <div className={`text-center py-12 rounded-2xl border border-dashed transition-colors ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <p className={`text-slate-400 ${largeText ? 'text-base' : 'text-sm'}`}>{t.noCategories}</p>
                        <p className="text-slate-300 text-xs mt-1">
                            {t.noCategoriesDesc}
                        </p>
                    </div>
                )}
            </div>

            <Link
                href="/admindashboard/categories/new"
                className={`w-full font-bold text-sm py-4 rounded-xl transition duration-200 flex items-center justify-center space-x-2 shadow-md active:scale-[0.99] cursor-pointer ${darkMode
                    ? 'bg-sky-600 hover:bg-sky-500 text-white'
                    : 'bg-[#0F172A] hover:bg-slate-800 text-white'
                    }`}
            >
                <PlusCircle className="w-5 h-5" />
                <div className="text-left">
                    <p className={`font-bold leading-none ${largeText ? 'text-base' : 'text-sm'}`}>{t.addCategoryBtn}</p>
                    <p className={`text-[10px] font-normal mt-1 leading-none ${darkMode ? 'text-slate-200' : 'text-slate-300'}`}>
                        {t.addCategoryDesc}
                    </p>
                </div>
            </Link>

            <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
        </div>
    );
}