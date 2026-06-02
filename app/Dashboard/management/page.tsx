"use client";

import React, { useState } from 'react';
import { UserCheck, CalendarDays, Contact, PhoneCall, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function StaffRosterPage() {
  const [activeTab, setActiveTab] = useState('All Staff');
  const staffList = [
    {
      id: 1,
      name: 'John Doe',
      role: 'Senior Electrician',
      thaiRole: 'ช่างไฟฟ้าอาวุโส',
      category: 'Electricians',
      status: 'AVAILABLE',
      image: '',
    },
    {
      id: 2,
      name: 'Joe Dohn',
      role: 'Senior Plumbing',
      thaiRole: 'ช่างประปาอาวุโส',
      category: 'Plumbing',
      status: 'AVAILABLE',
      image: '',
    },
    {
      id: 3,
      name: 'Som John',
      role: 'Senior Civil',
      thaiRole: 'ช่างประปาอาวุโส',
      category: 'Civil',
      status: 'AVAILABLE',
      image: '',
    },
    {
      id: 4,
      name: 'Joe John',
      role: 'Senior Electrician',
      thaiRole: 'ช่างไฟฟ้าอาวุโส',
      category: 'Electricians',
      status: 'UNAVAILABLE',
      image: '',
    }
  ];

  const tabs = ['All Staff', 'Electricians', 'Plumbing', 'Civil'];

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">ADMINISTRATIVE DASHBOARD</p>
        <h1 className="text-2xl font-bold text-[#0F172A] mt-0.5">Staff Roster</h1>
        <p className="text-xs font-medium text-slate-500 mt-0.5">บัญชีรายชื่อเจ้าหน้าที่</p>
      </div>
      <Link
        href="/Dashboard/management/addstaff"
        className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-sm py-4 rounded-xl transition duration-200 flex items-center justify-center space-x-2 shadow-md active:scale-[0.99]"
      >
        <PlusCircle className="w-5 h-5" />
        <div className="text-left">
          <p className="font-bold text-sm leading-none">Add New Staff</p>
          <p className="text-[10px] font-normal text-slate-300 mt-1 leading-none">
            เพิ่มเจ้าหน้าที่
          </p>
        </div>
      </Link>

      <div className="grid grid-cols-2 gap-4 space-y-2  ">
        <div className="bg-[#DCE4EC] rounded-2xl p-5 border border-slate-200/60 shadow-sm relative overflow-hidden">
          <UserCheck className="w-5 h-5 text-slate-700 absolute top-5 left-5" />
          <div className="pt-6">
            <span className="text-4xl font-bold text-[#0F172A]">1</span>
            <p className="text-sm font-bold text-slate-700 mt-1">On Duty</p>
            <p className="text-[11px] text-slate-500 font-medium">กำลังปฏิบัติงาน</p>
          </div>
        </div>

        <div className="bg-[#E8F0FE] rounded-2xl p-5 border border-blue-100 shadow-sm relative overflow-hidden">
          <CalendarDays className="w-5 h-5 text-blue-600 absolute top-5 left-5" />
          <div className="pt-6">
            <span className="text-4xl font-bold text-blue-600">3</span>
            <p className="text-sm font-bold text-slate-700 mt-1">Available</p>
            <p className="text-[11px] text-slate-500 font-medium">พร้อมทำงาน</p>
          </div>
        </div>

      </div>

      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition duration-200 shrink-0 ${activeTab === tab
              ? 'bg-[#0F172A] text-white shadow-sm'
              : 'bg-[#E2E8F0] text-slate-600 hover:bg-slate-300/80'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {staffList
          .filter(staff => activeTab === 'All Staff' || staff.category === activeTab)
          .map((staff) => (
            <div
              key={staff.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <img
                    src={staff.image || '/avatar-placeholder.png'} // รูปภาพจนท.
                    alt={staff.name}
                    className="w-14 h-14 rounded-xl object-cover shadow-sm border border-slate-100"
                  />
                  <div>
                    <h2 className="text-lg font-bold text-[#0F172A]">{staff.name}</h2>
                    <p className="text-xs font-semibold text-slate-500">{staff.role}</p>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">{staff.thaiRole}</p>
                  </div>
                </div>


                <span className="bg-[#E6F4EA] text-[#137333] text-[11px] font-bold px-3 py-1 rounded-lg border border-[#CEEAD6]">
                  {staff.status}
                </span>
              </div>


              <div className="grid grid-cols-2 gap-3 space-y-2">
                <button className="bg-[#0066B2] hover:bg-[#005291] text-white font-bold text-sm py-3 rounded-xl transition duration-200 flex items-center justify-center space-x-2 shadow-sm">
                  <Contact className="w-4 h-4" />
                  <span>Assign</span>
                </button>

                <button className="bg-white hover:bg-slate-50 text-[#0066B2] border-2 border-[#0066B2] font-bold text-sm py-3 rounded-xl transition duration-200 flex items-center justify-center space-x-2">
                  <PhoneCall className="w-4 h-4" />
                  <span>Call</span>
                </button>
              </div>

            </div>
          ))}
      </div>

    </div>
  );
}