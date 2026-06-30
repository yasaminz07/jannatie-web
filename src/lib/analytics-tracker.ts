"use client";

// Client-side event tracking. Every pageview/session/presence write here is
// real — there is no mock/simulated data anywhere in this file. Visitor and
// session identity live in localStorage/sessionStorage (no cookies, no auth
// required), so this also captures anonymous, signed-out traffic.

import { db } from "./firebase";
import {
  collection, doc, addDoc, setDoc, updateDoc, serverTimestamp, increment,
} from "firebase/firestore";

const VISITOR_KEY = "jnt_visitor_id";
const SESSION_KEY = "jnt_session_id";
const RETURNING_KEY = "jnt_returning";
const GEO_KEY = "jnt_geo_cache";
const LAST_PAGEVIEW_KEY = "jnt_last_pageview_id";

export type RegionKey = "uk" | "us" | "pakistan" | "bangladesh" | "india" | "saudi" | "uae" | "other";
export type FunnelStepKey = "signed_up" | "completed_onboarding" | "started_habit_plan" | "upgraded_premium";

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = uuid();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

function markReturningAndCheckIfNew(): boolean {
  if (localStorage.getItem(RETURNING_KEY)) return false;
  localStorage.setItem(RETURNING_KEY, "1");
  return true;
}

function getOrCreateSessionId(): { id: string; isNewSession: boolean } {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (id) return { id, isNewSession: false };
  id = uuid();
  sessionStorage.setItem(SESSION_KEY, id);
  return { id, isNewSession: true };
}

export function detectDevice(): "Mobile" | "Desktop" | "Tablet" {
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return "Tablet";
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return "Mobile";
  return "Desktop";
}

export function detectBrowser(): "Chrome" | "Safari" | "Firefox" | "Edge" | "Other" {
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return "Edge";
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return "Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "Safari";
  return "Other";
}

export function detectSource(): "Organic" | "Direct" | "Social" | "Referral" | "Paid" {
  const params = new URLSearchParams(window.location.search);
  const utmMedium = params.get("utm_medium") || "";
  const utmSource = params.get("utm_source") || "";
  if (utmMedium === "cpc" || utmMedium === "paid" || /ads?$/i.test(utmSource)) return "Paid";
  if (utmMedium === "social") return "Social";

  const ref = document.referrer;
  if (!ref) return "Direct";
  try {
    const refHost = new URL(ref).hostname.replace(/^www\./, "");
    const ownHost = window.location.hostname.replace(/^www\./, "");
    if (refHost === ownHost) return "Direct";
    if (/google\.|bing\.|yahoo\.|duckduckgo\./.test(refHost)) return "Organic";
    if (/facebook\.|instagram\.|twitter\.|x\.com|tiktok\.|linkedin\.|snapchat\.|pinterest\./.test(refHost)) return "Social";
    return "Referral";
  } catch {
    return "Direct";
  }
}

export function mapCountryToRegionKey(country: string): RegionKey {
  switch (country) {
    case "United Kingdom": return "uk";
    case "United States": return "us";
    case "Pakistan": return "pakistan";
    case "Bangladesh": return "bangladesh";
    case "India": return "india";
    case "Saudi Arabia": return "saudi";
    case "United Arab Emirates": return "uae";
    default: return "other";
  }
}

let geoPromise: Promise<{ country: string; city: string }> | null = null;

// Free, no-key IP geolocation. Best-effort — falls back to "Unknown" on
// failure/rate-limit so tracking never blocks on it. Cached per-tab.
export function getGeo(): Promise<{ country: string; city: string }> {
  if (geoPromise) return geoPromise;
  const cached = sessionStorage.getItem(GEO_KEY);
  if (cached) {
    geoPromise = Promise.resolve(JSON.parse(cached));
    return geoPromise;
  }
  geoPromise = fetch("https://ipwho.is/")
    .then((r) => r.json())
    .then((data) => {
      const geo = data && data.success !== false
        ? { country: data.country || "Unknown", city: data.city || "Unknown" }
        : { country: "Unknown", city: "Unknown" };
      sessionStorage.setItem(GEO_KEY, JSON.stringify(geo));
      return geo;
    })
    .catch(() => ({ country: "Unknown", city: "Unknown" }));
  return geoPromise;
}

