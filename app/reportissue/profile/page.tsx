"use client";

import React, { useState } from 'react';
import {
  User,
  CheckCircle2,
  Globe,
  ChevronRight,
  Type,
  Contrast,
  HelpCircle,
  MessageSquare,
  Shield,
  LogOut
} from 'lucide-react';

export default function ProfilePage() {
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center text-center relative overflow-hidden">
        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center relative mb-4">
          <User className="w-12 h-12 text-slate-600" />
          <div className="absolute bottom-0 right-1 bg-white rounded-full p-0.5">
            <CheckCircle2 className="w-5 h-5 text-sky-600 fill-white" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-800">John </h2>
        <p className="text-xs font-bold text-sky-600 uppercase tracking-wider mt-1">Verified Resident</p>
        <p className="text-[11px] text-slate-400 mt-1 font-mono">citizen_id: 1-1234-56XXX-X-X</p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
          บัญชีและการตั้งค่า (ACCOUNT SETTINGS)
        </h3>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">

          <a href='/reportissue/profile/edit' className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition text-left group">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-slate-50 rounded-xl text-slate-700 group-hover:bg-white border border-transparent group-hover:border-slate-100 transition">
                <User className="w-5 h-5" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">แก้ไขข้อมูลส่วนตัว</p>
                <p className="text-[11px] text-slate-400">Edit Profile</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </a>

          <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition text-left group">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-slate-50 rounded-xl text-slate-700 group-hover:bg-white border border-transparent group-hover:border-slate-100 transition">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">เปลี่ยนภาษา</p>
                <p className="text-[11px] text-slate-400">Change Language (Thai/English)</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
          การเข้าถึงที่สะดวก (ACCESSIBILITY)
        </h3>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-slate-50 rounded-xl text-slate-700">
                <Type className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">ตัวอักษรขนาดใหญ่</p>
                <p className="text-[11px] text-slate-400">Large Text Mode</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={largeText}
                onChange={() => setLargeText(!largeText)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 Tactics after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-slate-50 rounded-xl text-slate-700">
                <Contrast className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">โหมดความคมชัดสูง</p>
                <p className="text-[11px] text-slate-400">High Contrast Mode</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={highContrast}
                onChange={() => setHighContrast(!highContrast)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
          ความช่วยเหลือและกฎหมาย (SUPPORT & LEGAL)
        </h3>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
          <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition text-left group">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-slate-50 rounded-xl text-slate-700 group-hover:bg-white border border-transparent group-hover:border-slate-100 transition">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">ศูนย์ความช่วยเหลือ</p>
                <p className="text-[11px] text-slate-400">Help Center</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition text-left group">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-slate-50 rounded-xl text-slate-700 group-hover:bg-white border border-transparent group-hover:border-slate-100 transition">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">ติดต่อเจ้าหน้าที่</p>
                <p className="text-[11px] text-slate-400">Contact Support</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition text-left group">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-slate-50 rounded-xl text-slate-700 group-hover:bg-white border border-transparent group-hover:border-slate-100 transition">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">นโยบายความเป็นส่วนตัว</p>
                <p className="text-[11px] text-slate-400">Privacy Policy</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      <button className="w-full bg-[#FCE8E6] hover:bg-[#FAD4D0] text-[#C92A2A] font-bold text-sm py-4 rounded-2xl transition duration-200 flex items-center justify-center space-x-2 border border-[#F8B4AC]">
        <LogOut className="w-4 h-4" />
        <span>ออกจากระบบ (Logout)</span>
      </button>

    </div>
  );
}
