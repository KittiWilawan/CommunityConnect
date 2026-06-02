"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PlusCircle, Trash2, Loader2 } from "lucide-react";
import { ICON_MAP } from "@/app/lib/icons";
import type { Category } from "@/app/lib/types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Categories</h1>
        <p className="text-sm text-slate-500">
          Manage utility services and visibility.
        </p>
        <p className="text-xs font-bold text-slate-700 mt-0.5">
          จัดการประเภทบริการ
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
              className={`bg-white rounded-2xl border shadow-sm p-4 transition-all duration-300 ${service.enabled
                ? "border-slate-200"
                : "border-slate-100 opacity-60"
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
                    <h3 className="text-base font-bold text-[#0F172A]">
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
                        ลบ?
                      </span>
                      <button
                        onClick={() => deleteCategory(service.id)}
                        disabled={isDeleting}
                        className="px-3 py-1.5 rounded-lg border border-red-500 bg-transparent text-red-600 text-xs font-bold hover:bg-red-600 hover:text-white transition disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3 h-3 animate-spin " />
                        ) : (
                          "ยืนยัน"
                        )}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold hover:bg-slate-200 transition"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(service.id)}
                      className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition"
                      title="ลบหมวดหมู่"
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
                    <div className="w-14 h-7 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0066B2]" />
                  </label>
                </div>
              </div>
            </div>
          );
        })}

        {categories.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-400 text-sm">ยังไม่มีหมวดหมู่</p>
            <p className="text-slate-300 text-xs mt-1">
              กดปุ่มด้านล่างเพื่อเพิ่มหมวดหมู่ใหม่
            </p>
          </div>
        )}
      </div>

      <Link
        href="/Dashboard/categories/new"
        className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-sm py-4 rounded-xl transition duration-200 flex items-center justify-center space-x-2 shadow-md active:scale-[0.99]"
      >
        <PlusCircle className="w-5 h-5" />
        <div className="text-left">
          <p className="font-bold text-sm leading-none">Add New Category</p>
          <p className="text-[10px] font-normal text-slate-300 mt-1 leading-none">
            เพิ่มหมวดหมู่ใหม่
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