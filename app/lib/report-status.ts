export const REPORT_STATUSES = [
  "รอดำเนินการ",
  "กำลังดำเนินการ",
  "ขอข้อมูลเพิ่ม",
  "เสร็จสิ้น",
  "ปฏิเสธ",
] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];

export function getStatusColor(status: string): string {
  switch (status) {
    case "ปฏิเสธ":
      return "#EF4444";
    case "เสร็จสิ้น":
      return "#10B981";
    case "กำลังดำเนินการ":
      return "#3B82F6";
    case "ขอข้อมูลเพิ่ม":
      return "#9333EA";
    default:
      return "#DC2626";
  }
}

export function getStatusClass(status: string): string {
  switch (status) {
    case "ปฏิเสธ":
      return "bg-red-50 text-red-700 border-red-200/60";
    case "เสร็จสิ้น":
      return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
    case "กำลังดำเนินการ":
      return "bg-blue-50 text-blue-700 border-blue-200/50";
    case "ขอข้อมูลเพิ่ม":
      return "bg-purple-50 text-purple-700 border-purple-200/50";
    default:
      return "bg-amber-50 text-amber-700 border-amber-200/50";
  }
}

export function getStatusLabel(status: string, language: "th" | "en"): string {
  if (language === "th") return status;
  switch (status) {
    case "รอดำเนินการ":
      return "Pending";
    case "กำลังดำเนินการ":
      return "In Progress";
    case "ขอข้อมูลเพิ่ม":
      return "Need More Info";
    case "เสร็จสิ้น":
      return "Completed";
    case "ปฏิเสธ":
      return "Rejected";
    default:
      return status;
  }
}
