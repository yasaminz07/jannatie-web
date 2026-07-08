"use client";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Clock } from "lucide-react";

interface TimePickerPopupProps {
  value: string; // "HH:MM" 24-hour
  onChange: (v: string) => void;
}

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const ITEM_H = 48;
const VISIBLE = 5; // must be odd — selected item sits in the middle

function Drum({
  items,
  selectedIdx,
  onSelect,
  fmt,
}: {
  items: (number | string)[];
  selectedIdx: number;
  onSelect: (idx: number) => void;
  fmt: (v: number | string) => string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const snapTimer = useRef<ReturnType<typeof setTimeout>>();
  const syncing = useRef(false);
  const mid = Math.floor(VISIBLE / 2); // 2 — index of center slot

  // Set scroll instantly on mount (no animation flash)
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = selectedIdx * ITEM_H;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync when parent changes selectedIdx (e.g. AM↔PM flip changes hour)
  useEffect(() => {
    if (ref.current && !syncing.current) {
      ref.current.scrollTo({ top: selectedIdx * ITEM_H, behavior: "smooth" });
    }
  }, [selectedIdx]);

  function handleScroll() {
    clearTimeout(snapTimer.current);
    snapTimer.current = setTimeout(() => {
      if (!ref.current) return;
      const idx = Math.round(ref.current.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(items.length - 1, idx));
      syncing.current = true;
      ref.current.scrollTo({ top: clamped * ITEM_H, behavior: "smooth" });
      onSelect(clamped);
      setTimeout(() => { syncing.current = false; }, 300);
    }, 80);
  }

  return (
    <div className="relative" style={{ width: 72 }}>
      {/* Blue selection highlight behind center slot */}
      <div style={{
        position: "absolute",
        top: ITEM_H * mid,
        left: 4, right: 4,
        height: ITEM_H,
        borderRadius: 16,
        background: "linear-gradient(135deg,#3b82f6,#2563eb)",
        boxShadow: "0 4px 18px rgba(37,99,235,0.38)",
        pointerEvents: "none",
        zIndex: 1,
      }} />
      {/* Top fade mask */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: ITEM_H * mid,
        background: "linear-gradient(to bottom, rgba(255,255,255,1) 30%, rgba(255,255,255,0) 100%)",
        pointerEvents: "none", zIndex: 3,
      }} />
      {/* Bottom fade mask */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: ITEM_H * mid,
        background: "linear-gradient(to top, rgba(255,255,255,1) 30%, rgba(255,255,255,0) 100%)",
        pointerEvents: "none", zIndex: 3,
      }} />
      {/* Scrollable drum */}
      <div
        ref={ref}
        onScroll={handleScroll}
        style={{
          height: ITEM_H * VISIBLE,
          overflowY: "scroll",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        className="scrollbar-hide"
      >
        {/* Top padding so first item can scroll to center */}
        <div style={{ height: ITEM_H * mid }} />
        {items.map((item, idx) => (
          <div
            key={idx}
            onClick={() => {
              syncing.current = true;
              ref.current?.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
              onSelect(idx);
              setTimeout(() => { syncing.current = false; }, 300);
            }}
            style={{
              height: ITEM_H,
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative", zIndex: 2, cursor: "pointer",
              fontSize: idx === selectedIdx ? 24 : 18,
              fontWeight: idx === selectedIdx ? 700 : 400,
              color: idx === selectedIdx ? "white" : idx === selectedIdx - 1 || idx === selectedIdx + 1 ? "#94a3b8" : "#cbd5e1",
              transition: "color 0.12s, font-size 0.12s",
              userSelect: "none",
              letterSpacing: "-0.01em",
            }}
          >
            {fmt(item)}
          </div>
        ))}
        {/* Bottom padding so last item can scroll to center */}
        <div style={{ height: ITEM_H * mid }} />
      </div>
    </div>
  );
}

export default function TimePickerPopup({ value, onChange }: TimePickerPopupProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; above: boolean } | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const [hStr, mStr] = (value || "07:00").split(":");
  const h24 = parseInt(hStr) || 0;
  const rawMin = parseInt(mStr) || 0;
  const ispm = h24 >= 12;
  const h12 = h24 % 12 || 12;

  const hourIdx = HOURS.indexOf(h12);
  const closestMin = MINUTES.reduce((p, c) =>
    Math.abs(c - rawMin) < Math.abs(p - rawMin) ? c : p, MINUTES[0]
  );
  const minIdx = MINUTES.indexOf(closestMin);

  const displayH = String(h12).padStart(2, "0");
  const displayM = String(MINUTES[minIdx] ?? 0).padStart(2, "0");

  function openPicker() {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const popupW = 296;
    const popupH = 400;
    let left = r.left;
    if (left + popupW > window.innerWidth - 12) left = window.innerWidth - popupW - 12;
    if (left < 12) left = 12;
    const spaceBelow = window.innerHeight - r.bottom;
    const above = spaceBelow < popupH + 16 && r.top > popupH + 16;
    const top = above ? r.top - popupH - 8 : r.bottom + 8;
    setPos({ top, left, above });
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

  function setHourIdx(idx: number) {
    const h12new = HOURS[idx];
    const h24new = ispm ? (h12new % 12) + 12 : h12new % 12;
    onChange(`${String(h24new).padStart(2, "0")}:${mStr}`);
  }

  function setMinIdx(idx: number) {
    onChange(`${hStr}:${String(MINUTES[idx]).padStart(2, "0")}`);
  }

  function pickAmPm(pm: boolean) {
    if (pm === ispm) return;
    let h = pm ? h24 + 12 : h24 - 12;
    if (h < 0) h += 24;
    if (h >= 24) h -= 24;
    onChange(`${String(h).padStart(2, "0")}:${mStr}`);
  }

  const amPmBtn = (label: string, active: boolean, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 56, height: 48, borderRadius: 14, border: "none",
        fontSize: 14, fontWeight: 700, cursor: "pointer",
        transition: "all 0.15s",
        background: active ? "linear-gradient(135deg,#3b82f6,#2563eb)" : "#f1f5f9",
        color: active ? "white" : "#94a3b8",
        boxShadow: active ? "0 4px 14px rgba(37,99,235,0.35)" : "none",
        letterSpacing: "0.02em",
      }}
    >{label}</button>
  );

  const popup = pos && (
    <div
      id="tp-popup"
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: 296,
        zIndex: 99999,
        animation: `${pos.above ? "tp-enter-up" : "tp-enter"} 0.18s ease-out both`,
      }}
    >
      <div style={{
        background: "white",
        borderRadius: 24,
        boxShadow: "0 12px 48px rgba(15,23,42,0.16), 0 2px 8px rgba(15,23,42,0.06)",
        border: "1px solid rgba(226,232,240,0.8)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 20px 14px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Clock size={13} color="#3b82f6" />
            <span style={{
              fontSize: 11, fontWeight: 700, color: "#94a3b8",
              textTransform: "uppercase", letterSpacing: "0.1em",
            }}>Set time</span>
          </div>
          <div style={{
            fontSize: 14, fontWeight: 700, color: "#2563eb",
            background: "rgba(37,99,235,0.08)", padding: "4px 12px",
            borderRadius: 100, fontVariantNumeric: "tabular-nums",
          }}>
            {displayH}:{displayM} {ispm ? "PM" : "AM"}
          </div>
        </div>

        {/* Column labels */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          paddingTop: 14, paddingBottom: 2, gap: 0,
        }}>
          <div style={{ width: 72, textAlign: "center", fontSize: 10, fontWeight: 700, color: "#cbd5e1", letterSpacing: "0.1em", textTransform: "uppercase" }}>Hour</div>
          <div style={{ width: 24 }} />
          <div style={{ width: 72, textAlign: "center", fontSize: 10, fontWeight: 700, color: "#cbd5e1", letterSpacing: "0.1em", textTransform: "uppercase" }}>Min</div>
          <div style={{ width: 12 }} />
          <div style={{ width: 56, textAlign: "center", fontSize: 10, fontWeight: 700, color: "#cbd5e1", letterSpacing: "0.1em", textTransform: "uppercase" }}>Period</div>
        </div>

        {/* Drums row */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 20px 4px",
        }}>
          <Drum
            items={HOURS}
            selectedIdx={hourIdx >= 0 ? hourIdx : 0}
            onSelect={setHourIdx}
            fmt={v => String(v).padStart(2, "0")}
          />

          <div style={{
            width: 24, textAlign: "center",
            fontSize: 26, fontWeight: 800, color: "#e2e8f0",
            userSelect: "none", paddingTop: 4,
          }}>:</div>

          <Drum
            items={MINUTES}
            selectedIdx={minIdx >= 0 ? minIdx : 0}
            onSelect={setMinIdx}
            fmt={v => String(v).padStart(2, "0")}
          />

          {/* AM / PM */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginLeft: 12 }}>
            {amPmBtn("AM", !ispm, () => pickAmPm(false))}
            {amPmBtn("PM", ispm, () => pickAmPm(true))}
          </div>
        </div>

        {/* Done */}
        <div style={{ padding: "12px 20px 20px" }}>
          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{
              width: "100%", padding: "14px 0", borderRadius: 16, border: "none",
              background: "linear-gradient(135deg,#3b82f6,#2563eb)",
              color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 4px 18px rgba(37,99,235,0.38)",
              transition: "opacity 0.15s",
              letterSpacing: "0.01em",
            }}
          >Done</button>
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
