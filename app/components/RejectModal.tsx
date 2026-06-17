"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

interface RejectModalProps {
    isOpen: boolean;
    reportId: string;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
    language: string;
}

export default function RejectModal({
    isOpen,
    reportId,
    onClose,
    onConfirm,
    language,
}: RejectModalProps) {
    const [rejectionReason, setRejectionReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!rejectionReason.trim()) {
            alert(language === "th" ? "กรุณากรอกหมายเหตุการปฎิเสธ" : "Please enter rejection reason");
            return;
        }

        setIsSubmitting(true);
        try {
            await onConfirm(rejectionReason);
            setRejectionReason("");
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-100 z-10">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100"
                >
                    <X className="w-5 h-5 text-slate-400" />
                </button>

                <h2 className="text-xl font-bold text-red-600 mb-2">
                    {language === "th" ? "ปฎิเสธรายการแจ้งเหตุ" : "Reject Report"}
                </h2>
                <p className="text-sm text-slate-600 mb-4">
                    {language === "th"
                        ? "โปรดระบุเหตุผลในการปฎิเสธ"
                        : "Please specify the reason for rejection"}
                </p>

                <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder={
                        language === "th" ? "เหตุผลการปฎิเสธ..." : "Reason for rejection..."
                    }
                    className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none resize-none"
                    rows={5}
                    disabled={isSubmitting}
                />

                <div className="flex gap-2 mt-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 px-4 border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-50"
                        disabled={isSubmitting}
                    >
                        {language === "th" ? "ยกเลิก" : "Cancel"}
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
                        disabled={isSubmitting}
                    >
                        {isSubmitting
                            ? language === "th"
                                ? "กำลังประมวลผล..."
                                : "Processing..."
                            : language === "th"
                                ? "ยืนยันปฎิเสธ"
                                : "Confirm Reject"}
                    </button>
                </div>
            </div>
        </div>
    );
}
