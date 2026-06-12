"use client";

import React, { useState, useEffect } from "react";
import { SiGoogle } from "react-icons/si";
import { createClient } from "@/app/lib/supabase";
import { redirectAfterAuth, signInWithEmail } from "@/app/lib/auth-session";
import {
    initLiff,
    isLiffConfigured,
    isInLiffClient,
    isLiffLoggedIn,
    getLiffIdToken,
    liffLogin,
} from "@/app/lib/liff";

const LoginCard = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [liffReady, setLiffReady] = useState(false);
    const [liffAutoLogin, setLiffAutoLogin] = useState(false);
    const [checkingLiff, setCheckingLiff] = useState(false);

    useEffect(() => {
        if (!isLiffConfigured()) return;

        const isLineApp = /Line\//i.test(navigator.userAgent);
        if (!isLineApp) {
            return;
        }

        setCheckingLiff(true);
        let cancelled = false;

        (async () => {
            try {
                await initLiff();
                if (cancelled) return;
                setLiffReady(true);

                if (isLiffLoggedIn()) {
                    setLiffAutoLogin(true);
                    setLoading(true);

                    const idToken = getLiffIdToken();
                    if (idToken) {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 10000);

                        try {
                            const res = await fetch("/api/auth/liff", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "ngrok-skip-browser-warning": "true",
                                },
                                body: JSON.stringify({ idToken }),
                                signal: controller.signal,
                            });
                            clearTimeout(timeoutId);

                            const body = await res.json().catch(() => ({}));
                            if (res.ok && body.role) {
                                redirectAfterAuth(body.role);
                                return;
                            } else {
                                throw new Error(body.error || `API Error: ${res.status}`);
                            }
                        } catch (fetchErr: any) {
                            clearTimeout(timeoutId);
                            throw new Error(`การเชื่อมต่อเซิร์ฟเวอร์ล้มเหลว: ${fetchErr.message}`);
                        }
                    } else {
                        throw new Error("ไม่สามารถดึงข้อมูล Token จาก LINE ได้");
                    }
                } else if (isInLiffClient()) {
                    setLiffAutoLogin(true);
                    liffLogin();
                    setTimeout(() => {
                        if (!cancelled) {
                            const msg = "LINE Login ไม่ตอบสนอง กรุณาลองใหม่อีกครั้ง";
                            setError(msg);
                            window.alert(msg);
                            setCheckingLiff(false);
                            setLiffAutoLogin(false);
                        }
                    }, 5000);
                } else {
                    setCheckingLiff(false);
                }
            } catch (err: any) {
                if (!cancelled) {
                    const errMsg = err?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับ LINE";
                    setError(errMsg);
                    window.alert(errMsg);
                    setLiffReady(false);
                    setLiffAutoLogin(false);
                    setLoading(false);
                    setCheckingLiff(false);
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


    if (liffAutoLogin || checkingLiff) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 w-full">
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
                            {checkingLiff && !liffAutoLogin ? "กำลังตรวจสอบข้อมูลจาก LINE..." : "กำลังเข้าสู่ระบบผ่าน LINE..."}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 w-full">
            <div className="bg-white p-10 rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md">
                <div className="text-center mb-8">
                    <h2 className="text-lg font-bold text-gray-900">Community Connect</h2>
                    <h1 className="text-2xl font-bold text-gray-900 mt-1">Admin Login</h1>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}

                <form className="space-y-5" onSubmit={handleLogin}>
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1.5" htmlFor="email">
                            อีเมลแอดมิน
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            placeholder="[EMAIL_ADDRESS]"
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

                    <button
                        type="submit"
                        className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold px-6 py-3 rounded-lg transition duration-200 mt-2 shadow-md flex items-center justify-center cursor-pointer disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginCard;
