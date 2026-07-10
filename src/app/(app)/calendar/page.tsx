"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, MapPin, Clock, X, Plus,
  Droplets,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  collection, addDoc, getDocs, query, orderBy,
  serverTimestamp, deleteDoc, doc, getDoc, setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { differenceInCalendarDays, parseISO, format as formatDate } from "date-fns";
import { computeCycleStats, groupPeriodDays, expandRangeToDates } from "@/lib/period-utils";

const HIJRI_MONTHS = [
  "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani",
  "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Shaban",
  "Ramadan", "Shawwal", "Dhul Qidah", "Dhul Hijjah",
];

const HIJRI_MONTH_MEANINGS: Record<string, string> = {
  "Muharram": "The first and one of the four sacred months. Fasting on Ashura (10th) is highly recommended.",
  "Safar": "The second month. Historically associated with travel.",
  "Rabi al-Awwal": "The month of the Prophet's birth ﷺ. A time of great celebration.",
  "Rabi al-Thani": "The fourth month. A continuation of spring.",
  "Jumada al-Awwal": "The fifth month, an ancient pre-Islamic name meaning 'frozen'.",
  "Jumada al-Thani": "The sixth month. Paired with Jumada al-Awwal.",
  "Rajab": "One of the four sacred months. The Night Journey (Isra and Mi'raj) occurred in this month.",
  "Shaban": "The month before Ramadan. The Prophet ﷺ used to fast much in Shaban.",
  "Ramadan": "The holiest month. Fasting is obligatory. The Quran was revealed in this month.",
  "Shawwal": "The month after Ramadan. Fasting 6 days in Shawwal is like fasting the whole year.",
  "Dhul Qidah": "One of the four sacred months. Fighting is forbidden.",
  "Dhul Hijjah": "The month of Hajj. The first 10 days are among the best days of the year. Eid al-Adha is on the 10th.",
};

const GREG_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const EVENT_TYPES = ["personal", "mosque", "study", "community"] as const;
type EventType = (typeof EVENT_TYPES)[number];

const TYPE_COLORS: Record<EventType, { dot: string; label: string; bg: string }> = {
  mosque: { dot: "bg-blue-500", label: "Mosque", bg: "bg-blue-50 border-blue-100" },
  study: { dot: "bg-emerald-500", label: "Study", bg: "bg-emerald-50 border-emerald-100" },
  community: { dot: "bg-violet-500", label: "Community", bg: "bg-violet-50 border-violet-100" },
  personal: { dot: "bg-slate-400", label: "Personal", bg: "bg-slate-50 border-slate-100" },
};

interface UserEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: EventType;
  note?: string;
}

const glassCard = {
  background: "rgba(255, 255, 255, 0.65)",
  border: "1px solid rgba(255, 255, 255, 0.80)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 4px 24px rgba(15, 23, 42, 0.07)",
} as const;

