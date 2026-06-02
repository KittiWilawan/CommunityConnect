"use client";

import React from 'react';
import { Bell, Check, Copy, Lightbulb, MapPin, Calendar, AlertTriangle, Map } from 'lucide-react';

export default function ReportConfirmation() {
    const ticketId = "#CC-829104-TH";

    const handleCopyLink = () => {
        navigator.clipboard.writeText(`https://communityconnect.utility/track/${ticketId}`);
        alert('คัดลอกลิงก์ติดตามสถานะเรียบร้อยแล้ว!');
    };

    return (
        <div className="bg-[#f0f4fa] min-h-screen flex flex-col text-slate-800 font-sans">
            <main className="flex-grow max-w-6xl w-full mx-auto p-4 md:py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <section className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-10 flex flex-col justify-between">
                    <div>
                        <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center border border-green-200 mb-6">
                            <Check className="h-8 w-8 text-green-600" strokeWidth={2.5} />
                        </div>

                        <h1 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">ขอบคุณที่แจ้งปัญหา</h1>
                        <p className="text-slate-600 leading-relaxed text-sm md:text-base max-w-xl">
                            รายงานของคุณถูกส่งไปยังเจ้าหน้าที่ในพื้นที่ที่เกี่ยวข้องเรียบร้อยแล้ว เราจะดำเนินการตรวจสอบและปรับปรุงแก้ไขให้เร็วที่สุด
                        </p>

                        <div className="mt-8 bg-[#eef3fc] border border-blue-200 rounded-xl p-6 max-w-md">
                            <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Ticket ID</span>
                            <div className="text-2xl md:text-3xl font-bold text-[#0f3460] mt-1 mb-4">{ticketId}</div>
                            <button
                                onClick={handleCopyLink}
                                className="w-full bg-[#0f3460] hover:bg-[#16447c] py-2.5 px-4 rounded-lg font-medium text-sm transition flex items-center justify-center space-x-2 shadow-sm"
                            >
                                <Copy className="h-4 w-4" />
                                <span>Copy Tracking Link</span>
                            </button>
                        </div>
                    </div>

                    {/* ปุ่มกดย้อนกลับ / ดูสถานะ */}
                    <div className="flex flex-wrap gap-4 mt-12 pt-6 border-t border-slate-100">
                        <button className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition">
                            Back to Home
                        </button>
                        <button className="px-5 py-2.5 bg-[#0066cc] hover:bg-[#0052a3] text-white rounded-lg text-sm font-medium transition shadow-sm">
                            View Live Status
                        </button>
                    </div>
                </section>

                {/* ฝั่งขวา: รายละเอียดรายงาน และ แผนที่ */}
                <section className="flex flex-col space-y-6">
                    {/* กล่องสรุปรายงาน (Report Summary) */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                        <h2 className="text-base font-bold text-slate-900 mb-4">Report Summary</h2>

                        {/* หัวข้อเรื่องแจ้ง */}
                        <div className="flex items-center space-x-4 mb-5 pb-4 border-b border-slate-100">
                            <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center text-white overflow-hidden">
                                <Lightbulb className="h-6 w-6 text-amber-400" />
                            </div>
                            <div>
                                <div className="font-bold text-sm text-slate-800">Broken Streetlight</div>
                                <div className="text-xs text-slate-500">Public Utilities</div>
                            </div>
                        </div>

                        {/* รายละเอียดข้อมูลย่อย */}
                        <div className="space-y-3.5 text-xs">
                            <div className="flex justify-between items-start">
                                <span className="text-slate-500 flex items-center">
                                    <MapPin className="h-3.5 w-3.5 mr-1.5 text-slate-400" /> Location
                                </span>
                                <span className="font-medium text-slate-800 text-right max-w-[160px]">Sukhumvit Soi 24, Bangkok</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 flex items-center">
                                    <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-400" /> Reported Date
                                </span>
                                <span className="font-medium text-slate-800">Oct 24, 2024</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 flex items-center">
                                    <AlertTriangle className="h-3.5 w-3.5 mr-1.5 text-slate-400" /> Urgency
                                </span>
                                <span className="font-bold text-red-600">High Priority</span>
                            </div>
                        </div>

                        {/* กล่องข้อความอธิบาย (Description) */}
                        <div className="mt-5 bg-slate-50 rounded-lg p-3.5 border border-slate-100">
                            <p className="text-xs italic text-slate-600 leading-relaxed">
                                "The light has been flickering for three days and finally stopped working last night. The area is very dark and feels unsafe for pedestrians."
                            </p>
                        </div>
                    </div>

                    {/* ปุ่มดูแผนที่ (View Map) */}
                    <div className="relative bg-slate-800 rounded-xl overflow-hidden shadow-sm h-32 border border-slate-200 flex items-center justify-center group">
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                        <button className="absolute z-10 bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-semibold py-2 px-4 rounded-lg shadow-md transition flex items-center space-x-2 border border-slate-700">
                            <Map className="h-4 w-4" />
                            <span>View Map</span>
                        </button>
                    </div>
                </section>
            </main>

            {/* 3. Footer */}
            <footer className="bg-[#e2eaf4] border-t border-slate-300/60 text-xs text-slate-500 py-4 mt-auto">
                <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-2">
                    <div>© 2026 Community Connect Utility. All rights reserved.</div>
                    <div className="flex space-x-4">
                        <a href="#" className="hover:underline">Accessibility Settings</a>
                        <a href="#" className="hover:underline">Contact Support</a>
                        <a href="#" className="hover:underline">Privacy Policy</a>
                    </div>
                </div>
            </footer>

        </div>
    );
}