"use client";

// Reads the live events written by src/lib/analytics-tracker.ts and
// aggregates them into the shapes the admin dashboard renders. No mock
// or simulated data — every number here comes from a Firestore read.

import { db } from "./firebase";
import {
  collection, query, where, getDocs, onSnapshot, limit, orderBy, Timestamp,
} from "firebase/firestore";
import type {
  AnalyticsFilters, AnalyticsBundle, DailyPoint, KpiSummary,
  BreakdownSlice, TopPageRow, GeoRow, FunnelStep, RealtimeViewer,
} from "./analytics-types";

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function trendPct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

interface SessionRow {
  visitorId: string;
  device: string;
  browser: string;
  source: string;
  country: string;
  city: string;
  regionKey: string;
  startedAt: Date;
  pageviews: number;
  isNew: boolean;
}

interface PageviewRow {
  visitorId: string;
  sessionId: string;
  path: string;
  device: string;
  source: string;
  regionKey: string;
  enteredAt: Date;
  exitedAt: Date | null;
  scrollDepth: number | null;
}

function matchesFilters(row: { device: string; source: string; regionKey: string }, filters: AnalyticsFilters): boolean {
  if (filters.device !== "all" && row.device.toLowerCase() !== filters.device) return false;
  if (filters.source !== "all" && row.source.toLowerCase() !== filters.source) return false;
  if (filters.region !== "all" && row.regionKey !== filters.region) return false;
  return true;
}

