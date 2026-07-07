"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  collection, query, where, getDocs, doc, getDoc,
  updateDoc, arrayUnion, arrayRemove,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendReminder } from "@/lib/sendReminder";
import { compressImage } from "@/lib/image-utils";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Flame, Star, Users, UserCheck, ArrowLeft, Bell, Check, Camera, Trash2, MapPin, Globe, Store, CalendarSearch } from "lucide-react";
import Link from "next/link";
import { CommunityEvent } from "@/lib/community-utils";
import EventCard from "@/components/community/EventCard";
import VerifiedBadge from "@/components/ui/VerifiedBadge";

const CATEGORY_LABELS: Record<string, string> = {
  business: "Business",
  coffee_shop: "Coffee shop / venue",
  influencer: "Influencer / content creator",
  organization: "Organization / charity",
  other: "Other",
};

interface ProfileData {
  uid: string;
  displayName: string | null;
  username: string;
  photoURL: string | null;
  xp: number;
  level: number;
  streak: number;
  plan: string;
  following: string[];
  followerUids: string[]; // computed via query — who has this uid in their following
  habits?: string[];
  phone?: string;
  accountType?: "user" | "community";
  communityCategory?: string;
  communityPlan?: string;
  bio?: string;
  website?: string;
  city?: string;
}

interface FriendProgress {
  habitLog: Record<string, boolean>;
  adhkarLog: { morning?: boolean; evening?: boolean };
  prayerLog: Record<string, boolean>;
  hifzDone: boolean;
}

const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const todayStr = new Date().toISOString().split("T")[0];

const glass = {
  background: "rgba(255,255,255,0.65)",
  border: "1px solid rgba(255,255,255,0.80)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 4px 24px rgba(15,23,42,0.07)",
} as const;

function Avatar({ name, photoURL, size = 72 }: { name: string; photoURL?: string | null; size?: number }) {
  if (photoURL) {
    // Use regular <img> to support both data: URLs (base64) and remote URLs
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photoURL} alt={name} width={size} height={size}
        className="rounded-full object-cover ring-4 ring-white/80 flex-shrink-0"
        style={{ width: size, height: size }} />
    );
  }
  const initials = (name || "?").split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{ width: size, height: size }}
      className="rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-2xl ring-4 ring-white/80 flex-shrink-0">
      {initials || "?"}
    </div>
  );
}

