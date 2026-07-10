"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  CheckSquare, BookOpen, MessageCircle, Flame, Zap,
  Plus, ArrowRight, ChevronRight, Calendar,
  Sparkles, CheckCircle2, TrendingUp, BookMarked, Bell, Check,
  Users, Send, UserPlus, PhoneOff,
} from "lucide-react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

interface HifzPlan {
  preset: string;
  amount?: number;
  unit?: string;
  days?: number[];
  time?: string;
  log?: Record<string, boolean>;
}

const HADITHS = [
  { arabic: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ", text: "The best of you are those who learn the Quran and teach it.", source: "Sahih al-Bukhari 5027" },
  { arabic: "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ", text: "Actions are judged by intentions, and every person will get what they intended.", source: "Sahih al-Bukhari 1" },
  { arabic: "لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ", text: "None of you truly believes until he loves for his brother what he loves for himself.", source: "Sahih al-Bukhari 13" },
  { arabic: "لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ، إِنَّمَا الشَّدِيدُ الَّذِي يَمْلِكُ نَفْسَهُ عِنْدَ الْغَضَبِ", text: "The strong person is not the one who wrestles others down. The strong person is the one who controls himself when angry.", source: "Sahih al-Bukhari 6114" },
  { arabic: "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ", text: "Whoever believes in Allah and the Last Day should speak good or keep silent.", source: "Sahih al-Bukhari 6018" },
  { arabic: "يَسِّرُوا وَلَا تُعَسِّرُوا، وَبَشِّرُوا وَلَا تُنَفِّرُوا", text: "Make things easy and do not make them difficult; cheer people up and do not drive them away.", source: "Sahih al-Bukhari 69" },
  { arabic: "الدُّنْيَا سِجْنُ الْمُؤْمِنِ وَجَنَّةُ الْكَافِرِ", text: "The world is a prison for the believer and a paradise for the disbeliever.", source: "Sahih Muslim 2956" },
  { arabic: "إِمَاطَةُ الْأَذَى عَنِ الطَّرِيقِ صَدَقَةٌ", text: "Remove harm from the road. That is charity.", source: "Sahih Muslim 1009" },
  { arabic: "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ", text: "Smiling in the face of your brother is charity.", source: "Jami at-Tirmidhi 1956" },
  { arabic: "اطْلُبُوا الْعِلْمَ مِنَ الْمَهْدِ إِلَى اللَّحْدِ", text: "Seek knowledge from the cradle to the grave.", source: "Ibn Abd al-Barr, Jami Bayan al-Ilm" },
  { arabic: "لَا يَشْكُرُ اللَّهَ مَنْ لَا يَشْكُرُ النَّاسَ", text: "He who does not thank people does not thank Allah.", source: "Sunan Abu Dawud 4811" },
  { arabic: "قُلِ الْحَقَّ وَلَوْ كَانَ مُرًّا", text: "Speak the truth even if it is bitter.", source: "Ibn Hibban 5763" },
  { arabic: "لَا يَرْحَمُ اللَّهُ مَنْ لَا يَرْحَمُ النَّاسَ", text: "Whoever is not merciful to others will not be treated mercifully.", source: "Sahih al-Bukhari 6013" },
  { arabic: "خَيْرُكُمْ أَحْسَنُكُمْ خُلُقًا", text: "The best among you is the one who has the best manners and character.", source: "Sahih al-Bukhari 3559" },
  { arabic: "لَا تُسْرِفْ وَلَوْ كُنْتَ عَلَى نَهَرٍ جَارٍ", text: "Do not waste water even if you are at a flowing river.", source: "Sunan Ibn Majah 425" },
  { arabic: "إِنَّ اللَّهَ لَا يَنْظُرُ إِلَى صُوَرِكُمْ وَأَمْوَالِكُمْ، وَلَكِنْ يَنْظُرُ إِلَى قُلُوبِكُمْ وَأَعْمَالِكُمْ", text: "Allah does not look at your appearance or wealth, but He looks at your hearts and deeds.", source: "Sahih Muslim 2564" },
  { arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", text: "Verily, with hardship comes ease.", source: "Quran 94:6" },
  { arabic: "أَطْعِمُوا الْجَائِعَ، وَعُودُوا الْمَرِيضَ، وَفُكُّوا الْعَانِيَ", text: "Feed the hungry, visit the sick, and free the captive.", source: "Sahih al-Bukhari 5373" },
  { arabic: "أَحَبُّ الْأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ", text: "The most beloved of deeds to Allah are those done consistently, even if they are small.", source: "Sahih al-Bukhari 6464" },
  { arabic: "كُلُّ مَعْرُوفٍ صَدَقَةٌ", text: "Every act of kindness is charity.", source: "Sahih al-Bukhari 6021" },
];

function getDailyHadith(uid: string): { arabic: string; text: string; source: string } {
  const date = new Date().toISOString().slice(0, 10);
  let hash = 0;
  const seed = uid + date;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) >>> 0;
  }
  return HADITHS[hash % HADITHS.length];
}

