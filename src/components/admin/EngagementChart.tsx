"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { DailyPoint } from "@/lib/analytics-types";

export default function EngagementChart({ data, scrollDepthAvg }: { data: DailyPoint[]; scrollDepthAvg: number }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">New vs returning users</h3>
        <div className="text-right">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Avg scroll depth</p>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{scrollDepthAvg}%</p>
        </div>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-slate-800" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} stroke="#94A3B8" />
            <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" width={36} />
            <Tooltip cursor={false} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="newUsers" name="New users" stackId="a" fill="#2563EB" radius={[0, 0, 0, 0]} />
            <Bar dataKey="returningUsers" name="Returning users" stackId="a" fill="#A5B4FC" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
