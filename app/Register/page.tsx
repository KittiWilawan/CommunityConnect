"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/app/lib/supabase";
import { redirectAfterAuth, signInWithEmail } from "@/app/lib/auth-session";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            phone: phone,
            role: role,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      const { role: signedInRole } = await signInWithEmail(email, password);
      redirectAfterAuth(signedInRole || role);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-gray-900 font-sans">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8 md:p-10">
        <div className="mb-8">
          <Link
            href="/"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition duration-200 inline-flex items-center space-x-1 text-sm font-semibold mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับ</span>
          </Link>
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-900">Community Connect</h2>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">สมัครสมาชิก</h1>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleRegister}>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5" htmlFor="email">
              อีเมลผู้ใช้งาน <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-200 focus:border-sky-300 transition text-gray-900 bg-white"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5" htmlFor="password">
              รหัสผ่าน <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              required
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-200 focus:border-sky-300 transition text-gray-900 bg-white"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5" htmlFor="confirm-password">
              ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              placeholder="********"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-200 focus:border-sky-300 transition text-gray-900 bg-white"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5" htmlFor="tel">
              เบอร์มือถือ
            </label>
            <input
              id="tel"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="088-888-8888"
              value={phone}
              onChange={(e) => {
                const onlyNums = e.target.value.replace(/[^0-9]/g, "");
                setPhone(onlyNums);
              }}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-200 focus:border-sky-300 transition text-gray-900 bg-white"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-lg transition duration-200 mt-2 shadow-md flex items-center justify-center cursor-pointer disabled:opacity-50 font-bold"
            disabled={loading}
          >
            {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;