function getGreeting(name: string) {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 17) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

const ONBOARDING_STEPS = [
  {
    Icon: Sparkles,
    title: "Bismillah — welcome to Jannatie",
    body: "This is your personal Islamic growth space. Here is a quick look at what you can do.",
  },
  {
    Icon: CheckCircle2,
    title: "Build daily habits",
    body: "Track your Islamic habits every day. Salah, Quran, Dhikr and more. Complete them to earn XP and grow your streak.",
  },
  {
    Icon: MessageCircle,
    title: "Ask your AI Buddy",
    body: "Ask anything about Islam, duas, Seerah or Fiqh. Every answer cites the hadith so you always know the source.",
  },
  {
    Icon: TrendingUp,
    title: "Learn and level up",
    body: "Complete daily lessons, earn badges and track your progress alongside your mosque community.",
  },
];

const LEVEL_NAMES = ["Mubtadi", "Mujahid", "Talib", "Hafidh", "Wali"];
const AI_PROMPTS = [
  "What is the Sunnah of sleeping?",
  "How do I make up missed Salah?",
];

const glassCard = {
  background: "rgba(255, 255, 255, 0.65)",
  border: "1px solid rgba(255, 255, 255, 0.80)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 4px 24px rgba(15, 23, 42, 0.07)",
} as const;

function OnboardingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const current = ONBOARDING_STEPS[step];
  const CurrentIcon = current.Icon;
  const isLast = step === ONBOARDING_STEPS.length - 1;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="rounded-3xl p-8 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{
          background: "rgba(255,255,255,0.93)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          border: "1px solid rgba(255,255,255,0.95)",
          boxShadow: "0 20px 60px rgba(15,23,42,0.14)",
        }}
      >
        <div className="flex justify-center mb-6">
          <CurrentIcon size={40} className="text-blue-500" />
        </div>

        <div className="flex justify-center gap-1.5 mb-6">
          {ONBOARDING_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-blue-500" : "w-1.5 bg-slate-200"}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-xl font-bold text-slate-900 text-center mb-3">{current.title}</h2>
            <p className="text-slate-500 text-sm text-center leading-relaxed">{current.body}</p>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 py-3 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">
            Skip
          </button>
          <button
            onClick={() => (isLast ? onClose() : setStep((s) => s + 1))}
            className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            {isLast ? "Get started" : "Next"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface FriendProfile {
  uid: string;
  displayName: string | null;
  username: string;
  photoURL: string | null;
  streak: number;
  habits?: string[];
  habitLog?: Record<string, Record<string, boolean>>;
  phone?: string;
}

function FriendAvatar({ name, photoURL }: { name: string; photoURL?: string | null }) {
  if (photoURL) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photoURL} alt={name} width={36} height={36} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
    );
  }
  const initials = (name || "?").split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
      {initials}
    </div>
  );
}

