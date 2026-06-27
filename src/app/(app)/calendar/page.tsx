"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, MapPin, Clock, X, Plus,
  Info, Droplets, BookOpen,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  collection, addDoc, getDocs, query, orderBy,
  serverTimestamp, deleteDoc, doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

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
  "Jumada al-Awwal": "The fifth month — an ancient pre-Islamic name meaning 'frozen'.",
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

interface PeriodEntry {
  id: string;
  start: string;
  end?: string;
  duringRamadan?: boolean;
  ramadanYear?: number;
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
  const [showHijriInfo, setShowHijriInfo] = useState(false);

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

  // Period tracker (females only)
  const [periods, setPeriods] = useState<PeriodEntry[]>([]);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [addingPeriod, setAddingPeriod] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);

  // Fetch prayer times for nearest Friday (for Jumu'ah)
  useEffect(() => {
    if (!navigator.geolocation) { setPrayerLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const friday = getNextFriday();
          const d = friday.getDate();
          const mo = friday.getMonth() + 1;
          const y = friday.getFullYear();
          const [pRes, gRes] = await Promise.all([
            fetch(`https://api.aladhan.com/v1/timings/${d}-${mo}-${y}?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&method=2`),
            fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&zoom=10`),
          ]);
          const pJson = await pRes.json();
          if (pJson.code === 200) {
            setJumuahTime(pJson.data.timings.Dhuhr as string);
            const h = pJson.data.date.hijri;
            setHijriMonth(h.month.en as string);
            setHijriYear(h.year as string);
            setHijriDay(h.day as string);
          }
          const geo = await gRes.json();
          setPrayerCity(
            (geo.address?.city as string | undefined) ??
            (geo.address?.town as string | undefined) ??
            null
          );
        } catch { /* silently fail */ } finally {
          setPrayerLoading(false);
        }
      },
      () => setPrayerLoading(false),
      { timeout: 8000 }
    );
  }, []);

  // Load user events
  useEffect(() => {
    if (!user) return;
    getDocs(query(collection(db, "users", user.uid, "events"), orderBy("date"))).then((snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserEvent)));
    });
  }, [user]);

  // Load period data (females only)
  useEffect(() => {
    if (!user || !isFemale) return;
    getDocs(query(collection(db, "users", user.uid, "periods"), orderBy("start", "desc"))).then((snap) => {
      setPeriods(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PeriodEntry)));
    });
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

  async function addPeriod() {
    if (!user || !periodStart) return;
    setAddingPeriod(true);
    try {
      const ref = await addDoc(collection(db, "users", user.uid, "periods"), {
        start: periodStart,
        end: periodEnd || null,
        createdAt: serverTimestamp(),
      });
      setPeriods((prev) => [{ id: ref.id, start: periodStart, end: periodEnd || undefined }, ...prev]);
      setPeriodStart(""); setPeriodEnd("");
      toast.success("Period cycle saved.");
    } catch {
      toast.error("Failed to save period.");
    } finally {
      setAddingPeriod(false);
    }
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

  const hijriDesc = HIJRI_MONTH_MEANINGS[hijriMonth];

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
              {hijriMonth && (
                <button
                  onClick={() => setShowHijriInfo(!showHijriInfo)}
                  className="text-slate-400 hover:text-blue-600 transition-colors"
                  title="What is this Islamic month?"
                >
                  <Info size={14} />
                </button>
              )}
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

        {/* Hijri month explanation */}
        <AnimatePresence>
          {showHijriInfo && hijriDesc && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 rounded-2xl p-4 flex gap-3 items-start"
              style={{ ...glassCard, background: "rgba(239,246,255,0.80)", border: "1px solid rgba(147,197,253,0.40)" }}
            >
              <BookOpen size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800">{hijriMonth}</p>
                <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">{hijriDesc}</p>
              </div>
              <button onClick={() => setShowHijriInfo(false)} className="ml-auto text-blue-400 hover:text-blue-600 flex-shrink-0">
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

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
                    return (
                      <div
                        key={day}
                        className="relative p-1.5 rounded-xl text-center min-h-[38px] transition-colors hover:bg-slate-100 cursor-pointer"
                        style={isTodayCell ? { background: "rgba(219,234,254,0.80)", border: "1px solid rgba(147,197,253,0.60)" } : {}}
                      >
                        <span className={`text-xs font-medium ${isTodayCell ? "text-blue-700" : isFriday ? "text-blue-500" : "text-slate-500"}`}>
                          {day}
                        </span>
                        {hasEvent && (
                          <div className="flex gap-0.5 justify-center mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          </div>
                        )}
                        {isFriday && !hasEvent && (
                          <div className="flex gap-0.5 justify-center mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-200" />
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
                    <h3 className="font-semibold text-slate-800 text-sm">Period Cycle Tracker</h3>
                  </div>
                  <button
                    onClick={() => setPeriodOpen(!periodOpen)}
                    className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {periodOpen ? "Hide" : "Log cycle"}
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
                      <div className="space-y-3 mb-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Period start date</label>
                          <input
                            type="date"
                            value={periodStart}
                            onChange={(e) => setPeriodStart(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-300"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Period end date (optional)</label>
                          <input
                            type="date"
                            value={periodEnd}
                            onChange={(e) => setPeriodEnd(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-300"
                          />
                        </div>
                        <button
                          onClick={addPeriod}
                          disabled={!periodStart || addingPeriod}
                          className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 rounded-xl text-sm transition-colors disabled:opacity-50"
                        >
                          {addingPeriod ? "Saving…" : "Save cycle"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {periods.length > 0 ? (
                  <div className="space-y-2">
                    {periods.slice(0, 3).map((p) => {
                      const startD = new Date(p.start);
                      const endD = p.end ? new Date(p.end) : null;
                      const days = endD
                        ? Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) + 1
                        : null;
                      return (
                        <div key={p.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-pink-50 border border-pink-100">
                          <div>
                            <p className="text-xs font-semibold text-slate-700">
                              {startD.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                              {endD ? ` – ${endD.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : " (ongoing)"}
                            </p>
                            {days && <p className="text-[11px] text-slate-400">{days} day{days !== 1 ? "s" : ""}</p>}
                          </div>
                          {days && (
                            <span className="text-[10px] font-bold text-pink-600 bg-pink-100 rounded-full px-2 py-0.5">
                              {days}d
                            </span>
                          )}
                        </div>
                      );
                    })}
                    <p className="text-[11px] text-slate-400 text-center pt-1">
                      Mark missed fasting days during Ramadan to track days to make up (Qadha).
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-2">
                    Track your cycle to know which Ramadan fasting days need to be made up.
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
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setAddEventOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-3xl p-6 max-w-sm w-full"
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
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-3xl p-6 max-w-sm w-full"
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
