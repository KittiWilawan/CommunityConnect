import React from "react";

interface CardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  subcategories?: string[];
  onClick: () => void;
  darkMode?: boolean;
}

export default function CategoryCard({
  title,
  description,
  icon,
  color,
  subcategories,
  onClick,
  darkMode = false,
}: CardProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col justify-between p-2.5 sm:p-3 w-full min-h-[120px] sm:min-h-[135px] rounded-2xl border-2 border-dashed text-left transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md 
        ${darkMode
          ? "bg-slate-800/80 text-slate-100 border-opacity-50"
          : "bg-white text-slate-800"
        }`}
      style={{ borderColor: color + "60" }}
    >
      <div className="w-full">
        {/* กล่องไอคอน */}
        <div
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center mb-1.5 sm:mb-2"
          style={{ backgroundColor: color + "18", color }}
        >
          <div className="scale-75 sm:scale-90">{icon}</div>
        </div>

        {/* ส่วนหัวข้อ */}
        <h3 className={`text-xs sm:text-sm font-bold whitespace-pre-line mb-0.5 
          ${darkMode ? "text-white" : "text-slate-800"}`}
        >
          {title}
        </h3>

        {/* ส่วนคำอธิบาย */}
        <p className={`text-[10px] sm:text-[11px] leading-snug line-clamp-1 
          ${darkMode ? "text-slate-400" : "text-slate-500"}`}
        >
          {description}
        </p>

        {/* ชิปหมวดหมู่ย่อย */}
        {subcategories && subcategories.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {subcategories.slice(0, 2).map((sub, i) => (
              <span
                key={i}
                className="text-[8px] sm:text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: color + (darkMode ? "28" : "15"),
                  color: color,
                }}
              >
                {sub}
              </span>
            ))}
            {subcategories.length > 2 && (
              <span
                className="text-[8px] sm:text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: color + (darkMode ? "28" : "15"),
                  color: color,
                }}
              >
                +{subcategories.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="w-full flex justify-end mt-1 sm:mt-1.5">
        <span className="text-xs sm:text-sm font-bold" style={{ color }}>
          ➔
        </span>
      </div>
    </button>
  );
}