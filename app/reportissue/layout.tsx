"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Menu, X, User as UserIcon } from "lucide-react";
import { createClient } from "@/app/lib/supabase";
import { useSettings } from "@/app/components/SettingsProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { darkMode, language } = useSettings();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const fetchUserAndNotifications = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          console.log("No user found in ReportIssue Layout, but let Middleware handle redirect");
          setAuthChecked(true);
          return;
        }

        setUser(user);

        // Fetch profile for avatar - wrap in try-catch to not block authChecked
        try {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
          if (profileData) setProfile(profileData);
        } catch (e) {
          console.error("Profile fetch error in layout:", e);
        }

        // Fetch unread notification count
        try {
          const { count } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("read", false);
          setUnreadCount(count || 0);
        } catch (e) {
          console.error("Notification fetch error in layout:", e);
        }
      } catch (err) {
        console.error("Layout auth error:", err);
      } finally {
        setAuthChecked(true);
      }
    };

    fetchUserAndNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { count } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("read", false);
          setUnreadCount(count || 0);
        }
      } catch {
        // Silently ignore polling errors
      }
    }, 30000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state change in ReportIssue Layout:", event);
      setUser(session?.user ?? null);
      if (event === 'SIGNED_OUT') {
        router.push("/");
      }
    });

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add debug logging
  useEffect(() => {
    console.log("ReportIssue Layout state:", { authChecked, user: user?.email, profile: profile?.display_name });
  }, [authChecked, user, profile]);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      // Wait a moment for the sign out to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Sign out error:", err);
      router.push("/");
    }
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const BellWithBadge = () => (
    <Link
      href="/Dashboard/notification"
      className={`relative p-2 rounded-xl transition cursor-pointer ${
        darkMode
          ? "text-slate-300 hover:text-white hover:bg-slate-700"
          : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
      }`}
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm animate-[bounceIn_300ms_ease-out]">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );

  const ProfileAvatar = ({
    size = "w-8 h-8",
    textSize = "text-xs",
  }: {
    size?: string;
    textSize?: string;
  }) => (
    <Link href="/reportissue/profile" className="group">
      {profile?.avatar_url ? (
        <div
          className={`${size} rounded-full overflow-hidden flex items-center justify-center shrink-0 border-2 group-hover:border-blue-400 transition shadow-sm ${
            darkMode ? "border-slate-600" : "border-slate-200"
          }`}
        >
          <img
            src={profile.avatar_url}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div
          className={`${size} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold ${textSize} border-2 group-hover:border-blue-400 transition shadow-sm shrink-0 ${
            darkMode ? "border-slate-600" : "border-slate-200"
          }`}
        >
          {user?.email?.charAt(0)?.toUpperCase() || "U"}
        </div>
      )}
    </Link>
  );

  const tNav = {
    report: language === "th" ? "แจ้งปัญหา" : "Report an Issue",
    history: language === "th" ? "ประวัติของฉัน" : "My History",
    profile: language === "th" ? "โปรไฟล์" : "Profile",
    logout: language === "th" ? "ออกจากระบบ" : "Logout",
  };

  // Show nothing while checking auth to avoid flash of unauthenticated content
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans relative transition-colors duration-300 ${
        darkMode ? "bg-slate-900 text-slate-100" : "bg-slate-50 text-slate-800"
      }`}
    >
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className={`h-16 flex items-center justify-between px-6 md:px-8 shrink-0 relative z-25 border-b transition-colors duration-300 ${
            darkMode
              ? "bg-slate-800 border-slate-700"
              : "bg-white border-slate-200"
          }`}
        >
          <Link
            href="/Dashboard"
            className={`text-xl font-bold ${
              darkMode ? "text-white" : "text-[#0F172A]"
            }`}
          >
            Community Connect
          </Link>

          {/* Desktop Navigation */}
          <div
            className={`hidden md:flex items-center space-x-5 text-sm font-medium ${
              darkMode ? "text-slate-300" : "text-slate-600"
            }`}
          >
            <Link
              href="/reportissue"
              className={`transition ${
                pathname === "/reportissue"
                  ? "text-[#3B82F6] font-semibold"
                  : darkMode
                  ? "hover:text-white"
                  : "hover:text-slate-900"
              }`}
            >
              {tNav.report}
            </Link>
            <Link
              href="/reportissue/historys"
              className={`transition ${
                pathname === "/reportissue/historys"
                  ? "text-[#3B82F6] font-semibold"
                  : darkMode
                  ? "hover:text-white"
                  : "hover:text-slate-900"
              }`}
            >
              {tNav.history}
            </Link>

            <BellWithBadge />
            <ProfileAvatar />

            {user && (
              <div
                className={`flex items-center space-x-3 pl-3 border-l ${
                  darkMode ? "border-slate-700" : "border-slate-200"
                }`}
              >
                <span
                  className={`max-w-[120px] truncate text-xs ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                  title={user.email}
                >
                  {profile?.display_name || user.email?.split("@")[0]}
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleSignOut();
                  }}
                  className="flex items-center space-x-1 text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition duration-200 cursor-pointer font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{tNav.logout}</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Toggle & Bell */}
          <div className="flex md:hidden items-center space-x-2">
            <BellWithBadge />
            <ProfileAvatar size="w-7 h-7" textSize="text-[10px]" />

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </header>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div
            className={`md:hidden border-b shadow-lg absolute top-16 left-0 right-0 z-20 flex flex-col px-6 py-4 space-y-4 animate-[slideDown_200ms_ease-out] ${
              darkMode
                ? "bg-slate-800 border-slate-700"
                : "bg-white border-slate-200"
            }`}
          >
            <Link
              href="/reportissue"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
                pathname === "/reportissue"
                  ? "bg-blue-50 text-[#3B82F6]"
                  : darkMode
                  ? "text-slate-300 hover:bg-slate-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tNav.report}
            </Link>
            <Link
              href="/reportissue/historys"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
                pathname === "/reportissue/historys"
                  ? "bg-blue-50 text-[#3B82F6]"
                  : darkMode
                  ? "text-slate-300 hover:bg-slate-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tNav.history}
            </Link>
            <Link
              href="/reportissue/profile"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition flex items-center space-x-2 ${
                pathname === "/reportissue/profile"
                  ? "bg-blue-50 text-[#3B82F6]"
                  : darkMode
                  ? "text-slate-300 hover:bg-slate-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>{tNav.profile}</span>
            </Link>

            {user && (
              <div
                className={`pt-4 border-t flex flex-col space-y-3 ${
                  darkMode ? "border-slate-700" : "border-slate-100"
                }`}
              >
                <span
                  className={`text-xs px-4 truncate ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                  title={user.email}
                >
                  {user.email}
                </span>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full flex items-center justify-center space-x-2 text-red-500 hover:text-red-700 hover:bg-red-50 py-3 rounded-lg transition duration-200 cursor-pointer font-bold text-sm bg-red-50/50"
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
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.3);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
