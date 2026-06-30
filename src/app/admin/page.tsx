"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, UserCheck, MousePointerClick, Clock, Target } from "lucide-react";
import { resolveDays, exportBundleToCsv, formatDuration, type AnalyticsFilters, type AnalyticsBundle } from "@/lib/analytics-types";
import { fetchRealAnalytics } from "@/lib/real-analytics";
import AnalyticsHeader from "@/components/admin/AnalyticsHeader";
import KpiCard from "@/components/admin/KpiCard";
import TrafficChart from "@/components/admin/TrafficChart";
import EngagementChart from "@/components/admin/EngagementChart";
import DonutChartCard from "@/components/admin/DonutChartCard";
import TopPagesTable from "@/components/admin/TopPagesTable";
import GeographyTable from "@/components/admin/GeographyTable";
import ConversionFunnel from "@/components/admin/ConversionFunnel";
import RealtimePanel from "@/components/admin/RealtimePanel";

const DEFAULT_FILTERS: AnalyticsFilters = {
  range: "30d",
  days: 30,
  device: "all",
  source: "all",
  region: "all",
};

export default function AdminAnalyticsPage() {
  const [filters, setFilters] = useState<AnalyticsFilters>(DEFAULT_FILTERS);
  const [customDays, setCustomDays] = useState(14);
  const [darkMode, setDarkMode] = useState(false);
  const [bundle, setBundle] = useState<AnalyticsBundle | null>(null);
  const [loading, setLoading] = useState(true);

  const resolvedFilters: AnalyticsFilters = useMemo(
    () => ({ ...filters, days: resolveDays(filters.range, customDays) }),
    [filters, customDays]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchRealAnalytics(resolvedFilters).then((b) => {
      if (!cancelled) {
        setBundle(b);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [resolvedFilters]);

  function handleFilterChange(next: Partial<AnalyticsFilters>) {
    setFilters((prev) => ({ ...prev, ...next }));
  }

  function handleExport() {
    if (!bundle) return;
    const csv = exportBundleToCsv(bundle);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jannatie-analytics-${resolvedFilters.range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading || !bundle) {
    return (
      <div className={darkMode ? "dark" : ""}>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 md:px-8 py-8 transition-colors flex items-center justify-center">
          <p className="text-sm text-slate-400">Loading live analytics…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 md:px-8 py-8 transition-colors">
        <AnalyticsHeader
          filters={filters}
          onChange={handleFilterChange}
          customDays={customDays}
          onCustomDaysChange={setCustomDays}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((d) => !d)}
          onExport={handleExport}
        />

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <KpiCard label="Total Visitors" value={bundle.kpis.totalVisitors.value.toLocaleString()} trendPct={bundle.kpis.totalVisitors.trendPct} icon={Users} />
          <KpiCard label="Unique Users" value={bundle.kpis.uniqueUsers.value.toLocaleString()} trendPct={bundle.kpis.uniqueUsers.trendPct} icon={UserCheck} />
          <KpiCard label="Bounce Rate" value={`${bundle.kpis.bounceRate.value.toFixed(1)}%`} trendPct={bundle.kpis.bounceRate.trendPct} icon={MousePointerClick} invertTrend />
          <KpiCard label="Avg. Session" value={formatDuration(bundle.kpis.avgSessionDuration.value)} trendPct={bundle.kpis.avgSessionDuration.trendPct} icon={Clock} />
          <KpiCard label="Conversion Rate" value={`${bundle.kpis.conversionRate.value.toFixed(1)}%`} trendPct={bundle.kpis.conversionRate.trendPct} icon={Target} />
        </div>

        {/* Traffic + realtime */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="lg:col-span-2">
            <TrafficChart data={bundle.daily} />
          </div>
          <RealtimePanel />
        </div>

        {/* Sources / device / browser donuts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <DonutChartCard title="Traffic sources" data={bundle.trafficSources} />
          <DonutChartCard title="Devices" data={bundle.devices} />
          <DonutChartCard title="Browsers" data={bundle.browsers} />
        </div>

        {/* Top pages */}
        <div className="mb-4">
          <TopPagesTable rows={bundle.topPages} />
        </div>

        {/* Geography + engagement */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <GeographyTable rows={bundle.geo} />
          <EngagementChart data={bundle.daily} scrollDepthAvg={bundle.scrollDepthAvg} />
        </div>

        {/* Funnel */}
        <div className="mb-4">
          <ConversionFunnel steps={bundle.funnel} />
        </div>

        <p className="text-center text-xs text-slate-300 dark:text-slate-700 mt-8">
          Live data tracked from real visits. Figures grow as traffic comes in.
        </p>
      </div>
    </div>
  );
}
