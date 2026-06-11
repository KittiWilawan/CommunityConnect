"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Camera,
  Send,
  X,
  CheckCircle,
  Loader2,
} from "lucide-react";
import type { Category } from "@/app/lib/types";
import type { LocationValue } from "@/app/components/BangkokLocationPicker";
import { useSettings } from "@/app/components/SettingsProvider";

const BangkokLocationPicker = dynamic(
  () => import("@/app/components/BangkokLocationPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl h-64 bg-slate-100 border border-slate-200 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    ),
  }
);

function compressImage(dataUrl: string, maxWidth = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function ReportIssueForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { language } = useSettings();
  const categoryParam = searchParams.get("category");

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationValue | null>(null);
  const [mapKey, setMapKey] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/categories?enabled=true");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setCategories(data);

            if (categoryParam) {
              const found = data.find((c: Category) => c.id === categoryParam);
              if (found) {
                setSelectedCategoryId(found.id);
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        box_loading: setLoading(false);
      }
    };
    loadCategories();
  }, [categoryParam]);

  const currentCategory = categories.find((c) => c.id === selectedCategoryId);
  const subcategoriesList = currentCategory?.subcategories || [];

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategoryId(e.target.value);
    setSelectedSubcategory("");
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(language === "th" ? "ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB" : "Image file must be under 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const raw = reader.result as string;
        // Compress image before storing
        const compressed = await compressImage(raw, 800, 0.7);
        setSelectedImage(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const t = {
    fillRequired: language === "th" ? "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (หมวดหมู่หลัก, หมวดหมู่ย่อย, และรายละเอียดปัญหา)" : "Please fill in all required fields (main category, subcategory, and description)",
    locationRequired: language === "th" ? "กรุณาปักหมุดตำแหน่งที่เกิดปัญหาบนแผนที่ (เฉพาะเขตกรุงเทพมหานคร)" : "Please pin the issue location on the map (Bangkok only)",
    loginFirst: language === "th" ? "กรุณาเข้าสู่ระบบก่อนทำรายการ" : "Please log in before making a report",
    saveError: language === "th" ? "เกิดข้อผิดพลาดในการบันทึกข้อมูล: " : "Failed to save report: ",
    newReportTitle: language === "th" ? "มีรายการแจ้งเหตุใหม่ 📢" : "New Incident Report 📢",
    newReportContent: (sub: string, contactInfo: string, desc: string) =>
      language === "th"
        ? `หัวข้อ: ${sub}\nผู้แจ้ง: ${contactInfo || "ไม่ระบุชื่อ"}\nรายละเอียด: ${desc.slice(0, 60)}...`
        : `Topic: ${sub}\nReporter: ${contactInfo || "Anonymous"}\nDetails: ${desc.slice(0, 60)}...`,
    generalSaveError: language === "th" ? "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง" : "Could not save report. Please try again.",
    loadingCategories: language === "th" ? "กำลังโหลดข้อมูลหมวดหมู่..." : "Loading categories...",
    headerTitle: language === "th" ? "รายงานปัญหาชุมชน" : "Report Community Issue",
    headerSubtitle: language === "th" ? "กรุณาแจ้งรายละเอียดปัญหาที่เกิดขึ้นในพื้นที่ของคุณ เพื่อการตรวจสอบและแก้ไขที่รวดเร็ว" : "Please provide details about the issue in your area for swift inspection and resolution",
    backBtn: language === "th" ? "กลับหน้าหลัก" : "Back to Home",
    tapUpload: language === "th" ? "แตะเพื่อถ่ายภาพ / อัปโหลด" : "Tap to Capture / Upload",
    uploadDesc: language === "th" ? "แนบรูปภาพเพื่อให้เจ้าหน้าที่เห็นปัญหาชัดเจนยิ่งขึ้น" : "Attach an image to help officials see the problem more clearly",
    changeImage: language === "th" ? "เปลี่ยนรูปภาพ" : "Change Image",
    selectCategory: language === "th" ? "เลือกประเภทบริการ (Category)" : "Select Service Category (Category)",
    selectMainCategoryOpt: language === "th" ? "เลือกหมวดหมู่หลัก..." : "Select main category...",
    selectSubcategory: language === "th" ? "ระบุรายละเอียดประเภทปัญหา (Problem Subcategory)" : "Specify Subcategory (Problem Subcategory)",
    selectMainFirstOpt: language === "th" ? "กรุณาเลือกหมวดหมู่หลักด้านบนก่อน..." : "Please select main category above first...",
    noSubcategoryOpt: language === "th" ? "ไม่มีหมวดหมู่ย่อยในหัวข้อนี้..." : "No subcategories for this category...",
    selectProblemOpt: language === "th" ? "เลือกประเภทปัญหา..." : "Select issue type...",
    descLabel: language === "th" ? "รายละเอียดและข้อมูลเพิ่มเติม (Description)" : "Description & Additional Details (Description)",
    descPlaceholder: language === "th" ? "กรุณาระบุรายละเอียด เช่น ขนาดของปัญหา จุดสังเกตที่ชัดเจน หรือผลกระทบที่เกิดขึ้น..." : "Please specify details such as size of the issue, clear landmarks, or impacts...",
    contactLabel: language === "th" ? "ชื่อและเบอร์ติดต่อ (Contact Info - Optional)" : "Contact Info & Phone (Contact Info - Optional)",
    contactPlaceholder: language === "th" ? "ระบุชื่อและเบอร์โทรติดต่อ เพื่อให้เจ้าหน้าที่สอบถามข้อมูลเพิ่มเติม" : "Enter contact name and phone number for follow-up questions",
    submitBtn: language === "th" ? "ส่งรายงานปัญหา" : "Submit Report",
    submitting: language === "th" ? "กำลังบันทึกข้อมูลรายงาน..." : "Submitting report data...",
    successTitle: language === "th" ? "ส่งรายงานปัญหาสำเร็จ!" : "Report Submitted Successfully!",
    successDesc: language === "th" ? "ระบบได้รับรายงานเรื่องเรียบร้อยแล้ว เจ้าหน้าที่ที่เกี่ยวข้องจะเร่งดำเนินการตรวจสอบและแก้ไขโดยเร็วที่สุด คุณสามารถติดตามสถานะของปัญหาได้ที่หน้าประวัติ" : "We have received your report. Relevant officials will inspect and resolve it as soon as possible. You can track the status in your history page.",
    viewHistoryBtn: language === "th" ? "ดูประวัติการแจ้งเหตุ" : "View History",
    reportAnotherBtn: language === "th" ? "แจ้งปัญหาอื่นเพิ่มเติม" : "Report Another Issue",
    loadingForm: language === "th" ? "กำลังโหลดแบบฟอร์ม..." : "Loading Form...",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryId || !selectedSubcategory || !description.trim()) {
      alert(t.fillRequired);
      return;
    }

    if (!location) {
      alert(t.locationRequired);
      return;
    }

    setSaving(true);

    try {
      let imageToStore: string | null = null;
      if (selectedImage) {
        try {
          imageToStore = await compressImage(selectedImage, 600, 0.6);
        } catch {
          imageToStore = selectedImage;
        }
      }

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: selectedCategoryId,
          category_title: currentCategory
            ? `${currentCategory.subtitle} (${currentCategory.title})`
            : "หมวดหมู่อื่นๆ",
          category_color: currentCategory?.color || "#64748B",
          subcategory: selectedSubcategory,
          description: description.trim(),
          contact: contact.trim(),
          image: imageToStore,
          latitude: location.latitude,
          longitude: location.longitude,
          location_address: location.address || null,
          notification_title: t.newReportTitle,
          notification_content: t.newReportContent(
            selectedSubcategory,
            contact.trim(),
            description.trim()
          ),
        }),
      });

      if (res.status === 401) {
        alert(t.loginFirst);
        setSaving(false);
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error("Error inserting report:", body.error || res.statusText);
        alert(t.saveError + (body.error || res.statusText));
        setSaving(false);
        return;
      }

      setShowSuccessModal(true);
    } catch (err: any) {
      console.error("Failed to save report:", err);
      alert(t.generalSaveError);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedCategoryId("");
    setSelectedSubcategory("");
    setDescription("");
    setContact("");
    setSelectedImage(null);
    setLocation(null);
    setMapKey((k) => k + 1);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-slate-500 text-sm font-medium">
          {t.loadingCategories}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-start border-b border-slate-100 pb-6 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {t.headerTitle}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t.headerSubtitle}
          </p>
        </div>
        <a href="/Dashboard">
          <button className="px-5 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition whitespace-nowrap cursor-pointer">
            {t.backBtn}
          </button>
        </a>
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
                  className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full shadow-md z-10 transition opacity-90 hover:scale-105 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-medium">
                  {t.changeImage}
                </div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 bg-[#1E293B] text-white rounded-xl flex items-center justify-center shadow-md mb-4 group-hover:scale-105 transition-transform duration-200">
                  <Camera className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {t.tapUpload}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {t.uploadDesc}
                </p>
              </>
            )}
          </div>

          <BangkokLocationPicker
            key={mapKey}
            value={location}
            onChange={setLocation}
            language={language}
            className="shrink-0"
          />
        </div>

        {/* Right Column - Form */}
        <div className="md:col-span-3">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Main Category Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t.selectCategory}{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedCategoryId}
                  onChange={handleCategoryChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition cursor-pointer appearance-none text-gray-900"
                  required
                  disabled={saving}
                >
                  <option value="">{t.selectMainCategoryOpt}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {language === "th" && cat.subtitle
                        ? `${cat.subtitle} (${cat.title})`
                        : cat.title}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Subcategory Selector */}
            <div className="space-y-1.5 animate-[fadeIn_250ms_ease-out]">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t.selectSubcategory}{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  disabled={
                    !selectedCategoryId ||
                    saving
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition cursor-pointer appearance-none disabled:opacity-50 disabled:cursor-not-allowed text-gray-900"
                  required
                >
                  {!selectedCategoryId ? (
                    <option value="">
                      {t.selectMainFirstOpt}
                    </option>
                  ) : (
                    <>
                      <option value="">{t.selectProblemOpt}</option>
                      {subcategoriesList.map((sub, idx) => (
                        <option key={idx} value={sub}>
                          {sub}
                        </option>
                      ))}
                      {/* Always provide "อื่นๆ" option */}
                      {!subcategoriesList.includes(language === "th" ? "อื่นๆ" : "Other") && (
                        <option value={language === "th" ? "อื่นๆ" : "Other"}>
                          {language === "th" ? "อื่นๆ (Other)" : "Other (อื่นๆ)"}
                        </option>
                      )}
                    </>
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Details Area */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t.descLabel}{" "}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder={t.descPlaceholder}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition resize-none text-gray-900"
                required
                disabled={saving}
              ></textarea>
            </div>

            {/* Contact Information */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t.contactLabel}
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder={t.contactPlaceholder}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition text-gray-900"
                disabled={saving}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#2B7A3E] hover:bg-[#226231] text-white font-bold text-sm py-4 rounded-xl transition duration-200 flex items-center justify-center space-x-2 shadow-md active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{t.submitting}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 fill-white" />
                    <span>{t.submitBtn}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        // 🟢 เพิ่ม z-[9999] คลุมแท็กนอกสุด เพื่อบังคับให้ฉากหลังทั้งหมดอยู่เหนือแผนที่
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]"
            onClick={() => setShowSuccessModal(false)}
          />

          {/* Modal Content Box */}
          {/* 🟢 เปลี่ยนเป็น z-10 ธรรมดา เพราะกล่องแม่ z-[9999] คุมความสูงเบ็ดเสร็จไว้แล้ว */}
          <div className="relative bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-slate-100 z-10 my-auto animate-[scaleUp_250ms_ease-out]">
            <div className="mx-auto w-16 h-16 bg-emerald-50 text-[#2B7A3E] rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-[#0F172A]">
              {t.successTitle}
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {t.successDesc}
            </p>

            <div className="mt-6 flex flex-col space-y-2">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push("/Dashboard");
                }}
                className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-sm py-3.5 rounded-xl transition duration-200 cursor-pointer"
              >
                {language === "th" ? "กลับหน้า Dashboard" : "Back to Dashboard"}
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push("/reportissue/historys");
                }}
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-sm py-3.5 rounded-xl transition duration-200 cursor-pointer"
              >
                {t.viewHistoryBtn}
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  resetForm();
                }}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-sm py-3.5 rounded-xl transition duration-200 cursor-pointer"
              >
                {t.reportAnotherBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scaleUp {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default function ReportIssuePage() {
  const { language } = useSettings();
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center h-64 space-y-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-slate-500 text-sm font-medium">
            {language === "th" ? "กำลังโหลดแบบฟอร์ม..." : "Loading form..."}
          </p>
        </div>
      }
    >
      <ReportIssueForm />
    </Suspense>
  );
}