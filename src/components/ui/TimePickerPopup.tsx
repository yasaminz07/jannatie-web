"use client";
import { useState } from "react";
import { Clock, ChevronUp, ChevronDown } from "lucide-react";

interface TimePickerPopupProps {
  value: string; // "HH:MM" 24-hour
  onChange: (v: string) => void;
}

const MINUTE_STEPS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export default function TimePickerPopup({ value, onChange }: TimePickerPopupProps) {
  const [open, setOpen] = useState(false);

  const [hStr, mStr] = (value || "07:00").split(":");
  const h24 = parseInt(hStr) || 0;
  const rawMin = parseInt(mStr) || 0;
  const ispm = h24 >= 12;
  const h12 = h24 % 12 || 12;
  const minIdx = MINUTE_STEPS.indexOf(
    MINUTE_STEPS.reduce((p, c) => (Math.abs(c - rawMin) < Math.abs(p - rawMin) ? c : p), MINUTE_STEPS[0])
  );

  function setHour(newH12: number) {
    let h = ((newH12 - 1 + 12) % 12) + 1;
    const h24new = ispm ? (h % 12) + 12 : h % 12;
    onChange(`${String(h24new).padStart(2, "0")}:${mStr}`);
  }

  function setMinuteIdx(idx: number) {
    const newIdx = ((idx % MINUTE_STEPS.length) + MINUTE_STEPS.length) % MINUTE_STEPS.length;
    onChange(`${hStr}:${String(MINUTE_STEPS[newIdx]).padStart(2, "0")}`);
  }

  function stepHour(dir: 1 | -1) {
    const newH12 = ((h12 - 1 + dir + 12) % 12) + 1;
    setHour(newH12);
  }

  function stepMinute(dir: 1 | -1) {
    setMinuteIdx(minIdx + dir);
  }

  function pickAmPm(pm: boolean) {
    if (pm === ispm) return;
    let h = pm ? h24 + 12 : h24 - 12;
    if (h < 0) h += 24;
    if (h >= 24) h -= 24;
    onChange(`${String(h).padStart(2, "0")}:${mStr}`);
  }

  const displayH = String(h12).padStart(2, "0");
  const displayM = String(MINUTE_STEPS[minIdx]).padStart(2, "0");

  return (
    <div className="w-full">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
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

      {/* Inline panel — no fixed positioning, works inside any modal */}
      {open && (
        <div className="mt-2 rounded-2xl border border-slate-100 bg-white shadow-lg shadow-slate-100/80 p-4">

          {/* Drum-roll style selectors */}
          <div className="flex items-center justify-center gap-2 mb-4">

            {/* Hour drum */}
            <div className="flex flex-col items-center gap-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hour</p>
              <button
                type="button"
                onClick={() => stepHour(1)}
                className="w-14 h-8 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors"
              >
                <ChevronUp size={18} />
              </button>
              <div className="w-14 h-12 flex items-center justify-center rounded-xl bg-blue-600 text-white text-2xl font-bold tabular-nums shadow-sm shadow-blue-200">
                {displayH}
              </div>
              <button
                type="button"
                onClick={() => stepHour(-1)}
                className="w-14 h-8 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors"
              >
                <ChevronDown size={18} />
              </button>
            </div>

            <span className="text-2xl font-bold text-slate-300 pb-1">:</span>

            {/* Minute drum */}
            <div className="flex flex-col items-center gap-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Min</p>
              <button
                type="button"
                onClick={() => stepMinute(1)}
                className="w-14 h-8 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors"
              >
                <ChevronUp size={18} />
              </button>
              <div className="w-14 h-12 flex items-center justify-center rounded-xl bg-blue-600 text-white text-2xl font-bold tabular-nums shadow-sm shadow-blue-200">
                {displayM}
              </div>
              <button
                type="button"
                onClick={() => stepMinute(-1)}
                className="w-14 h-8 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors"
              >
                <ChevronDown size={18} />
              </button>
            </div>

            {/* AM / PM */}
            <div className="flex flex-col items-center gap-1 ml-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Period</p>
              <button
                type="button"
                onClick={() => pickAmPm(false)}
                className={`w-14 h-10 rounded-xl text-sm font-bold transition-all ${
                  !ispm ? "bg-blue-600 text-white shadow-sm shadow-blue-200" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >AM</button>
              <button
                type="button"
                onClick={() => pickAmPm(true)}
                className={`w-14 h-10 rounded-xl text-sm font-bold transition-all ${
                  ispm ? "bg-blue-600 text-white shadow-sm shadow-blue-200" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >PM</button>
            </div>
          </div>

          {/* Quick minute grid */}
          <div className="border-t border-slate-100 pt-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Quick minutes</p>
            <div className="grid grid-cols-6 gap-1">
              {MINUTE_STEPS.map((m, idx) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMinuteIdx(idx); }}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    idx === minIdx
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  :{String(m).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full mt-3 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
