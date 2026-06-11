"use client";

import React, { useState, useEffect } from "react";
import { SiLine, SiGoogle } from "react-icons/si";
import { createClient } from "@/app/lib/supabase";
import { redirectAfterAuth, signInWithEmail } from "@/app/lib/auth-session";
import {
  initLiff,
  isLiffConfigured,
  isInLiffClient,
  isLiffLoggedIn,
  getLiffIdToken,
} from "@/app/lib/liff";

const LoginCard = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liffReady, setLiffReady] = useState(false);
  const [liffAutoLogin, setLiffAutoLogin] = useState(false);

  // Initialize LIFF on mount — if running inside LINE, auto-login
  useEffect(() => {
    if (!isLiffConfigured()) return;

    let cancelled = false;

    (async () => {
      try {
        await initLiff();
        if (cancelled) return;
        setLiffReady(true);

        // If running inside LINE in-app browser and user is logged in → auto-login
        if (isInLiffClient() && isLiffLoggedIn()) {
          setLiffAutoLogin(true);
          setLoading(true);

          const idToken = getLiffIdToken();
          if (idToken) {
            const res = await fetch("/api/auth/liff", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken }),
            });

            const body = await res.json().catch(() => ({}));

            if (res.ok && body.role) {
              redirectAfterAuth(body.role);
              return;
            }
          }

          // Auto-login failed — fall back to normal login
          setLiffAutoLogin(false);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setLiffReady(false);
          setLiffAutoLogin(false);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { role } = await signInWithEmail(email, password);
      redirectAfterAuth(role);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: "profile openid email",
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ Google");
      setLoading(false);
    }
  };

  const handleLineLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // If LIFF is ready and we're in LINE client, use LIFF login
      if (liffReady && isInLiffClient()) {
        const idToken = getLiffIdToken();
        if (idToken) {
          const res = await fetch("/api/auth/liff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });

          const body = await res.json().catch(() => ({}));

          if (res.ok && body.role) {
            redirectAfterAuth(body.role);
            return;
          }
        }
      }

      // Fallback: use standard Supabase OAuth flow for LINE
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "line" as any,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: "profile openid email",
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ LINE");
      setLoading(false);
    }
  };

  // Show loading screen when LIFF auto-login is in progress
  if (liffAutoLogin) {
    return (
      <div className="bg-white p-10 rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md flex flex-col items-center justify-center min-h-[200px]">
        <div className="flex items-center space-x-3">
          <svg
            className="animate-spin h-6 w-6 text-green-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-gray-700 font-semibold">
            กำลังเข้าสู่ระบบผ่าน LINE...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-10 rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-lg font-bold text-gray-900">Community Connect</h2>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">ลงชื่อเข้าใช้งาน</h1>
        <p className="text-sm text-gray-600 mt-2">เลือกช่องทางที่คุณสะดวกเพื่อเริ่มต้น</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      <div className="space-y-4 mb-8">
        <button
          onClick={handleLineLogin}
          className="w-full flex items-center justify-center space-x-3 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2.5 rounded-lg transition duration-200 cursor-pointer"
          disabled={loading}
        >
          <SiLine className="w-6 h-6" />
          <span>เข้าสู่ระบบด้วย LINE</span>
        </button>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-gray-100 text-gray-700 font-medium px-6 py-2.5 rounded-lg border border-gray-300 transition duration-200 shadow-sm cursor-pointer"
          disabled={loading}
        >
          <SiGoogle className="w-5 h-5" />
          <span>เข้าสู่ระบบด้วย Google</span>
        </button>
      </div>

      <div className="flex items-center mb-6">
        <div className="flex-grow border-t border-gray-200"></div>
        <span className="flex-shrink mx-4 text-sm text-gray-400 font-medium">หรือ</span>
        <div className="flex-grow border-t border-gray-200"></div>
      </div>

      <form className="space-y-5" onSubmit={handleLogin}>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1.5" htmlFor="email">
            อีเมลผู้ใช้งาน
          </label>
          <input
            id="email"
            type="email"
            required
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-200 focus:border-sky-300 transition text-gray-900"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1.5" htmlFor="password">
            รหัสผ่าน
          </label>
          <input
            id="password"
            type="password"
            required
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-200 focus:border-sky-300 transition text-gray-900"
            disabled={loading}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center space-x-2 text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="form-checkbox h-4 w-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
              disabled={loading}
            />
            <span>จดจำฉัน</span>
          </label>
          <a href="/forgotpassword" className="text-sky-700 font-semibold hover:text-sky-800 transition">
            ลืมรหัสผ่าน?
          </a>
        </div>

        <button
          type="submit"
          className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold px-6 py-3 rounded-lg transition duration-200 mt-2 shadow-md flex items-center justify-center cursor-pointer disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>
      </form>

      <div className="text-center mt-10 text-sm text-gray-600">
        ยังไม่มีบัญชี?{" "}
        <a href="/Register" className="text-sky-700 font-bold hover:text-sky-800 transition">
          สมัครใช้งานฟรี
        </a>
      </div>
    </div>
  );
};

export default LoginCard;
