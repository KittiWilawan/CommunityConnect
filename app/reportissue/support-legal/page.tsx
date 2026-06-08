"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  HelpCircle,
  MessageSquare,
  Shield,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  Send,
} from "lucide-react";
import { useSettings } from "@/app/components/SettingsProvider";

type Section = "help" | "contact" | "privacy";

const FAQ_ITEMS = {
  th: [
    {
      q: "วิธีแจ้งปัญหาสาธารณูปโภค",
      a: "ไปที่เมนู \"แจ้งปัญหา\" เลือกหมวดหมู่ที่ตรงกับปัญหา กรอกรายละเอียดและแนบรูปภาพ (ถ้ามี) จากนั้นกดส่งรายงาน",
    },
    {
      q: "ตรวจสอบสถานะรายงานได้อย่างไร",
      a: "ไปที่เมนู \"ประวัติของฉัน\" จะเห็นรายการทั้งหมดพร้อมสถานะ เช่น รอดำเนินการ กำลังดำเนินการ หรือเสร็จสิ้น",
    },
    {
      q: "ได้รับการแจ้งเตือนเมื่อสถานะเปลี่ยนหรือไม่",
      a: "ใช่ ระบบจะส่งการแจ้งเตือนเมื่อเจ้าหน้าที่อัปเดตสถานะรายงานของคุณ ดูได้ที่ไอคอนกระดิ่งด้านบน",
    },
    {
      q: "แก้ไขหรือลบรายงานได้หรือไม่",
      a: "สามารถลบรายงานจากหน้าประวัติได้ หากต้องการแก้ไขข้อมูล กรุณาติดต่อเจ้าหน้าที่ผ่านฟอร์มด้านล่าง",
    },
  ],
  en: [
    {
      q: "How do I report a utility issue?",
      a: "Go to \"Report an Issue\", choose the matching category, fill in details and attach a photo if needed, then submit.",
    },
    {
      q: "How can I track my report status?",
      a: "Open \"My History\" to see all your reports with statuses such as Pending, In Progress, or Completed.",
    },
    {
      q: "Will I get notified when status changes?",
      a: "Yes. You will receive a notification when staff updates your report. Check the bell icon in the header.",
    },
    {
      q: "Can I edit or delete a report?",
      a: "You can delete a report from your history. To edit details, please contact support using the form below.",
    },
  ],
};

