"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Menu, X, User as UserIcon } from "lucide-react";
import { createClient } from "@/app/lib/supabase";
import { useSettings } from "@/app/components/SettingsProvider";
import ProfileAvatar from "@/app/components/ProfileAvatar";
import NotificationBell from "@/app/components/NotificationBell";
import { signOutUser } from "@/app/lib/sign-out";
import { normalizeRole } from "@/app/lib/roles";
import { getLogoutButtonClass, getLogoutMobileButtonClass } from "@/app/lib/logout-button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { darkMode, largeText, language } = useSettings();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const loadHeaderData = async () => {
      try {
        const profileRes = await fetch("/api/profile");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
          setUser({ email: profileData.email, id: profileData.id });
          if (normalizeRole(profileData.role) === "admin") {
            router.push("/admindashboard");
          }
          return;
        }
      } catch {
        // ignore & fallback
      }

      try {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);
        const role = authUser?.user_metadata?.role || "member";
        setProfile({ role });
        if (normalizeRole(role) === "admin") {
          router.push("/admindashboard");
        }
      } catch {
        // ignore
      }
    };

    loadHeaderData();
  }, [router]);

  const handleSignOut = async () => {
    if (!confirm(language === "th" ? "คุณต้องการออกจากระบบใช่หรือไม่?" : "Are you sure you want to log out?")) {
      return;
    }

    try {
      await signOutUser();
      router.push("/");
      router.refresh();
    } catch {
      alert(language === "th" ? "ไม่สามารถออกจากระบบได้ กรุณาลองใหม่อีกครั้ง" : "Could not sign out. Please try again.");
    }
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const actualRole = normalizeRole(profile?.role);
  const userRole = actualRole;
  const isAdmin = actualRole === "admin";

  const tNav = {
    report: language === 'th' ? 'แจ้งปัญหา' : 'Report an Issue',
    history: language === 'th' ? 'ประวัติของฉัน' : 'My History',
    profile: language === 'th' ? 'โปรไฟล์' : 'Profile',
    logout: language === 'th' ? 'ออกจากระบบ' : 'Logout',
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans relative transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      <div className="flex-1 flex flex-col min-w-0">
        <header className={`h-16 flex items-center justify-between px-6 md:px-8 shrink-0 relative z-25 border-b transition-colors duration-300 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <Link
            href="/Dashboard"
            className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}
          >
            Community Connect
          </Link>

          {/* Desktop Navigation */}
          <div className={`hidden md:flex items-center space-x-5 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            <Link
              href="/reportissue"
              className={`transition ${pathname === '/reportissue' ? 'text-[#3B82F6] font-semibold' : darkMode ? 'hover:text-white' : 'hover:text-slate-900'}`}
            >
              {tNav.report}
            </Link>
            <Link
              href="/reportissue/historys"
              className={`transition ${pathname === '/reportissue/historys' ? 'text-[#3B82F6] font-semibold' : darkMode ? 'hover:text-white' : 'hover:text-slate-900'}`}
            >
              {tNav.history}
            </Link>

            <NotificationBell darkMode={darkMode} language={language} userRole={userRole} />
            <ProfileAvatar darkMode={darkMode} />

            {user && (
              <div className={`flex items-center space-x-3 pl-3 border-l ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                <span
                  className={`max-w-[120px] truncate text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}
                  title={user.email}
                >
                  {profile?.display_name || user.email?.split("@")[0]}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className={getLogoutButtonClass(darkMode)}
                >
                  <LogOut className="w-4 h-4" />
                  <span>{tNav.logout}</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Toggle & Bell */}
          <div className="flex md:hidden items-center space-x-2">
            <NotificationBell darkMode={darkMode} language={language} userRole={userRole} />
            <ProfileAvatar darkMode={darkMode} size="w-7 h-7" textSize="text-[10px]" />

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6.5 h-6.5" /> : <Menu className="w-6.5 h-6.5" />}
            </button>
          </div>
        </header>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className={`md:hidden border-b shadow-lg absolute top-16 left-0 right-0 z-20 flex flex-col px-6 py-4 space-y-4 animate-[slideDown_200ms_ease-out] ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <Link
              href="/reportissue"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition ${pathname === '/reportissue' ? 'bg-blue-50 text-[#3B82F6]' : darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              {tNav.report}
            </Link>
            <Link
              href="/reportissue/historys"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition ${pathname === '/reportissue/historys' ? 'bg-blue-50 text-[#3B82F6]' : darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              {tNav.history}
            </Link>
            <Link
              href="/reportissue/profile"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition flex items-center space-x-2 ${pathname === '/reportissue/profile' ? 'bg-blue-50 text-[#3B82F6]' : darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>{tNav.profile}</span>
            </Link>

            {user && (
              <div className={`pt-4 border-t flex flex-col space-y-3 ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                <span className={`text-xs px-4 truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} title={user.email}>
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className={getLogoutMobileButtonClass(darkMode)}
                >
                  <LogOut className="w-4 h-4" />
                  <span>{tNav.logout}</span>
                </button>
              </div>
            )}
          </div>
        )}

        <main className="p-4 md:p-8 flex-1 overflow-y-auto">{children}</main>
      </div>

      <style jsx global>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes bounceIn {
          0% { transform: scale(0); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
