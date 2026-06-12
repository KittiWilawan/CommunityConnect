import React from "react";
import { redirect } from "next/navigation";
import LoginCard from "./Login/page";
import { createClient } from "@/app/lib/supabase-server";

const App = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const role = profile?.role || "member";
    redirect(role === "admin" ? "/admindashboard" : "/Dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between p-6 md:p-12 text-gray-900 font-sans">
      <main className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col items-start space-y-8">
          <span className="bg-sky-100 text-sky-700 text-xs font-semibold px-4 py-1 rounded-full">
            เข้าสู่ระบบผู้ใช้งาน
          </span>
          <h1 className="text-3xl md:text-4xl font-bold leading-snug">
            เชื่อมต่อ ชุมชน สู่การ
            <br />
            เปลี่ยนแปลงที่ดีกว่า
          </h1>

          {/* Description Text */}
          <p className="text-gray-600 leading-relaxed max-w-lg">
            แพลตฟอร์มแจ้งปัญหาและพัฒนาสาธารณูปโภคเพื่อคนในชุมชน สะดวก รวดเร็ว
            และตรวจสอบได้ในที่เดียว เพื่อสร้างสภาพแวดล้อมที่น่าอยู่ไปด้วยกัน
          </p>

          {/* Bottom Info Row */}
          <div className="flex space-x-6 pt-4 text-sm text-gray-700">
            {/* Info 1 */}
            <div className="flex items-center space-x-2">
              <svg
                className="w-5 h-5 text-gray-900"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>ข้อมูลปลอดภัย</span>
            </div>

            {/* Info 2 */}
            <div className="flex items-center space-x-2">
              <svg
                className="w-5 h-5 text-gray-900"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <polyline points="13 2 13 9 20 9" />
              </svg>
              <span>แจ้งผลรวดเร็ว</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center md:justify-end">
          <LoginCard />
        </div>
      </main>

      {/* Footer */}
      <footer className="pt-12 text-center text-xs text-gray-400">
        &copy; 2024 Community Connect Utility. All rights reserved.
      </footer>
    </div>
  );
};

export default App;