function SupportLegalContent() {
  const searchParams = useSearchParams();
  const { darkMode, language } = useSettings();
  const [activeSection, setActiveSection] = useState<Section>("help");

  useEffect(() => {
    const section = searchParams.get("section");
    if (section === "help" || section === "contact" || section === "privacy") {
      setActiveSection(section);
    }
  }, [searchParams]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [contactForm, setContactForm] = useState({ subject: "", message: "", email: "" });
  const [submitted, setSubmitted] = useState(false);

  const t = {
    title: language === "th" ? "ความช่วยเหลือและกฎหมาย" : "Support & Legal",
    subtitle:
      language === "th"
        ? "คู่มือการใช้งาน ติดต่อเจ้าหน้าที่ และนโยบายความเป็นส่วนตัว"
        : "User guides, contact support, and privacy policy",
    back: language === "th" ? "กลับโปรไฟล์" : "Back to Profile",
    help: language === "th" ? "ศูนย์ความช่วยเหลือ" : "Help Center",
    contact: language === "th" ? "ติดต่อเจ้าหน้าที่" : "Contact Support",
    privacy: language === "th" ? "นโยบายความเป็นส่วนตัว" : "Privacy Policy",
    contactTitle:
      language === "th" ? "ส่งข้อความถึงเจ้าหน้าที่" : "Send a message to support",
    contactDesc:
      language === "th"
        ? "แจ้งปัญหาระบบ ข้อสงสัย หรือข้อเสนอแนะ"
        : "Report system issues, ask questions, or send feedback",
    subject: language === "th" ? "หัวข้อ" : "Subject",
    email: language === "th" ? "อีเมลติดต่อกลับ" : "Reply email",
    message: language === "th" ? "ข้อความ" : "Message",
    send: language === "th" ? "ส่งข้อความ" : "Send message",
    sent: language === "th" ? "ส่งข้อความเรียบร้อยแล้ว เราจะติดต่อกลับโดยเร็วที่สุด" : "Message sent. We will get back to you soon.",
    hotline: language === "th" ? "สายด่วนชุมชน" : "Community hotline",
    privacyUpdated: language === "th" ? "อัปเดตล่าสุด: มิถุนายน 2026" : "Last updated: June 2026",
  };

  const faqItems = FAQ_ITEMS[language];

  const cardClass = darkMode
    ? "bg-slate-800 border-slate-700 text-white"
    : "bg-white border-slate-200 text-slate-800";
  const mutedClass = darkMode ? "text-slate-400" : "text-slate-500";
  const inputClass = `w-full px-4 py-3 rounded-xl border text-sm outline-none transition focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 ${darkMode
    ? "bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
    : "bg-white border-slate-200 text-slate-800 placeholder:text-slate-400"
    }`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setContactForm({ subject: "", message: "", email: "" });
  };

  const sections: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: "help", label: t.help, icon: <HelpCircle className="w-4 h-4" /> },
    { id: "contact", label: t.contact, icon: <MessageSquare className="w-4 h-4" /> },
    { id: "privacy", label: t.privacy, icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-4">
        <Link
          href="/reportissue/profile"
          className={`p-2 rounded-xl border transition ${darkMode ? "bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-[#0F172A]"}`}>
            {t.title}
          </h1>
          <p className={`text-xs font-medium ${mutedClass}`}>{t.subtitle}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {sections.map((sec) => (
          <button
            key={sec.id}
            type="button"
            onClick={() => setActiveSection(sec.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition cursor-pointer ${activeSection === sec.id
              ? "bg-[#3B82F6] text-white border-[#3B82F6] shadow-md"
              : darkMode
                ? "bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
          >
            {sec.icon}
            <span>{sec.label}</span>
          </button>
        ))}
      </div>

      {activeSection === "help" && (
        <div className={`rounded-2xl border overflow-hidden ${cardClass}`}>
          <div className={`px-5 py-4 border-b ${darkMode ? "border-slate-700" : "border-slate-100"}`}>
            <h2 className="font-bold text-lg">{t.help}</h2>
            <p className={`text-xs mt-1 ${mutedClass}`}>
              {language === "th" ? "คำถามที่พบบ่อย" : "Frequently asked questions"}
            </p>
          </div>
          <div className={`divide-y ${darkMode ? "divide-slate-700" : "divide-slate-100"}`}>
            {faqItems.map((item, i) => (
              <div key={i}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className={`w-full flex items-center justify-between px-5 py-4 text-left transition cursor-pointer ${darkMode ? "hover:bg-slate-700/50" : "hover:bg-slate-50"}`}
                >
                  <span className="font-semibold text-sm pr-4">{item.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-4 h-4 shrink-0 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />
                  )}
                </button>
                {openFaq === i && (
                  <div className={`px-5 pb-4 text-sm leading-relaxed ${mutedClass}`}>
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === "contact" && (
        <div className="space-y-4">
          <div className={`rounded-2xl border p-5 ${cardClass}`}>
            <h2 className="font-bold text-lg mb-1">{t.contactTitle}</h2>
            <p className={`text-xs mb-5 ${mutedClass}`}>{t.contactDesc}</p>

            {submitted ? (
              <div className={`p-4 rounded-xl text-sm font-medium ${darkMode ? "bg-emerald-900/30 text-emerald-300 border border-emerald-800" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                {t.sent}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${mutedClass}`}>{t.subject}</label>
                  <input
                    type="text"
                    required
                    value={contactForm.subject}
                    onChange={(e) => setContactForm((p) => ({ ...p, subject: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${mutedClass}`}>{t.email}</label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${mutedClass}`}>{t.message}</label>
                  <textarea
                    required
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
                    className={`${inputClass} resize-none`}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  {t.send}
                </button>
              </form>
            )}
          </div>

          {/* <div className={`rounded-2xl border p-5 space-y-3 ${cardClass}`}>
            <p className={`text-xs font-bold uppercase tracking-wider ${mutedClass}`}>{t.hotline}</p>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-blue-500" />
              <span>02-123-4567</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-blue-500" />
              <span>[EMAIL_ADDRESS]</span>
            </div>
          </div> */}
        </div>
      )}

      {activeSection === "privacy" && (
        <div className={`rounded-2xl border p-5 md:p-6 space-y-5 ${cardClass}`}>
          <div>
            <h2 className="font-bold text-lg">{t.privacy}</h2>
            <p className={`text-xs mt-1 ${mutedClass}`}>{t.privacyUpdated}</p>
          </div>

          <div className={`space-y-4 text-sm leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
            {language === "th" ? (
              <>
                <section>
                  <h3 className="font-bold text-base mb-2">1. ข้อมูลที่เราเก็บรวบรวม</h3>
                  <p>
                    เราเก็บข้อมูลที่จำเป็นในการให้บริการ เช่น อีเมล ชื่อ หมายเลขโทรศัพท์
                    รายละเอียดการแจ้งปัญหา และรูปภาพที่คุณแนบมา เพื่อดำเนินการแก้ไขปัญหาสาธารณูปโภคในชุมชน
                  </p>
                </section>
                <section>
                  <h3 className="font-bold text-base mb-2">2. การใช้ข้อมูล</h3>
                  <p>
                    ข้อมูลจะถูกใช้เพื่อรับและติดตามรายงานปัญหา แจ้งสถานะให้ผู้ใช้ทราบ
                    และปรับปรุงคุณภาพการให้บริการ เราไม่ขายข้อมูลส่วนบุคคลให้บุคคลที่สาม
                  </p>
                </section>
                <section>
                  <h3 className="font-bold text-base mb-2">3. การรักษาความปลอดภัย</h3>
                  <p>
                    เราใช้มาตรการรักษาความปลอดภัยทางเทคนิคและการจัดการที่เหมาะสม
                    เพื่อป้องกันการเข้าถึง การเปิดเผย หรือการใช้ข้อมูลโดยไม่ได้รับอนุญาต
                  </p>
                </section>
                <section>
                  <h3 className="font-bold text-base mb-2">4. สิทธิของผู้ใช้</h3>
                  <p>
                    คุณมีสิทธิขอเข้าถึง แก้ไข หรือลบข้อมูลส่วนบุคคลของคุณได้
                    โดยติดต่อเจ้าหน้าที่ผ่านหน้า \"ติดต่อเจ้าหน้าที่\"
                  </p>
                </section>
                <section>
                  <h3 className="font-bold text-base mb-2">5. ข้อตกลงการใช้งาน</h3>
                  <p>
                    การใช้งานแพลตฟอร์มนี้ถือว่าคุณยอมรับข้อกำหนดและนโยบายนี้
                    ห้ามส่งรายงานเท็จหรือข้อมูลที่เป็นอันตรายต่อผู้อื่น
                  </p>
                </section>
              </>
            ) : (
              <>
                <section>
                  <h3 className="font-bold text-base mb-2">1. Data We Collect</h3>
                  <p>
                    We collect information needed to provide the service, including email, name, phone number,
                    report details, and attached images to process community utility issues.
                  </p>
                </section>
                <section>
                  <h3 className="font-bold text-base mb-2">2. How We Use Data</h3>
                  <p>
                    Data is used to receive and track reports, notify users of status updates, and improve service quality.
                    We do not sell personal data to third parties.
                  </p>
                </section>
                <section>
                  <h3 className="font-bold text-base mb-2">3. Security</h3>
                  <p>
                    We apply appropriate technical and organizational safeguards to protect against unauthorized access,
                    disclosure, or misuse of your information.
                  </p>
                </section>
                <section>
                  <h3 className="font-bold text-base mb-2">4. Your Rights</h3>
                  <p>
                    You may request access, correction, or deletion of your personal data by contacting support.
                  </p>
                </section>
                <section>
                  <h3 className="font-bold text-base mb-2">5. Terms of Use</h3>
                  <p>
                    By using this platform you agree to these terms. False reports or harmful content are prohibited.
                  </p>
                </section>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SupportLegalPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B82F6]" />
        </div>
      }
    >
      <SupportLegalContent />
    </Suspense>
  );
}
