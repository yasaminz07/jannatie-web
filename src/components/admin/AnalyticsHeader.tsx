"use client";

import { Download, Moon, Sun } from "lucide-react";
import type { AnalyticsFilters, DateRangeKey } from "@/lib/analytics-types";
import Dropdown from "./Dropdown";

const RANGE_OPTIONS: { key: DateRangeKey; label: string }[] = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "custom", label: "Custom" },
];

const DEVICE_OPTIONS: { value: AnalyticsFilters["device"]; label: string }[] = [
  { value: "all", label: "All devices" },
  { value: "mobile", label: "Mobile" },
  { value: "desktop", label: "Desktop" },
  { value: "tablet", label: "Tablet" },
];

const SOURCE_OPTIONS: { value: AnalyticsFilters["source"]; label: string }[] = [
  { value: "all", label: "All sources" },
  { value: "organic", label: "Organic" },
  { value: "direct", label: "Direct" },
  { value: "social", label: "Social" },
  { value: "referral", label: "Referral" },
  { value: "paid", label: "Paid" },
];

const REGION_OPTIONS: { value: AnalyticsFilters["region"]; label: string }[] = [
  { value: "all", label: "All regions" },
  { value: "uk", label: "United Kingdom" },
  { value: "us", label: "United States" },
  { value: "pakistan", label: "Pakistan" },
  { value: "bangladesh", label: "Bangladesh" },
  { value: "india", label: "India" },
  { value: "saudi", label: "Saudi Arabia" },
  { value: "uae", label: "UAE" },
];

export default function AnalyticsHeader({
  filters,
  onChange,
  customDays,
  onCustomDaysChange,
  darkMode,
  onToggleDarkMode,
  onExport,
}: {
  filters: AnalyticsFilters;
  onChange: (next: Partial<AnalyticsFilters>) => void;
  customDays: number;
  onCustomDaysChange: (days: number) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onExport: () => void;
}) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Jannatie</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Website analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleDarkMode}
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => onChange({ range: opt.key })}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filters.range === opt.key
                  ? "bg-blue-600 text-white"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {filters.range === "custom" && (
          <input
            type="number"
            min={1}
            max={365}
            value={customDays}
            onChange={(e) => onCustomDaysChange(Math.max(1, Number(e.target.value) || 1))}
            className="w-24 text-xs border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl px-3 py-2"
            placeholder="Days"
          />
        )}

        <Dropdown value={filters.device} options={DEVICE_OPTIONS} onChange={(device) => onChange({ device })} />
        <Dropdown value={filters.source} options={SOURCE_OPTIONS} onChange={(source) => onChange({ source })} />
        <Dropdown value={filters.region} options={REGION_OPTIONS} onChange={(region) => onChange({ region })} />
      </div>
    </div>
  );
}
