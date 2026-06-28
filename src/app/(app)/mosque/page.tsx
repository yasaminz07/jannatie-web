"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Building2, MapPin, Lock, RefreshCw, Crown, Clock, Newspaper, ChevronDown, Check, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface NearbyMosque {
  id: number;
  name: string;
  lat: number;
  lon: number;
  distanceKm: number;
}

interface SavedMosque {
  id: number;
  name: string;
  lat: number;
  lon: number;
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

// Method 3 (MWL) is a reliable default for UK/global
const DEFAULT_METHOD = 3;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

async function fetchMosquesNearby(lat: number, lon: number): Promise<NearbyMosque[]> {
  // Search nodes, ways AND relations — mosques are often stored as polygon ways/relations in OSM
  // Use two tag combos: amenity=mosque OR amenity=place_of_worship + religion=muslim
  // out center gives lat/lon for way/relation centroids
  const overpassQuery = `
[out:json][timeout:30];
(
  node["amenity"="mosque"](around:25000,${lat},${lon});
  node["amenity"="place_of_worship"]["religion"="muslim"](around:25000,${lat},${lon});
  way["amenity"="mosque"](around:25000,${lat},${lon});
  way["amenity"="place_of_worship"]["religion"="muslim"](around:25000,${lat},${lon});
  relation["amenity"="mosque"](around:25000,${lat},${lon});
  relation["amenity"="place_of_worship"]["religion"="muslim"](around:25000,${lat},${lon});
);
out center 100;
  `.trim();

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: overpassQuery,
  });
  const json = await res.json() as {
    elements: {
      id: number;
      type: "node" | "way" | "relation";
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
    }[];
  };

  const seen = new Set<string>();
  return json.elements
    .filter((el) => {
      const name = el.tags?.name;
      if (!name) return false;
      // deduplicate by name (nodes and ways for same mosque both appear)
      if (seen.has(name.toLowerCase())) return false;
      seen.add(name.toLowerCase());
      return true;
    })
    .map((el) => {
      // nodes have lat/lon directly; ways and relations expose a center object
      const elLat = el.lat ?? el.center?.lat ?? 0;
      const elLon = el.lon ?? el.center?.lon ?? 0;
      return {
        id: el.id,
        name: el.tags!.name!,
        lat: elLat,
        lon: elLon,
        distanceKm: haversineKm(lat, lon, elLat, elLon),
      };
    })
    .filter((m) => m.lat !== 0 && m.lon !== 0)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 60);
}

async function fetchTimingsForCoords(lat: number, lon: number): Promise<PrayerTimings | null> {
  const today = new Date();
  const d = today.getDate();
  const mo = today.getMonth() + 1;
  const y = today.getFullYear();
  const res = await fetch(
    `https://api.aladhan.com/v1/timings/${d}-${mo}-${y}?latitude=${lat}&longitude=${lon}&method=${DEFAULT_METHOD}`
  );
  const json = await res.json();
  if (json.code === 200) return json.data.timings as PrayerTimings;
  return null;
}

