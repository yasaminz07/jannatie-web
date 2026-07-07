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
import {
  Users, Search, MapPin, CalendarSearch, Store, ChevronDown, Heart, Sparkles,
} from "lucide-react";

const glass = {
  background: "rgba(255,255,255,0.65)",
  border: "1px solid rgba(255,255,255,0.80)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 4px 24px rgba(15,23,42,0.07)",
} as const;

interface CommunityProfile {
  uid: string;
  displayName: string | null;
  username: string;
  photoURL: string | null;
  communityCategory?: string;
  city?: string;
  bio?: string;
  communityPlan?: string; // "premium" for verified/featured communities
}

const CATEGORY_LABELS: Record<string, string> = {
  business: "Business",
  coffee_shop: "Coffee shop / venue",
  influencer: "Influencer / content creator",
  organization: "Organization / charity",
  other: "Other",
};

function CommunityCard({ c, followerCount }: { c: CommunityProfile; followerCount: number | undefined }) {
  const initials = (c.displayName ?? c.username).slice(0, 2).toUpperCase();
  const isPremium = c.communityPlan === "premium";
  return (
    <Link href={`/profile/${c.username}`}
      className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group">
      <div className="relative flex-shrink-0">
        {c.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.photoURL} alt={c.displayName ?? c.username} width={48} height={48}
            className="rounded-full object-cover ring-2 ring-white" style={{ width: 48, height: 48 }} />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white">
            {initials}
          </div>
        )}
        {isPremium && (
          <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-sm">
            <VerifiedBadge size={11} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-700 transition-colors">
            {c.displayName ?? c.username}
          </p>
          {isPremium && (
            <span className="flex-shrink-0 text-[9px] font-bold bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 border border-amber-200">
              Featured
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 truncate">
          @{c.username}
          {c.city && <span> · <MapPin size={9} className="inline -mt-0.5" /> {c.city}</span>}
          {c.communityCategory && <span> · {CATEGORY_LABELS[c.communityCategory] ?? c.communityCategory}</span>}
        </p>
        {c.bio && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{c.bio}</p>}
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Users size={11} className="text-slate-300" />
          <span className="font-semibold text-slate-600">{followerCount ?? "…"}</span>
        </div>
        <span className="text-[10px] text-slate-300">{followerCount === 1 ? "follower" : "followers"}</span>
      </div>
    </Link>
  );
}

type Tab = "discover" | "following" | "communities";

export default function CommunityFeedPage() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>("discover");
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
      const profiles = snap.docs.map(d => {
        const data = d.data();
        return {
          uid: data.uid,
          displayName: data.displayName ?? null,
          username: data.username ?? "",
          photoURL: data.photoURL ?? null,
          communityCategory: data.communityCategory,
          city: data.city,
          bio: data.bio,
          // fall back to plan field for accounts manually set in Firebase Console
          communityPlan: data.communityPlan ?? (data.plan === "premium" ? "premium" : undefined),
        } as CommunityProfile;
      });
      // Sort premium (featured) communities first
      profiles.sort((a, b) => {
        if (a.communityPlan === "premium" && b.communityPlan !== "premium") return -1;
        if (a.communityPlan !== "premium" && b.communityPlan === "premium") return 1;
        return 0;
      });
      setCommunities(profiles);
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

  const premiumCommunityUids = useMemo(
    () => new Set(communities.filter(c => c.communityPlan === "premium").map(c => c.uid)),
    [communities]
  );

  const followingUids = useMemo(() => profile?.following ?? [], [profile?.following]);
  const followingCommunityUids = useMemo(() => {
    const communityUids = new Set(communities.map(c => c.uid));
    return followingUids.filter(uid => communityUids.has(uid));
  }, [followingUids, communities]);

  const filteredCommunities = useMemo(() => {
    if (!search) return communities;
    const t = search.toLowerCase();
    return communities.filter(c =>
      (c.displayName ?? "").toLowerCase().includes(t) ||
      c.username.toLowerCase().includes(t) ||
      (c.city ?? "").toLowerCase().includes(t)
    );
  }, [communities, search]);

  const cities = useMemo(() => {
    const set = new Set(events.map(e => e.city).filter(Boolean));
    return Array.from(set).sort();
  }, [events]);

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => events.filter(e => {
    if (cityFilter && e.city !== cityFilter) return false;
    if (search) {
      const t = search.toLowerCase();
      if (!e.title.toLowerCase().includes(t) &&
        !e.communityName.toLowerCase().includes(t) &&
        !e.description.toLowerCase().includes(t)) return false;
    }
    return true;
  }), [events, search, cityFilter]);

  const followingEvents = useMemo(() => events.filter(e => {
    if (!followingUids.includes(e.communityUid)) return false;
    if (cityFilter && e.city !== cityFilter) return false;
    if (search) {
      const t = search.toLowerCase();
      if (!e.title.toLowerCase().includes(t) &&
        !e.communityName.toLowerCase().includes(t) &&
        !e.description.toLowerCase().includes(t)) return false;
    }
    return true;
  }), [events, followingUids, search, cityFilter]);

  // Sort: premium (communityIsPremium) first, then by date ascending
  const upcoming = useMemo(() => filtered
    .filter(e => e.date >= today)
    .sort((a, b) => {
      if (a.communityIsPremium && !b.communityIsPremium) return -1;
      if (!a.communityIsPremium && b.communityIsPremium) return 1;
      return a.date.localeCompare(b.date);
    }), [filtered, today]);

  const past = filtered.filter(e => e.date < today);

  const followingUpcoming = useMemo(() => followingEvents
    .filter(e => e.date >= today)
    .sort((a, b) => {
      if (a.communityIsPremium && !b.communityIsPremium) return -1;
      if (!a.communityIsPremium && b.communityIsPremium) return 1;
      return a.date.localeCompare(b.date);
    }), [followingEvents, today]);

  const followingPast = followingEvents.filter(e => e.date < today);

  const showCityFilter = (tab === "discover" || tab === "following") && cities.length > 0;

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-5 py-6 sm:py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Users size={20} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Community</h1>
          </div>
          <p className="text-slate-500 text-sm">Events and announcements from Jannatie communities</p>
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}
          className="flex rounded-2xl p-1 gap-1 mb-4 overflow-x-auto scrollbar-hide" style={glass}>
          <button onClick={() => { setTab("discover"); setSearch(""); }}
            className={`flex-1 justify-center min-w-0 px-2 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1 ${tab === "discover" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
            <Sparkles size={13} className="flex-shrink-0" /> <span className="truncate">Discover</span>
          </button>
          <button onClick={() => { setTab("following"); setSearch(""); }}
            className={`flex-1 justify-center min-w-0 px-2 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1 ${tab === "following" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
            <Heart size={13} className="flex-shrink-0" /> <span className="truncate">Following</span>
            {followingCommunityUids.length > 0 && (
              <span className={`flex-shrink-0 text-[10px] font-bold rounded-full px-1.5 py-0.5 ${tab === "following" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-600"}`}>
                {followingCommunityUids.length}
              </span>
            )}
          </button>
          <button onClick={() => { setTab("communities"); setSearch(""); }}
            className={`flex-1 justify-center min-w-0 px-2 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1 ${tab === "communities" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
            <Store size={13} className="flex-shrink-0" /> <span className="truncate">Communities</span>
          </button>
        </motion.div>

        {/* Search + city filter */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="flex items-center gap-2 mb-6">
          <div className="flex items-center gap-2 flex-1 rounded-2xl px-3.5 py-2.5" style={glass}>
            <Search size={14} className="text-slate-400 flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={
                tab === "discover" ? "Search events, communities…" :
                tab === "following" ? "Search followed events…" :
                "Search communities by name or city…"
              }
              className="flex-1 text-sm bg-transparent outline-none text-slate-800 placeholder-slate-400 min-w-0"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-slate-300 hover:text-slate-500 flex-shrink-0">
                <CalendarSearch size={13} />
              </button>
            )}
          </div>
          {showCityFilter && (
            <div ref={cityDropdownRef} className="relative flex-shrink-0">
              <button
                onClick={() => setCityDropdownOpen(o => !o)}
                className="flex items-center gap-1.5 rounded-2xl px-3.5 py-2.5 text-sm text-slate-700 transition-all whitespace-nowrap"
                style={glass}
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
                    className="absolute right-0 top-full mt-1.5 min-w-[150px] rounded-2xl overflow-hidden z-50 py-1.5"
                    style={{ ...glass, boxShadow: "0 8px 32px rgba(15,23,42,0.14)" }}
                  >
                    {(["", ...cities] as string[]).map(c => (
                      <button
                        key={c || "__all"}
                        onClick={() => { setCityFilter(c); setCityDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 ${
                          cityFilter === c ? "text-blue-600 font-semibold bg-blue-50/60" : "text-slate-700 hover:bg-white/60"
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
        </motion.div>

        {/* ── FOLLOWING TAB ── */}
        {tab === "following" && (
          loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-64 rounded-3xl animate-pulse" style={{ background: "rgba(255,255,255,0.40)" }} />
              ))}
            </div>
          ) : followingCommunityUids.length === 0 ? (
            <div className="rounded-3xl p-10 text-center" style={glass}>
              <Heart size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700 mb-1">Not following anyone yet</p>
              <p className="text-xs text-slate-400 mb-4">Follow communities to see their events here.</p>
              <button onClick={() => setTab("discover")}
                className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl px-4 py-2 transition-colors">
                Discover communities
              </button>
            </div>
          ) : followingEvents.length === 0 ? (
            <div className="rounded-3xl p-10 text-center" style={glass}>
              <CalendarSearch size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700 mb-1">
                {search || cityFilter ? "No matching events" : "No events from followed communities"}
              </p>
              <p className="text-xs text-slate-400">
                {search || cityFilter ? "Try adjusting your search or filter." : "Check back soon — communities you follow will post here."}
              </p>
              {(search || cityFilter) && (
                <button onClick={() => { setSearch(""); setCityFilter(""); }}
                  className="mt-3 text-xs font-semibold text-blue-600 hover:underline">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {followingUpcoming.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Upcoming</p>
                  <div className="space-y-4">
                    {followingUpcoming.map((e, i) => (
                      <motion.div key={e.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}>
                        <EventCard event={e} mode="public" isPremiumCommunity={premiumCommunityUids.has(e.communityUid)} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
              {followingPast.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1 mt-2">Past events</p>
                  <div className="space-y-4 opacity-75">
                    {followingPast.map((e, i) => (
                      <motion.div key={e.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}>
                        <EventCard event={e} mode="public" isPremiumCommunity={premiumCommunityUids.has(e.communityUid)} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {/* ── COMMUNITIES TAB ── */}
        {tab === "communities" && (
          communitiesLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.40)" }} />
              ))}
            </div>
          ) : filteredCommunities.length === 0 ? (
            <div className="rounded-3xl p-10 text-center" style={glass}>
              <Store size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700 mb-1">No communities found</p>
              <p className="text-xs text-slate-400">Try a different search.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredCommunities.map((c, i) => (
                <motion.div key={c.uid} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}>
                  <CommunityCard c={c} followerCount={followerCounts[c.uid]} />
                </motion.div>
              ))}
            </div>
          )
        )}

        {/* ── DISCOVER TAB ── */}
        {tab === "discover" && (
          loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-64 rounded-3xl animate-pulse" style={{ background: "rgba(255,255,255,0.40)" }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl p-10 text-center" style={glass}>
              <CalendarSearch size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700 mb-1">No events found</p>
              <p className="text-xs text-slate-400 mb-3">
                {search || cityFilter ? "Try adjusting your search or filter." : "Check back soon, or follow communities to stay updated."}
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
                        <EventCard event={e} mode="public" isPremiumCommunity={premiumCommunityUids.has(e.communityUid)} />
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
                        <EventCard event={e} mode="public" isPremiumCommunity={premiumCommunityUids.has(e.communityUid)} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
              {followingCommunityUids.length === 0 && upcoming.length > 0 && (
                <div className="rounded-2xl p-4 text-center" style={{ ...glass, background: "rgba(239,246,255,0.70)" }}>
                  <p className="text-xs text-slate-600 mb-2">
                    <span className="font-semibold">Follow communities</span> to get notified when they post new events.
                  </p>
                  <button onClick={() => setTab("communities")}
                    className="text-xs font-semibold text-blue-600 hover:underline">
                    Browse communities →
                  </button>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