function shouldTrack(path: string): boolean {
  return !path.startsWith("/admin");
}

// Logs a pageview doc, closes out the previous one's dwell time (for avg
// time-on-page / exit-rate math), and bumps the session's running totals.
export async function trackPageview(path: string): Promise<void> {
  if (typeof window === "undefined" || !shouldTrack(path)) return;

  const visitorId = getVisitorId();
  const { id: sessionId, isNewSession } = getOrCreateSessionId();
  const device = detectDevice();
  const browser = detectBrowser();
  const source = detectSource();
  const geo = await getGeo();
  const regionKey = mapCountryToRegionKey(geo.country);

  const prevPageviewId = sessionStorage.getItem(LAST_PAGEVIEW_KEY);
  if (prevPageviewId) {
    updateDoc(doc(db, "analyticsPageviews", prevPageviewId), { exitedAt: serverTimestamp() }).catch(() => {});
  }

  try {
    const pvRef = await addDoc(collection(db, "analyticsPageviews"), {
      visitorId, sessionId, path, device, browser, source,
      country: geo.country, city: geo.city, regionKey,
      enteredAt: serverTimestamp(),
      exitedAt: null,
      scrollDepth: null,
    });
    sessionStorage.setItem(LAST_PAGEVIEW_KEY, pvRef.id);
  } catch {
    // Firestore write failed (offline/blocked) — skip silently, never break navigation.
  }

  const sessionUpdate: Record<string, unknown> = {
    visitorId, device, browser, source,
    country: geo.country, city: geo.city, regionKey,
    lastSeenAt: serverTimestamp(),
    pageviews: increment(1),
  };
  if (isNewSession) {
    sessionUpdate.startedAt = serverTimestamp();
    sessionUpdate.isNew = markReturningAndCheckIfNew();
  }
  setDoc(doc(db, "analyticsSessions", sessionId), sessionUpdate, { merge: true }).catch(() => {});
}

// Records max scroll depth reached on the page being left.
export function recordScrollDepth(pct: number): void {
  if (typeof window === "undefined") return;
  const prevPageviewId = sessionStorage.getItem(LAST_PAGEVIEW_KEY);
  if (!prevPageviewId) return;
  updateDoc(doc(db, "analyticsPageviews", prevPageviewId), { scrollDepth: Math.round(pct) }).catch(() => {});
}

// Heartbeat for the live "active now" panel — call every ~15-20s while a
// tracked page is open. Presence docs are keyed by session, so re-sending
// just refreshes lastActiveAt.
export async function sendPresenceHeartbeat(path: string): Promise<void> {
  if (typeof window === "undefined" || !shouldTrack(path)) return;
  const visitorId = getVisitorId();
  const { id: sessionId } = getOrCreateSessionId();
  const device = detectDevice();
  const geo = await getGeo();
  setDoc(doc(db, "analyticsPresence", sessionId), {
    visitorId, path, device,
    country: geo.country, city: geo.city,
    lastActiveAt: serverTimestamp(),
  }, { merge: true }).catch(() => {});
}

// Conversion funnel — one doc per visitor per step (deterministic ID), so
// re-firing the same step for the same visitor is a harmless no-op rather
// than double-counting.
export async function trackFunnelStep(step: FunnelStepKey): Promise<void> {
  if (typeof window === "undefined") return;
  const visitorId = getVisitorId();
  try {
    await setDoc(doc(db, "analyticsFunnel", `${visitorId}__${step}`), {
      visitorId, step, timestamp: serverTimestamp(),
    }, { merge: true });
  } catch {
    // best-effort
  }
}
