"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Building2, MapPin, Lock, RefreshCw, Crown, Clock, Newspaper } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

const glassCard = {
  background: "rgba(255, 255, 255, 0.65)",
  border: "1px solid rgba(255, 255, 255, 0.80)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 4px 24px rgba(15, 23, 42, 0.07)",
} as const;

const PRAYERS = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
type PrayerName = (typeof PRAYERS)[number];

function fmt(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function nextPrayer(timings: PrayerTimings): PrayerName | null {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  for (const p of PRAYERS) {
    if (p === "Sunrise") continue;
    const [h, m] = timings[p].split(":").map(Number);
    if (h * 60 + m > mins) return p;
  }
  return null;
}

export default function MosquePage() {
  const { profile } = useAuth();
  const isPremium = profile?.plan && profile.plan !== "free";
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [dateStr, setDateStr] = useState("");
  const [city, setCity] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchPrayerTimes(lat: number, lon: number) {
    setLoading(true);
    setError(null);
    try {
      const today = new Date();
      const d = today.getDate();
      const mo = today.getMonth() + 1;
      const y = today.getFullYear();
      const [prayerRes, geoRes] = await Promise.all([
        fetch(`https://api.aladhan.com/v1/timings/${d}-${mo}-${y}?latitude=${lat}&longitude=${lon}&method=2`),
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`),
      ]);
      const prayerJson = await prayerRes.json();
      if (prayerJson.code === 200) {
        setTimings(prayerJson.data.timings as PrayerTimings);
        setDateStr(prayerJson.data.date.readable as string);
      } else {
        setError("Could not load prayer times. Please try again.");
      }
      const geo = await geoRes.json();
      setCity(
        (geo.address?.city as string | undefined) ??
        (geo.address?.town as string | undefined) ??
        (geo.address?.county as string | undefined) ??
        null
      );
    } catch {
      setError("Could not load prayer times. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  function getLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchPrayerTimes(pos.coords.latitude, pos.coords.longitude),
      () => {
        setError("Location access was denied. Please allow location access to see your local prayer times.");
        setLoading(false);
      },
      { timeout: 10000 }
    );
  }

  useEffect(() => {
    getLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const next = timings ? nextPrayer(timings) : null;

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-5 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Building2 size={22} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Mosque</h1>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <MapPin size={13} />
            <span>{city ?? (loading ? "Detecting your location…" : "Location not set")}</span>
            {timings && !loading && (
              <button
                onClick={getLocation}
                className="ml-1 text-slate-300 hover:text-blue-600 transition-colors"
                title="Refresh prayer times"
              >
                <RefreshCw size={12} />
              </button>
            )}
          </div>
        </motion.div>

        {/* Prayer times card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="mb-5">
          <div className="rounded-2xl p-6" style={glassCard}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-slate-800">Today&apos;s Prayer Times</h2>
                {dateStr && <p className="text-xs text-slate-400 mt-0.5">{dateStr}</p>}
              </div>
              <Clock size={16} className="text-slate-400" />
            </div>

            {loading && (
              <div className="flex flex-col items-center py-8 gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                <p className="text-sm text-slate-400">Loading prayer times…</p>
              </div>
            )}

            {error && !loading && (
              <div className="flex flex-col items-center py-8 gap-3 text-center">
                <MapPin size={28} className="text-slate-300" />
                <p className="text-sm text-slate-500 max-w-[260px] leading-relaxed">{error}</p>
                <button
                  onClick={getLocation}
                  className="text-sm font-semibold text-blue-600 hover:underline"
                >
                  Try again
                </button>
              </div>
            )}

            {timings && !loading && (
              <div className="space-y-2">
                {PRAYERS.map((prayer) => {
                  const isNext = prayer === next;
                  const isSunrise = prayer === "Sunrise";
                  return (
                    <div
                      key={prayer}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                        isNext
                          ? "bg-blue-600"
                          : isSunrise
                          ? "bg-slate-50"
                          : "bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isNext && (
                          <span className="text-[9px] font-bold uppercase tracking-widest text-blue-200 bg-blue-500/40 rounded px-1.5 py-0.5">
                            Next
                          </span>
                        )}
                        <span
                          className={`text-sm font-semibold ${
                            isNext ? "text-white" : isSunrise ? "text-slate-400" : "text-slate-700"
                          }`}
                        >
                          {prayer}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-bold tabular-nums ${
                          isNext ? "text-white" : isSunrise ? "text-slate-400" : "text-slate-800"
                        }`}
                      >
                        {fmt(timings[prayer])}
                      </span>
                    </div>
                  );
                })}
                <p className="text-center text-[11px] text-slate-400 pt-2">
                  Times based on your current location · Method: ISNA
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Mosque & Islamic News — premium only */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <div className="rounded-2xl p-6" style={glassCard}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Newspaper size={16} className="text-slate-600" />
                <h2 className="font-semibold text-slate-800">Mosque & Islamic News</h2>
              </div>
              {!isPremium && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                  <Crown size={10} /> Premium
                </span>
              )}
            </div>

            {isPremium ? (
              <div className="space-y-3">
                {[
                  { title: "Community iftar event this weekend — all welcome", source: "Community", time: "2h ago" },
                  { title: "New Quran class for beginners starting next week", source: "Community", time: "5h ago" },
                  { title: "Jumu\'ah khutbah: the importance of gratitude in Islam", source: "Community", time: "1d ago" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-0.5 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <p className="text-sm font-medium text-slate-800 leading-snug">{item.title}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>{item.source}</span>
                      <span>·</span>
                      <span>{item.time}</span>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-slate-400 text-center pt-1">
                  Live news integration coming soon
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                  <Lock size={20} className="text-amber-500" />
                </div>
                <p className="text-sm font-semibold text-slate-800">Premium feature</p>
                <p className="text-xs text-slate-400 leading-relaxed max-w-[240px]">
                  Get the latest news from mosques and Islamic organisations near you with a Premium plan.
                </p>
                <Link
                  href="/pricing"
                  className="mt-1 inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
                >
                  <Crown size={13} /> Upgrade to Premium
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
