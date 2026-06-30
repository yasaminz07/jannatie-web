"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { CommunityEvent, getFollowerCount } from "@/lib/community-utils";
import EventCard from "@/components/community/EventCard";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, CalendarDays, Store, Sparkles, Users, X, ChevronDown } from "lucide-react";

interface CommunityProfile {
  uid: string;
  displayName: string | null;
  username: string;
  photoURL: string | null;
  communityCategory?: string;
  city?: string;
  bio?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  business: "Business",
  coffee_shop: "Coffee shop / venue",
  influencer: "Influencer / content creator",
  organization: "Organization / charity",
  other: "Other",
};

function CommunityRow({ c, followerCount }: { c: CommunityProfile; followerCount: number | undefined }) {
  const initials = (c.displayName ?? c.username).slice(0, 2).toUpperCase();
  return (
    <Link href={`/profile/${c.username}`}
      className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-200 hover:shadow-sm transition-all group">
      <div className="relative flex-shrink-0">
        {c.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.photoURL} alt={c.displayName ?? c.username} width={44} height={44}
            className="rounded-full object-cover ring-2 ring-white" style={{ width: 44, height: 44 }} />
        ) : (
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white">
            {initials}
          </div>
        )}
        <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-sm">
          <VerifiedBadge size={11} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-700 transition-colors">
          {c.displayName ?? c.username}
        </p>
        <p className="text-xs text-slate-400 truncate">
          @{c.username}
          {c.city && <span> · <MapPin size={9} className="inline -mt-0.5" /> {c.city}</span>}
          {c.communityCategory && <span> · {CATEGORY_LABELS[c.communityCategory] ?? c.communityCategory}</span>}
        </p>
        {c.bio && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{c.bio}</p>}
      </div>
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Users size={11} className="text-slate-300" />
          <span className="font-semibold text-slate-600">{followerCount ?? "…"}</span>
        </div>
        <span className="text-[10px] text-slate-300">{followerCount === 1 ? "follower" : "followers"}</span>
      </div>
    </Link>
  );
}

type Tab = "events" | "communities";

