"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Phone, Mail, Loader2, Save, CheckCircle, Camera, X, MapPin, FileText, Type } from "lucide-react";
import { createClient } from "@/app/lib/supabase";
import { useSettings } from "@/app/components/SettingsProvider";

export default function EditProfilePage() {
  const router = useRouter();
  const { language } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          // Let Middleware handle redirect
          setLoading(false);
          return;
        }

        setEmail(user.email || "");

        // Fetch user profile from database table
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!profileError && profileData) {
          setPhone(profileData.phone || "");
          setDisplayName(profileData.display_name || "");
          setAvatarUrl(profileData.avatar_url || "");
          setAvatarPreview(profileData.avatar_url || "");
          setAddress(profileData.address || "");
          setBio(profileData.bio || "");
        } else {
          setPhone(user.user_metadata?.phone || "");
        }
      } catch (err) {
        console.error("Error loading profile details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const t = {
    avatarSizeError: language === "th" ? "ไฟล์รูปภาพต้องมีขนาดไม่เกิน 2MB" : "Image file size must not exceed 2MB",
    avatarTypeError: language === "th" ? "กรุณาเลือกไฟล์รูปภาพเท่านั้น" : "Please select image files only",
    phoneLengthError: language === "th" ? "เบอร์โทรศัพท์ต้องมีจำนวน 9-10 หลัก" : "Phone number must be 9-10 digits",
    loginAgainError: language === "th" ? "กรุณาเข้าสู่ระบบอีกครั้ง" : "Please log in again",
    updateProfileError: language === "th" ? "ไม่สามารถอัปเดตโปรไฟล์ได้: " : "Failed to update profile: ",
    generalUpdateError: language === "th" ? "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" : "Error updating profile details",
    loadingProfile: language === "th" ? "กำลังโหลดข้อมูลโปรไฟล์..." : "Loading profile details...",
    saveSuccess: language === "th" ? "บันทึกข้อมูลเรียบร้อยแล้ว! กำลังกลับ..." : "Profile saved successfully! Redirecting...",
    backBtn: language === "th" ? "กลับ (Back)" : "Back",
    editTitle: language === "th" ? "แก้ไขข้อมูลส่วนตัว" : "Edit Profile Info",
    avatarLabel: language === "th" ? "รูปโปรไฟล์ (Profile Picture)" : "Profile Picture (Avatar)",
    selectImageBtn: language === "th" ? "เลือกรูปภาพ" : "Select Image",
    removeAvatarBtn: language === "th" ? "ลบรูปโปรไฟล์" : "Remove Photo",
    avatarHint: language === "th" ? "JPG, PNG ขนาดไม่เกิน 2MB" : "JPG, PNG under 2MB",
    displayNameLabel: language === "th" ? "ชื่อที่แสดง (Display Name)" : "Display Name",
    displayNamePlaceholder: language === "th" ? "ชื่อที่ต้องการแสดง เช่น สมชาย" : "Display name, e.g. John",
    displayNameHint: language === "th" ? "— ไม่จำเป็น" : "— Optional",
    emailLabel: language === "th" ? "อีเมลผู้ใช้งาน (Email)" : "User Email",
    emailHint: language === "th" ? "ไม่สามารถแก้ไขอีเมลหลักที่ใช้เชื่อมต่อระบบได้" : "Main registration email cannot be modified",
    phoneLabel: language === "th" ? "เบอร์โทรศัพท์ (Phone Number)" : "Phone Number",
    phoneHint: language === "th" ? "ระบุเบอร์โทรศัพท์มือถือ 9-10 หลักสำหรับการติดต่อประสานงาน" : "Enter a 9-10 digit mobile number for contact",
    addressLabel: language === "th" ? "ที่อยู่ (Address)" : "Address",
    addressPlaceholder: language === "th" ? "เลขที่บ้าน ถนน แขวง/ตำบล..." : "House number, street, sub-district...",
    bioLabel: language === "th" ? "เกี่ยวกับตัวฉัน (Bio)" : "About Me (Bio)",
    bioPlaceholder: language === "th" ? "แนะนำตัวสั้นๆ..." : "Short bio introduction...",
    cancelBtn: language === "th" ? "ยกเลิก" : "Cancel",
    saveBtn: language === "th" ? "บันทึกข้อมูล" : "Save Settings",
    savingBtn: language === "th" ? "กำลังบันทึก..." : "Saving...",
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to 2MB
    if (file.size > 2 * 1024 * 1024) {
      setError(t.avatarSizeError);
      return;
    }

    // Only allow image files
    if (!file.type.startsWith("image/")) {
      setError(t.avatarTypeError);
      return;
    }

    setError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setAvatarPreview(base64);
      setAvatarUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl("");
    setAvatarPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate phone number format (only digits, length 9-10)
    const phoneClean = phone.replace(/[^0-9]/g, "");
    if (phoneClean && (phoneClean.length < 9 || phoneClean.length > 10)) {
      setError(t.phoneLengthError);
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError(t.loginAgainError);
        setSaving(false);
        return;
      }

      // Update profile in public.profiles
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          phone: phoneClean,
          display_name: displayName || null,
          avatar_url: avatarUrl || null,
          address: address || null,
          bio: bio || null,
        })
        .eq("id", user.id);

      if (updateError) {
        setError(t.updateProfileError + updateError.message);
        setSaving(false);
        return;
      }

      // Also update user metadata for consistency
      await supabase.auth.updateUser({
        data: { phone: phoneClean }
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/reportissue/profile");
      }, 1500);
    } catch (err: any) {
      setError(err.message || t.generalUpdateError);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-slate-500 text-sm font-medium">{t.loadingProfile}</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 pb-12 pt-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Link
          href="/reportissue/profile"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition duration-200 inline-flex items-center space-x-1 text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.backBtn}</span>
        </Link>
        <h2 className="text-lg font-bold text-slate-800">{t.editTitle}</h2>
      </div>

      {/* Edit Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm text-center font-medium flex items-center justify-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>{t.saveSuccess}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar Upload */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t.avatarLabel}
            </label>
            <div className="flex items-center space-x-4">
              <div className="relative">
                {avatarPreview ? (
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                    <img
                      src={avatarPreview}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full aspect-square bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold border-2 border-slate-200 shadow-sm shrink-0">
                    {displayName?.charAt(0)?.toUpperCase() || email?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-md border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 transition cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex flex-col space-y-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer text-left"
                >
                  {t.selectImageBtn}
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-xs font-semibold text-red-500 hover:text-red-700 transition cursor-pointer flex items-center space-x-1"
                  >
                    <X className="w-3 h-3" />
                    <span>{t.removeAvatarBtn}</span>
                  </button>
                )}
                <p className="text-[10px] text-slate-400">{t.avatarHint}</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          {/* Display Name (Optional) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t.displayNameLabel} <span className="text-slate-400 font-normal normal-case">{t.displayNameHint}</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Type className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                placeholder={t.displayNamePlaceholder}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition text-sm text-gray-900 bg-white"
                disabled={saving}
              />
            </div>
          </div>

          {/* Email (Disabled) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t.emailLabel}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={email}
                disabled
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
              />
            </div>
            <p className="text-[10px] text-slate-400">{t.emailHint}</p>
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t.phoneLabel} <span className="text-slate-400 font-normal normal-case">{t.displayNameHint}</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  const onlyNums = e.target.value.replace(/[^0-9]/g, "");
                  setPhone(onlyNums);
                }}
                maxLength={10}
                placeholder="08X-XXX-XXXX"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition text-sm text-gray-900 bg-white"
                disabled={saving}
              />
            </div>
            <p className="text-[10px] text-slate-400">{t.phoneHint}</p>
          </div>

          {/* Address (Optional) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t.addressLabel} <span className="text-slate-400 font-normal normal-case">{t.displayNameHint}</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 pt-2.5 text-slate-400">
                <MapPin className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                maxLength={200}
                placeholder={t.addressPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition text-sm text-gray-900 bg-white"
                disabled={saving}
              />
            </div>
          </div>

          {/* Bio (Optional) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t.bioLabel} <span className="text-slate-400 font-normal normal-case">{t.displayNameHint}</span>
            </label>
            <div className="relative">
              <span className="absolute left-0 pl-3 pt-2.5 text-slate-400">
                <FileText className="w-4 h-4" />
              </span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={300}
                rows={3}
                placeholder={t.bioPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition text-sm text-gray-900 bg-white resize-none"
                disabled={saving}
              />
            </div>
            <p className="text-[10px] text-slate-400 text-right">{bio.length}/300</p>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex space-x-3">
            <Link
              href="/reportissue/profile"
              className="flex-1 text-center py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              {t.cancelBtn}
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#0F172A] hover:bg-slate-800 text-white py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{t.savingBtn}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{t.saveBtn}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}