"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { collection, query, where, onSnapshot, deleteField } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import {
  CommunityEvent, createEvent, updateEvent, deleteEvent,
  notifyFollowersOfEvent, isCommunityPremium,
} from "@/lib/community-utils";
import { compressImage } from "@/lib/image-utils";
import EventCard from "@/components/community/EventCard";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays, Plus, X, Camera, Trash2, Calendar, Clock,
  ChevronLeft, ChevronRight, Search, MapPin, Lock, Crown, Bell,
} from "lucide-react";
import Link from "next/link";

const RATIOS = [
  { label: "1:1", w: 1, h: 1 },
  { label: "4:5", w: 4, h: 5 },
  { label: "3:4", w: 3, h: 4 },
  { label: "9:16", w: 9, h: 16 },
] as const;

type AspectRatio = typeof RATIOS[number]["label"];

function snapToRatio(width: number, height: number): AspectRatio {
  const r = width / height;
  return RATIOS.reduce((best, cur) =>
    Math.abs(r - cur.w / cur.h) < Math.abs(r - best.w / best.h) ? cur : best
  ).label;
}

function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.src = dataUrl;
  });
}

const inputCls =
  "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white";

const labelCls = "block text-xs font-semibold text-slate-600 mb-1.5";

const popoverStyle = {
  background: "rgba(255,255,255,0.99)",
  border: "1px solid rgba(226,232,240,0.80)",
  boxShadow: "0 16px 40px rgba(15,23,42,0.18)",
} as const;

