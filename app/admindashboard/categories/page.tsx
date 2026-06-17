"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PlusCircle, Trash2, Loader2, Pencil, X, Plus, Save } from "lucide-react";
import { ICON_MAP } from "@/app/lib/icons";
import type { Category } from "@/app/lib/types";
import { useSettings } from "@/app/components/SettingsProvider";

const PRESET_COLORS = [
    "#EF4444", "#F59E0B", "#F97316", "#84CC16",
    "#22C55E", "#10B981", "#14B8A6", "#06B6D4",
    "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7",
    "#D946EF", "#EC4899", "#F43F5E", "#64748B",
];

export default function CategoriesPage() {
    const { darkMode, largeText, language } = useSettings();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    // Edit modal state
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editSubtitle, setEditSubtitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editColor, setEditColor] = useState("");
    const [editSubcategories, setEditSubcategories] = useState<string[]>([]);
    const [editNewSub, setEditNewSub] = useState("");
    const [savingEdit, setSavingEdit] = useState(false);
    const [editError, setEditError] = useState("");

    const t = {
        title: language === "th" ? "จัดการหมวดหมู่ปัญหา" : "Issue Categories",
        subtitle: language === "th" ? "จัดการการเปิด/ปิดใช้งาน แก้ไข และลบหมวดหมู่บริการแจ้งปัญหา" : "Manage utility services, visibility, editing, and deletion.",
        confirmDelete: language === "th" ? "ลบ?" : "Delete?",
        confirmBtn: language === "th" ? "ยืนยัน" : "Confirm",
        cancelBtn: language === "th" ? "ยกเลิก" : "Cancel",
        deleteTooltip: language === "th" ? "ลบหมวดหมู่" : "Delete Category",
        editTooltip: language === "th" ? "แก้ไขหมวดหมู่" : "Edit Category",
        noCategories: language === "th" ? "ยังไม่มีหมวดหมู่บริการ" : "No categories created yet",
        noCategoriesDesc: language === "th" ? "กดปุ่มด้านล่างเพื่อเพิ่มหมวดหมู่ใหม่" : "Click the button below to add a new category",
        addCategoryBtn: language === "th" ? "เพิ่มหมวดหมู่ใหม่" : "Add New Category",
        addCategoryDesc: language === "th" ? "สร้างหมวดหมู่หลักและหมวดหมู่ย่อย" : "Create new main category and subcategories",
        loading: language === "th" ? "กำลังโหลดข้อมูลหมวดหมู่..." : "Loading categories...",
        editModalTitle: language === "th" ? "แก้ไขหมวดหมู่" : "Edit Category",
        titleLabel: language === "th" ? "ชื่อภาษาอังกฤษ (Title)" : "English Title",
        subtitleLabel: language === "th" ? "ชื่อภาษาไทย (Subtitle)" : "Thai Subtitle",
        descLabel: language === "th" ? "คำอธิบาย" : "Description",
        colorLabel: language === "th" ? "สีประจำหมวด" : "Category Color",
        subcatLabel: language === "th" ? "หมวดหมู่ย่อย" : "Subcategories",
        addSubPlaceholder: language === "th" ? "พิมพ์แล้วกด Enter..." : "Type and press Enter...",
        saveBtn: language === "th" ? "บันทึกการแก้ไข" : "Save Changes",
        addOther: language === "th" ? "เพิ่ม \"อื่นๆ\" อัตโนมัติ (แนะนำ)" : "Add \"Other\" (recommended)",
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

    useEffect(() => {
        if (editingCategory) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [editingCategory]);

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

    // Delete category
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

    // Open edit modal
    const openEditModal = (cat: Category) => {
        setEditingCategory(cat);
        setEditTitle(cat.title);
        setEditSubtitle(cat.subtitle || "");
        setEditDescription(cat.description || "");
        setEditColor(cat.color);
        setEditSubcategories([...(cat.subcategories || [])]);
        setEditNewSub("");
        setEditError("");
    };

    const closeEditModal = () => {
        setEditingCategory(null);
        setEditError("");
    };

    const addEditSub = () => {
        const trimmed = editNewSub.trim();
        if (trimmed && !editSubcategories.includes(trimmed)) {
            setEditSubcategories((prev) => [...prev, trimmed]);
            setEditNewSub("");
        }
    };

    const removeEditSub = (idx: number) => {
        setEditSubcategories((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleSaveEdit = async () => {
        if (!editingCategory || !editTitle.trim()) {
            setEditError("กรุณากรอกชื่อหมวดหมู่ (Title)");
            return;
        }

        setSavingEdit(true);
        try {
            const res = await fetch("/api/categories", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editingCategory.id,
                    title: editTitle.trim(),
                    subtitle: editSubtitle.trim(),
                    description: editDescription.trim(),
                    color: editColor,
                    subcategories: editSubcategories,
                }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setEditError(body.error || "เกิดข้อผิดพลาดในการบันทึก");
                return;
            }

            const updated = await res.json();
            setCategories((prev) =>
                prev.map((c) =>
                    c.id === editingCategory.id
                        ? { ...c, ...updated, iconName: updated.icon_name || c.iconName }
                        : c
                )
            );
            closeEditModal();
        } catch {
            setEditError("เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่อีกครั้ง");
        } finally {
            setSavingEdit(false);
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
                                <div className="flex items-center space-x-4 min-w-0">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner transition-colors shrink-0"
                                        style={{
                                            backgroundColor: service.color + "20",
                                            color: service.color,
                                        }}
                                    >
                                        {IconComponent && <IconComponent className="w-6 h-6" />}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className={`font-bold transition-colors truncate ${largeText ? 'text-lg' : 'text-base'} ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                                            {service.title}
                                        </h3>
                                        <p className="text-xs text-slate-500 font-medium">
                                            {service.subtitle}
                                        </p>
                                        {service.subcategories.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                {service.subcategories.map((sub, i) => (
                                                    <span
                                                        key={i}
                                                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full animate-[fadeIn_200ms_ease-out]"
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

                                <div className="flex items-center space-x-2 shrink-0 ml-3">
                                    {/* Edit Button */}
                                    <button
                                        onClick={() => openEditModal(service)}
                                        className="p-2 rounded-xl text-slate-300 hover:text-blue-500 hover:bg-blue-50/50 transition cursor-pointer"
                                        title={t.editTooltip}
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>

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
                                            <Trash2 className="w-4 h-4" />
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

            {/* Edit Modal */}
            {editingCategory && (
                <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 overflow-y-auto">
                    <div
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
                        onClick={closeEditModal}
                    />
                    <div className="relative bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 z-10 my-8 space-y-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-800">{t.editModalTitle}</h3>
                            <button
                                onClick={closeEditModal}
                                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {editError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold">
                                {editError}
                            </div>
                        )}

                        {/* Title + Subtitle */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.titleLabel} <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.subtitleLabel}</label>
                                <input
                                    type="text"
                                    value={editSubtitle}
                                    onChange={(e) => setEditSubtitle(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.descLabel}</label>
                            <textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none resize-none"
                            />
                        </div>

                        {/* Color */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.colorLabel}</label>
                            <div className="flex flex-wrap gap-2 items-center">
                                {PRESET_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setEditColor(color)}
                                        className="w-8 h-8 rounded-full transition-all duration-150 hover:scale-110 shadow-sm active:scale-90 flex items-center justify-center"
                                        style={{
                                            backgroundColor: color,
                                            boxShadow: editColor === color ? `0 0 0 2px white, 0 0 0 4px ${color}` : undefined,
                                        }}
                                    >
                                        {editColor === color && (
                                            <svg className="w-3.5 h-3.5 text-white drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                                <div className="relative flex items-center">
                                    <button
                                        type="button"
                                        className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition"
                                    >
                                        <div className="w-3.5 h-3.5 rounded-full border border-slate-300" style={{ backgroundColor: editColor }} />
                                        เลือกเอง
                                    </button>
                                    <input
                                        type="color"
                                        value={editColor}
                                        onChange={(e) => setEditColor(e.target.value)}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Subcategories */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.subcatLabel}</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={editNewSub}
                                    onChange={(e) => setEditNewSub(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addEditSub(); } }}
                                    placeholder={t.addSubPlaceholder}
                                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={addEditSub}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition hover:opacity-90 active:scale-95"
                                    style={{ backgroundColor: editColor }}
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Quick-add อื่นๆ */}
                            {!editSubcategories.includes("อื่นๆ") && !editSubcategories.includes("Other") && (
                                <button
                                    type="button"
                                    onClick={() => setEditSubcategories((prev) => [...prev, "อื่นๆ"])}
                                    className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-xl border border-dashed border-slate-300 text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition cursor-pointer"
                                >
                                    <Plus className="w-3 h-3" />
                                    {t.addOther}
                                </button>
                            )}

                            {editSubcategories.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {editSubcategories.map((sub, i) => (
                                        <span
                                            key={i}
                                            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition shadow-sm"
                                            style={{
                                                backgroundColor: editColor + "15",
                                                color: editColor,
                                                border: `1px solid ${editColor}30`,
                                            }}
                                        >
                                            {sub}
                                            <button
                                                type="button"
                                                onClick={() => removeEditSub(i)}
                                                className="hover:bg-black/10 rounded-full p-0.5 transition"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={closeEditModal}
                                className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                            >
                                {t.cancelBtn}
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={savingEdit || !editTitle.trim()}
                                className="flex-1 py-3 rounded-xl text-white text-sm font-bold transition shadow-md hover:opacity-90 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                                style={{ backgroundColor: editColor }}
                            >
                                {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {t.saveBtn}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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