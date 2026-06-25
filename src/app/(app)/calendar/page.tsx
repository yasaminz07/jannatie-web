"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin, Clock, Users, X } from "lucide-react";

const HIJRI_MONTHS = ["Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani", "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Shaban", "Ramadan", "Shawwal", "Dhul Qidah", "Dhul Hijjah"];
const GREG_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const EVENTS = [
  { id: "1", title: "Friday Jumu'ah", date: "2026-06-26", time: "1:00pm", location: "Central Mosque", type: "mosque", organiser: "Central Mosque Birmingham", online: false },
  { id: "2", title: "Quran Study Circle", date: "2026-06-27", time: "10:00am", location: "Online", type: "study", organiser: "Jannatie Community", online: true },
  { id: "3", title: "Seerah Series", date: "2026-06-28", time: "7:00pm", location: "Online (Zoom)", type: "study", organiser: "Islamic Education UK", online: true },
  { id: "4", title: "Community Gathering", date: "2026-06-30", time: "6:30pm", location: "Green Lane Mosque", type: "community", organiser: "Green Lane Mosque", online: false },
];

const TYPE_COLORS: Record<string, { dot: string; label: string }> = {
  mosque: { dot: "bg-blue-500", label: "Mosque" },
  study: { dot: "bg-emerald-500", label: "Study" },
  community: { dot: "bg-violet-500", label: "Community" },
  personal: { dot: "bg-slate-400", label: "Personal" },
};

const glassCard = {
  background: "rgba(255, 255, 255, 0.65)",
  border: "1px solid rgba(255, 255, 255, 0.80)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 4px 24px rgba(15, 23, 42, 0.07)",
} as const;

export default function CalendarPage() {
  const [view, setView] = useState<"month" | "list">("month");
  const [filter, setFilter] = useState("All");
  const [selectedEvent, setSelectedEvent] = useState<typeof EVENTS[0] | null>(null);
  const today = new Date();

  const filters = ["All", "Mosque", "Study", "Online", "Community"];

  const filteredEvents = EVENTS.filter((e) => {
    if (filter === "All") return true;
    if (filter === "Online") return e.online;
    return e.type === filter.toLowerCase();
  });

  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-5 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Islamic Calendar</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {GREG_MONTHS[today.getMonth()]} {today.getFullYear()} · {HIJRI_MONTHS[7]} 1447 AH
            </p>
          </div>
          <div className="flex gap-2">
            {(["month", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-3 py-1.5 rounded-xl text-sm font-medium capitalize transition-all"
                style={
                  view === v
                    ? { background: "rgba(219, 234, 254, 0.80)", border: "1px solid rgba(147, 197, 253, 0.60)", color: "#1d4ed8" }
                    : { background: "rgba(255, 255, 255, 0.65)", border: "1px solid rgba(226, 232, 240, 0.80)", color: "#94a3b8" }
                }
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={
                filter === f
                  ? { background: "rgba(219, 234, 254, 0.80)", border: "1px solid rgba(147, 197, 253, 0.60)", color: "#1d4ed8" }
                  : { background: "rgba(255, 255, 255, 0.65)", border: "1px solid rgba(226, 232, 240, 0.80)", color: "#94a3b8" }
              }
            >
              {f}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-5 flex-wrap">
          {Object.entries(TYPE_COLORS).map(([type, { dot, label }]) => (
            <div key={type} className="flex items-center gap-1.5 text-xs text-slate-400">
              <div className={`w-2 h-2 rounded-full ${dot}`} />
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Calendar grid */}
          {view === "month" && (
            <div className="lg:col-span-2">
              <div className="rounded-2xl p-5" style={glassCard}>
                <div className="flex items-center justify-between mb-5">
                  <button
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-slate-100 border border-slate-200"
                  >
                    <ChevronLeft size={16} className="text-slate-400" />
                  </button>
                  <h2 className="font-bold text-slate-800">
                    {GREG_MONTHS[today.getMonth()]} {today.getFullYear()}
                  </h2>
                  <button
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-slate-100 border border-slate-200"
                  >
                    <ChevronRight size={16} className="text-slate-400" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
                    <div key={d + i} className="text-center text-[10px] font-semibold text-slate-400 py-1">
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const dayEvents = EVENTS.filter((e) => e.date === dateStr);
                    const isToday = day === today.getDate();
                    return (
                      <div
                        key={day}
                        className="relative p-1.5 rounded-xl text-center min-h-[38px] transition-colors hover:bg-slate-100 cursor-pointer"
                        style={isToday ? { background: "rgba(219, 234, 254, 0.80)", border: "1px solid rgba(147, 197, 253, 0.60)" } : {}}
                      >
                        <span className={`text-xs font-medium ${isToday ? "text-blue-700" : "text-slate-500"}`}>
                          {day}
                        </span>
                        <div className="flex gap-0.5 justify-center mt-0.5 flex-wrap">
                          {dayEvents.map((ev) => (
                            <div key={ev.id} className={`w-1.5 h-1.5 rounded-full ${TYPE_COLORS[ev.type]?.dot ?? "bg-slate-400"}`} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Events list */}
          <div className={view === "month" ? "" : "lg:col-span-3"}>
            <h3 className="font-semibold text-slate-600 mb-3 text-sm">Upcoming Events</h3>
            {filteredEvents.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={glassCard}>
                <p className="text-sm text-slate-400">No events match this filter.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((event) => (
                  <motion.button
                    key={event.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setSelectedEvent(event)}
                    className="w-full text-left rounded-2xl p-4 transition-all hover:bg-white/80"
                    style={glassCard}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${TYPE_COLORS[event.type]?.dot ?? "bg-slate-400"}`} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800">{event.title}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock size={10} /> {event.time}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <MapPin size={10} /> {event.location}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Event detail modal */}
        {selectedEvent && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-3xl p-6 max-w-sm w-full"
              style={{
                background: "rgba(255, 255, 255, 0.93)",
                backdropFilter: "blur(32px)",
                WebkitBackdropFilter: "blur(32px)",
                border: "1px solid rgba(255, 255, 255, 0.95)",
                boxShadow: "0 20px 60px rgba(15, 23, 42, 0.14)",
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
                  <span>{selectedEvent.date} at {selectedEvent.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="flex-shrink-0 text-slate-400" />
                  <span>{selectedEvent.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="flex-shrink-0 text-slate-400" />
                  <span>{selectedEvent.organiser}</span>
                </div>
              </div>
              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors">
                RSVP to this event
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
