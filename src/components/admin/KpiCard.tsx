import { ArrowUpRight, ArrowDownRight, LucideIcon } from "lucide-react";

export default function KpiCard({
  label,
  value,
  trendPct,
  icon: Icon,
  invertTrend = false,
}: {
  label: string;
  value: string;
  trendPct: number;
  icon: LucideIcon;
  invertTrend?: boolean;
}) {
  const isUp = trendPct >= 0;
  // For metrics like bounce rate, "up" is bad — invertTrend flips the color logic.
  const isGood = invertTrend ? !isUp : isUp;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
      <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mb-3">
        <Icon size={15} />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        <span
          className={`flex items-center gap-0.5 text-xs font-semibold ${
            isGood ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
          }`}
        >
          {isUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {Math.abs(trendPct).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
