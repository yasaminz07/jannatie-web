"use client";

import { useEffect, useState } from "react";
import { Radio, Smartphone, Monitor, Tablet } from "lucide-react";
import { subscribeRealtimePresence } from "@/lib/real-analytics";
import type { RealtimeViewer } from "@/lib/analytics-types";

const DEVICE_ICON = { Mobile: Smartphone, Desktop: Monitor, Tablet: Tablet } as const;

export default function RealtimePanel() {
  const [viewers, setViewers] = useState<RealtimeViewer[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeRealtimePresence(setViewers);
    return unsubscribe;
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Real-time
        </h3>
        <Radio size={14} className="text-slate-300 dark:text-slate-600" />
      </div>

      <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{viewers.length}</p>
      <p className="text-xs text-slate-400 mb-4">active users right now</p>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {viewers.length === 0 && (
          <p className="text-xs text-slate-400 py-2">No one&apos;s browsing Jannatie right now.</p>
        )}
        {viewers.slice(0, 8).map((v) => {
          const Icon = DEVICE_ICON[v.device as keyof typeof DEVICE_ICON] ?? Monitor;
          return (
            <div key={v.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 dark:border-slate-800/60 last:border-0">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Icon size={13} className="text-slate-400" />
                <span className="font-mono">{v.page}</span>
              </span>
              <span className="text-slate-400">{v.country}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