/* ── Place autocomplete (Nominatim) ── */
function PlaceAutocomplete({
  value, onChange, placeholder, searchType = "city",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  searchType?: "city" | "address";
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [fetching, setFetching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  function handleInput(val: string) {
    onChange(val);
    clearTimeout(timerRef.current);
    if (val.trim().length < 2) { setSuggestions([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      setFetching(true);
      try {
        const params = new URLSearchParams({
          q: val, format: "json", limit: "6", addressdetails: "1", "accept-language": "en",
        });
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
          headers: { "User-Agent": "Jannatie/1.0 (jannatie.com)" },
        });
        if (!res.ok) return;
        const data = await res.json() as Array<{
          display_name: string;
          address?: Record<string, string>;
        }>;
        const places = data.map(item => {
          if (searchType === "city") {
            const addr = item.address ?? {};
            return addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? item.display_name.split(",")[0].trim();
          }
          return item.display_name;
        }).filter((s): s is string => !!s);
        const seen = new Set<string>();
        const unique = places.filter(p => seen.has(p) ? false : (seen.add(p), true));
        setSuggestions(unique.slice(0, 5));
        setOpen(true);
      } catch { /* ignore */ }
      finally { setFetching(false); }
    }, 400);
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          className={inputCls}
          value={value}
          onChange={e => handleInput(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
        />
        {fetching && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.13 }}
            className="absolute z-50 mt-1 w-full rounded-xl overflow-hidden py-1"
            style={{ background: "white", border: "1px solid rgba(226,232,240,0.80)", boxShadow: "0 8px 24px rgba(15,23,42,0.12)" }}
          >
            {suggestions.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => { onChange(s); setOpen(false); setSuggestions([]); }}
                  className="w-full text-left px-3.5 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors"
                >
                  <MapPin size={12} className="text-slate-300 flex-shrink-0" />
                  <span className="truncate">{s}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Date picker ── */
function EventDatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => (value ? new Date(value + "T00:00:00") : new Date()));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const selected = value ? new Date(value + "T00:00:00") : null;
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const startWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const monthLabel = viewDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  function pick(day: number) {
    const d = new Date(year, month, day);
    onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between border border-slate-200 rounded-xl px-4 py-3 text-sm text-left bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${selected ? "text-slate-900" : "text-slate-400"}`}>
        {selected ? selected.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "Select a date"}
        <Calendar size={15} className="text-slate-400 flex-shrink-0" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }} className="absolute z-30 mt-2 w-72 rounded-2xl p-3" style={popoverStyle}>
            <div className="flex items-center justify-between mb-2 px-1">
              <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
                <ChevronLeft size={15} />
              </button>
              <p className="text-sm font-semibold text-slate-800">{monthLabel}</p>
              <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
                <ChevronRight size={15} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (
                <p key={d} className="text-[10px] font-semibold text-slate-400 text-center py-1">{d}</p>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (day === null) return <div key={i} />;
                const isSelected = !!selected && selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === day;
                return (
                  <button key={i} type="button" onClick={() => pick(day)}
                    className={`w-9 h-9 rounded-xl text-xs font-medium transition-colors ${isSelected ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-blue-50"}`}>
                    {day}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Time picker ── */
function EventTimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  let hour12 = "", minute = "", period: "AM" | "PM" = "AM";
  if (value) {
    const [h, m] = value.split(":").map(Number);
    period = h >= 12 ? "PM" : "AM";
    hour12 = String(h % 12 === 0 ? 12 : h % 12);
    minute = String(m).padStart(2, "0");
  }

  function commit(h12: string, min: string, per: "AM" | "PM") {
    let h = parseInt(h12, 10) % 12;
    if (per === "PM") h += 12;
    onChange(`${String(h).padStart(2, "0")}:${min}`);
  }

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const minutes = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between border border-slate-200 rounded-xl px-4 py-3 text-sm text-left bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${value ? "text-slate-900" : "text-slate-400"}`}>
        {value ? `${hour12}:${minute} ${period}` : "Select a time"}
        <Clock size={15} className="text-slate-400 flex-shrink-0" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }} className="absolute z-30 mt-2 w-48 rounded-2xl p-2 flex gap-1" style={popoverStyle}>
            <div className="flex-1 max-h-48 overflow-y-auto scrollbar-hide">
              {hours.map(h => (
                <button key={h} type="button" onClick={() => commit(h, minute || "00", period)}
                  className={`w-full text-center py-1.5 rounded-lg text-xs font-medium transition-colors ${hour12 === h ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-blue-50"}`}>
                  {h}
                </button>
              ))}
            </div>
            <div className="flex-1 max-h-48 overflow-y-auto scrollbar-hide">
              {minutes.map(m => (
                <button key={m} type="button" onClick={() => commit(hour12 || "12", m, period)}
                  className={`w-full text-center py-1.5 rounded-lg text-xs font-medium transition-colors ${minute === m ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-blue-50"}`}>
                  {m}
                </button>
              ))}
            </div>
            <div className="flex-1">
              {(["AM", "PM"] as const).map(p => (
                <button key={p} type="button" onClick={() => commit(hour12 || "12", minute || "00", p)}
                  className={`w-full text-center py-1.5 rounded-lg text-xs font-medium transition-colors ${period === p ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-blue-50"}`}>
                  {p}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FormState {
  title: string;
  description: string;
  photoURL: string | null;
  photoAspectRatio: AspectRatio;
  date: string;
  time: string;
  venueName: string;
  address: string;
  city: string;
  externalLink: string;
}

const emptyForm: FormState = {
  title: "", description: "", photoURL: null,
  photoAspectRatio: "1:1", date: "", time: "", venueName: "", address: "", city: "", externalLink: "",
};

type TimeFilter = "all" | "upcoming" | "past";

const FREE_EVENT_LIMIT = 3;

export default function CommunityEventsPage() {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("upcoming");
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Post-create notify prompt (premium only)
  const [notifyPromptEvent, setNotifyPromptEvent] = useState<{ id: string; title: string; communityUid: string; communityName: string; communityUsername: string } | null>(null);
  const [notifyingFollowers, setNotifyingFollowers] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "communityEvents"), where("communityUid", "==", user.uid));
    const unsub = onSnapshot(q, snap => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityEvent)).sort((a, b) => b.date.localeCompare(a.date)));
      setLoading(false);
    }, err => {
      console.error("Failed to load events:", err);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const isPremium = isCommunityPremium(profile);

  // Count events created this calendar month
  const thisMonthCount = useMemo(() => events.filter(e => {
    const d = new Date((e.createdAt as { toDate?: () => Date })?.toDate?.() ?? Date.now());
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length, [events]);

  const atLimit = !isPremium && thisMonthCount >= FREE_EVENT_LIMIT;

  const today = new Date().toISOString().slice(0, 10);
  const upcomingCount = useMemo(() => events.filter(e => e.date >= today).length, [events, today]);
  const pastCount = useMemo(() => events.filter(e => e.date < today).length, [events, today]);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (search) {
        const t = search.toLowerCase();
        if (!e.title.toLowerCase().includes(t) && !e.description.toLowerCase().includes(t) && !e.city.toLowerCase().includes(t)) return false;
      }
      if (timeFilter === "upcoming" && e.date < today) return false;
      if (timeFilter === "past" && e.date >= today) return false;
      return true;
    });
  }, [events, search, timeFilter, today]);

  function openCreate() {
    if (atLimit) {
      toast.error("You have reached your 3-event monthly limit. Upgrade to Premium for unlimited events.");
      return;
    }
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(event: CommunityEvent) {
    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description,
      photoURL: event.photoURL,
      photoAspectRatio: (event.photoAspectRatio as AspectRatio) ?? "1:1",
      date: event.date,
      time: event.time ?? "",
      venueName: event.venueName ?? "",
      address: event.address,
      city: event.city,
      externalLink: event.externalLink ?? "",
    });
    setShowForm(true);
  }

  async function handleDuplicate(event: CommunityEvent) {
    if (!user || !profile) return;
    if (atLimit) {
      toast.error("You have reached your 3-event monthly limit. Upgrade to Premium for unlimited events.");
      return;
    }
    try {
      await createEvent({
        communityUid: user.uid,
        communityName: profile.displayName ?? "Community",
        communityUsername: profile.username ?? "",
        communityPhotoURL: profile.photoURL ?? null,
        communityIsPremium: isPremium,
        title: `${event.title} (copy)`,
        description: event.description,
        photoURL: event.photoURL,
        photoAspectRatio: event.photoAspectRatio ?? null,
        date: event.date,
        address: event.address,
        city: event.city,
        ...(event.time ? { time: event.time } : {}),
        ...(event.venueName ? { venueName: event.venueName } : {}),
        ...(event.externalLink ? { externalLink: event.externalLink } : {}),
      });
      toast.success("Event duplicated.");
    } catch {
      toast.error("Couldn't duplicate event.");
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressImage(file, 1080, 0.82, false);
    const { width, height } = await getImageDimensions(dataUrl);
    const ratio = snapToRatio(width, height);
    setForm(f => ({ ...f, photoURL: dataUrl, photoAspectRatio: ratio }));
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile) return;
    if (!form.title.trim() || !form.description.trim() || !form.date || !form.address.trim() || !form.city.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSaving(true);
    try {
      const baseFields = {
        title: form.title.trim(),
        description: form.description.trim(),
        photoURL: form.photoURL,
        photoAspectRatio: form.photoURL ? form.photoAspectRatio : null,
        date: form.date,
        address: form.address.trim(),
        city: form.city.trim(),
      };
      if (editingId) {
        await updateEvent(editingId, {
          ...baseFields,
          time: form.time ? form.time : deleteField(),
          venueName: form.venueName.trim() ? form.venueName.trim() : deleteField(),
          externalLink: form.externalLink.trim() ? form.externalLink.trim() : deleteField(),
        });
        toast.success("Event updated!");
      } else {
        const ref = await createEvent({
          communityUid: user.uid,
          communityName: profile.displayName ?? "Community",
          communityUsername: profile.username ?? "",
          communityPhotoURL: profile.photoURL ?? null,
          communityIsPremium: isPremium,
          ...baseFields,
          ...(form.time ? { time: form.time } : {}),
          ...(form.venueName.trim() ? { venueName: form.venueName.trim() } : {}),
          ...(form.externalLink.trim() ? { externalLink: form.externalLink.trim() } : {}),
        });
        toast.success("Event posted!");
        // For premium accounts, show notify prompt
        if (isPremium) {
          setNotifyPromptEvent({
            id: ref.id,
            title: form.title.trim(),
            communityUid: user.uid,
            communityName: profile.displayName ?? "Community",
            communityUsername: profile.username ?? "",
          });
        }
      }
      setShowForm(false);
    } catch {
      toast.error("Couldn't save event. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteEvent(deleteTarget);
      toast.success("Event deleted.");
    } catch {
      toast.error("Couldn't delete event.");
    } finally {
      setDeleteTarget(null);
    }
  }

  async function handleNotifyFollowers() {
    if (!notifyPromptEvent) return;
    setNotifyingFollowers(true);
    try {
      await notifyFollowersOfEvent(notifyPromptEvent);
      toast.success("Followers notified!");
      setNotifyPromptEvent(null);
    } catch {
      toast.error("Couldn't notify followers.");
    } finally {
      setNotifyingFollowers(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-slate-900">Events</h1>
        <button
          onClick={openCreate}
          disabled={atLimit}
          title={atLimit ? "Upgrade to Premium for unlimited events" : undefined}
          className={`flex items-center gap-1.5 text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors shadow-sm ${
            atLimit
              ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200"
          }`}
        >
          {atLimit ? <Lock size={14} /> : <Plus size={15} />}
          {atLimit ? "Limit reached" : "New event"}
        </button>
      </div>
      <p className="text-slate-500 text-sm mb-4">Create and manage the events your followers see.</p>

      {/* Event limit banner for free accounts at limit */}
      {atLimit && !isPremium && (
        <div className="flex items-center gap-3 mb-5 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <Crown size={16} className="text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-800 flex-1">
            You have used {FREE_EVENT_LIMIT}/{FREE_EVENT_LIMIT} free events this month.
          </p>
          <Link href="/community-hub/upgrade" className="text-xs font-bold text-amber-700 hover:text-amber-900 whitespace-nowrap underline">
            Upgrade to Premium
          </Link>
        </div>
      )}

      {/* Free tier soft nudge (not at limit yet) */}
      {!isPremium && !atLimit && events.length > 0 && (
        <div className="flex items-center gap-2 mb-4 text-xs text-slate-400">
          <CalendarDays size={12} className="text-slate-300" />
          <span>{thisMonthCount}/{FREE_EVENT_LIMIT} events used this month.</span>
          <Link href="/community-hub/upgrade" className="text-blue-500 hover:underline font-medium">
            Upgrade for unlimited
          </Link>
        </div>
      )}

      {/* Stats bar */}
      {!loading && events.length > 0 && (
        <div className="flex items-center gap-3 mb-4 px-0.5 flex-wrap">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
            <CalendarDays size={12} className="text-slate-400" />
            <span className="text-xs text-slate-500"><span className="font-bold text-slate-800">{events.length}</span> total</span>
          </div>
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-xl px-3 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-xs text-blue-700 font-medium"><span className="font-bold">{upcomingCount}</span> upcoming</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span className="text-xs text-slate-500"><span className="font-semibold">{pastCount}</span> past</span>
          </div>
        </div>
      )}

      {/* Search + filter */}
      {!loading && events.length > 0 && (
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-sm">
            <Search size={14} className="text-slate-400 flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search your events by title, city…"
              className="flex-1 text-sm outline-none text-slate-800 placeholder-slate-400 bg-transparent"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-slate-300 hover:text-slate-500 transition-colors">
                <X size={13} />
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {([
              { key: "upcoming", label: `Upcoming (${upcomingCount})` },
              { key: "past", label: `Past (${pastCount})` },
              { key: "all", label: `All (${events.length})` },
            ] as { key: TimeFilter; label: string }[]).map(f => (
              <button key={f.key} onClick={() => setTimeFilter(f.key)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                  timeFilter === f.key
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600"
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Event list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-56 rounded-3xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <CalendarDays size={28} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 mb-4">You haven&apos;t posted any events yet.</p>
          <button onClick={openCreate} className="text-sm font-semibold text-blue-600 hover:underline">
            Create your first event
          </button>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <Search size={24} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No events match your search.</p>
          <button onClick={() => { setSearch(""); setTimeFilter("all"); }}
            className="mt-3 text-xs font-semibold text-blue-600 hover:underline">Clear filters</button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              mode="owner"
              isPremiumCommunity={isPremium}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/30"
              onClick={() => !saving && setShowForm(false)}
            />
            <div className="fixed inset-0 z-[61] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="pointer-events-auto w-full sm:max-w-lg max-h-[92vh] sm:max-h-[88vh] overflow-y-auto scrollbar-hide rounded-t-3xl sm:rounded-3xl"
                style={{
                  background: "rgba(255,255,255,0.99)",
                  border: "1px solid rgba(226,232,240,0.80)",
                  boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
                }}
              >
                <div className="flex justify-center pt-3 pb-1 sm:hidden">
                  <div className="w-10 h-1 rounded-full bg-slate-200" />
                </div>

                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur z-10">
                  <h2 className="text-base font-bold text-slate-900">{editingId ? "Edit event" : "New event"}</h2>
                  <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                    <X size={14} className="text-slate-500" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                  {/* Photo */}
                  <div>
                    <label className={labelCls}>Event photo</label>
                    {form.photoURL ? (
                      <div className="space-y-2.5">
                        <div className="relative w-full overflow-hidden rounded-2xl"
                          style={{ aspectRatio: form.photoAspectRatio.replace(":", " / ") }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={form.photoURL} alt="" aria-hidden
                            className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-70 pointer-events-none" />
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={form.photoURL} alt="" className="relative z-10 w-full h-full object-contain" />
                          <button type="button"
                            onClick={() => setForm(f => ({ ...f, photoURL: null, photoAspectRatio: "1:1" }))}
                            className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-black/50 hover:bg-red-600 text-white flex items-center justify-center transition-colors">
                            <X size={13} />
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] text-slate-400 mr-1">Ratio:</span>
                          {RATIOS.map(r => (
                            <button key={r.label} type="button"
                              onClick={() => setForm(f => ({ ...f, photoAspectRatio: r.label }))}
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors ${
                                form.photoAspectRatio === r.label
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600"
                              }`}>
                              {r.label}
                            </button>
                          ))}
                          <button type="button" onClick={() => photoInputRef.current?.click()}
                            className="ml-auto text-[11px] font-semibold text-blue-600 hover:underline">
                            Change photo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => photoInputRef.current?.click()}
                        className="w-full h-28 rounded-2xl bg-slate-50 border border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-colors flex flex-col items-center justify-center gap-1.5">
                        <Camera size={20} className="text-slate-300" />
                        <span className="text-xs font-semibold text-slate-400">Upload photo</span>
                      </button>
                    )}
                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </div>

                  <div>
                    <label className={labelCls}>Title *</label>
                    <input className={inputCls} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required maxLength={100} placeholder="Enter a title" />
                  </div>

                  <div>
                    <label className={labelCls}>Description *</label>
                    <textarea className={inputCls} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required maxLength={800} placeholder="Tell people what to expect..." />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Date *</label>
                      <EventDatePicker value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
                    </div>
                    <div>
                      <label className={labelCls}>Time <span className="text-slate-400 font-normal">(optional)</span></label>
                      <EventTimePicker value={form.time} onChange={v => setForm(f => ({ ...f, time: v }))} />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Venue name <span className="text-slate-400 font-normal">(optional)</span></label>
                    <input className={inputCls} value={form.venueName} onChange={e => setForm(f => ({ ...f, venueName: e.target.value }))} placeholder="e.g. Jannatie Community Hall" />
                  </div>

                  <div>
                    <label className={labelCls}>Address *</label>
                    <PlaceAutocomplete
                      value={form.address}
                      onChange={v => setForm(f => ({ ...f, address: v }))}
                      placeholder="e.g. 123 High Street, Birmingham"
                      searchType="address"
                    />
                  </div>

                  <div>
                    <label className={labelCls}>City *</label>
                    <PlaceAutocomplete
                      value={form.city}
                      onChange={v => setForm(f => ({ ...f, city: v }))}
                      placeholder="e.g. Birmingham"
                      searchType="city"
                    />
                  </div>

                  <div>
                    <label className={labelCls}>External link <span className="text-slate-400 font-normal">(optional)</span></label>
                    <input type="url" className={inputCls} value={form.externalLink} onChange={e => setForm(f => ({ ...f, externalLink: e.target.value }))} placeholder="https://…" />
                  </div>

                  <button type="submit" disabled={saving}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl py-3 transition-colors shadow-sm shadow-blue-200">
                    {saving ? "Saving…" : editingId ? "Save changes" : "Post event"}
                  </button>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/30" onClick={() => setDeleteTarget(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[61] w-[90vw] max-w-sm rounded-3xl bg-white p-6 text-center"
              style={{ boxShadow: "0 24px 60px rgba(15,23,42,0.18)" }}>
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-3">
                <Trash2 size={20} className="text-red-500" />
              </div>
              <p className="text-sm font-bold text-slate-900 mb-1">Delete this event?</p>
              <p className="text-xs text-slate-500 mb-5">This will permanently remove the event, its likes and comments.</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl py-2.5 transition-colors">
                  Cancel
                </button>
                <button onClick={confirmDelete} className="flex-1 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl py-2.5 transition-colors">
                  Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Notify followers prompt (premium only, shown after creating new event) */}
      <AnimatePresence>
        {notifyPromptEvent && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[62] bg-black/30" onClick={() => !notifyingFollowers && setNotifyPromptEvent(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[63] w-[90vw] max-w-sm rounded-3xl bg-white p-6 text-center"
              style={{ boxShadow: "0 24px 60px rgba(15,23,42,0.18)" }}
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                <Bell size={20} className="text-blue-500" />
              </div>
              <p className="text-sm font-bold text-slate-900 mb-1">Notify your followers?</p>
              <p className="text-xs text-slate-500 mb-5">
                Send a notification to all your followers about &ldquo;{notifyPromptEvent.title}&rdquo;.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setNotifyPromptEvent(null)}
                  disabled={notifyingFollowers}
                  className="flex-1 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl py-2.5 transition-colors disabled:opacity-50">
                  Later
                </button>
                <button
                  onClick={handleNotifyFollowers}
                  disabled={notifyingFollowers}
                  className="flex-[2] text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl py-2.5 transition-colors disabled:opacity-50">
                  {notifyingFollowers ? "Notifying…" : "Notify now"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