export async function fetchRealAnalytics(filters: AnalyticsFilters): Promise<AnalyticsBundle> {
  const days = filters.days;
  const now = new Date();
  const periodStart = new Date(now.getTime() - days * 86400000);
  const prevPeriodStart = new Date(now.getTime() - days * 2 * 86400000);

  const [sessionsSnap, pageviewsSnap, funnelSnap] = await Promise.all([
    getDocs(query(collection(db, "analyticsSessions"), where("startedAt", ">=", Timestamp.fromDate(prevPeriodStart)))),
    getDocs(query(collection(db, "analyticsPageviews"), where("enteredAt", ">=", Timestamp.fromDate(prevPeriodStart)))),
    getDocs(collection(db, "analyticsFunnel")),
  ]);

  const allSessions: SessionRow[] = sessionsSnap.docs
    .map((d) => {
      const data = d.data();
      const startedAt: Timestamp | undefined = data.startedAt;
      if (!startedAt) return null;
      return {
        visitorId: data.visitorId || "",
        device: data.device || "Desktop",
        browser: data.browser || "Other",
        source: data.source || "Direct",
        country: data.country || "Unknown",
        city: data.city || "Unknown",
        regionKey: data.regionKey || "other",
        startedAt: startedAt.toDate(),
        pageviews: data.pageviews || 0,
        isNew: data.isNew !== false,
      };
    })
    .filter((s): s is SessionRow => s !== null)
    .filter((s) => matchesFilters(s, filters));

  const allPageviews: PageviewRow[] = pageviewsSnap.docs
    .map((d) => {
      const data = d.data();
      const enteredAt: Timestamp | undefined = data.enteredAt;
      if (!enteredAt) return null;
      return {
        visitorId: data.visitorId || "",
        sessionId: data.sessionId || "",
        path: data.path || "/",
        device: data.device || "Desktop",
        source: data.source || "Direct",
        regionKey: data.regionKey || "other",
        enteredAt: enteredAt.toDate(),
        exitedAt: data.exitedAt ? (data.exitedAt as Timestamp).toDate() : null,
        scrollDepth: typeof data.scrollDepth === "number" ? data.scrollDepth : null,
      };
    })
    .filter((p): p is PageviewRow => p !== null)
    .filter((p) => matchesFilters(p, filters));

  const periodSessions = allSessions.filter((s) => s.startedAt >= periodStart);
  const prevPeriodSessions = allSessions.filter((s) => s.startedAt >= prevPeriodStart && s.startedAt < periodStart);
  const periodPageviews = allPageviews.filter((p) => p.enteredAt >= periodStart);

  const totalVisitors = periodSessions.length;
  const prevTotalVisitors = prevPeriodSessions.length;
  const uniqueUsers = new Set(periodSessions.map((s) => s.visitorId)).size;
  const prevUniqueUsers = new Set(prevPeriodSessions.map((s) => s.visitorId)).size;

  const bounced = periodSessions.filter((s) => s.pageviews <= 1).length;
  const bounceRate = totalVisitors ? (bounced / totalVisitors) * 100 : 0;
  const prevBounced = prevPeriodSessions.filter((s) => s.pageviews <= 1).length;
  const prevBounceRate = prevTotalVisitors ? (prevBounced / prevTotalVisitors) * 100 : 0;

  const durations = periodPageviews.filter((p) => p.exitedAt).map((p) => (p.exitedAt!.getTime() - p.enteredAt.getTime()) / 1000);
  const avgSessionDuration = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  const prevDurations = allPageviews
    .filter((p) => p.enteredAt >= prevPeriodStart && p.enteredAt < periodStart && p.exitedAt)
    .map((p) => (p.exitedAt!.getTime() - p.enteredAt.getTime()) / 1000);
  const prevAvgSessionDuration = prevDurations.length ? prevDurations.reduce((a, b) => a + b, 0) / prevDurations.length : 0;

  // Funnel docs carry no device/source/region, so they're bucketed by date only.
  const funnelByStep = new Map<string, Set<string>>();
  const prevFunnelByStep = new Map<string, Set<string>>();
  funnelSnap.docs.forEach((d) => {
    const data = d.data();
    const ts: Timestamp | undefined = data.timestamp;
    const step: string | undefined = data.step;
    const visitorId: string | undefined = data.visitorId;
    if (!ts || !step || !visitorId) return;
    const date = ts.toDate();
    if (date >= periodStart) {
      if (!funnelByStep.has(step)) funnelByStep.set(step, new Set());
      funnelByStep.get(step)!.add(visitorId);
    } else if (date >= prevPeriodStart) {
      if (!prevFunnelByStep.has(step)) prevFunnelByStep.set(step, new Set());
      prevFunnelByStep.get(step)!.add(visitorId);
    }
  });

  const signedUp = funnelByStep.get("signed_up")?.size || 0;
  const prevSignedUp = prevFunnelByStep.get("signed_up")?.size || 0;
  const conversionRate = uniqueUsers ? (signedUp / uniqueUsers) * 100 : 0;
  const prevConversionRate = prevUniqueUsers ? (prevSignedUp / prevUniqueUsers) * 100 : 0;

  const kpis: KpiSummary = {
    totalVisitors: { value: totalVisitors, trendPct: trendPct(totalVisitors, prevTotalVisitors) },
    uniqueUsers: { value: uniqueUsers, trendPct: trendPct(uniqueUsers, prevUniqueUsers) },
    bounceRate: { value: bounceRate, trendPct: trendPct(bounceRate, prevBounceRate) },
    avgSessionDuration: { value: avgSessionDuration, trendPct: trendPct(avgSessionDuration, prevAvgSessionDuration) },
    conversionRate: { value: conversionRate, trendPct: trendPct(conversionRate, prevConversionRate) },
  };

  const sessionsByDay = new Map<string, SessionRow[]>();
  allSessions.forEach((s) => {
    const key = dayKey(s.startedAt);
    if (!sessionsByDay.has(key)) sessionsByDay.set(key, []);
    sessionsByDay.get(key)!.push(s);
  });

  const daily: DailyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 86400000);
    const key = dayKey(date);
    const prevKey = dayKey(new Date(date.getTime() - days * 86400000));
    const todaySessions = sessionsByDay.get(key) || [];
    const prevDaySessions = sessionsByDay.get(prevKey) || [];
    daily.push({
      date: key,
      visitors: new Set(todaySessions.map((s) => s.visitorId)).size,
      sessions: todaySessions.length,
      prevVisitors: new Set(prevDaySessions.map((s) => s.visitorId)).size,
      prevSessions: prevDaySessions.length,
      newUsers: todaySessions.filter((s) => s.isNew).length,
      returningUsers: todaySessions.filter((s) => !s.isNew).length,
    });
  }

  function breakdown(rows: SessionRow[], key: "source" | "device" | "browser"): BreakdownSlice[] {
    const counts = new Map<string, number>();
    rows.forEach((r) => counts.set(r[key], (counts.get(r[key]) || 0) + 1));
    return Array.from(counts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }

  const trafficSources = breakdown(periodSessions, "source");
  const devices = breakdown(periodSessions, "device");
  const browsers = breakdown(periodSessions, "browser");

  const pageviewsBySession = new Map<string, PageviewRow[]>();
  periodPageviews.forEach((p) => {
    if (!pageviewsBySession.has(p.sessionId)) pageviewsBySession.set(p.sessionId, []);
    pageviewsBySession.get(p.sessionId)!.push(p);
  });
  pageviewsBySession.forEach((list) => list.sort((a, b) => a.enteredAt.getTime() - b.enteredAt.getTime()));

  const pageStats = new Map<string, { views: number; sessionsVisited: Set<string>; bounceSessions: Set<string>; exitSessions: Set<string>; durations: number[] }>();
  periodPageviews.forEach((p) => {
    if (!pageStats.has(p.path)) {
      pageStats.set(p.path, { views: 0, sessionsVisited: new Set(), bounceSessions: new Set(), exitSessions: new Set(), durations: [] });
    }
    const stat = pageStats.get(p.path)!;
    stat.views += 1;
    stat.sessionsVisited.add(p.sessionId);
    if (p.exitedAt) stat.durations.push((p.exitedAt.getTime() - p.enteredAt.getTime()) / 1000);
  });
  pageviewsBySession.forEach((list, sessionId) => {
    if (list.length === 1) pageStats.get(list[0].path)?.bounceSessions.add(sessionId);
    const last = list[list.length - 1];
    pageStats.get(last.path)?.exitSessions.add(sessionId);
  });

  const topPages: TopPageRow[] = Array.from(pageStats.entries())
    .map(([url, stat]) => ({
      url,
      views: stat.views,
      avgTimeSec: stat.durations.length ? stat.durations.reduce((a, b) => a + b, 0) / stat.durations.length : 0,
      bounceRate: stat.sessionsVisited.size ? (stat.bounceSessions.size / stat.sessionsVisited.size) * 100 : 0,
      exitRate: stat.sessionsVisited.size ? (stat.exitSessions.size / stat.sessionsVisited.size) * 100 : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  const geoStats = new Map<string, { country: string; city: string; visitors: Set<string> }>();
  periodSessions.forEach((s) => {
    const key = `${s.country}__${s.city}`;
    if (!geoStats.has(key)) geoStats.set(key, { country: s.country, city: s.city, visitors: new Set() });
    geoStats.get(key)!.visitors.add(s.visitorId);
  });
  const geo: GeoRow[] = Array.from(geoStats.values())
    .map((g) => ({ country: g.country, city: g.city, visitors: g.visitors.size }))
    .sort((a, b) => b.visitors - a.visitors);

  const FUNNEL_STEPS: { key: string | null; label: string }[] = [
    { key: null, label: "Visited" },
    { key: "signed_up", label: "Signed Up" },
    { key: "completed_onboarding", label: "Completed Onboarding" },
    { key: "started_habit_plan", label: "Started Habit/Plan" },
    { key: "upgraded_premium", label: "Upgraded to Premium" },
  ];
  const funnel: FunnelStep[] = FUNNEL_STEPS.map(({ key, label }) => ({
    step: label,
    users: key === null ? uniqueUsers : funnelByStep.get(key)?.size || 0,
  }));

  const scrollSamples = periodPageviews.filter((p) => p.scrollDepth !== null).map((p) => p.scrollDepth as number);
  const scrollDepthAvg = scrollSamples.length ? Math.round(scrollSamples.reduce((a, b) => a + b, 0) / scrollSamples.length) : 0;

  return { filters, kpis, daily, trafficSources, devices, browsers, topPages, geo, funnel, scrollDepthAvg };
}

const REALTIME_STALE_MS = 90000; // heartbeats fire every 20s; allow buffer for drift/backgrounding

export function subscribeRealtimePresence(callback: (viewers: RealtimeViewer[]) => void): () => void {
  const q = query(collection(db, "analyticsPresence"), orderBy("lastActiveAt", "desc"), limit(50));
  return onSnapshot(q, (snap) => {
    const now = Date.now();
    const viewers: RealtimeViewer[] = snap.docs
      .map((d) => {
        const data = d.data();
        const lastActiveAt: Timestamp | undefined = data.lastActiveAt;
        if (!lastActiveAt || now - lastActiveAt.toDate().getTime() > REALTIME_STALE_MS) return null;
        return {
          id: d.id,
          page: data.path || "/",
          device: data.device || "Desktop",
          country: data.country || "Unknown",
        };
      })
      .filter((v): v is RealtimeViewer => v !== null);
    callback(viewers);
  });
}
