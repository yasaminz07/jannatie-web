// Shared types + formatting helpers for the admin analytics dashboard.
// Actual data comes from src/lib/real-analytics.ts, which reads live events
// tracked by src/lib/analytics-tracker.ts — nothing in here is mock data.

export type DateRangeKey = "7d" | "30d" | "90d" | "custom";

export interface AnalyticsFilters {
  range: DateRangeKey;
  days: number; // resolved day count (custom range collapses to this)
  device: "all" | "mobile" | "desktop" | "tablet";
  source: "all" | "organic" | "direct" | "social" | "referral" | "paid";
  region: "all" | "uk" | "us" | "pakistan" | "bangladesh" | "india" | "saudi" | "uae";
}

export interface DailyPoint {
  date: string;
  visitors: number;
  sessions: number;
  prevVisitors: number;
  prevSessions: number;
  newUsers: number;
  returningUsers: number;
}

export interface Metric {
  value: number;
  trendPct: number; // vs previous period, +/-
}

export interface KpiSummary {
  totalVisitors: Metric;
  uniqueUsers: Metric;
  bounceRate: Metric; // %
  avgSessionDuration: Metric; // seconds
  conversionRate: Metric; // %
}

export interface BreakdownSlice {
  label: string;
  value: number;
}

export interface TopPageRow {
  url: string;
  views: number;
  avgTimeSec: number;
  bounceRate: number;
  exitRate: number;
}

export interface GeoRow {
  country: string;
  city: string;
  visitors: number;
}

export interface FunnelStep {
  step: string;
  users: number;
}

export interface RealtimeViewer {
  id: string;
  page: string;
  device: string;
  country: string;
}

export interface AnalyticsBundle {
  filters: AnalyticsFilters;
  kpis: KpiSummary;
  daily: DailyPoint[];
  trafficSources: BreakdownSlice[];
  devices: BreakdownSlice[];
  browsers: BreakdownSlice[];
  topPages: TopPageRow[];
  geo: GeoRow[];
  funnel: FunnelStep[];
  scrollDepthAvg: number;
}

export function resolveDays(range: DateRangeKey, customDays?: number): number {
  if (range === "7d") return 7;
  if (range === "30d") return 30;
  if (range === "90d") return 90;
  return customDays && customDays > 0 ? customDays : 14;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

// Wraps a value in quotes and escapes embedded quotes whenever it contains a
// comma, quote or newline, so exported reports stay valid CSV no matter what
// free-text content (page URLs, names, comments) ends up in a cell.
export function csvCell(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function csvRow(values: (string | number)[]): string {
  return values.map(csvCell).join(",");
}

const RANGE_LABEL: Record<DateRangeKey, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  custom: "Custom range",
};

function reportHeader(title: string, subtitle?: string): string[] {
  const lines = [
    csvRow(["Jannatie — " + title]),
    csvRow([subtitle ?? ""]),
    csvRow([`Generated ${new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}`]),
    "",
  ];
  return subtitle ? lines : [lines[0], lines[2], ""];
}

export function exportBundleToCsv(bundle: AnalyticsBundle): string {
  const lines: string[] = [
    ...reportHeader("Site Analytics Report", `${RANGE_LABEL[bundle.filters.range]} · ${bundle.filters.days} days`),
  ];

  lines.push("SUMMARY");
  lines.push(csvRow(["Metric", "Value", "Trend vs. previous period"]));
  lines.push(csvRow(["Total Visitors", bundle.kpis.totalVisitors.value.toLocaleString(), `${bundle.kpis.totalVisitors.trendPct >= 0 ? "+" : ""}${bundle.kpis.totalVisitors.trendPct.toFixed(1)}%`]));
  lines.push(csvRow(["Unique Users", bundle.kpis.uniqueUsers.value.toLocaleString(), `${bundle.kpis.uniqueUsers.trendPct >= 0 ? "+" : ""}${bundle.kpis.uniqueUsers.trendPct.toFixed(1)}%`]));
  lines.push(csvRow(["Bounce Rate", `${bundle.kpis.bounceRate.value.toFixed(1)}%`, `${bundle.kpis.bounceRate.trendPct >= 0 ? "+" : ""}${bundle.kpis.bounceRate.trendPct.toFixed(1)}%`]));
  lines.push(csvRow(["Avg. Session Duration", formatDuration(bundle.kpis.avgSessionDuration.value), `${bundle.kpis.avgSessionDuration.trendPct >= 0 ? "+" : ""}${bundle.kpis.avgSessionDuration.trendPct.toFixed(1)}%`]));
  lines.push(csvRow(["Conversion Rate", `${bundle.kpis.conversionRate.value.toFixed(1)}%`, `${bundle.kpis.conversionRate.trendPct >= 0 ? "+" : ""}${bundle.kpis.conversionRate.trendPct.toFixed(1)}%`]));
  lines.push("");

  lines.push("TOP PAGES");
  lines.push(csvRow(["Page", "Views", "Avg Time (s)", "Bounce Rate %", "Exit Rate %"]));
  bundle.topPages.forEach((p) => {
    lines.push(csvRow([p.url, p.views, p.avgTimeSec, p.bounceRate, p.exitRate]));
  });
  lines.push("");

  lines.push("TRAFFIC SOURCES");
  lines.push(csvRow(["Source", "Visitors"]));
  bundle.trafficSources.forEach((s) => lines.push(csvRow([s.label, s.value])));
  lines.push("");

  lines.push("GEOGRAPHY");
  lines.push(csvRow(["Country", "City", "Visitors"]));
  bundle.geo.forEach((g) => lines.push(csvRow([g.country, g.city, g.visitors])));

  return lines.join("\n");
}
