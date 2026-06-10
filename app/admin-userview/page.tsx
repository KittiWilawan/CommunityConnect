"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { normalizeRole } from "@/app/lib/roles";
import UserDashboardPage from "@/app/Dashboard/page";

export default function AdminUserViewPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) {
          router.push("/");
          return;
        }
        const profile = await res.json().catch(() => ({}));
        const role = normalizeRole(profile?.role);
        if (role !== "admin") {
          router.push("/Dashboard");
          return;
        }
        setAllowed(true);
      } finally {
        setChecking(false);
      }
    };

    checkRole();
  }, [router]);

  if (checking) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (!allowed) return null;

  return (
    <div>
      <UserDashboardPage />
    </div>
  );
}