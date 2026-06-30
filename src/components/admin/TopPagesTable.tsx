"use client";

import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import type { TopPageRow } from "@/lib/analytics-types";
import { formatDuration } from "@/lib/analytics-types";

type SortKey = keyof TopPageRow;

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "url", label: "Page" },
  { key: "views", label: "Views" },
  { key: "avgTimeSec", label: "Avg. Time" },
  { key: "bounceRate", label: "Bounce Rate" },
  { key: "exitRate", label: "Exit Rate" },
];

export default function TopPagesTable({ rows }: { rows: TopPageRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("views");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...rows].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
    return sortDir === "asc" ? cmp : -cmp;
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Top pages</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              {COLUMNS.map((c) => (
                <th key={c.key} className="text-left pb-2 pr-4">
                  <button
                    onClick={() => toggleSort(c.key)}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {c.label}
                    <ArrowUpDown size={11} className={sortKey === c.key ? "text-blue-600" : "text-slate-300"} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.url} className="border-b border-slate-50 dark:border-slate-800/60 last:border-0">
                <td className="py-2.5 pr-4 font-mono text-xs text-slate-700 dark:text-slate-300">{r.url}</td>
                <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">{r.views.toLocaleString()}</td>
                <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">{formatDuration(r.avgTimeSec)}</td>
                <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">{r.bounceRate.toFixed(1)}%</td>
                <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">{r.exitRate.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