function FollowButton({ isFollowing, loading, onToggle }: { isFollowing: boolean; loading: boolean; onToggle: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onToggle}
      disabled={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`rounded-2xl px-6 py-2.5 text-sm font-semibold border-2 transition-all duration-200 flex items-center gap-2 ${
        isFollowing
          ? hovered ? "bg-red-50 border-red-400 text-red-500" : "border-slate-200 text-slate-700"
          : "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
      } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
      style={isFollowing ? { ...glass, background: hovered ? "rgba(254,242,242,0.9)" : "rgba(255,255,255,0.85)" } : {}}
    >
      {isFollowing ? <><UserCheck size={15} />{hovered ? "Unfollow" : "Following"}</> : <><Users size={15} />Follow</>}
    </button>
  );
}

function RemindButton({ done, label, onSend }: { done: boolean; label: string; onSend: () => Promise<void> }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (done || sent || loading) return;
    setLoading(true);
    await onSend();
    setLoading(false);
    setSent(true);
  }

  if (done) {
    return (
      <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
        <Check size={12} /> Done
      </span>
    );
  }
  if (sent) {
    return (
      <span className="flex items-center gap-1 text-[11px] text-blue-500 font-semibold">
        <Bell size={12} /> Sent
      </span>
    );
  }
  return (
    <button
      onClick={handle}
      disabled={loading}
      className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50"
    >
      <Bell size={11} /> Remind
    </button>
  );
}

function MiniUserRow({ uid }: { uid: string }) {
  const [data, setData] = useState<{ displayName: string | null; username: string; photoURL: string | null } | null>(null);

  useEffect(() => {
    getDocs(query(collection(db, "users"), where("uid", "==", uid))).then(snap => {
      if (!snap.empty) {
        const d = snap.docs[0].data();
        setData({ displayName: d.displayName ?? null, username: d.username ?? uid, photoURL: d.photoURL ?? null });
      }
    });
  }, [uid]);

  if (!data) return <div className="h-12 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.40)" }} />;

  return (
    <Link href={`/profile/${data.username}`}
      className="flex items-center gap-3 p-3 rounded-xl hover:scale-[1.01] transition-all" style={glass}>
      {data.photoURL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.photoURL} alt={data.displayName ?? ""} width={36} height={36}
          className="rounded-full object-cover flex-shrink-0" style={{ width: 36, height: 36 }} />
      ) : (
        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {(data.displayName ?? data.username).split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{data.displayName ?? data.username}</p>
        <p className="text-xs text-slate-400">@{data.username}</p>
      </div>
    </Link>
  );
}

export default function ProfilePage({ params }: { params: { username: string } }) {
  const { username } = params;
  const router = useRouter();
  const { user, profile: myProfile } = useAuth();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<"followers" | "following" | "progress">("progress");
  const [followLoading, setFollowLoading] = useState(false);
  const [friendProgress, setFriendProgress] = useState<FriendProgress | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoRemoving, setPhotoRemoving] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [communityEvents, setCommunityEvents] = useState<CommunityEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const photoMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPhotoMenu) return;
    function onClick(e: MouseEvent) {
      if (photoMenuRef.current && !photoMenuRef.current.contains(e.target as Node)) {
        setShowPhotoMenu(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showPhotoMenu]);

  const isOwnProfile = user?.uid === profileData?.uid;
  const isFollowing = myProfile?.following?.includes(profileData?.uid ?? "") ?? false;
  const isCommunityProfile = profileData?.accountType === "community";
  const isCommunityViewer = myProfile?.accountType === "community";
  const profileUid = profileData?.uid ?? null;
  const profileAccountType = profileData?.accountType ?? null;

  useEffect(() => {
    async function loadProfile() {
      const snap = await getDocs(query(collection(db, "users"), where("username", "==", username.toLowerCase())));
      if (snap.empty) { setNotFound(true); return; }
      const d = snap.docs[0].data();
      const uid = d.uid as string;

      // Compute followers by querying who has this uid in their following array
      const followerSnap = await getDocs(
        query(collection(db, "users"), where("following", "array-contains", uid))
      );
      const followerUids = followerSnap.docs.map(fd => fd.data().uid as string);

      setProfileData({
        uid,
        displayName: d.displayName ?? null,
        username: d.username ?? "",
        photoURL: d.photoURL ?? null,
        xp: d.xp ?? 0,
        level: d.level ?? 1,
        streak: d.streak ?? 0,
        plan: d.plan ?? "free",
        following: d.following ?? [],
        followerUids,
        habits: d.habits ?? [],
        phone: d.phone as string | undefined,
        accountType: d.accountType,
        communityCategory: d.communityCategory,
        communityPlan: d.communityPlan ?? (d.plan === "premium" ? "premium" : undefined),
        bio: d.bio,
        website: d.website,
        city: d.city,
      });

      // Load today's progress (normal users only)
      if (d.accountType !== "community") {
        const habitsDoc = await getDoc(doc(db, "users", uid));
        if (habitsDoc.exists()) {
          const data = habitsDoc.data();
          setFriendProgress({
            habitLog: data.habitLog?.[todayStr] ?? {},
            adhkarLog: data.adhkarLog?.[todayStr] ?? {},
            prayerLog: data.prayerLog?.[todayStr] ?? {},
            hifzDone: !!(data.hifzPlan?.log?.[todayStr]),
          });
        }
      }
    }
    loadProfile();
  }, [username]);

  useEffect(() => {
    if (!profileUid || profileAccountType !== "community") { setEventsLoading(false); return; }
    setEventsLoading(true);
    getDocs(query(collection(db, "communityEvents"), where("communityUid", "==", profileUid))).then(snap => {
      setCommunityEvents(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() } as CommunityEvent))
          .sort((a, b) => b.date.localeCompare(a.date))
      );
      setEventsLoading(false);
    });
  }, [profileUid, profileAccountType]);

  async function handleFollowToggle() {
    if (!user || !profileData) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        // Only write to OWN document — avoids Firestore security rule errors
        await updateDoc(doc(db, "users", user.uid), { following: arrayRemove(profileData.uid) });
        setProfileData(prev => prev ? { ...prev, followerUids: prev.followerUids.filter(id => id !== user.uid) } : prev);
      } else {
        await updateDoc(doc(db, "users", user.uid), { following: arrayUnion(profileData.uid) });
        setProfileData(prev => prev ? { ...prev, followerUids: [...prev.followerUids, user.uid] } : prev);
      }
    } finally {
      setFollowLoading(false);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setPhotoUploading(true);
    try {
      // Compress image to ~200x200 JPEG and convert to base64 — no Storage needed
      const dataUrl = await compressImage(file, 200, 0.75);
      await updateDoc(doc(db, "users", user.uid), { photoURL: dataUrl });
      setProfileData(prev => prev ? { ...prev, photoURL: dataUrl } : prev);
    } finally {
      setPhotoUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  }

  async function handlePhotoRemove() {
    if (!user) return;
    setPhotoRemoving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { photoURL: null });
      setProfileData(prev => prev ? { ...prev, photoURL: null } : prev);
    } finally {
      setPhotoRemoving(false);
    }
  }

  function remind(type: "prayer" | "adhkar" | "habit" | "hifz", label: string) {
    return async () => {
      if (!user || !profileData || !myProfile) return;
      // Always send in-app notification
      await sendReminder({
        fromUid: user.uid,
        fromName: myProfile.displayName ?? myProfile.username,
        fromUsername: myProfile.username,
        toUid: profileData.uid,
        type,
        label,
      });
      // Also send SMS if both users have phone numbers
      if (myProfile.phone && profileData.phone) {
        await fetch("/api/sms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: profileData.phone,
            senderName: myProfile.displayName ?? myProfile.username,
            friendName: profileData.displayName ?? profileData.username,
          }),
        });
      }
    };
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 text-sm font-semibold mb-2">User not found</p>
          <Link href="/leaderboard" className="mt-2 inline-block text-xs text-blue-600 hover:underline">Browse leaderboard</Link>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isCommunityProfile) {
    return (
      <div className="min-h-screen">
        <div className="max-w-xl mx-auto px-5 py-8">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
              <ArrowLeft size={14} /> Back
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl p-6 mb-5" style={glass}>
            <div className="flex items-start gap-4">
              <Avatar name={profileData.displayName ?? profileData.username} photoURL={profileData.photoURL} size={72} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xl font-bold text-slate-900 leading-tight truncate">{profileData.displayName ?? profileData.username}</p>
                  {profileData.communityPlan === "premium" && <VerifiedBadge size={16} />}
                </div>
                <p className="text-sm text-slate-400 mt-0.5 truncate">@{profileData.username}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-500">
                  {profileData.communityCategory && (
                    <span className="inline-flex items-center gap-1"><Store size={12} className="text-blue-400" />{CATEGORY_LABELS[profileData.communityCategory] ?? profileData.communityCategory}</span>
                  )}
                  {profileData.city && (
                    <span className="inline-flex items-center gap-1"><MapPin size={12} className="text-blue-400" />{profileData.city}</span>
                  )}
                  {profileData.website && (
                    <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                      <Globe size={12} />Website
                    </a>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                {!isOwnProfile && !isCommunityViewer && (
                  <FollowButton isFollowing={isFollowing} loading={followLoading} onToggle={handleFollowToggle} />
                )}
              </div>
            </div>
            {profileData.bio && (
              <p className="text-sm text-slate-600 leading-relaxed mt-4 whitespace-pre-line">{profileData.bio}</p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mt-5">
              {[
                { label: "Followers", value: profileData.followerUids.length, icon: <Users size={13} className="text-blue-400" /> },
                { label: "Events posted", value: communityEvents.length, icon: <CalendarSearch size={13} className="text-blue-400" /> },
              ].map(({ label, value, icon }) => (
                <div key={label} className="rounded-2xl p-3 text-center" style={{ background: "rgba(248,250,252,0.80)", border: "1px solid rgba(226,232,240,0.60)" }}>
                  <div className="flex justify-center mb-1">{icon}</div>
                  <p className="text-base font-bold text-slate-800">{value}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
            {eventsLoading ? (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Events</p>
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-56 rounded-3xl animate-pulse" style={{ background: "rgba(255,255,255,0.40)" }} />
                ))}
              </div>
            ) : communityEvents.length === 0 ? (
              <>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Events</p>
                <div className="rounded-3xl p-8 text-center" style={glass}>
                  <CalendarSearch size={28} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No events posted yet</p>
                </div>
              </>
            ) : (
              <div className="space-y-5">
                {communityEvents.filter(e => e.date >= todayStr).length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Upcoming events</p>
                    <div className="space-y-4">
                      {communityEvents.filter(e => e.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date)).map(e => (
                        <EventCard key={e.id} event={e} mode="public" />
                      ))}
                    </div>
                  </div>
                )}
                {communityEvents.filter(e => e.date < todayStr).length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Past events</p>
                    <div className="space-y-4 opacity-80">
                      {communityEvents.filter(e => e.date < todayStr).map(e => (
                        <EventCard key={e.id} event={e} mode="public" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  const displayList = tab === "followers" ? profileData.followerUids : profileData.following;

  return (
    <div className="min-h-screen">
      <div className="max-w-xl mx-auto px-5 py-8">
        {/* Back */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={14} /> Back
          </button>
        </motion.div>

        {/* Profile card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl p-6 mb-5" style={glass}>
          <div className="flex items-start gap-4">
            {/* Avatar with optional upload */}
            <div className="relative flex-shrink-0" ref={photoMenuRef}>
              <Avatar name={profileData.displayName ?? profileData.username} photoURL={profileData.photoURL} size={72} />
              {isOwnProfile && (
                <>
                  <button
                    onClick={() => setShowPhotoMenu((v) => !v)}
                    disabled={photoUploading || photoRemoving}
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-md ring-2 ring-white transition-colors disabled:opacity-60"
                  >
                    {photoUploading || photoRemoving
                      ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Camera size={13} className="text-white" />
                    }
                  </button>
                  <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />

                  <AnimatePresence>
                    {showPhotoMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-20 w-44 rounded-2xl overflow-hidden"
                        style={{
                          background: "rgba(255,255,255,0.98)",
                          backdropFilter: "blur(20px)",
                          WebkitBackdropFilter: "blur(20px)",
                          border: "1px solid rgba(226,232,240,0.8)",
                          boxShadow: "0 12px 32px rgba(15,23,42,0.16)",
                        }}
                      >
                        <button
                          onClick={() => { setShowPhotoMenu(false); photoInputRef.current?.click(); }}
                          className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Camera size={14} className="text-slate-400" /> {profileData.photoURL ? "Change photo" : "Upload photo"}
                        </button>
                        {profileData.photoURL && (
                          <button
                            onClick={() => { setShowPhotoMenu(false); handlePhotoRemove(); }}
                            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors border-t border-slate-100"
                          >
                            <Trash2 size={14} /> Remove photo
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold text-slate-900 leading-tight truncate">{profileData.displayName ?? profileData.username}</p>
              <p className="text-sm text-slate-400 mt-0.5 truncate">@{profileData.username.slice(0, 14)}{profileData.username.length > 14 ? "…" : ""}</p>
              {profileData.plan !== "free" && (
                <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5">
                  <Star size={10} /> Premium
                </span>
              )}
            </div>
            <div className="flex-shrink-0">
              {!isOwnProfile && (
                <FollowButton isFollowing={isFollowing} loading={followLoading} onToggle={handleFollowToggle} />
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mt-6">
            {[
              { label: "XP", value: profileData.xp, icon: <Zap size={13} className="text-blue-400" /> },
              { label: "Level", value: profileData.level, icon: <Star size={13} className="text-amber-400" /> },
              { label: "Streak", value: profileData.streak, icon: <Flame size={13} className="text-orange-400" /> },
              { label: "Followers", value: profileData.followerUids.length, icon: <Users size={13} className="text-slate-400" /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="rounded-2xl p-3 text-center" style={{ background: "rgba(248,250,252,0.80)", border: "1px solid rgba(226,232,240,0.60)" }}>
                <div className="flex justify-center mb-1">{icon}</div>
                <p className="text-base font-bold text-slate-800">{value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
          <div className="inline-flex rounded-2xl p-1 gap-1 mb-4" style={glass}>
            {!isOwnProfile && (
              <button onClick={() => setTab("progress")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === "progress" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                Today
              </button>
            )}
            <button onClick={() => setTab("followers")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === "followers" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
              Followers <span className="opacity-70">{profileData.followerUids.length}</span>
            </button>
            <button onClick={() => setTab("following")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === "following" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
              Following <span className="opacity-70">{profileData.following.length}</span>
            </button>
          </div>

          {/* Today's progress (friend view only) */}
          {tab === "progress" && !isOwnProfile && (
            <div className="space-y-3">
              {/* Prayers */}
              <div className="rounded-2xl p-4" style={glass}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Salah — today</p>
                <div className="space-y-2">
                  {PRAYERS.map(prayer => {
                    const done = friendProgress?.prayerLog?.[prayer] === true;
                    return (
                      <div key={prayer} className="flex items-center justify-between py-1">
                        <span className="text-sm font-medium text-slate-700">{prayer}</span>
                        <RemindButton done={done} label={prayer} onSend={remind("prayer", prayer)} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Adhkar */}
              <div className="rounded-2xl p-4" style={glass}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Adhkar — today</p>
                <div className="space-y-2">
                  {(["morning", "evening"] as const).map(session => {
                    const done = friendProgress?.adhkarLog?.[session] === true;
                    const label = session === "morning" ? "Morning Adhkar" : "Evening Adhkar";
                    return (
                      <div key={session} className="flex items-center justify-between py-1">
                        <span className="text-sm font-medium text-slate-700">{label}</span>
                        <RemindButton done={done} label={label} onSend={remind("adhkar", label)} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Habits */}
              {profileData.habits && profileData.habits.length > 0 && (
                <div className="rounded-2xl p-4" style={glass}>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Habits — today</p>
                  <div className="space-y-2">
                    {profileData.habits.map(habit => {
                      const done = friendProgress?.habitLog?.[habit] === true;
                      return (
                        <div key={habit} className="flex items-center justify-between py-1 gap-3">
                          <span className="text-sm font-medium text-slate-700 leading-snug flex-1">{habit}</span>
                          <RemindButton done={done} label={habit} onSend={remind("habit", habit)} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Hifz */}
              {friendProgress !== null && (
                <div className="rounded-2xl p-4" style={glass}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">Hifz — today</p>
                      <p className="text-sm font-medium text-slate-700">Quran memorisation</p>
                    </div>
                    <RemindButton done={friendProgress.hifzDone} label="Hifz" onSend={remind("hifz", "Hifz")} />
                  </div>
                </div>
              )}

              {!isFollowing && (
                <p className="text-[11px] text-slate-400 text-center pt-1">
                  Follow this user to send them daily reminders
                </p>
              )}
              {isFollowing && !myProfile?.phone && (
                <p className="text-[11px] text-slate-400 text-center pt-1">
                  <Link href="/settings" className="underline hover:text-blue-600">Add your phone number</Link> to also send SMS reminders.
                </p>
              )}
              {isFollowing && myProfile?.phone && !profileData.phone && (
                <p className="text-[11px] text-slate-400 text-center pt-1">
                  This user hasn&apos;t added a phone number yet, only in-app reminders will be sent.
                </p>
              )}
            </div>
          )}

          {/* Followers / Following list */}
          {(tab === "followers" || tab === "following") && (
            displayList.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={glass}>
                <p className="text-sm text-slate-400">
                  {tab === "followers"
                    ? isOwnProfile ? "No one is following you yet" : "No followers yet"
                    : isOwnProfile ? "You are not following anyone yet" : "Not following anyone yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {displayList.map(uid => <MiniUserRow key={uid} uid={uid} />)}
              </div>
            )
          )}
        </motion.div>
      </div>
    </div>
  );
}