export default function CommunityHubBrowsePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("events");
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [communities, setCommunities] = useState<CommunityProfile[]>([]);
  const [followerCounts, setFollowerCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, "communityEvents"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, snap => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityEvent)));
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "users"),
      where("accountType", "==", "community"),
      where("applicationStatus", "==", "approved")
    );
    const unsub = onSnapshot(q, snap => {
      setCommunities(snap.docs.map(d => {
        const data = d.data();
        return {
          uid: data.uid,
          displayName: data.displayName ?? null,
          username: data.username ?? "",
          photoURL: data.photoURL ?? null,
          communityCategory: data.communityCategory,
          city: data.city,
          bio: data.bio,
        } as CommunityProfile;
      }));
      setCommunitiesLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (communities.length === 0) return;
    let cancelled = false;
    Promise.all(communities.map(async c => [c.uid, await getFollowerCount(c.uid)] as const)).then(entries => {
      if (!cancelled) setFollowerCounts(Object.fromEntries(entries));
    });
    return () => { cancelled = true; };
  }, [communities]);

  useEffect(() => {
    if (!cityDropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node)) {
        setCityDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [cityDropdownOpen]);

  const otherCommunities = useMemo(() => communities.filter(c => c.uid !== user?.uid), [communities, user]);
  const otherEvents = useMemo(() => events.filter(e => e.communityUid !== user?.uid), [events, user]);

  const filteredCommunities = useMemo(() => {
    if (!search) return otherCommunities;
    const t = search.toLowerCase();
    return otherCommunities.filter(c =>
      (c.displayName ?? "").toLowerCase().includes(t) ||
      c.username.toLowerCase().includes(t) ||
      (c.city ?? "").toLowerCase().includes(t)
    );
  }, [otherCommunities, search]);

  const cities = useMemo(() => {
    const set = new Set(otherEvents.map(e => e.city).filter(Boolean));
    return Array.from(set).sort();
  }, [otherEvents]);

  const filteredEvents = useMemo(() => {
    return otherEvents.filter(e => {
      if (cityFilter && e.city !== cityFilter) return false;
      if (search) {
        const t = search.toLowerCase();
        if (!e.title.toLowerCase().includes(t) &&
          !e.communityName.toLowerCase().includes(t) &&
          !e.description.toLowerCase().includes(t)) return false;
      }
      return true;
    });
  }, [otherEvents, search, cityFilter]);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = filteredEvents.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = filteredEvents.filter(e => e.date < today);

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <div className="flex items-center gap-2 mb-1">
        <Users size={20} className="text-blue-600" />
        <h1 className="text-2xl font-bold text-slate-900">Community</h1>
      </div>
      <p className="text-slate-500 text-sm mb-6">Discover events and posts from other Jannatie communities</p>

      {/* Tabs */}
      <div className="flex rounded-2xl p-1 gap-1 mb-4 bg-white border border-slate-200 overflow-x-auto scrollbar-hide">
        <button onClick={() => { setTab("events"); setSearch(""); }}
          className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${tab === "events" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
          <Sparkles size={13} /> Events
        </button>
        <button onClick={() => { setTab("communities"); setSearch(""); }}
          className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${tab === "communities" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
          <Store size={13} /> Communities
        </button>
      </div>

      {/* Search + city filter */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex items-center gap-2 flex-1 rounded-2xl px-3.5 py-2.5 bg-white border border-slate-200">
          <Search size={14} className="text-slate-400 flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tab === "events" ? "Search events, communities…" : "Search communities by name or city…"}
            className="flex-1 text-sm bg-transparent outline-none text-slate-800 placeholder-slate-400 min-w-0"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-slate-300 hover:text-slate-500 flex-shrink-0">
              <X size={13} />
            </button>
          )}
        </div>
        {tab === "events" && cities.length > 0 && (
          <div ref={cityDropdownRef} className="relative flex-shrink-0">
            <button
              onClick={() => setCityDropdownOpen(o => !o)}
              className="flex items-center gap-1.5 rounded-2xl px-3.5 py-2.5 text-sm text-slate-700 bg-white border border-slate-200 transition-all whitespace-nowrap"
            >
              <MapPin size={13} className={cityFilter ? "text-blue-500" : "text-slate-400"} />
              <span className="max-w-[80px] truncate font-medium text-xs">{cityFilter || "City"}</span>
              <ChevronDown size={11} className={`text-slate-400 transition-transform ${cityDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {cityDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.13 }}
                  className="absolute right-0 top-full mt-1.5 min-w-[150px] rounded-2xl overflow-hidden z-50 py-1.5 bg-white border border-slate-200 shadow-xl"
                >
                  {(["", ...cities] as string[]).map(c => (
                    <button
                      key={c || "__all"}
                      onClick={() => { setCityFilter(c); setCityDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 ${
                        cityFilter === c ? "text-blue-600 font-semibold bg-blue-50" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {c && <MapPin size={11} className="text-slate-300 flex-shrink-0" />}
                      {c || "All cities"}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Events tab */}
      {tab === "events" && (
        loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 rounded-3xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <CalendarDays size={28} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700 mb-1">No events found</p>
            <p className="text-xs text-slate-400 mb-3">
              {search || cityFilter ? "Try adjusting your search or filter." : "Other communities haven't posted any events yet."}
            </p>
            {(search || cityFilter) && (
              <button onClick={() => { setSearch(""); setCityFilter(""); }}
                className="text-xs font-semibold text-blue-600 hover:underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {upcoming.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Upcoming</p>
                <div className="space-y-4">
                  {upcoming.map((e, i) => (
                    <motion.div key={e.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}>
                      <EventCard event={e} mode="public" />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1 mt-2">Past events</p>
                <div className="space-y-4 opacity-75">
                  {past.map((e, i) => (
                    <motion.div key={e.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}>
                      <EventCard event={e} mode="public" />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* Communities tab */}
      {tab === "communities" && (
        communitiesLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : filteredCommunities.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <Store size={28} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700 mb-1">No communities found</p>
            <p className="text-xs text-slate-400">Try a different search.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredCommunities.map((c, i) => (
              <motion.div key={c.uid} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}>
                <CommunityRow c={c} followerCount={followerCounts[c.uid]} />
              </motion.div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
