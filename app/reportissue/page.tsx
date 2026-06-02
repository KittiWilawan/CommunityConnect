"use client";

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Camera, MapPin, Navigation, Send, X, CheckCircle, Loader2 } from 'lucide-react';
import type { Category } from "@/app/lib/types";

function ReportIssueForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const categoryParam = searchParams.get("category");

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [selectedSubcategory, setSelectedSubcategory] = useState("");
    const [description, setDescription] = useState("");
    const [contact, setContact] = useState("");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch active categories
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const res = await fetch("/api/categories?enabled=true");
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data);

                    // Pre-select category if parameter is valid
                    if (categoryParam) {
                        const found = data.find((c: Category) => c.id === categoryParam);
                        if (found) {
                            setSelectedCategoryId(found.id);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch categories:", err);
            } finally {
                setLoading(false);
            }
        };
        loadCategories();
    }, [categoryParam]);

    const currentCategory = categories.find(c => c.id === selectedCategoryId);
    const subcategoriesList = currentCategory?.subcategories || [];

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedCategoryId(e.target.value);
        setSelectedSubcategory(""); // Reset subcategory when main category changes
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setSelectedImage(imageUrl);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const removeImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCategoryId || !selectedSubcategory || !description.trim()) {
            alert("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (หมวดหมู่หลัก, หมวดหมู่ย่อย, และรายละเอียดปัญหา)");
            return;
        }

        const newReport = {
            id: crypto.randomUUID(),
            categoryId: selectedCategoryId,
            categoryTitle: currentCategory ? `${currentCategory.subtitle} (${currentCategory.title})` : "หมวดหมู่อื่นๆ",
            categoryColor: currentCategory?.color || "#64748B",
            subcategory: selectedSubcategory,
            description: description.trim(),
            contact: contact.trim(),
            image: selectedImage,
            status: "รอดำเนินการ",
            timestamp: new Date().toLocaleString("th-TH"),
        };

        try {
            const existingRaw = localStorage.getItem("citizen_reports");
            const existing = existingRaw ? JSON.parse(existingRaw) : [];
            localStorage.setItem("citizen_reports", JSON.stringify([newReport, ...existing]));
            setShowSuccessModal(true);
        } catch (err) {
            console.error("Failed to save report to local storage:", err);
            alert("ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
        }
    };

    const resetForm = () => {
        setSelectedCategoryId("");
        setSelectedSubcategory("");
        setDescription("");
        setContact("");
        setSelectedImage(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-slate-500 text-sm font-medium">กำลังโหลดข้อมูลหมวดหมู่...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">รายงานปัญหาชุมชน</h1>
                <p className="text-xs text-slate-500 mt-1">
                    กรุณาแจ้งรายละเอียดปัญหาที่เกิดขึ้นในพื้นที่ของคุณ เพื่อการตรวจสอบและแก้ไขที่รวดเร็ว
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                {/* Left Column - Image & Map */}
                <div className="md:col-span-2 space-y-6 flex flex-col">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                    />

                    <div
                        onClick={triggerFileInput}
                        className="border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50/80 transition flex-1 min-h-[220px] relative overflow-hidden group"
                    >
                        {selectedImage ? (
                            <>
                                <img
                                    src={selectedImage}
                                    alt="Preview"
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                                <button
                                    onClick={removeImage}
                                    className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full shadow-md z-10 transition opacity-90 hover:scale-105"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-medium">
                                    เปลี่ยนรูปภาพ
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-14 h-14 bg-[#1E293B] text-white rounded-xl flex items-center justify-center shadow-md mb-4 group-hover:scale-105 transition-transform duration-200">
                                    <Camera className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-bold text-slate-800">แตะเพื่อถ่ายภาพ / อัปโหลด</p>
                                <p className="text-xs text-slate-400 mt-1">แนบรูปภาพเพื่อให้เจ้าหน้าที่เห็นปัญหาชัดเจนยิ่งขึ้น</p>
                            </>
                        )}
                    </div>

                    <div className="bg-slate-100 rounded-2xl h-64 relative overflow-hidden border border-slate-200 shadow-inner shrink-0">
                        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] bg-slate-200-grid"></div>

                        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-[#C92A2A]" />
                            <span>ตำแหน่งที่เกิดปัญหา</span>
                        </div>

                        <div className="absolute inset-0 flex items-center justify-center">
                            <MapPin className="w-8 h-8 text-[#C92A2A] drop-shadow-md animate-bounce" />
                        </div>

                        <button type="button" className="absolute bottom-4 right-4 bg-[#0F172A] hover:bg-slate-800 text-white px-3 py-2 rounded-lg shadow-md flex items-center space-x-1.5 text-xs font-semibold transition active:scale-95">
                            <Navigation className="w-3.5 h-3.5 fill-white" />
                            <span>ระบุตำแหน่งปัจจุบัน</span>
                        </button>
                    </div>
                </div>

                {/* Right Column - Form */}
                <div className="md:col-span-3">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Main Category Selector */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                เลือกประเภทบริการ (Category) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedCategoryId}
                                    onChange={handleCategoryChange}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition cursor-pointer appearance-none"
                                    required
                                >
                                    <option value="">เลือกหมวดหมู่หลัก...</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.subtitle ? `${cat.subtitle} (${cat.title})` : cat.title}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                    <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                </div>
                            </div>
                        </div>

                        {/* Subcategory Selector */}
                        <div className="space-y-1.5 animate-[fadeIn_250ms_ease-out]">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                ระบุรายละเอียดประเภทปัญหา (Problem Subcategory) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedSubcategory}
                                    onChange={(e) => setSelectedSubcategory(e.target.value)}
                                    disabled={!selectedCategoryId || subcategoriesList.length === 0}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition cursor-pointer appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    required
                                >
                                    {!selectedCategoryId ? (
                                        <option value="">กรุณาเลือกหมวดหมู่หลักด้านบนก่อน...</option>
                                    ) : subcategoriesList.length === 0 ? (
                                        <option value="">ไม่มีหมวดหมู่ย่อยในหัวข้อนี้...</option>
                                    ) : (
                                        <>
                                            <option value="">เลือกประเภทปัญหา...</option>
                                            {subcategoriesList.map((sub, idx) => (
                                                <option key={idx} value={sub}>
                                                    {sub}
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                    <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                </div>
                            </div>
                        </div>

                        {/* Details Area */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                รายละเอียดและข้อมูลเพิ่มเติม (Description) <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={5}
                                placeholder="กรุณาระบุรายละเอียด เช่น ขนาดของปัญหา จุดสังเกตที่ชัดเจน หรือผลกระทบที่เกิดขึ้น..."
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition resize-none"
                                required
                            ></textarea>
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                ชื่อและเบอร์ติดต่อ (Contact Info - Optional)
                            </label>
                            <input
                                type="text"
                                value={contact}
                                onChange={(e) => setContact(e.target.value)}
                                placeholder="ระบุชื่อและเบอร์โทรติดต่อ เพื่อให้เจ้าหน้าที่สอบถามข้อมูลเพิ่มเติม"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                className="w-full bg-[#2B7A3E] hover:bg-[#226231] text-white font-bold text-sm py-4 rounded-xl transition duration-200 flex items-center justify-center space-x-2 shadow-md active:scale-[0.99]"
                            >
                                <Send className="w-4 h-4 fill-white" />
                                <span>ส่งรายงานปัญหา</span>
                            </button>
                            <p className="text-center text-[11px] text-slate-400 mt-3">
                                ข้อมูลของคุณจะถูกส่งไปยังหน่วยงานที่เกี่ยวข้องโดยตรง
                            </p>
                        </div>
                    </form>
                </div>
            </div>

            {/* Success Modal */}
            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    {/* Backdrop (พื้นหลังมืดเบลอ) */}
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]"
                        onClick={() => setShowSuccessModal(false)} // ป้องกันการกดปิดด้านหลัง (ถ้าต้องการ)
                    />

                    {/* Modal Content Box (กล่องข้อความกลางจอ) */}
                    <div className="relative bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-slate-100 z-10 my-auto animate-[scaleUp_250ms_ease-out]">
                        <div className="mx-auto w-16 h-16 bg-emerald-50 text-[#2B7A3E] rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-[#0F172A]">ส่งรายงานปัญหาสำเร็จ!</h3>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                            ระบบได้รับรายงานเรื่องเรียบร้อยแล้ว เจ้าหน้าที่ที่เกี่ยวข้องจะเร่งดำเนินการตรวจสอบและแก้ไขโดยเร็วที่สุด คุณสามารถติดตามสถานะของปัญหาได้ที่หน้าประวัติ
                        </p>

                        <div className="mt-6 flex flex-col space-y-2">
                            <button
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    router.push("/reportissue/historys");
                                }}
                                className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-sm py-3.5 rounded-xl transition duration-200"
                            >
                                ดูประวัติการแจ้งเหตุ
                            </button>
                            <button
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    resetForm();
                                }}
                                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-sm py-3.5 rounded-xl transition duration-200"
                            >
                                แจ้งปัญหาอื่นเพิ่มเติม
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes scaleUp {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
}

export default function ReportIssuePage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-slate-500 text-sm font-medium">กำลังโหลดแบบฟอร์ม...</p>
            </div>
        }>
            <ReportIssueForm />
        </Suspense>
    );
}