function fmt12(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getNextFriday(): Date {
  const d = new Date();
  const day = d.getDay(); // 0=Sun, 5=Fri
  const daysUntilFriday = day === 5 ? 0 : (5 - day + 7) % 7;
  d.setDate(d.getDate() + daysUntilFriday);
  return d;
}

export default function CalendarPage() {
  const { profile, user } = useAuth();
  const isFemale = profile?.gender === "female";

  const today = new Date();
  const [displayMonth, setDisplayMonth] = useState(today.getMonth());
  const [displayYear, setDisplayYear] = useState(today.getFullYear());
  const [view, setView] = useState<"month" | "list">("month");

  // Prayer times
  const [jumuahTime, setJumuahTime] = useState<string | null>(null);
  const [prayerCity, setPrayerCity] = useState<string | null>(null);
  const [prayerLoading, setPrayerLoading] = useState(true);

  // Hijri date
  const [hijriMonth, setHijriMonth] = useState<string>("Shaban");
  const [hijriYear, setHijriYear] = useState<string>("1447");
  const [hijriDay, setHijriDay] = useState<string>("1");

  // User events
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState(today.toISOString().split("T")[0]);
  const [newTime, setNewTime] = useState("");
  const [newType, setNewType] = useState<EventType>("personal");
  const [newNote, setNewNote] = useState("");
  const [addingEvent, setAddingEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<UserEvent | null>(null);

  // Period tracker (females only) — each logged day is its own Firestore doc, id = date string
  const [periodDays, setPeriodDays] = useState<Set<string>>(new Set());
  const [periodOpen, setPeriodOpen] = useState(false);
  const [periodDisplayMonth, setPeriodDisplayMonth] = useState(today.getMonth());
  const [periodDisplayYear, setPeriodDisplayYear] = useState(today.getFullYear());
  const [togglingDay, setTogglingDay] = useState<string | null>(null);

  // Fetch Jumu'ah time — use the chosen mosque's coords if saved, else user's own location
  useEffect(() => {
    if (!user) return;
    async function loadJumuah() {
      try {
        // Check if user has a chosen mosque saved in Firestore
        const userSnap = await getDoc(doc(db, "users", user!.uid));
        const chosenMosque = userSnap.exists()
          ? (userSnap.data() as { chosenMosque?: { lat: number; lon: number; name: string } | null }).chosenMosque
          : null;

        const fetchWithCoords = async (lat: number, lon: number, city?: string) => {
          const friday = getNextFriday();
          const d = friday.getDate();
          const mo = friday.getMonth() + 1;
          const y = friday.getFullYear();
          const pRes = await fetch(
            `https://api.aladhan.com/v1/timings/${d}-${mo}-${y}?latitude=${lat}&longitude=${lon}&method=3`
          );
          const pJson = await pRes.json();
          if (pJson.code === 200) {
            setJumuahTime(pJson.data.timings.Dhuhr as string);
            const h = pJson.data.date.hijri;
            setHijriMonth(h.month.en as string);
            setHijriYear(h.year as string);
            setHijriDay(h.day as string);
          }
          if (city) setPrayerCity(city);
        };

        if (chosenMosque) {
          await fetchWithCoords(chosenMosque.lat, chosenMosque.lon, chosenMosque.name);
          setPrayerLoading(false);
          return;
        }

        // Fall back to geolocation
        if (!navigator.geolocation) { setPrayerLoading(false); return; }
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const gRes = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&zoom=10`
              );
              const geo = await gRes.json();
              const city =
                (geo.address?.city as string | undefined) ??
                (geo.address?.town as string | undefined) ??
                undefined;
              await fetchWithCoords(pos.coords.latitude, pos.coords.longitude, city);
            } catch { /* silently fail */ } finally {
              setPrayerLoading(false);
            }
          },
          () => setPrayerLoading(false),
          { timeout: 8000 }
        );
      } catch {
        setPrayerLoading(false);
      }
    }
    loadJumuah();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Load user events
  useEffect(() => {
    if (!user) return;
    getDocs(query(collection(db, "users", user.uid, "events"), orderBy("date")))
      .then((snap) => {
        setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserEvent)));
      })
      .catch(() => {
        // Fallback without orderBy if index not yet created
        getDocs(collection(db, "users", user.uid, "events")).then((snap) => {
          setEvents(
            snap.docs
              .map((d) => ({ id: d.id, ...d.data() } as UserEvent))
              .sort((a, b) => a.date.localeCompare(b.date))
          );
        }).catch(() => {});
      });
  }, [user]);

  // Load period data (females only) — doc id is the date string, no index needed
  useEffect(() => {
    if (!user || !isFemale) return;
    getDocs(collection(db, "users", user.uid, "periods"))
      .then((snap) => setPeriodDays(new Set(snap.docs.map((d) => d.id))))
      .catch(() => {});
  }, [user, isFemale]);

  async function addEvent() {
    if (!user || !newTitle.trim() || !newDate) return;
    setAddingEvent(true);
    try {
      const ref = await addDoc(collection(db, "users", user.uid, "events"), {
        title: newTitle.trim(),
        date: newDate,
        time: newTime || null,
        type: newType,
        note: newNote.trim() || null,
        createdAt: serverTimestamp(),
      });
      setEvents((prev) => [...prev, {
        id: ref.id, title: newTitle.trim(), date: newDate,
        time: newTime || undefined, type: newType, note: newNote.trim() || undefined,
      }].sort((a, b) => a.date.localeCompare(b.date)));
      setAddEventOpen(false);
      setNewTitle(""); setNewDate(today.toISOString().split("T")[0]); setNewTime(""); setNewNote(""); setNewType("personal");
      toast.success("Event added!");
    } catch {
      toast.error("Failed to add event.");
    } finally {
      setAddingEvent(false);
    }
  }

  async function deleteEvent(id: string) {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "events", id));
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setSelectedEvent(null);
    toast.success("Event removed.");
  }

  async function togglePeriodDay(dateStr: string) {
    if (!user || dateStr > todayStr) return;
    setTogglingDay(dateStr);
    const wasMarked = periodDays.has(dateStr);
    setPeriodDays((prev) => {
      const next = new Set(prev);
      if (wasMarked) next.delete(dateStr); else next.add(dateStr);
      return next;
    });
    try {
      if (wasMarked) {
        await deleteDoc(doc(db, "users", user.uid, "periods", dateStr));
      } else {
        await setDoc(doc(db, "users", user.uid, "periods", dateStr), {
          date: dateStr,
          loggedAt: serverTimestamp(),
        });
      }
    } catch {
      setPeriodDays((prev) => {
        const next = new Set(prev);
        if (wasMarked) next.add(dateStr); else next.delete(dateStr);
        return next;
      });
      toast.error("Failed to update period day.");
    } finally {
      setTogglingDay(null);
    }
  }

  function prevPeriodMonth() {
    if (periodDisplayMonth === 0) { setPeriodDisplayMonth(11); setPeriodDisplayYear((y) => y - 1); }
    else setPeriodDisplayMonth((m) => m - 1);
  }
  function nextPeriodMonth() {
    if (periodDisplayMonth === 11) { setPeriodDisplayMonth(0); setPeriodDisplayYear((y) => y + 1); }
    else setPeriodDisplayMonth((m) => m + 1);
  }

  // Calendar grid
  const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(displayYear, displayMonth, 1).getDay();

  const eventDatesInMonth = new Set(
    events
      .filter((e) => {
        const [ey, em] = e.date.split("-").map(Number);
        return ey === displayYear && em === displayMonth + 1;
      })
      .map((e) => parseInt(e.date.split("-")[2]))
  );

  const isTodayMonth = displayMonth === today.getMonth() && displayYear === today.getFullYear();

  // Upcoming events (next 30 days)
  const todayStr = today.toISOString().split("T")[0];
  const upcomingEvents = events.filter((e) => e.date >= todayStr).slice(0, 10);

  // Next Friday date string for Jumu'ah
  const nextFriday = getNextFriday();
  const nextFridayStr = nextFriday.toISOString().split("T")[0];
  const nextFridayDisplay = nextFriday.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  // Period cycle stats + predictions (females only)
  const cycleStats = useMemo(() => computeCycleStats(Array.from(periodDays)), [periodDays]);
  const predictedDaySet = useMemo(() => {
    const s = new Set<string>();
    cycleStats.predictedRanges.forEach((r) => expandRangeToDates(r).forEach((d) => s.add(d)));
    return s;
  }, [cycleStats]);
  const recentCycles = useMemo(
    () => groupPeriodDays(Array.from(periodDays).sort()).slice(-3).reverse(),
    [periodDays]
  );
  const nextPredicted = cycleStats.predictedRanges[0] ?? null;

  // Period mini-calendar grid dimensions
  const periodDaysInMonth = new Date(periodDisplayYear, periodDisplayMonth + 1, 0).getDate();
  const periodFirstDay = new Date(periodDisplayYear, periodDisplayMonth, 1).getDay();

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-5 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Islamic Calendar</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-slate-400">
                {GREG_MONTHS[displayMonth]} {displayYear}
                {!prayerLoading && hijriMonth && (
                  <> · {hijriDay} {hijriMonth} {hijriYear} AH</>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {(["month", "list"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="px-3 py-1.5 rounded-xl text-sm font-medium capitalize transition-all"
                  style={
                    view === v
                      ? { background: "rgba(219,234,254,0.80)", border: "1px solid rgba(147,197,253,0.60)", color: "#1d4ed8" }
                      : { background: "rgba(255,255,255,0.65)", border: "1px solid rgba(226,232,240,0.80)", color: "#94a3b8" }
                  }
                >
                  {v}
                </button>
              ))}
            </div>
            <button
              onClick={() => setAddEventOpen(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-3 py-1.5 rounded-xl transition-colors"
            >
              <Plus size={14} /> Add event
            </button>
          </div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Calendar grid */}
          {view === "month" && (
            <div className="lg:col-span-2">
              <div className="rounded-2xl p-5" style={glassCard}>
                <div className="flex items-center justify-between mb-5">
                  <button
                    onClick={() => {
                      if (displayMonth === 0) { setDisplayMonth(11); setDisplayYear((y) => y - 1); }
                      else setDisplayMonth((m) => m - 1);
                    }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 border border-slate-200 transition-colors"
                  >
                    <ChevronLeft size={16} className="text-slate-400" />
                  </button>
                  <h2 className="font-bold text-slate-800">{GREG_MONTHS[displayMonth]} {displayYear}</h2>
                  <button
                    onClick={() => {
                      if (displayMonth === 11) { setDisplayMonth(0); setDisplayYear((y) => y + 1); }
                      else setDisplayMonth((m) => m + 1);
                    }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 border border-slate-200 transition-colors"
                  >
                    <ChevronRight size={16} className="text-slate-400" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
                    <div key={d + i} className={`text-center text-[10px] font-semibold py-1 ${d === "Fr" ? "text-blue-500" : "text-slate-400"}`}>
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e-${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isTodayCell = isTodayMonth && day === today.getDate();
                    const hasEvent = eventDatesInMonth.has(day);
                    const isFriday = new Date(displayYear, displayMonth, day).getDay() === 5;
                    const cellDateStr = toDateStr(displayYear, displayMonth, day);
                    const isPeriodDay = isFemale && periodDays.has(cellDateStr);
                    const isPredictedPeriod = isFemale && !isPeriodDay && predictedDaySet.has(cellDateStr);
                    const showDots = hasEvent || (isFriday && !hasEvent) || isPeriodDay || isPredictedPeriod;
                    return (
                      <div
                        key={day}
                        className="relative p-1.5 rounded-xl text-center min-h-[38px] transition-colors hover:bg-slate-100 cursor-pointer"
                        style={isTodayCell ? { background: "rgba(219,234,254,0.80)", border: "1px solid rgba(147,197,253,0.60)" } : {}}
                      >
                        <span className={`text-xs font-medium ${isTodayCell ? "text-blue-700" : isFriday ? "text-blue-500" : "text-slate-500"}`}>
                          {day}
                        </span>
                        {showDots && (
                          <div className="flex gap-0.5 justify-center mt-0.5">
                            {hasEvent && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                            {isFriday && !hasEvent && <div className="w-1.5 h-1.5 rounded-full bg-blue-200" />}
                            {isPeriodDay && <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />}
                            {isPredictedPeriod && <div className="w-1.5 h-1.5 rounded-full border border-pink-300" />}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-4 mt-4 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-200" /> Jumu&apos;ah (Friday)
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Your event
                  </div>
                  {isFemale && (
                    <>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-pink-500" /> Period
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full border border-pink-300" /> Predicted
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Right column: Jumu'ah + upcoming events */}
          <div className={view === "month" ? "" : "lg:col-span-3"}>
            {/* Jumu'ah prayer time */}
            <div className="rounded-2xl p-4 mb-4" style={{ ...glassCard, border: "1px solid rgba(147,197,253,0.40)", background: "rgba(239,246,255,0.70)" }}>
              <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-2">Jumu&apos;ah — Friday Prayer</p>
              <p className="text-sm font-semibold text-slate-800 mb-0.5">{nextFridayDisplay}</p>
              {prayerLoading ? (
                <p className="text-xs text-slate-400">Loading prayer time…</p>
              ) : jumuahTime ? (
                <div className="flex items-center gap-1.5 text-sm text-blue-700 font-semibold">
                  <Clock size={13} />
                  {fmt12(jumuahTime)}
                  {prayerCity && <span className="text-slate-400 font-normal">· {prayerCity}</span>}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Allow location access to see your local Jumu&apos;ah time.</p>
              )}
            </div>

            {/* Upcoming events */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-600 text-sm">Your Upcoming Events</h3>
              </div>
              {upcomingEvents.length === 0 ? (
                <div className="rounded-2xl p-6 text-center" style={glassCard}>
                  <p className="text-sm text-slate-400 mb-3">No events yet.</p>
                  <button
                    onClick={() => setAddEventOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:underline"
                  >
                    <Plus size={12} /> Add your first event
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingEvents.map((event) => (
                    <motion.button
                      key={event.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setSelectedEvent(event)}
                      className="w-full text-left rounded-2xl p-4 transition-all hover:bg-white/80"
                      style={glassCard}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${TYPE_COLORS[event.type]?.dot ?? "bg-slate-400"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{event.title}</p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-xs text-slate-400">{event.date}</span>
                            {event.time && (
                              <span className="flex items-center gap-1 text-xs text-slate-400">
                                <Clock size={10} /> {fmt12(event.time)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Period cycle tracker — females only */}
            {isFemale && (
              <div className="rounded-2xl p-5" style={{ ...glassCard, border: "1px solid rgba(244,114,182,0.30)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Droplets size={15} className="text-pink-400" />
                    <h3 className="font-semibold text-slate-800 text-sm">Period Tracker</h3>
                  </div>
                  <button
                    onClick={() => setPeriodOpen(!periodOpen)}
                    className="flex items-center gap-1.5 bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
                  >
                    {periodOpen ? "Hide" : "Log period days"}
                  </button>
                </div>

                <AnimatePresence>
                  {periodOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <button
                            onClick={prevPeriodMonth}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-pink-50 border border-pink-100 transition-colors"
                          >
                            <ChevronLeft size={13} className="text-pink-400" />
                          </button>
                          <p className="text-xs font-bold text-slate-700">
                            {GREG_MONTHS[periodDisplayMonth]} {periodDisplayYear}
                          </p>
                          <button
                            onClick={nextPeriodMonth}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-pink-50 border border-pink-100 transition-colors"
                          >
                            <ChevronRight size={13} className="text-pink-400" />
                          </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-1">
                          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                            <div key={d + i} className="text-center text-[9px] font-semibold text-slate-400 py-0.5">
                              {d}
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: periodFirstDay }).map((_, i) => <div key={`pe-${i}`} />)}
                          {Array.from({ length: periodDaysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const cellDateStr = toDateStr(periodDisplayYear, periodDisplayMonth, day);
                            const isMarked = periodDays.has(cellDateStr);
                            const isPredicted = !isMarked && predictedDaySet.has(cellDateStr);
                            const isFuture = cellDateStr > todayStr;
                            const isTodayCell = cellDateStr === todayStr;
                            const isBusy = togglingDay === cellDateStr;
                            return (
                              <button
                                key={day}
                                type="button"
                                disabled={isFuture || isBusy}
                                onClick={() => togglePeriodDay(cellDateStr)}
                                className={`relative h-8 rounded-lg text-[11px] font-semibold flex items-center justify-center transition-all ${
                                  isFuture ? "cursor-default" : "cursor-pointer hover:bg-pink-50"
                                } ${isTodayCell ? "ring-1 ring-blue-300" : ""}`}
                                style={
                                  isMarked
                                    ? { background: "#ec4899", color: "white" }
                                    : isPredicted
                                    ? { border: "1.5px dashed #f9a8d4", color: "#db2777" }
                                    : { color: isFuture ? "#cbd5e1" : "#475569" }
                                }
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {cycleStats.ranges.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 bg-pink-50/70 rounded-xl px-3 py-2">
                      <span>Avg cycle: <strong className="text-slate-700">{cycleStats.avgCycleLength}d</strong></span>
                      <span>Avg period: <strong className="text-slate-700">{cycleStats.avgPeriodLength}d</strong></span>
                    </div>
                    {nextPredicted && (
                      <p className="text-[11px] text-pink-600 text-center font-semibold">
                        Next period expected {formatDate(parseISO(nextPredicted.start), "d MMM")}
                        {" "}({Math.max(0, differenceInCalendarDays(parseISO(nextPredicted.start), today))}d away)
                      </p>
                    )}
                    {recentCycles.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {recentCycles.map((r) => (
                          <div key={r.start} className="flex items-center justify-between px-3 py-2 rounded-xl bg-pink-50 border border-pink-100">
                            <p className="text-xs font-semibold text-slate-700">
                              {formatDate(parseISO(r.start), "d MMM")}
                              {r.end !== r.start ? ` – ${formatDate(parseISO(r.end), "d MMM")}` : ""}
                            </p>
                            <span className="text-[10px] font-bold text-pink-600 bg-pink-100 rounded-full px-2 py-0.5">
                              {differenceInCalendarDays(parseISO(r.end), parseISO(r.start)) + 1}d
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-[11px] text-slate-400 text-center pt-1">
                      Also helps track which Ramadan fasting days may need to be made up (Qadha).
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-2">
                    Tap &quot;Log period days&quot; to mark days on the calendar, including past cycles you remember.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add event modal */}
      <AnimatePresence>
        {addEventOpen && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setAddEventOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-3xl p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto"
              style={{
                background: "rgba(255,255,255,0.97)",
                backdropFilter: "blur(32px)",
                WebkitBackdropFilter: "blur(32px)",
                border: "1px solid rgba(255,255,255,0.95)",
                boxShadow: "0 20px 60px rgba(15,23,42,0.14)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-900">Add event</h2>
                <button onClick={() => setAddEventOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Event title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Time (optional)"
                />
                <div className="grid grid-cols-2 gap-2">
                  {EVENT_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewType(t)}
                      className={`py-2 rounded-xl border text-xs font-medium capitalize transition-all ${
                        newType === t
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="Note (optional)"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <button
                  onClick={addEvent}
                  disabled={!newTitle.trim() || !newDate || addingEvent}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors text-sm disabled:opacity-50"
                >
                  {addingEvent ? "Saving…" : "Add to calendar"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Event detail modal */}
      <AnimatePresence>
        {selectedEvent && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-3xl p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto"
              style={{
                background: "rgba(255,255,255,0.97)",
                backdropFilter: "blur(32px)",
                WebkitBackdropFilter: "blur(32px)",
                border: "1px solid rgba(255,255,255,0.95)",
                boxShadow: "0 20px 60px rgba(15,23,42,0.14)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-3 h-3 rounded-full mt-1.5 ${TYPE_COLORS[selectedEvent.type]?.dot ?? "bg-slate-400"}`} />
                <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-700 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">{selectedEvent.title}</h2>
              <div className="space-y-2 mb-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="flex-shrink-0 text-slate-400" />
                  <span>{selectedEvent.date}{selectedEvent.time ? ` at ${fmt12(selectedEvent.time)}` : ""}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="flex-shrink-0 text-slate-400" />
                  <span className="capitalize">{selectedEvent.type} event</span>
                </div>
                {selectedEvent.note && (
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{selectedEvent.note}</p>
                )}
              </div>
              <button
                onClick={() => deleteEvent(selectedEvent.id)}
                className="w-full border border-red-200 text-red-500 hover:bg-red-50 font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                Remove event
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
