"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User as UserIcon,
  CheckCircle2,
  Globe,
  ChevronRight,
  Type,
  Moon,
  HelpCircle,
  MessageSquare,
  Shield,
  LogOut,
  Loader2,
  Settings,
  Camera,
  MapPin,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useSettings } from "@/app/components/SettingsProvider";
import { signOutUser } from "@/app/lib/sign-out";
import { getRoleLabel } from "@/app/lib/roles";

export default function ProfilePage() {
  const router = useRouter();
  const { darkMode, largeText, language, setDarkMode, setLargeText, setLanguage } = useSettings();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile?includeAvatar=true");

        if (res.status === 401) {
          router.push("/");
          return;
        }

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(
            language === "th"
              ? "ไม่สามารถโหลดโปรไฟล์ได้: " + (body.error || res.statusText)
              : "Failed to load profile: " + (body.error || res.statusText)
          );
          return;
        }

        setProfile(await res.json());
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(
          language === "th"
            ? "เกิดข้อผิดพลาดในการโหลดข้อมูลโปรไฟล์"
            : "An error occurred while loading profile"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router, language]);

  const handleSignOut = async () => {
    if (!confirm(language === 'th' ? "คุณต้องการออกจากระบบใช่หรือไม่?" : "Are you sure you want to log out?")) {
      return;
    }

    try {
      await signOutUser();
      router.push('/');
      router.refresh();
    } catch {
      alert(language === 'th' ? "ไม่สามารถออกจากระบบได้ กรุณาลองใหม่อีกครั้ง" : "Could not sign out. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-slate-500 text-sm font-medium">กำลังโหลดข้อมูลโปรไฟล์...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3 text-center px-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-slate-600 text-sm font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-blue-500 text-xs underline cursor-pointer"
        >
          {language === "th" ? "ลองใหม่" : "Try again"}
        </button>
      </div>
    );
  }

  // Define translations/labels
  const t = {
    title: language === 'th' ? 'โปรไฟล์ของคุณ' : 'Your Profile',
    verified: language === 'th' ? 'ผู้พักอาศัยที่ได้รับการยืนยัน' : 'Verified Resident',
    citizenId: language === 'th' ? 'รหัสประจำตัวประชาชน' : 'Citizen ID',
    roleLabel: language === 'th' ? 'บทบาทผู้ใช้' : 'User Role',
    phoneLabel: language === 'th' ? 'เบอร์โทรศัพท์' : 'Phone Number',
    joinedLabel: language === 'th' ? 'วันที่เข้าร่วม' : 'Joined Date',
    adminPanel: language === 'th' ? 'แผงควบคุมผู้ดูแลระบบ (Admin Panel)' : 'Admin Dashboard Panel',
    displayNameLabel: language === 'th' ? 'ชื่อที่แสดง' : 'Display Name',
    addressLabel: language === 'th' ? 'ที่อยู่' : 'Address',
    bioLabel: language === 'th' ? 'เกี่ยวกับตัวฉัน' : 'About Me',
    
    secAccount: language === 'th' ? 'บัญชีและการตั้งค่า' : 'ACCOUNT SETTINGS',
    editProfile: language === 'th' ? 'แก้ไขข้อมูลส่วนตัว' : 'Edit Profile',
    editProfileDesc: language === 'th' ? 'แก้ไขรูปโปรไฟล์ ชื่อ และข้อมูลติดต่อ' : 'Edit avatar, name and contact details',
    changeLang: language === 'th' ? 'เปลี่ยนภาษา' : 'Change Language',
    changeLangDesc: language === 'th' ? 'สลับภาษาไทย / อังกฤษ' : 'Switch between Thai / English',

    secAccessibility: language === 'th' ? 'การเข้าถึงที่สะดวก' : 'ACCESSIBILITY',
    largeText: language === 'th' ? 'ตัวอักษรขนาดใหญ่' : 'Large Text Mode',
    largeTextDesc: language === 'th' ? 'เพิ่มขนาดตัวอักษรของข้อความในหน้าเว็บ' : 'Increase the font size of web text',
    darkMode: language === 'th' ? 'โหมดมืด (Dark Mode)' : 'Dark Mode',
    darkModeDesc: language === 'th' ? 'เปลี่ยนหน้าเว็บเป็นสีเข้มเพื่อถนอมสายตา' : 'Switch system colors to dark theme',

    secSupport: language === 'th' ? 'ความช่วยเหลือและกฎหมาย' : 'SUPPORT & LEGAL',
    helpCenter: language === 'th' ? 'ศูนย์ความช่วยเหลือ' : 'Help Center',
    helpCenterDesc: language === 'th' ? 'คู่มือการใช้งานและคำถามที่พบบ่อย' : 'User guides and FAQs',
    contactSupport: language === 'th' ? 'ติดต่อเจ้าหน้าที่' : 'Contact Support',
    contactSupportDesc: language === 'th' ? 'ส่งข้อสงสัยหรือแจ้งปัญหาระบบ' : 'Submit feedback or system bugs',
    privacyPolicy: language === 'th' ? 'นโยบายความเป็นส่วนตัว' : 'Privacy Policy',
    privacyPolicyDesc: language === 'th' ? 'การปกป้องข้อมูลและข้อตกลงผู้ใช้' : 'Data protection and user agreement',

    logout: language === 'th' ? 'ออกจากระบบ (Logout)' : 'Logout of Account'
  };

  const getContrastClass = (element: 'bg' | 'text' | 'card' | 'border' | 'btn' | 'iconBg') => {
    if (darkMode) {
      switch (element) {
        case 'bg': return 'bg-slate-900 text-white';
        case 'text': return 'text-white';
        case 'card': return 'bg-slate-800 border border-slate-700 text-white shadow-lg';
        case 'border': return 'border-slate-700';
        case 'btn': return 'bg-slate-700 text-white hover:bg-slate-600 border border-slate-600';
        case 'iconBg': return 'bg-slate-700 text-slate-300 border border-transparent';
      }
    }
    switch (element) {
      case 'bg': return 'bg-slate-50 text-slate-800';
      case 'text': return 'text-slate-800';
      case 'card': return 'bg-white border border-slate-200 shadow-sm text-slate-800';
      case 'border': return 'border-slate-200';
      case 'btn': return 'bg-blue-50 text-blue-700 hover:bg-blue-100';
      case 'iconBg': return 'bg-slate-50 text-slate-700 border border-transparent';
    }
  };

  const fontSizeClass = largeText ? 'text-lg' : 'text-sm';
  const headingSizeClass = largeText ? 'text-2xl' : 'text-xl';
  const subSizeClass = largeText ? 'text-sm' : 'text-[11px]';

  return (
    <div className={`max-w-2xl mx-auto space-y-6 pb-12 transition-all duration-300 ${fontSizeClass} ${darkMode ? 'text-white bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl' : 'text-slate-700'}`}>
      
      {/* Profile Card */}
      <div className={`rounded-2xl p-6 flex flex-col items-center text-center relative overflow-hidden transition-colors ${getContrastClass('card')}`}>
        {/* Avatar with Camera overlay */}
        <div className="relative mb-4 group">
          {profile?.avatar_url ? (
            <div className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center shrink-0 border-4 border-white shadow-lg">
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className={`w-28 h-28 rounded-full aspect-square flex items-center justify-center shadow-lg border-4 border-white shrink-0 ${darkMode ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
              <span className="text-white text-3xl font-bold">
                {profile?.display_name?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
          <Link
            href="/reportissue/profile/edit"
            className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 transition cursor-pointer group-hover:scale-110"
          >
            <Camera className="w-4 h-4" />
          </Link>
          <div className="absolute bottom-0 left-0 bg-white rounded-full p-0.5 shadow-md">
            <CheckCircle2 className="w-5 h-5 text-sky-600 fill-white" />
          </div>
        </div>

        <h2 className={`font-bold ${headingSizeClass} ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          {profile?.display_name || profile?.email?.split('@')[0] || 'User'}
        </h2>
        <p className={`font-bold uppercase tracking-wider mt-1 ${darkMode ? 'text-sky-400' : 'text-sky-600'} ${subSizeClass}`}>
          {t.verified}
        </p>

        {/* Bio */}
        {profile?.bio && (
          <p className={`mt-3 max-w-md leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-500'} ${subSizeClass}`}>
            {profile.bio}
          </p>
        )}
        
        {/* User Details Grid */}
        <div className={`w-full mt-6 pt-6 border-t grid grid-cols-2 gap-4 text-left ${getContrastClass('border')}`}>
          <div>
            <span className={`${subSizeClass} text-slate-400 block`}>Email</span>
            <span className="font-semibold break-all">{profile?.email || 'N/A'}</span>
          </div>
          <div>
            <span className={`${subSizeClass} text-slate-400 block`}>{t.phoneLabel}</span>
            <span className="font-semibold">{profile?.phone || (language === 'th' ? 'ไม่ได้ระบุ' : 'Not specified')}</span>
          </div>
          {profile?.display_name && (
            <div>
              <span className={`${subSizeClass} text-slate-400 block`}>{t.displayNameLabel}</span>
              <span className="font-semibold">{profile.display_name}</span>
            </div>
          )}
          <div>
            <span className={`${subSizeClass} text-slate-400 block`}>{t.roleLabel}</span>
            <span className="font-semibold">{getRoleLabel(profile?.role, language)}</span>
          </div>
          {profile?.address && (
            <div className="col-span-2">
              <span className={`${subSizeClass} text-slate-400 block flex items-center space-x-1`}>
                <MapPin className="w-3 h-3" />
                <span>{t.addressLabel}</span>
              </span>
              <span className="font-semibold">{profile.address}</span>
            </div>
          )}
          <div>
            <span className={`${subSizeClass} text-slate-400 block`}>{t.joinedLabel}</span>
            <span className="font-semibold">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US') : 'N/A'}
            </span>
          </div>
        </div>

        {/* Admin Panel Quick Access */}
        {profile?.role === 'admin' && (
          <Link 
            href="/admindashboard" 
            className={`w-full mt-6 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-xs font-bold transition duration-200 ${
              darkMode ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-md' : 'bg-[#0F172A] text-white hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>{t.adminPanel}</span>
          </Link>
        )}
      </div>

      {/* Account Settings Section */}
      <div className="space-y-3">
        <h3 className={`font-bold uppercase tracking-wider px-1 ${subSizeClass} ${darkMode ? 'text-sky-400' : 'text-slate-500'}`}>
          {t.secAccount}
        </h3>

        <div className={`rounded-2xl overflow-hidden divide-y transition-colors ${getContrastClass('card')} ${darkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
          <Link href="/reportissue/profile/edit" className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition text-left group">
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-xl transition ${getContrastClass('iconBg')}`}>
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">{t.editProfile}</p>
                <p className={`text-slate-400 ${subSizeClass}`}>{t.editProfileDesc}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <button onClick={() => setLanguage(language === 'th' ? 'en' : 'th')} className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition text-left group cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-xl transition ${getContrastClass('iconBg')}`}>
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">{t.changeLang}</p>
                <p className={`text-slate-400 ${subSizeClass}`}>{t.changeLangDesc}</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
              {language.toUpperCase()}
            </span>
          </button>
        </div>
      </div>

      {/* Accessibility Section */}
      <div className="space-y-3">
        <h3 className={`font-bold uppercase tracking-wider px-1 ${subSizeClass} ${darkMode ? 'text-sky-400' : 'text-slate-500'}`}>
          {t.secAccessibility}
        </h3>

        <div className={`rounded-2xl overflow-hidden divide-y transition-colors ${getContrastClass('card')} ${darkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-xl transition ${getContrastClass('iconBg')}`}>
                <Type className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">{t.largeText}</p>
                <p className={`text-slate-400 ${subSizeClass}`}>{t.largeTextDesc}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={largeText}
                onChange={() => setLargeText(!largeText)}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 rounded-full peer peer-focus:outline-none after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full ${
                darkMode 
                  ? 'bg-slate-700 border border-slate-600 peer-checked:bg-sky-600' 
                  : 'bg-slate-200 peer-checked:bg-sky-600'
              }`}></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-xl transition ${getContrastClass('iconBg')}`}>
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">{t.darkMode}</p>
                <p className={`text-slate-400 ${subSizeClass}`}>{t.darkModeDesc}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 rounded-full peer peer-focus:outline-none after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full ${
                darkMode 
                  ? 'bg-slate-700 border border-slate-600 peer-checked:bg-sky-600' 
                  : 'bg-slate-200 peer-checked:bg-sky-600'
              }`}></div>
            </label>
          </div>
        </div>
      </div>

      {/* Support Section */}
      <div className="space-y-3">
        <h3 className={`font-bold uppercase tracking-wider px-1 ${subSizeClass} ${darkMode ? 'text-sky-400' : 'text-slate-500'}`}>
          {t.secSupport}
        </h3>

        <div className={`rounded-2xl overflow-hidden divide-y transition-colors ${getContrastClass('card')} ${darkMode ? 'divide-slate-700' : 'divide-slate-100'}`}>
          <Link href="/reportissue/support-legal?section=help" className={`w-full flex items-center justify-between p-4 transition text-left group cursor-pointer ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/50'}`}>
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-xl transition ${getContrastClass('iconBg')}`}>
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">{t.helpCenter}</p>
                <p className={`text-slate-400 ${subSizeClass}`}>{t.helpCenterDesc}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link href="/reportissue/support-legal?section=contact" className={`w-full flex items-center justify-between p-4 transition text-left group cursor-pointer ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/50'}`}>
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-xl transition ${getContrastClass('iconBg')}`}>
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">{t.contactSupport}</p>
                <p className={`text-slate-400 ${subSizeClass}`}>{t.contactSupportDesc}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link href="/reportissue/support-legal?section=privacy" className={`w-full flex items-center justify-between p-4 transition text-left group cursor-pointer ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/50'}`}>
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-xl transition ${getContrastClass('iconBg')}`}>
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">{t.privacyPolicy}</p>
                <p className={`text-slate-400 ${subSizeClass}`}>{t.privacyPolicyDesc}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Logout Button */}
      <button 
        onClick={handleSignOut}
        className={`w-full font-bold text-sm py-4 rounded-2xl transition duration-200 flex items-center justify-center space-x-2 border cursor-pointer ${
          darkMode 
            ? 'bg-red-950/40 hover:bg-red-950/60 text-[#FCA5A5] border-red-900/50' 
            : 'bg-[#FCE8E6] hover:bg-[#FAD4D0] text-[#C92A2A] border-[#F8B4AC]'
        }`}
      >
        <LogOut className="w-4 h-4" />
        <span>{t.logout}</span>
      </button>

    </div>
  );
}
