"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { BreakdownSlice } from "@/lib/analytics-types";

const COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6", "#06B6D4"];

export default function DonutChartCard({ title, data }: { title: string; data: BreakdownSlice[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">{title}</h3>
      <div className="flex items-center gap-4">
        <div className="w-32 h-32 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="label" innerRadius={38} outerRadius={58} paddingAngle={2}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => {
                  const v = Number(value) || 0;
                  return [`${v} (${total ? ((v / total) * 100).toFixed(1) : 0}%)`, name];
                }}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-1.5 min-w-0">
          {data.map((d, i) => (
            <div key={d.label} className="flex items-center justify-between text-xs gap-2">
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                {d.label}
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-200 flex-shrink-0">
                {total ? ((d.value / total) * 100).toFixed(0) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
