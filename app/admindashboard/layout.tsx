"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, LayoutDashboard, Layers, Menu, X, User as UserIcon } from "lucide-react";
import { createClient } from "@/app/lib/supabase";
import { useSettings } from "@/app/components/SettingsProvider";

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
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const supabase = createClient();

        const fetchUserAndNotifications = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                // Fetch profile for avatar
                const { data: profileData, error: profileError } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single();
                
                if (profileError) {
                    console.error("Error fetching profile:", profileError);
                } else {
                    setProfile(profileData);
                }

                // Fetch unread notification count
                const { count, error: notifError } = await supabase
                    .from("notifications")
                    .select("*", { count: "exact", head: true })
                    .eq("user_id", user.id)
                    .eq("read", false);
                
                if (notifError) {
                    console.error("Error fetching notifications:", notifError);
                    setUnreadCount(0);
                } else {
                    setUnreadCount(count || 0);
                }
            }
        };

        fetchUserAndNotifications();

        // Poll for new notifications every 30 seconds
        const interval = setInterval(async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { count, error: pollError } = await supabase
                        .from("notifications")
                        .select("*", { count: "exact", head: true })
                        .eq("user_id", user.id)
                        .eq("read", false);
                    
                    if (pollError) {
                        console.error("Error polling notifications:", pollError);
                    } else {
                        setUnreadCount(count || 0);
                    }
                }
            } catch (err) {
                console.error("Polling interval error:", err);
            }
        }, 30000);

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => {
            subscription.unsubscribe();
            clearInterval(interval);
        };
    }, []);

    const getLinkClass = (path: string) => {
        const baseClass = "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition duration-200 ";
        if (pathname === path) {
            return baseClass + "bg-[#3B82F6] text-white shadow-sm";
        }
        return baseClass + (darkMode ? "text-slate-300 hover:bg-slate-700 hover:text-white" : "text-slate-600 hover:bg-slate-200 hover:text-slate-900");
    };
    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
    };

    const BellWithBadge = () => (
        <Link href="/Dashboard/notification" className={`relative p-2 rounded-xl transition cursor-pointer ${darkMode ? 'text-slate-300 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm animate-[bounceIn_300ms_ease-out]">
                    {unreadCount > 99 ? "99+" : unreadCount}
                </span>
            )}
        </Link>
    );

    const ProfileAvatar = ({ size = "w-8 h-8", textSize = "text-xs" }: { size?: string; textSize?: string }) => (
        <Link href="/reportissue/profile" className="group">
            {profile?.avatar_url ? (
                <div className={`${size} rounded-full overflow-hidden flex items-center justify-center shrink-0 border-2 group-hover:border-blue-400 transition shadow-sm ${darkMode ? 'border-slate-600' : 'border-slate-200'}`}>
                    <img
                        src={profile.avatar_url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                    />
                </div>
            ) : (
                <div className={`${size} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold ${textSize} border-2 group-hover:border-blue-400 transition shadow-sm shrink-0 ${darkMode ? 'border-slate-600' : 'border-slate-200'}`}>
                    {user?.email?.charAt(0)?.toUpperCase() || "U"}
                </div>
            )}
        </Link>
    );

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
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden animate-[fadeIn_200ms_ease-out]"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile Sidebar Content */}
            <aside
                className={`fixed inset-y-0 left-0 w-64 border-r flex flex-col pt-6 z-40 transition-all duration-300 md:hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-[#EEF2F6] border-slate-200'} ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
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

                    <div className={`px-3 mt-6 mb-2 text-[10px] font-bold uppercase tracking-wider pt-4 border-t ${darkMode ? 'text-slate-500 border-slate-700' : 'text-slate-400 border-slate-200'}`}>
                        {tNav.generalPages}
                    </div>
                    <Link
                        href="/reportissue"
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition ${darkMode ? 'text-slate-300 hover:bg-slate-700 hover:text-white' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
                    >
                        <span>{tNav.report}</span>
                    </Link>
                    <Link
                        href="/reportissue/historys"
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition ${darkMode ? 'text-slate-300 hover:bg-slate-700 hover:text-white' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
                    >
                        <span>{tNav.history}</span>
                    </Link>
                    <Link
                        href="/reportissue/profile"
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition ${darkMode ? 'text-slate-300 hover:bg-slate-700 hover:text-white' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
                    >
                        <UserIcon className="w-5 h-5" />
                        <span>{tNav.profile}</span>
                    </Link>
                </nav>
            </aside>

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0">

                <header className={`h-16 flex items-center justify-between px-6 md:px-8 shrink-0 border-b transition-colors duration-300 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className={`p-1.5 rounded-lg transition cursor-pointer md:hidden focus:outline-none ${darkMode ? 'text-slate-300 hover:text-white hover:bg-slate-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                            aria-label="Toggle Sidebar"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <Link href="/Dashboard" className={`text-lg md:text-xl font-bold ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>
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

                        <BellWithBadge />
                        <ProfileAvatar />

                        {user && (
                            <div className={`flex items-center space-x-3 pl-3 border-l ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                                <span
                                    className={`max-w-[120px] truncate text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}
                                    title={user.email}
                                >
                                    {profile?.display_name || user.email?.split("@")[0]}
                                </span>
                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center space-x-1 text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition duration-200 cursor-pointer font-semibold"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>{tNav.logout}</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Header Icons */}
                    <div className="flex lg:hidden items-center space-x-2">
                        <BellWithBadge />
                        <ProfileAvatar size="w-7 h-7" textSize="text-[10px]" />
                        <button
                            onClick={handleSignOut}
                            className="flex items-center space-x-1 text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition duration-200 cursor-pointer"
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