export default function MosquePage() {
  const { profile, user } = useAuth();
  const isPremium = profile?.plan && profile.plan !== "free";

  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [dateStr, setDateStr] = useState("");
  const [city, setCity] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mosque picker
  const [selectedMosque, setSelectedMosque] = useState<SavedMosque | null>(
    (profile as { chosenMosque?: SavedMosque })?.chosenMosque ?? null
  );
  const [nearbyMosques, setNearbyMosques] = useState<NearbyMosque[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [mosqueSearch, setMosqueSearch] = useState("");
  const [loadingMosques, setLoadingMosques] = useState(false);

  const filteredMosques = nearbyMosques.filter((m) =>
    m.name.toLowerCase().includes(mosqueSearch.toLowerCase())
  );

  async function loadPrayerTimes(lat: number, lon: number, mosque?: SavedMosque | null) {
    setLoading(true);
    setError(null);
    try {
      const target = mosque ?? null;
      const [timingsResult, geoRes] = await Promise.all([
        fetchTimingsForCoords(target ? target.lat : lat, target ? target.lon : lon),
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`),
      ]);
      if (timingsResult) {
        setTimings(timingsResult);
        const today = new Date();
        setDateStr(today.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }));
      } else {
        setError("Could not load prayer times. Please try again.");
      }
      const geo = await geoRes.json();
      const cityName =
        (geo.address?.city as string | undefined) ??
        (geo.address?.town as string | undefined) ??
        (geo.address?.county as string | undefined) ??
        null;
      const countryCode = (geo.address?.country_code as string | undefined)?.toUpperCase() ?? null;
      setCity(cityName && countryCode ? `${cityName}, ${countryCode}` : cityName);
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
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setUserCoords({ lat, lon });
        const mosque = (profile as { chosenMosque?: SavedMosque })?.chosenMosque ?? selectedMosque ?? null;
        await loadPrayerTimes(lat, lon, mosque);
        // If picker is open and list is empty, fetch now that we have coords
        setNearbyMosques((prev) => {
          if (prev.length === 0) {
            setLoadingMosques(true);
            fetchMosquesNearby(lat, lon)
              .then((m) => setNearbyMosques(m))
              .catch(() => setNearbyMosques([]))
              .finally(() => setLoadingMosques(false));
          }
          return prev;
        });
      },
      () => {
        setError("Location access was denied. Please allow location access to see prayer times.");
        setLoading(false);
      },
      { timeout: 10000 }
    );
  }

  async function openMosquePicker() {
    setShowPicker(true);
    // Already fetched — no need to re-fetch
    if (nearbyMosques.length > 0) return;
    // Coords not ready yet — getLocation will trigger fetch once they arrive
    if (!userCoords) {
      setLoadingMosques(true);
      return;
    }
    setLoadingMosques(true);
    try {
      const mosques = await fetchMosquesNearby(userCoords.lat, userCoords.lon);
      setNearbyMosques(mosques);
    } catch {
      setNearbyMosques([]);
    } finally {
      setLoadingMosques(false);
    }
  }

  async function chooseMosque(mosque: NearbyMosque) {
    const saved: SavedMosque = { id: mosque.id, name: mosque.name, lat: mosque.lat, lon: mosque.lon };
    setSelectedMosque(saved);
    setShowPicker(false);
    setMosqueSearch("");
    if (userCoords) {
      await loadPrayerTimes(userCoords.lat, userCoords.lon, saved);
    }
    if (user) {
      await updateDoc(doc(db, "users", user.uid), { chosenMosque: saved });
    }
  }

  async function clearMosque() {
    setSelectedMosque(null);
    setShowPicker(false);
    if (userCoords) {
      await loadPrayerTimes(userCoords.lat, userCoords.lon, null);
    }
    if (user) {
      await updateDoc(doc(db, "users", user.uid), { chosenMosque: null });
    }
  }

  useEffect(() => {
    const saved = (profile as { chosenMosque?: SavedMosque })?.chosenMosque;
    if (saved) setSelectedMosque(saved);
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
            {!loading && (
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

        {/* Mosque selector */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="mb-5">
          <div className="rounded-2xl overflow-hidden" style={glassCard}>
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Following mosque</p>
                {selectedMosque ? (
                  <p className="text-sm font-semibold text-slate-800 truncate">{selectedMosque.name}</p>
                ) : (
                  <p className="text-sm text-slate-400">No mosque selected — using your location</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {selectedMosque && (
                  <button
                    onClick={clearMosque}
                    className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={openMosquePicker}
                  className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {selectedMosque ? "Change" : "Choose mosque"}
                  <ChevronDown size={14} className={`transition-transform ${showPicker ? "rotate-180" : ""}`} />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showPicker && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-slate-100"
                >
                  {/* Search */}
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200">
                      <Search size={13} className="text-slate-400 flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="Search mosques near you…"
                        value={mosqueSearch}
                        onChange={(e) => setMosqueSearch(e.target.value)}
                        className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto">
                    {loadingMosques ? (
                      <div className="flex items-center justify-center py-8 gap-2">
                        <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                        <p className="text-sm text-slate-400">Finding mosques near you…</p>
                      </div>
                    ) : filteredMosques.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-sm text-slate-400">
                          {nearbyMosques.length === 0
                            ? !userCoords
                              ? "Allow location access to find local mosques."
                              : "No mosques found in your area."
                            : "No matches for your search."}
                        </p>
                      </div>
                    ) : (
                      <div className="p-2 space-y-0.5">
                        {filteredMosques.map((mosque) => {
                          const active = selectedMosque?.id === mosque.id;
                          return (
                            <button
                              key={mosque.id}
                              onClick={() => chooseMosque(mosque)}
                              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-colors ${
                                active ? "bg-blue-50 border border-blue-100" : "hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${active ? "text-blue-700" : "text-slate-700"}`}>
                                  {mosque.name}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {mosque.distanceKm < 1
                                    ? `${Math.round(mosque.distanceKm * 1000)}m away`
                                    : `${mosque.distanceKm.toFixed(1)}km away`}
                                </p>
                              </div>
                              {active && <Check size={14} className="text-blue-600 flex-shrink-0 ml-2" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-2 border-t border-slate-100">
                    <p className="text-[11px] text-slate-400 text-center">
                      Mosques sourced from OpenStreetMap · sorted by distance
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Prayer times card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mb-5">
          <div className="rounded-2xl p-6" style={glassCard}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-slate-800">Today&apos;s Prayer Times</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedMosque ? selectedMosque.name : dateStr || "Your location"}
                </p>
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
                <button onClick={getLocation} className="text-sm font-semibold text-blue-600 hover:underline">
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
                        isNext ? "bg-blue-600" : "bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isNext && (
                          <span className="text-[9px] font-bold uppercase tracking-widest text-blue-200 bg-blue-500/40 rounded px-1.5 py-0.5">
                            Next
                          </span>
                        )}
                        <span className={`text-sm font-semibold ${isNext ? "text-white" : isSunrise ? "text-slate-400" : "text-slate-700"}`}>
                          {prayer}
                        </span>
                      </div>
                      <span className={`text-sm font-bold tabular-nums ${isNext ? "text-white" : isSunrise ? "text-slate-400" : "text-slate-800"}`}>
                        {fmt(timings[prayer])}
                      </span>
                    </div>
                  );
                })}
                <p className="text-center text-[11px] text-slate-400 pt-2">
                  {selectedMosque
                    ? `Times based on ${selectedMosque.name} location`
                    : "Times based on your current location"}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Mosque & Islamic News — premium only */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <div className="rounded-2xl p-6" style={glassCard}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Newspaper size={16} className="text-slate-600" />
                <h2 className="font-semibold text-slate-800">Mosque &amp; Islamic News</h2>
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
                  { title: "Jumu'ah khutbah: the importance of gratitude in Islam", source: "Community", time: "1d ago" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col gap-0.5 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-sm font-medium text-slate-800 leading-snug">{item.title}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>{item.source}</span>
                      <span>·</span>
                      <span>{item.time}</span>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-slate-400 text-center pt-1">Live news integration coming soon</p>
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
