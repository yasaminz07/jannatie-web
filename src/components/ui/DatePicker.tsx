"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface DatePickerProps {
  value: string; // "YYYY-MM-DD" or ""
  onChange: (v: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  accent?: "blue" | "amber";
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_LABELS = ["Mo","Tu","We","Th","Fr","Sa","Su"];

export default function DatePicker({
  value, onChange, min, max, placeholder = "Select date", accent = "blue",
}: DatePickerProps) {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const [open, setOpen] = useState(false);

  const parsed = value ? new Date(value + "T00:00:00") : null;
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth());

  function formatDisplay(d: string) {
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  }

  function firstWeekday(y: number, m: number) {
    return (new Date(y, m, 1).getDay() + 6) % 7; // 0=Mon
  }

  function daysInMonth(y: number, m: number) {
    return new Date(y, m + 1, 0).getDate();
  }

  function selectDate(y: number, m: number, d: number) {
    const str = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (min && str < min) return;
    if (max && str > max) return;
    onChange(str);
    setOpen(false);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const sel = accent === "amber"
    ? { selected: "bg-amber-400 text-white", todayBg: "bg-amber-50 text-amber-600 font-bold", ring: "border-amber-300 ring-amber-100", icon: "text-amber-400" }
    : { selected: "bg-blue-600 text-white", todayBg: "bg-blue-50 text-blue-600 font-bold", ring: "border-blue-400 ring-blue-100", icon: "text-blue-500" };

  const firstDay = firstWeekday(viewYear, viewMonth);
  const days = daysInMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => {
          if (!open && parsed) { setViewYear(parsed.getFullYear()); setViewMonth(parsed.getMonth()); }
          setOpen(o => !o);
        }}
        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-white text-left transition-all ${
          open ? `${sel.ring} ring-2` : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <Calendar size={13} className={value ? sel.icon : "text-slate-300"} />
        <span className={`text-xs font-semibold flex-1 ${value ? "text-slate-700" : "text-slate-400"}`}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        {value && (
          <span
            role="button"
            onClick={e => { e.stopPropagation(); onChange(""); setOpen(false); }}
            className="text-[10px] text-slate-300 hover:text-red-400 transition-colors cursor-pointer px-0.5"
          >✕</span>
        )}
      </button>

      {/* Inline calendar — part of normal flow, no overflow:hidden issues */}
      {open && (
        <div className="mt-2 bg-white rounded-2xl border border-slate-100 shadow-lg p-3">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={prevMonth}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-bold text-slate-800">{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map(d => (
              <div key={d} className="text-center text-[9px] font-bold text-slate-400 py-0.5">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const str = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isSelected = str === value;
              const isToday = str === todayStr;
              const disabled = !!(min && str < min) || !!(max && str > max);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectDate(viewYear, viewMonth, day)}
                  disabled={disabled}
                  className={`w-full aspect-square rounded-lg text-[11px] font-semibold transition-all leading-none flex items-center justify-center ${
                    isSelected ? sel.selected :
                    isToday ? sel.todayBg :
                    disabled ? "text-slate-200 cursor-not-allowed" :
                    "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex justify-between mt-2 pt-2 border-t border-slate-100">
            <button type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className="text-[10px] font-semibold text-slate-400 hover:text-red-400 transition-colors">
              Clear
            </button>
            <button type="button"
              onClick={() => selectDate(today.getFullYear(), today.getMonth(), today.getDate())}
              className="text-[10px] font-semibold text-blue-500 hover:text-blue-700 transition-colors">
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