function FriendsProgress({ following, senderPhone, senderName }: { following: string[]; senderPhone?: string; senderName: string }) {
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [reminding, setReminding] = useState<Record<string, boolean>>({});
  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!following.length) { setLoading(false); return; }
    const load = async () => {
      const results = await Promise.all(
        following.slice(0, 10).map(async (uid) => {
          const snap = await getDoc(doc(db, "users", uid));
          if (!snap.exists()) return null;
          const d = snap.data();
          // Exclude community accounts — they're not personal friends and have no habits
          if (d.accountType === "community") return null;
          return {
            uid,
            displayName: (d.displayName as string | null) ?? null,
            username: (d.username as string) ?? uid,
            photoURL: (d.photoURL as string | null) ?? null,
            streak: (d.streak as number) ?? 0,
            habits: d.habits as string[] | undefined,
            habitLog: d.habitLog as Record<string, Record<string, boolean>> | undefined,
            phone: d.phone as string | undefined,
          } satisfies FriendProfile;
        })
      );
      setFriends((results.filter(Boolean) as FriendProfile[]).slice(0, 5));
      setLoading(false);
    };
    load();
  }, [following]);

  async function sendReminder(friend: FriendProfile) {
    if (!senderPhone) {
      toast("Add your phone number in Settings to send SMS reminders.");
      return;
    }
    if (!friend.phone) {
      toast(`${friend.displayName ?? friend.username} hasn't added their phone number yet.`);
      return;
    }
    setReminding((prev) => ({ ...prev, [friend.uid]: true }));
    try {
      const res = await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: friend.phone, senderName, friendName: friend.displayName ?? friend.username }),
      });
      if (res.ok) {
        toast.success(`Reminder sent to ${friend.displayName ?? friend.username}!`);
      } else {
        const err = await res.json();
        toast.error(err.error ?? "Failed to send reminder.");
      }
    } catch {
      toast.error("Failed to send reminder. Please try again.");
    } finally {
      setReminding((prev) => ({ ...prev, [friend.uid]: false }));
    }
  }

  if (loading) return (
    <div className="flex justify-center py-8">
      <div className="w-6 h-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
    </div>
  );

  if (!following.length) return (
    <div className="flex flex-col items-center py-8 gap-3 text-center">
      <Users size={28} className="text-slate-300" />
      <p className="text-sm text-slate-400">You haven&apos;t added any friends yet.</p>
      <p className="text-xs text-slate-400">Search for friends in the sidebar to see their progress here.</p>
    </div>
  );

  if (!friends.length) return (
    <div className="flex flex-col items-center py-8 gap-3 text-center">
      <Users size={28} className="text-slate-300" />
      <p className="text-sm text-slate-400">No friend data found.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {friends.map((friend) => {
        const habits = friend.habits ?? [];
        const todayLog = friend.habitLog?.[todayStr] ?? {};
        const done = habits.filter((h) => todayLog[h] === true).length;
        const total = habits.length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        const lacking = pct < 50 && total > 0;

        return (
          <div key={friend.uid} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <Link href={`/profile/${friend.username}`}>
              <FriendAvatar name={friend.displayName ?? friend.username} photoURL={friend.photoURL} />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Link href={`/profile/${friend.username}`} className="text-sm font-semibold text-slate-800 truncate hover:text-blue-600 transition-colors">
                  {friend.displayName ?? friend.username}
                </Link>
                <span className="flex items-center gap-0.5 text-[11px] text-amber-500 flex-shrink-0">
                  <Flame size={11} /> {friend.streak}
                </span>
              </div>
              {total > 0 ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct >= 80 ? "bg-emerald-500" : pct >= 40 ? "bg-blue-500" : "bg-red-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 flex-shrink-0 tabular-nums">{done}/{total}</span>
                  </div>
                  {lacking && (
                    <p className="text-[11px] text-slate-400 mt-0.5">Needs some motivation today</p>
                  )}
                </>
              ) : (
                <p className="text-[11px] text-slate-400">No habits set up</p>
              )}
            </div>
            <button
              onClick={() => sendReminder(friend)}
              disabled={!!reminding[friend.uid]}
              title={!friend.phone ? "Friend has no phone number" : !senderPhone ? "Add your number to send reminders" : "Send a reminder"}
              className="flex-shrink-0 flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-xl border transition-all disabled:opacity-50 border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white"
            >
              {!friend.phone || !senderPhone ? <PhoneOff size={11} /> : <Send size={11} />}
              {reminding[friend.uid] ? "Sending…" : "Remind"}
            </button>
          </div>
        );
      })}
      {!senderPhone && (
        <p className="text-[11px] text-slate-400 text-center pt-1">
          <Link href="/settings" className="underline hover:text-blue-600">Add your phone number</Link> to send SMS reminders to friends.
        </p>
      )}
    </div>
  );
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export default function DashboardPage() {
  const { profile, user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hifzDoneLocal, setHifzDoneLocal] = useState(false);

  const name = profile?.displayName?.split(" ")[0] ?? "there";
  const habits = profile?.habits as string[] | undefined;
  const hasHabits = habits && habits.length > 0;
  const streak = profile?.streak ?? 0;
  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;
  const levelName = LEVEL_NAMES[Math.min(level - 1, 4)];
  const xpProgress = xp % 100;

  const hifzPlan = profile?.hifzPlan as HifzPlan | undefined;
  const todayStr = new Date().toISOString().split("T")[0];
  const todayDayIndex = (new Date().getDay() + 6) % 7; // 0=Mon
  const isTodayHifzScheduled = hifzPlan
    ? (hifzPlan.days ? hifzPlan.days.includes(todayDayIndex) : true)
    : false;
  const isDoneHifzToday = hifzDoneLocal || !!(hifzPlan?.log?.[todayStr]);
  const showHifzReminder = !!hifzPlan && isTodayHifzScheduled;

  // Onboarding — show only once, tracked in Firestore so it persists across devices
  useEffect(() => {
    if (!profile || !user?.uid) return;
    if (profile.onboarded) return;
    // Existing user who predates this field: they already have xp/habits/streak data.
    // Silently mark them as onboarded without showing the tutorial.
    const hasExistingData = (profile.xp ?? 0) > 0 || (profile.habits?.length ?? 0) > 0 || (profile.streak ?? 0) > 0;
    if (hasExistingData) {
      updateDoc(doc(db, "users", user.uid), { onboarded: true });
      return;
    }
    const timer = setTimeout(() => setShowOnboarding(true), 600);
    return () => clearTimeout(timer);
  }, [profile, user]);

  // Schedule browser notification at the user's chosen time
  useEffect(() => {
    const plan = profile?.hifzPlan as HifzPlan | undefined;
    if (!plan?.time || !plan.days) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const todayIdx = (new Date().getDay() + 6) % 7;
    if (!plan.days.includes(todayIdx)) return;

    const today = new Date().toISOString().split("T")[0];
    if (plan.log?.[today]) return;

    const [h, m] = plan.time.split(":").map(Number);
    const notifAt = new Date();
    notifAt.setHours(h, m, 0, 0);
    const delay = notifAt.getTime() - Date.now();
    if (delay <= 0) return;

    const timer = setTimeout(() => {
      new Notification("Quran memorisation reminder", {
        body: `Your daily target is ${plan.amount} ${plan.unit}. Open Jannatie to mark it done.`,
      });
    }, delay);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.hifzPlan?.time]);

  const todayHabitLog = profile?.habitLog?.[todayStr] ?? {};

  async function markHifzDone() {
    setHifzDoneLocal(true);
    if (!user?.uid) return;
    await updateDoc(doc(db, "users", user.uid), {
      [`hifzPlan.log.${todayStr}`]: true,
    });
  }

  async function toggleHabit(name: string) {
    if (!user?.uid) return;
    const current = todayHabitLog[name] === true;
    await updateDoc(doc(db, "users", user.uid), {
      [`habitLog.${todayStr}.${name}`]: !current,
    });
  }

  async function closeOnboarding() {
    setShowOnboarding(false);
    if (user?.uid) {
      await updateDoc(doc(db, "users", user.uid), { onboarded: true });
    }
  }

  return (
    <div className="min-h-screen">
      <AnimatePresence>
        {showOnboarding && <OnboardingModal onClose={closeOnboarding} />}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto px-5 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
          <h1 className="text-2xl font-bold text-slate-900">{getGreeting(name)}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {hasHabits ? "Keep up your daily practice." : "Welcome. Start by setting up your daily habits."}
          </p>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          <div className="rounded-2xl px-4 py-4 flex items-center gap-3" style={glassCard}>
            <Flame size={20} className="text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-xl font-bold text-slate-900 leading-none">{streak}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">day streak</p>
            </div>
          </div>

          <div className="rounded-2xl px-4 py-4 flex items-center gap-3" style={glassCard}>
            <Zap size={20} className="text-blue-500 flex-shrink-0" />
            <div>
              <p className="text-xl font-bold text-slate-900 leading-none">{xp}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">total XP</p>
            </div>
          </div>

          <div className="rounded-2xl px-4 py-4" style={glassCard}>
            <p className="text-sm font-bold text-slate-800 leading-tight">{levelName}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Level {level}</p>
            <div className="mt-2.5 h-1 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${xpProgress}%` }} />
            </div>
          </div>
        </motion.div>

        {/* Hifz Reminder Banner */}
        <AnimatePresence>
          {showHifzReminder && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl p-5 mb-5 flex items-center justify-between gap-4"
              style={glassCard}
            >
              <div className="flex items-center gap-3">
                {isDoneHifzToday ? (
                  <Check size={18} className="text-blue-500 flex-shrink-0" />
                ) : (
                  <BookMarked size={18} className="text-slate-400 flex-shrink-0" />
                )}
                <div>
                  {isDoneHifzToday ? (
                    <>
                      <p className="text-sm font-bold text-slate-800">
                        Hifz done today! Masha&apos;Allah
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {hifzPlan?.amount} {hifzPlan?.unit} memorised
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-slate-800">
                        {hifzPlan?.amount} {hifzPlan?.unit} to memorise today
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        {hifzPlan?.time && (
                          <>
                            <Bell size={10} /> Reminder at {formatTime(hifzPlan.time)}
                          </>
                        )}
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {!isDoneHifzToday && (
                  <button
                    onClick={markHifzDone}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-2 rounded-xl transition-colors"
                  >
                    Mark done
                  </button>
                )}
                <Link href="/habits" className="text-xs text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-0.5">
                  Track <ChevronRight size={12} />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Habits */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            <div className="rounded-2xl p-6" style={glassCard}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <CheckSquare size={17} className="text-blue-600" />
                  <h2 className="font-semibold text-slate-800">Today&apos;s habits</h2>
                </div>
                <Link href="/habits" className="flex items-center gap-0.5 text-xs text-slate-400 hover:text-blue-600 transition-colors">
                  View all <ChevronRight size={12} />
                </Link>
              </div>

              {hasHabits ? (
                <div className="space-y-2">
                  {(habits as string[]).map((h) => {
                    const done = todayHabitLog[h] === true;
                    return (
                    <button
                      key={h}
                      onClick={() => toggleHabit(h)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors border text-left ${
                        done ? "bg-blue-50 border-blue-100" : "bg-slate-50 hover:bg-slate-100 border-slate-100"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center ${
                        done ? "bg-blue-600 border-blue-600" : "border-slate-300"
                      }`}>
                        {done && (
                          <svg width="10" height="8" viewBox="0 0 11 9" fill="none">
                            <path d="M1 4.5l3 3 6-7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm ${done ? "line-through text-slate-400" : "text-slate-700"}`}>{h}</span>
                    </button>
                    );
                  })}
                  <Link
                    href="/habits"
                    className="flex items-center justify-center gap-1.5 mt-2 py-2.5 rounded-xl border border-dashed border-slate-300 text-xs text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    <Plus size={12} /> Add or manage habits
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CheckSquare size={36} className="text-slate-300 mb-4" />
                  <p className="text-sm font-semibold text-slate-700 mb-1">No habits set up yet</p>
                  <p className="text-xs text-slate-400 mb-5 leading-relaxed max-w-[200px]">
                    Add your first habit to start tracking your progress and building your streak.
                  </p>
                  <Link
                    href="/habits"
                    className="inline-flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl transition-colors font-medium"
                  >
                    <Plus size={14} /> Set up habits
                  </Link>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Today's lesson */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div className="rounded-2xl p-5" style={glassCard}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen size={15} className="text-blue-600" />
                    <h2 className="font-semibold text-slate-800 text-sm">Today&apos;s lesson</h2>
                  </div>
                  <Link href="/learn" className="text-xs text-slate-400 hover:text-blue-600 transition-colors">
                    All lessons
                  </Link>
                </div>
                {(() => {
                  const hadith = user ? getDailyHadith(user.uid) : HADITHS[0];
                  return (
                    <div className="bg-blue-50 rounded-xl px-4 py-4 text-center mb-4 border border-blue-100">
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Hadith of the Day</p>
                      <p className="text-sm text-slate-700 leading-relaxed mb-2 font-medium" dir="rtl" style={{ fontFamily: "serif" }}>
                        {hadith.arabic}
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed mb-2">
                        &ldquo;{hadith.text}&rdquo;
                      </p>
                      <p className="text-[10px] text-slate-400">{hadith.source}</p>
                    </div>
                  );
                })()}
                <Link
                  href="/learn"
                  className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors"
                >
                  Start lesson <ArrowRight size={13} />
                </Link>
              </div>
            </motion.div>

            {/* AI Buddy */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="rounded-2xl p-5" style={glassCard}>
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle size={15} className="text-blue-600" />
                  <h2 className="font-semibold text-slate-800 text-sm">AI Buddy</h2>
                </div>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                  Ask anything about Islam. Every answer cites the hadith.
                </p>
                <div className="space-y-1.5 mb-3">
                  {AI_PROMPTS.map((q) => (
                    <Link
                      key={q}
                      href={`/ai?q=${encodeURIComponent(q)}`}
                      className="block text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-slate-600 transition-colors leading-snug"
                    >
                      {q}
                    </Link>
                  ))}
                </div>
                <Link
                  href="/ai"
                  className="flex items-center justify-center gap-1.5 border border-blue-200 text-blue-600 font-semibold py-2.5 rounded-xl text-xs hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors"
                >
                  Open AI Buddy <ArrowRight size={13} />
                </Link>
              </div>
            </motion.div>

            {/* Calendar nudge */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Link
                href="/calendar"
                className="flex items-center gap-3 rounded-2xl p-4 hover:bg-white/80 transition-all group"
                style={glassCard}
              >
                <Calendar size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">Calendar</p>
                  <p className="text-xs text-slate-400">View events and prayer times</p>
                </div>
                <ChevronRight size={15} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Friends progress */}
        {(profile?.following?.length ?? 0) > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-5">
            <div className="rounded-2xl p-6" style={glassCard}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-blue-600" />
                  <h2 className="font-semibold text-slate-800">Friends&apos; Progress</h2>
                </div>
                <Link href="/leaderboard" className="flex items-center gap-0.5 text-xs text-slate-400 hover:text-blue-600 transition-colors">
                  Leaderboard <ChevronRight size={12} />
                </Link>
              </div>
              <FriendsProgress
                following={profile?.following ?? []}
                senderPhone={profile?.phone}
                senderName={profile?.displayName ?? "A friend"}
              />
            </div>
          </motion.div>
        )}

        {/* Add friends nudge when no following */}
        {(profile?.following?.length ?? 0) === 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-5">
            <div className="rounded-2xl p-5 flex items-center gap-4" style={glassCard}>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <UserPlus size={18} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">Follow friends to see their progress</p>
                <p className="text-xs text-slate-400 mt-0.5">Search for friends in the sidebar and follow them.</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
