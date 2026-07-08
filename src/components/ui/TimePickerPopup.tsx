"use client";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Clock, ChevronUp, ChevronDown } from "lucide-react";

interface TimePickerPopupProps {
  value: string; // "HH:MM" 24-hour
  onChange: (v: string) => void;
}

const MINUTE_STEPS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export default function TimePickerPopup({ value, onChange }: TimePickerPopupProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const [hStr, mStr] = (value || "07:00").split(":");
  const h24 = parseInt(hStr) || 0;
  const rawMin = parseInt(mStr) || 0;
  const ispm = h24 >= 12;
  const h12 = h24 % 12 || 12;
  const minIdx = MINUTE_STEPS.indexOf(
    MINUTE_STEPS.reduce((p, c) => (Math.abs(c - rawMin) < Math.abs(p - rawMin) ? c : p), MINUTE_STEPS[0])
  );
  const displayH = String(h12).padStart(2, "0");
  const displayM = String(MINUTE_STEPS[minIdx]).padStart(2, "0");

  function openPicker() {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      // Position below trigger; clamp to stay in viewport
      const popupW = 304;
      let left = r.left;
      if (left + popupW > window.innerWidth - 12) left = window.innerWidth - popupW - 12;
      setPos({ top: r.bottom + 8, left, width: r.width });
    }
    setOpen(true);
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const popup = document.getElementById("tp-popup");
      if (popup?.contains(e.target as Node) || triggerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function stepHour(dir: 1 | -1) {
    const newH12 = ((h12 - 1 + dir + 12) % 12) + 1;
    const h24new = ispm ? (newH12 % 12) + 12 : newH12 % 12;
    onChange(`${String(h24new).padStart(2, "0")}:${mStr}`);
  }

  function setMinuteIdx(idx: number) {
    const i = ((idx % MINUTE_STEPS.length) + MINUTE_STEPS.length) % MINUTE_STEPS.length;
    onChange(`${hStr}:${String(MINUTE_STEPS[i]).padStart(2, "0")}`);
  }

  function pickAmPm(pm: boolean) {
    if (pm === ispm) return;
    let h = pm ? h24 + 12 : h24 - 12;
    if (h < 0) h += 24;
    if (h >= 24) h -= 24;
    onChange(`${String(h).padStart(2, "0")}:${mStr}`);
  }

  const popup = pos && (
    <div
      id="tp-popup"
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: 304,
        zIndex: 99999,
        animation: "tp-enter 0.15s ease-out both",
      }}
    >
      {/* Glass card */}
      <div
        style={{
          background: "rgba(255,255,255,0.97)",
          border: "1px solid rgba(226,232,240,0.9)",
          borderRadius: 20,
          boxShadow: "0 8px 40px rgba(15,23,42,0.16), 0 2px 8px rgba(15,23,42,0.08)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-blue-500" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Set time</p>
          </div>
          <div
            className="px-3 py-1 rounded-full text-sm font-bold tabular-nums"
            style={{ background: "rgba(37,99,235,0.08)", color: "#2563eb" }}
          >
            {displayH}:{displayM} {ispm ? "PM" : "AM"}
          </div>
        </div>

        {/* Drums */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-center gap-3">

            {/* Hour drum */}
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Hour</p>
              <button
                type="button"
                onClick={() => stepHour(1)}
                className="w-12 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-300 hover:text-blue-400 transition-all active:scale-95"
              >
                <ChevronUp size={16} />
              </button>
              <div
                className="w-14 h-14 flex items-center justify-center rounded-2xl text-3xl font-bold tabular-nums text-white shadow-md"
                style={{ background: "linear-gradient(135deg,#3b82f6,#2563eb)" }}
              >
                {displayH}
              </div>
              <button
                type="button"
                onClick={() => stepHour(-1)}
                className="w-12 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-300 hover:text-blue-400 transition-all active:scale-95"
              >
                <ChevronDown size={16} />
              </button>
            </div>

            <span className="text-3xl font-bold text-slate-200 pb-0.5 select-none">:</span>

            {/* Minute drum */}
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Min</p>
              <button
                type="button"
                onClick={() => setMinuteIdx(minIdx + 1)}
                className="w-12 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-300 hover:text-blue-400 transition-all active:scale-95"
              >
                <ChevronUp size={16} />
              </button>
              <div
                className="w-14 h-14 flex items-center justify-center rounded-2xl text-3xl font-bold tabular-nums text-white shadow-md"
                style={{ background: "linear-gradient(135deg,#3b82f6,#2563eb)" }}
              >
                {displayM}
              </div>
              <button
                type="button"
                onClick={() => setMinuteIdx(minIdx - 1)}
                className="w-12 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-300 hover:text-blue-400 transition-all active:scale-95"
              >
                <ChevronDown size={16} />
              </button>
            </div>

            {/* AM / PM */}
            <div className="flex flex-col gap-2 ml-1">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Period</p>
              <button
                type="button"
                onClick={() => pickAmPm(false)}
                className={`w-14 h-[42px] rounded-xl text-sm font-bold transition-all active:scale-95 ${
                  !ispm
                    ? "text-white shadow-sm"
                    : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                }`}
                style={!ispm ? { background: "linear-gradient(135deg,#3b82f6,#2563eb)" } : {}}
              >AM</button>
              <button
                type="button"
                onClick={() => pickAmPm(true)}
                className={`w-14 h-[42px] rounded-xl text-sm font-bold transition-all active:scale-95 ${
                  ispm
                    ? "text-white shadow-sm"
                    : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                }`}
                style={ispm ? { background: "linear-gradient(135deg,#3b82f6,#2563eb)" } : {}}
              >PM</button>
            </div>
          </div>
        </div>

        {/* Quick minutes */}
        <div className="px-5 pb-4 border-t border-slate-50 pt-3">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Quick select</p>
          <div className="grid grid-cols-6 gap-1">
            {MINUTE_STEPS.map((m, idx) => (
              <button
                key={m}
                type="button"
                onClick={() => setMinuteIdx(idx)}
                className={`py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95 ${
                  idx === minIdx
                    ? "text-white shadow-sm"
                    : "bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                }`}
                style={idx === minIdx ? { background: "linear-gradient(135deg,#3b82f6,#2563eb)" } : {}}
              >
                :{String(m).padStart(2, "0")}
              </button>
            ))}
          </div>
        </div>

        {/* Done */}
        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full py-3 rounded-2xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98] shadow-md"
            style={{ background: "linear-gradient(135deg,#3b82f6,#2563eb)", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => open ? setOpen(false) : openPicker()}
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border bg-white text-left transition-all ${
          open ? "border-blue-400 ring-2 ring-blue-50" : "border-slate-200 hover:border-blue-200"
        }`}
      >
        <Clock size={16} className="text-blue-500 flex-shrink-0" />
        <span className="text-lg font-bold text-slate-800 tabular-nums flex-1">
          {displayH}:{displayM}
          <span className="text-sm font-semibold text-slate-400 ml-2">{ispm ? "PM" : "AM"}</span>
        </span>
        <span className="text-[11px] text-slate-300 font-medium">{open ? "close" : "tap to edit"}</span>
      </button>

      {mounted && open && createPortal(popup, document.body)}
    </>
  );
}
