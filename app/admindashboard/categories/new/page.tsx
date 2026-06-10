"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Search, X, Save, AlertCircle } from "lucide-react";
import { ICON_MAP, ICON_NAMES } from "@/app/lib/icons";
import CategoryCard from "@/app/components/categorycard";
import { useSettings } from "@/app/components/SettingsProvider";

const PRESET_COLORS = [
    "#EF4444", "#F59E0B", "#F97316", "#84CC16",
    "#22C55E", "#10B981", "#14B8A6", "#06B6D4",
    "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7",
    "#D946EF", "#EC4899", "#F43F5E", "#64748B",
];

export default function NewCategoryPage() {
    const router = useRouter();
    const { darkMode } = useSettings();
    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedIcon, setSelectedIcon] = useState("Zap");
    const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[8]); // Default to blue
    const [customColor, setCustomColor] = useState("");
    const [subcategories, setSubcategories] = useState<string[]>([]);
    const [newSubcategory, setNewSubcategory] = useState("");
    const [iconSearch, setIconSearch] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const activeColor = customColor || selectedColor;

    const filteredIcons = ICON_NAMES.filter((name) =>
        name.toLowerCase().includes(iconSearch.toLowerCase())
    );

    const addSubcategory = () => {
        const trimmed = newSubcategory.trim();
        if (trimmed && !subcategories.includes(trimmed)) {
            setSubcategories([...subcategories, trimmed]);
            setNewSubcategory("");
        }
    };

    const removeSubcategory = (index: number) => {
        setSubcategories(subcategories.filter((_, i) => i !== index));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            setError("กรุณากรอกชื่อหมวดหมู่ (Title)");
            return;
        }
        setError("");
        setSaving(true);

        try {
            const res = await fetch("/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    subtitle: subtitle.trim(),
                    description: description.trim(),
                    iconName: selectedIcon,
                    color: activeColor,
                    subcategories,
                }),
            });

            if (!res.ok) {
                throw new Error("Failed to save category");
            }

            router.push("/admindashboard/categories");
            router.refresh();
        } catch (err) {
            console.error(err);
            setError("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
        } finally {
            setSaving(false);
        }
    };

    // Preview properties
    const PreviewIcon = ICON_MAP[selectedIcon];

    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 md:px-0">
            {/* Header Navigation */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Link
                        href="/admindashboard/categories"
                        className={`p-2 rounded-xl border transition shadow-sm active:scale-95 ${darkMode ? "bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-[#0F172A]"}`}>สร้างหมวดหมู่ใหม่</h1>
                        <p className={`text-xs font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Add New Custom Issue Category</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="flex items-center space-x-2 bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600 animate-[fadeIn_200ms_ease-out]">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Main Grid split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Form Column */}
                <form onSubmit={handleSave} className={`lg:col-span-7 rounded-3xl border shadow-sm p-4 sm:p-6 md:p-8 space-y-6 ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>

                    {/* Title & Subtitle */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                ชื่อภาษาอังกฤษ (Title) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Electricity, Water"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition bg-white placeholder:text-slate-300 font-medium text-slate-800"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                ชื่อภาษาไทย (Subtitle)
                            </label>
                            <input
                                type="text"
                                value={subtitle}
                                onChange={(e) => setSubtitle(e.target.value)}
                                placeholder="e.g. ไฟฟ้า, น้ำประปา"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition bg-white placeholder:text-slate-300 font-medium text-slate-800"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            คำอธิบาย (Description)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="แจ้งเหตุไฟฟ้าขัดข้อง ไฟทางดับ หรือหม้อแปลงมีปัญหา..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition bg-white resize-none placeholder:text-slate-300 text-slate-800"
                        />
                    </div>

                    {/* Icon Selector */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            เลือกไอคอน (Icon)
                        </label>
                        <div className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition">
                            <Search className="w-4 h-4 text-slate-400 shrink-0" />
                            <input
                                type="text"
                                value={iconSearch}
                                onChange={(e) => setIconSearch(e.target.value)}
                                placeholder="ค้นหาไอคอน..."
                                className="flex-1 bg-transparent text-sm outline-none focus:outline-none text-slate-800 placeholder:text-slate-300"
                            />
                        </div>
                        <div
                            className={`grid gap-2.5 p-3 rounded-2xl border max-h-60 overflow-y-auto ${darkMode ? "border-slate-600 bg-slate-900/50" : "border-slate-200 bg-slate-50/40"}`}
                            style={{ gridTemplateColumns: "repeat(auto-fill, 3rem)" }}
                        >
                            {filteredIcons.map((name) => {
                                const Icon = ICON_MAP[name];
                                const isSelected = selectedIcon === name;
                                const iconColor = isSelected
                                    ? activeColor
                                    : darkMode
                                        ? "#94a3b8"
                                        : "#475569";
                                return (
                                    <button
                                        key={name}
                                        type="button"
                                        onClick={() => setSelectedIcon(name)}
                                        title={name}
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 border-2 ${isSelected
                                                ? darkMode ? "bg-slate-800 shadow-md scale-105" : "bg-white shadow-md scale-105"
                                                : darkMode
                                                    ? "bg-slate-700/60 border-transparent hover:bg-slate-600 hover:scale-105 active:scale-95"
                                                    : "bg-slate-50 border-transparent hover:bg-slate-100 hover:scale-105 active:scale-95"
                                            }`}
                                        style={
                                            isSelected
                                                ? { borderColor: activeColor }
                                                : undefined
                                        }
                                    >
                                        <span className="icon-themed" style={{ ["--icon-themed-color" as string]: iconColor }}>
                                            <Icon className="w-5 h-5" />
                                        </span>
                                    </button>
                                );
                            })}
                            {filteredIcons.length === 0 && (
                                <p className="col-span-full text-center py-8 text-xs text-slate-400 font-medium">
                                    ไม่พบไอคอนที่ค้นหา
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Color Selector */}
                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            เลือกสีประจำหมวดหมู่ (Color Theme)
                        </label>
                        <div className="flex flex-wrap gap-2.5">
                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => {
                                        setSelectedColor(color);
                                        setCustomColor("");
                                    }}
                                    className="w-9 h-9 rounded-full transition-all duration-150 flex items-center justify-center hover:scale-110 shadow-sm active:scale-90"
                                    style={{
                                        backgroundColor: color,
                                        boxShadow:
                                            selectedColor === color && !customColor
                                                ? `0 0 0 3px white, 0 0 0 5px ${color}`
                                                : "none",
                                    }}
                                >
                                    {selectedColor === color && !customColor && (
                                        <svg
                                            className="w-4 h-4 text-white drop-shadow-sm"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={3.5}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-3 items-center pt-2">
                            <div className="flex items-center space-x-2">
                                <span className="text-xs text-slate-400 font-bold uppercase shrink-0">หรือใส่รหัสสีเอง</span>
                                <div className="relative flex items-center">
                                    <input
                                        type="text"
                                        value={customColor}
                                        onChange={(e) => setCustomColor(e.target.value)}
                                        placeholder="#HEX"
                                        maxLength={7}
                                        className="w-28 px-3 py-2 rounded-xl border border-slate-200 text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition placeholder:text-slate-300 text-slate-800"
                                    />
                                    {customColor.match(/^#[0-9A-Fa-f]{6}$/) && (
                                        <div
                                            className="absolute right-2 w-4 h-4 rounded-full border border-slate-200/50"
                                            style={{ backgroundColor: customColor }}
                                        />
                                    )}
                                </div>
                            </div>

                            <span className="text-xs text-slate-300 font-semibold">หรือ</span>

                            <div className="relative flex items-center">
                                <button
                                    type="button"
                                    className="flex items-center space-x-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition shadow-sm active:scale-95 text-slate-700 text-xs font-bold"
                                >
                                    <div
                                        className="w-4 h-4 rounded-full border border-slate-200/60"
                                        style={{
                                            background: customColor ? activeColor : "conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red)"
                                        }}
                                    />
                                    <span>จิ้มเลือกสีเอง...</span>
                                </button>
                                <input
                                    type="color"
                                    value={customColor.match(/^#[0-9A-Fa-f]{6}$/) ? customColor : "#3B82F6"}
                                    onChange={(e) => {
                                        setCustomColor(e.target.value);
                                        setSelectedColor("");
                                    }}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Subcategories */}
                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            หมวดหมู่ย่อย / ปัญหาย่อย (Subcategories)
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="text"
                                value={newSubcategory}
                                onChange={(e) => setNewSubcategory(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        addSubcategory();
                                    }
                                }}
                                placeholder="พิมพ์ปัญหาย่อย (เช่น หม้อแปลงระเบิด, ท่อแตก) แล้วกด Enter"
                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition bg-white placeholder:text-slate-300 text-slate-800"
                            />
                            <button
                                type="button"
                                onClick={addSubcategory}
                                className="w-full sm:w-auto px-6 py-3 rounded-xl text-white font-bold text-sm transition hover:opacity-90 active:scale-95 shadow-md flex items-center justify-center shrink-0"
                                style={{ backgroundColor: activeColor }}
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                        {/* Quick-add "อื่นๆ" button */}
                        {!subcategories.includes("อื่นๆ") && !subcategories.includes("Other") && (
                            <button
                                type="button"
                                onClick={() => setSubcategories((prev) => [...prev, "อื่นๆ"])}
                                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-dashed border-slate-300 text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                เพิ่ม &quot;อื่นๆ&quot; อัตโนมัติ (แนะนำ)
                            </button>
                        )}

                        {subcategories.length > 0 ? (
                            <div className="flex flex-wrap gap-2.5 pt-2">
                                {subcategories.map((sub, i) => (
                                    <span
                                        key={i}
                                        className="inline-flex items-center space-x-1.5 text-xs font-bold px-3.5 py-2 rounded-full transition shadow-sm"
                                        style={{
                                            backgroundColor: activeColor + "15",
                                            color: activeColor,
                                            border: `1px solid ${activeColor}30`,
                                        }}
                                    >
                                        <span>{sub}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeSubcategory(i)}
                                            className="hover:bg-black/10 rounded-full p-0.5 transition"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic">
                                ยังไม่ได้เพิ่มหมวดหมู่ย่อย (กรุณาเพิ่มเพื่อให้ประชาชนเลือกประเภทปัญหาได้สะดวกยิ่งขึ้น)
                            </p>
                        )}
                    </div>

                    {/* Form Actions */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
                        <Link
                            href="/admindashboard/categories"
                            className="w-full sm:w-auto text-center px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition active:scale-95"
                        >
                            ยกเลิก
                        </Link>
                        <button
                            type="submit"
                            disabled={!title.trim() || saving}
                            className="w-full sm:w-auto justify-center px-8 py-3 rounded-xl text-sm font-bold text-white transition shadow-lg hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-2"
                            style={{ backgroundColor: activeColor }}
                        >
                            {saving ? (
                                <>
                                    <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" className="opacity-25" />
                                        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" className="opacity-75" />
                                    </svg>
                                    <span>กำลังบันทึก...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>บันทึกหมวดหมู่</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Live Preview Column */}
                <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
                    <div className={`rounded-3xl border p-4 sm:p-6 md:p-8 relative overflow-hidden flex flex-col items-center justify-center min-h-[280px] lg:min-h-[360px] ${darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200"}`}>
                        {/* Dots background overlay */}
                        <div className={`absolute inset-0 opacity-20 [background-size:16px_16px] ${darkMode ? "bg-[radial-gradient(#475569_1px,transparent_1px)] bg-slate-900" : "bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] bg-slate-200"}`} />

                        <div className="relative z-10 w-full max-w-sm space-y-6">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 text-center">
                                    Live Preview Card (Dashboard)
                                </p>
                                <p className="text-[10px] text-slate-400 text-center">
                                    ตัวอย่างการ์ดที่จะแสดงให้คนในชุมชนเห็นในหน้าแรก
                                </p>
                            </div>

                            <div className="flex justify-center w-full">
                                <CategoryCard
                                    title={
                                        title || subtitle
                                            ? `${subtitle || "-"}\n(${title || "-"})`
                                            : "ชื่อหมวดหมู่\n(Category Title)"
                                    }
                                    description={description || "คำอธิบายความต้องการ หรือขอบเขตของประเภทเหตุขัดข้อง..."}
                                    icon={
                                        PreviewIcon ? (
                                            <PreviewIcon className="w-6 h-6" style={{ color: activeColor }} />
                                        ) : null
                                    }
                                    color={activeColor}
                                    subcategories={subcategories.length > 0 ? subcategories : ["ปัญหาย่อย 1", "ปัญหาย่อย 2"]}
                                    onClick={() => { }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
