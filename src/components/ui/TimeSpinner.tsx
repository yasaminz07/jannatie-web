"use client";
import { ChevronUp, ChevronDown } from "lucide-react";

interface TimeSpinnerProps {
  value: string; // "HH:MM" 24-hour
  onChange: (v: string) => void;
}

export default function TimeSpinner({ value, onChange }: TimeSpinnerProps) {
  const [hStr, mStr] = value.split(":");
  const h24 = parseInt(hStr) || 0;
  const min = parseInt(mStr) || 0;
  const ispm = h24 >= 12;
  const h12 = h24 % 12 || 12;

  function setHour(newH12: number) {
    let h = newH12 % 12;
    if (ispm) h += 12;
    onChange(`${String(h).padStart(2, "0")}:${mStr}`);
  }

  function setMinute(newMin: number) {
    onChange(`${hStr}:${String(newMin).padStart(2, "0")}`);
  }

  function toggleAmPm() {
    let h = ispm ? h24 - 12 : h24 + 12;
    if (h < 0) h += 24;
    if (h >= 24) h -= 24;
    onChange(`${String(h).padStart(2, "0")}:${mStr}`);
  }

  const spinnerCol = (
    label: string,
    display: string,
    onUp: () => void,
    onDown: () => void
  ) => (
    <div className="flex flex-col items-center gap-0.5 flex-1">
      <button
        type="button"
        onClick={onUp}
        className="w-full flex justify-center py-1.5 rounded-lg text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
      >
        <ChevronUp size={18} strokeWidth={2.5} />
      </button>
      <div className="w-full text-center py-3 rounded-2xl bg-white border border-slate-200 shadow-sm text-2xl font-bold text-slate-800 select-none tabular-nums">
        {display}
      </div>
      <button
        type="button"
        onClick={onDown}
        className="w-full flex justify-center py-1.5 rounded-lg text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
      >
        <ChevronDown size={18} strokeWidth={2.5} />
      </button>
      <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-0.5">{label}</span>
    </div>
  );

  return (
    <div className="flex items-center gap-2.5">
      {spinnerCol(
        "Hour",
        String(h12).padStart(2, "0"),
        () => setHour(h12 === 12 ? 1 : h12 + 1),
        () => setHour(h12 === 1 ? 12 : h12 - 1)
      )}

      <span className="text-slate-300 font-bold text-2xl mb-6 flex-shrink-0">:</span>

      {spinnerCol(
        "Min",
        String(min).padStart(2, "0"),
        () => setMinute(min === 59 ? 0 : min + 1),
        () => setMinute(min === 0 ? 59 : min - 1)
      )}

      {/* AM / PM pill */}
      <div className="flex flex-col gap-1.5 flex-shrink-0 mb-5">
        <button
          type="button"
          onClick={() => { if (ispm) toggleAmPm(); }}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
            !ispm
              ? "bg-blue-600 text-white shadow-md shadow-blue-200"
              : "bg-white border border-slate-200 text-slate-400 hover:bg-slate-50"
          }`}
        >
          AM
        </button>
        <button
          type="button"
          onClick={() => { if (!ispm) toggleAmPm(); }}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
            ispm
              ? "bg-blue-600 text-white shadow-md shadow-blue-200"
              : "bg-white border border-slate-200 text-slate-400 hover:bg-slate-50"
          }`}
        >
          PM
        </button>
      </div>
    </div>
  );
}
