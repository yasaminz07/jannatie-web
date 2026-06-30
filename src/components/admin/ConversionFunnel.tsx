import type { FunnelStep } from "@/lib/analytics-types";

export default function ConversionFunnel({ steps }: { steps: FunnelStep[] }) {
  const max = steps[0]?.users || 1;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-5">Conversion funnel</h3>
      <div className="space-y-3">
        {steps.map((s, i) => {
          const widthPct = Math.max((s.users / max) * 100, 4);
          const prev = i > 0 ? steps[i - 1].users : null;
          const dropoffPct = prev ? Math.max(0, ((prev - s.users) / prev) * 100) : 0;
          return (
            <div key={s.step}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-600 dark:text-slate-300">{s.step}</span>
                <span className="text-slate-400 dark:text-slate-500">
                  {s.users.toLocaleString()}
                  {i > 0 && <span className="text-red-400 dark:text-red-400 ml-2">−{dropoffPct.toFixed(0)}%</span>}
                </span>
              </div>
              <div className="h-7 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-400 transition-all"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
