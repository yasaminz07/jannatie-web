"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin, Clock, Users } from "lucide-react";
import Card from "@/components/ui/Card";

const HIJRI_MONTHS = ["Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani", "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhul Qi'dah", "Dhul Hijjah"];
const GREG_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const EVENTS = [
  { id: "1", title: "Friday Jumu'ah", date: "2025-01-17", time: "1:00pm", location: "Central Mosque", type: "mosque", organiser: "Central Mosque Birmingham", online: false },
  { id: "2", title: "Quran Study Circle", date: "2025-01-18", time: "10:00am", location: "Online", type: "study", organiser: "Jannatie Community", online: true },
  { id: "3", title: "Seerah Series — Week 3", date: "2025-01-19", time: "7:00pm", location: "Online (Zoom)", type: "study", organiser: "Islamic Education UK", online: true },
  { id: "4", title: "Community Iftar Planning", date: "2025-01-22", time: "6:30pm", location: "Green Lane Mosque", type: "community", organiser: "Green Lane Mosque", online: false },
  { id: "5", title: "Isra & Mi'raj Gathering", date: "2025-01-27", time: "8:00pm", location: "Birmingham Central Mosque", type: "mosque", organiser: "Birmingham Central Mosque", online: false },
];

const TYPE_COLORS: Record<string, string> = {
  mosque: "bg-primary-500",
  study: "bg-accent",
  community: "bg-gray-400",
  personal: "bg-gray-200",
};

export default function CalendarPage() {
  const [view, setView] = useState<"month" | "list">("month");
  const [filter, setFilter] = useState("All");
  const [selectedEvent, setSelectedEvent] = useState<typeof EVENTS[0] | null>(null);
  const today = new Date();

  const filters = ["All", "Mosque", "Study Circles", "Online", "Community"];

  const filteredEvents = EVENTS.filter((e) => {
    if (filter === "All") return true;
    if (filter === "Online") return e.online;
    return e.type === filter.toLowerCase().replace(/ /g, "").replace("circles", "");
  });

  // Calendar grid (simplified)
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Islamic Calendar</h1>
          <p className="text-sm text-muted mt-0.5">
            {GREG_MONTHS[today.getMonth()]} {today.getFullYear()} · {HIJRI_MONTHS[7]} 1446 AH
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView("month")} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${view === "month" ? "bg-foreground text-white border-foreground" : "border-border text-muted"}`}>Month</button>
          <button onClick={() => setView("list")} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${view === "list" ? "bg-foreground text-white border-foreground" : "border-border text-muted"}`}>List</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-6">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filter === f ? "bg-foreground text-white border-foreground" : "border-border text-muted hover:border-primary-500 hover:text-primary-500"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-6 flex-wrap">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs text-muted">
            <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
            <span className="capitalize">{type}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        {view === "month" ? (
          <div className="lg:col-span-2">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-5">
                <button className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft size={18} /></button>
                <h2 className="font-bold text-foreground">{GREG_MONTHS[today.getMonth()]} {today.getFullYear()}</h2>
                <button className="p-1 hover:bg-gray-100 rounded-lg"><ChevronRight size={18} /></button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div key={d + i} className="text-center text-xs font-semibold text-muted py-1">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayEvents = EVENTS.filter((e) => e.date === dateStr);
                  const isToday = day === today.getDate();
                  return (
                    <div key={day} className={`relative p-1.5 rounded-lg text-center min-h-[40px] ${isToday ? "bg-primary-500 text-white" : "hover:bg-gray-50"}`}>
                      <span className="text-xs">{day}</span>
                      <div className="flex gap-0.5 justify-center mt-0.5 flex-wrap">
                        {dayEvents.map((ev) => (
                          <div key={ev.id} className={`w-1.5 h-1.5 rounded-full ${TYPE_COLORS[ev.type]}`} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        ) : null}

        {/* Events list */}
        <div className={view === "month" ? "" : "lg:col-span-3"}>
          <h3 className="font-semibold text-foreground mb-3 text-sm">Upcoming Events</h3>
          <div className="space-y-3">
            {filteredEvents.map((event) => (
              <motion.button
                key={event.id}
                whileHover={{ scale: 1.01 }}
                onClick={() => setSelectedEvent(event)}
                className="w-full text-left"
              >
                <Card className="p-4 hover:border-primary-500 transition-all" hover>
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${TYPE_COLORS[event.type]}`} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{event.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-muted">
                          <Clock size={10} /> {event.time}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted">
                          <MapPin size={10} /> {event.location}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Event detail modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`w-3 h-3 rounded-full ${TYPE_COLORS[selectedEvent.type]} mb-4`} />
            <h2 className="text-xl font-bold text-foreground mb-2">{selectedEvent.title}</h2>
            <div className="space-y-2 mb-6 text-sm text-muted">
              <div className="flex items-center gap-2"><Clock size={14} /> {selectedEvent.date} · {selectedEvent.time}</div>
              <div className="flex items-center gap-2"><MapPin size={14} /> {selectedEvent.location}</div>
              <div className="flex items-center gap-2"><Users size={14} /> {selectedEvent.organiser}</div>
            </div>
            <button className="w-full bg-primary-500 text-white font-semibold py-3 rounded-xl hover:bg-primary-600 transition-colors">
              RSVP to this event
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
