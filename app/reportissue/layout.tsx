"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';

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
              <Link href="/Dashboard/notification">
                <Bell className="w-6 h-6" />
              </Link>
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