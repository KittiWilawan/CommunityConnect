"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Layers, Users, Bell } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const getLinkClass = (path: string) => {
    const baseClass = "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition duration-200 ";
    if (pathname === path) {
      return baseClass + "bg-[#3B82F6] text-white shadow-sm";
    }
    return baseClass + "text-slate-600 hover:bg-slate-200 hover:text-slate-900";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">

      <aside className="w-64 bg-[#EEF2F6] border-r border-slate-200 flex flex-col pt-6 shrink-0">
        <div className="px-6 mb-6">
          <h2 className="text-sm font-bold text-slate-700">Admin Panel</h2>
          <p className="text-xs text-slate-500">Manage Utility Data</p>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          <Link href="/Dashboard" className={getLinkClass('/Dashboard')}>
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>

          <Link href="/Dashboard/categories" className={getLinkClass('/categories')}>
            <Layers className="w-5 h-5" />
            <span>Issue Categories</span>
          </Link>

          <Link href="/Dashboard/management" className={getLinkClass('/management')}>
            <Users className="w-5 h-5" />
            <span>Staff Management</span>
          </Link>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">

        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shrink-0">
          <Link href="/Dashboard" className="text-xl font-bold text-[#0F172A]">Community Connect</Link>

          <div className="flex items-center space-x-6 text-sm font-medium text-slate-600">
            <Link href="/reportissue" className="hover:text-slate-900 transition">
              Report an Issue
            </Link>
            <Link href="/reportissue/historys" className="hover:text-slate-900 transition">
              My History
            </Link>
            <Link href="/reportissue/profile" className="hover:text-slate-900 transition">Profile</Link>

            <button className="relative p-1 text-slate-400 hover:text-slate-600 transition">
              <Bell className="w-6 h-6" />
            </button>
          </div>
        </header>
        <main className="p-8 flex-1 overflow-y-auto">
          {children}
        </main>

      </div>
    </div>
  );
}