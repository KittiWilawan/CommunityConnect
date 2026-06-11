"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, LayoutDashboard, Layers, Menu, X, User as UserIcon } from "lucide-react";
import { useSettings } from "@/app/components/SettingsProvider";
import ProfileAvatar from "@/app/components/ProfileAvatar";
import NotificationBell from "@/app/components/NotificationBell";
import { signOutUser } from "@/app/lib/sign-out";
import { normalizeRole } from "@/app/lib/roles";
import { getLogoutButtonClass } from "@/app/lib/logout-button";
import { createClient } from "@/app/lib/supabase";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { darkMode, largeText, language } = useSettings();
    const [sidebarOpen, setSidebarOpen] = useState(false);
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
                    if (normalizeRole(profileData.role) !== "admin") {
                        router.push("/Dashboard");
                    }
                    return;
                } else if (profileRes.status === 401) {
                    router.push("/");
                    return;
                }
            } catch {
                // fallback below
            }

            // Fallback: still try to determine role from auth metadata
            try {
                const supabase = createClient();
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (!authUser) {
                    router.push("/");
                    return;
                }
                setUser(authUser);
                const role = authUser?.user_metadata?.role || "member";
                setProfile({ role });
                if (normalizeRole(role) !== "admin") {
                    router.push("/Dashboard");
                }
            } catch {
                router.push("/");
            }
        };

        loadHeaderData();
    }, [router]);

    const userRole = normalizeRole(profile?.role);
    const isAdmin = userRole === "admin";

    const getLinkClass = (path: string) => {
        const baseClass = "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition duration-200 ";
        if (pathname === path) {
            return baseClass + "bg-[#3B82F6] text-white shadow-sm";
        }
        return baseClass + (darkMode ? "text-slate-300 hover:bg-slate-700 hover:text-white" : "text-slate-600 hover:bg-slate-200 hover:text-slate-900");
    };

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

    const tNav = {
        report: language === 'th' ? 'แจ้งปัญหา' : 'Report an Issue',
        history: language === 'th' ? 'ประวัติของฉัน' : 'My History',
        profile: language === 'th' ? 'โปรไฟล์' : 'Profile',
        logout: language === 'th' ? 'ออกจากระบบ' : 'Logout',
        dashboard: 'Dashboard',
        categories: 'Issue Categories',
        adminPanel: 'Admin Panel',
        manageData: language === 'th' ? 'จัดการข้อมูลระบบ' : 'Manage Utility Data',
        generalPages: language === 'th' ? 'หน้าทั่วไป' : 'General Pages',
        adminControls: language === 'th' ? 'เครื่องมือแอดมิน' : 'Admin Controls',
    };

    return (
        <div className={`min-h-screen flex font-sans relative transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>

            {/* Desktop Sidebar */}
            <aside className={`hidden md:flex w-64 border-r flex-col pt-6 shrink-0 transition-colors duration-300 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-[#EEF2F6] border-slate-200'}`}>
                <div className="px-6 mb-6">
                    <h2 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-700'}`}>{tNav.adminPanel}</h2>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{tNav.manageData}</p>
                </div>

                <nav className="flex-1 space-y-1 px-3">
                    <Link href="/admindashboard" className={getLinkClass('/admindashboard')}>
                        <LayoutDashboard className="w-5 h-5" />
                        <span>{tNav.dashboard}</span>
                    </Link>

                    <Link href="/admindashboard/categories" className={getLinkClass('/admindashboard/categories')}>
                        <Layers className="w-5 h-5" />
                        <span>{tNav.categories}</span>
                    </Link>

                    <Link href="/admin-userview" className={getLinkClass('/admin-userview')}>
                        <UserIcon className="w-5 h-5" />
                        <span>{language === "th" ? "ดูมุมมองผู้ใช้" : "User View Preview"}</span>
                    </Link>

                    <div className={`px-3 mt-6 mb-2 text-[10px] font-bold uppercase tracking-wider pt-4 border-t ${darkMode ? 'text-slate-500 border-slate-700' : 'text-slate-400 border-slate-200'}`}>
                        {tNav.generalPages}
                    </div>
                    <Link href="/reportissue" className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition ${darkMode ? 'text-slate-300 hover:bg-slate-700 hover:text-white' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}>
                        <span>{tNav.report}</span>
                    </Link>
                    <Link href="/reportissue/historys" className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition ${darkMode ? 'text-slate-300 hover:bg-slate-700 hover:text-white' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}>
                        <span>{tNav.history}</span>
                    </Link>
                    <Link href="/reportissue/profile" className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition ${darkMode ? 'text-slate-300 hover:bg-slate-700 hover:text-white' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}>
                        <UserIcon className="w-5 h-5" />
                        <span>{tNav.profile}</span>
                    </Link>
                </nav>
            </aside>

            {/* Mobile Sidebar Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1008] md:hidden animate-[fadeIn_200ms_ease-out]"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            <aside
                className={`fixed inset-y-0 left-0 w-64 border-r flex flex-col pt-6 z-[1009] transition-all duration-300 md:hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-[#EEF2F6] border-slate-200'} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                style={{ visibility: sidebarOpen ? 'visible' : 'hidden' }}
            >
                <div className="px-6 mb-6 flex items-center justify-between">
                    <div>
                        <h2 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-700'}`}>{tNav.adminPanel}</h2>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{tNav.manageData}</p>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'}`}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 space-y-1 px-3">
                    <div className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        {tNav.adminControls}
                    </div>
                    <Link
                        href="/admindashboard"
                        onClick={() => setSidebarOpen(false)}
                        className={getLinkClass('/admindashboard')}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        <span>{tNav.dashboard}</span>
                    </Link>

                    <Link
                        href="/admindashboard/categories"
                        onClick={() => setSidebarOpen(false)}
                        className={getLinkClass('/admindashboard/categories')}
                    >
                        <Layers className="w-5 h-5" />
                        <span>{tNav.categories}</span>
                    </Link>

                    <Link
                        href="/admin-userview"
                        onClick={() => setSidebarOpen(false)}
                        className={getLinkClass('/admin-userview')}
                    >
                        <UserIcon className="w-5 h-5" />
                        <span>{language === "th" ? "ดูมุมมองผู้ใช้" : "User View Preview"}</span>
                    </Link>

                    <div className={`px-3 mt-6 mb-2 text-[10px] font-bold uppercase tracking-wider pt-4 border-t ${darkMode ? 'text-slate-500 border-slate-700' : 'text-slate-400 border-slate-200'}`}>
                        {tNav.generalPages}
                    </div>
                    <Link
                        href="/reportissue"
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition ${darkMode ? 'text-slate-300 hover:bg-slate-700 hover:text-white' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}>
                        <span>{tNav.report}</span>
                    </Link>
                    <Link
                        href="/reportissue/historys"
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition ${darkMode ? 'text-slate-300 hover:bg-slate-700 hover:text-white' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}>
                        <span>{tNav.history}</span>
                    </Link>
                    <Link
                        href="/reportissue/profile"
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition ${darkMode ? 'text-slate-300 hover:bg-slate-700 hover:text-white' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}>
                        <UserIcon className="w-5 h-5" />
                        <span>{tNav.profile}</span>
                    </Link>
                </nav>
            </aside>

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0">

                <header className={`h-16 flex items-center  justify-between px-6 md:px-8 shrink-0 border-b relative z-[1010] transition-colors duration-300 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className={`p-1.5 rounded-lg transition cursor-pointer md:hidden focus:outline-none ${darkMode ? 'text-slate-300 hover:text-white hover:bg-slate-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                            aria-label="Toggle Sidebar"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <Link href="/admindashboard" className={`text-lg md:text-xl font-bold ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                            Community Connect
                        </Link>
                    </div>

                    {/* Desktop Header Links */}
                    <div className={`hidden lg:flex items-center space-x-5 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        <Link href="/reportissue" className={`transition ${darkMode ? 'hover:text-white' : 'hover:text-slate-900'}`}>
                            {tNav.report}
                        </Link>
                        <Link href="/reportissue/historys" className={`transition ${darkMode ? 'hover:text-white' : 'hover:text-slate-900'}`}>
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

                    {/* Mobile Header Icons */}
                    <div className="flex lg:hidden items-center space-x-2">
                        <NotificationBell darkMode={darkMode} language={language} userRole={userRole} />

                        <button
                            type="button"
                            onClick={handleSignOut}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${darkMode ? "text-red-400 hover:text-red-300 hover:bg-red-950/40" : "text-red-500 hover:text-red-700 hover:bg-red-50"}`}
                            title={tNav.logout}
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <main className="p-4 md:p-8 flex-1 overflow-y-auto">
                    {children}
                </main>

            </div>

            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
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
