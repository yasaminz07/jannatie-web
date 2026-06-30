import type { GeoRow } from "@/lib/analytics-types";

export default function GeographyTable({ rows }: { rows: GeoRow[] }) {
  const top = rows.slice(0, 8);
  const max = Math.max(...top.map((r) => r.visitors), 1);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Top countries &amp; cities</h3>
      <div className="space-y-2.5">
        {top.map((r) => (
          <div key={`${r.country}-${r.city}`} className="flex items-center gap-3 text-sm">
            <div className="w-32 flex-shrink-0 truncate text-slate-600 dark:text-slate-300">
              {r.city}
              <span className="text-slate-400 dark:text-slate-500 text-xs"> · {r.country}</span>
            </div>
            <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(r.visitors / max) * 100}%` }} />
            </div>
            <span className="w-12 text-right text-xs font-semibold text-slate-600 dark:text-slate-300">{r.visitors}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
