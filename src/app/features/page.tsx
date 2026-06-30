import { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  MessageCircle, BookOpen, CheckSquare, Calendar, TrendingUp, BadgeCheck,
  Shield, Zap, Building2, Trophy, UserPlus, Search, Heart, Share2,
  Check, Flame, Clock, ArrowRight, Droplets, Sparkles, CakeSlice,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Features — Everything for Your Deen",
  description:
    "Explore all 9 Jannatie features: AI Buddy, Habit Tracker, Learning Game, Islamic Calendar, Progress & XP, Mosque Finder, Leaderboard, Friends & Social, and Community Accounts.",
};

const features = [
  {
    id: "ai-buddy",
    icon: MessageCircle,
    name: "AI Buddy",
    tagline: "Scholar-reviewed answers, available 24/7",
    description:
      "Ask any Islamic question and get answers grounded in Sahih Bukhari and Sahih Muslim. Every response includes the hadith collection name and number so you can verify it yourself.",
    bullets: [
      "Covers Fiqh, Aqeedah, Duas, and daily life questions",
      "Cites exact hadith: e.g. Bukhari 1:1, Muslim 705",
      "Scholar-verified badge on reviewed responses",
      "Clear disclaimer: guidance only, never a fatwa",
      "Free tier: 5 messages/day · Premium: unlimited",
    ],
  },
  {
    id: "habits",
    icon: CheckSquare,
    name: "Habit Tracker",
    tagline: "Build consistency without guilt",
    description:
      "Track your daily Islamic practices with a system designed around positive reinforcement. No red streaks, no guilt trips, just steady, sustainable growth in your deen.",
    bullets: [
      "Categories: Salah, Quran, Dhikr, Fasting, Charity, Study, Good Deeds",
      "Streak counter with Streak Shield (one guilt-free skip/week)",
      "Weekly mini progress bars per habit",
      "Daily summary: '4 of 6 habits completed today'",
      "Completion message: 'Masha'Allah! All done for today'",
    ],
  },
  {
    id: "learn",
    icon: BookOpen,
    name: "Learning Game",
    tagline: "Earn XP as your knowledge grows",
    description:
      "Gamified Islamic education covering Quran, Duas, Seerah, Fiqh, Arabic, Prophets, History and Manners. All content is sourced from authenticated texts with references.",
    bullets: [
      "8 topic areas with graded difficulty levels",
      "Each lesson earns XP — correct answers reward +10 XP",
      "Wrong answers show the correct one, no punishment",
      "All Quranic ayat cited with surah and verse number",
      "All hadith cited with collection and hadith number",
    ],
  },
  {
    id: "calendar",
    icon: Calendar,
    name: "Islamic Calendar",
    tagline: "Never miss an important date",
    description:
      "A community-powered Islamic calendar showing Hijri dates alongside Gregorian, mosque events, study circles, and personal Islamic milestones.",
    bullets: [
      "Hijri + Gregorian dual-date display",
      "Mosque events, study circles, community events",
      "Color-coded by type: mosque (blue), study (orange)",
      "RSVP to events and add to your personal calendar",
      "Private cycle tracker layer for female users",
    ],
  },
  {
    id: "progress",
    icon: TrendingUp,
    name: "Progress & XP",
    tagline: "Level up your deen",
    description:
      "Watch your Islamic growth unfold through XP, levels, badges and streaks. A community leaderboard celebrates collective mosque progress, not individual competition.",
    bullets: [
      "5 levels: Mubtadi → Mujahid → Talib → Hafidh → Wali",
      "XP earned from habits, learning, and community",
      "30+ badges to earn — from first prayer to 100-day streak",
      "Weekly summary vs last week with trend arrows",
      "Mosque collective leaderboard — grow together",
    ],
  },
  {
    id: "mosque",
    icon: Building2,
    name: "Mosque Finder",
    tagline: "Find prayer times wherever you are",
    description:
      "Locate every mosque near you using live GPS, see accurate prayer timings, and always know how long until the next prayer, wherever you happen to be.",
    bullets: [
      "GPS-based search for every mosque near you, sorted by distance",
      "Live Fajr, Dhuhr, Asr, Maghrib and Isha timings",
      "Live countdown to the next prayer",
      "Save your regular mosques for quick access",
      "Powered by OpenStreetMap and verified prayer time data",
    ],
  },
  {
    id: "leaderboard",
    icon: Trophy,
    name: "Leaderboard",
    tagline: "Grow together, not alone",
    description:
      "See how your XP and streaks compare with friends and the wider Jannatie community, celebrating consistency, not competition.",
    bullets: [
      "Global leaderboard ranked by XP",
      "Friends-only view to track people you follow",
      "Gold, silver and bronze badges for the top 3",
      "Updates as XP is earned across the app",
      "Mosque-level leaderboard so you grow as a community",
    ],
  },
  {
    id: "friends",
    icon: UserPlus,
    name: "Friends & Social",
    tagline: "Faith grows faster together",
    description:
      "Find and follow friends by username, see their progress, and gently keep each other accountable, without pressure or judgement.",
    bullets: [
      "Search and follow any user by username",
      "See friends' streaks and milestones",
      "Friends-only leaderboard view",
      "Send reminder notifications to nudge each other",
      "Your activity stays private unless you choose to follow",
    ],
  },
  {
    id: "community",
    icon: Building2,
    name: "Community Accounts",
    tagline: "Built for mosques, businesses and creators",
    description:
      "Community accounts let mosques, halal businesses, organizations and Muslim creators post real events, reach local followers, and connect with other communities, all from a dedicated dashboard, completely separate from personal accounts.",
    bullets: [
      "Dedicated dashboard for mosques, businesses & organizations",
      "Post structured events with photo, date, time and venue",
      "Followers get notified the moment you post a new event",
      "Verified badge on every community profile",
      "Send and accept collaboration requests with other communities",
    ],
    highlight: true,
  },
];

function Mockup({ id }: { id: string }) {
  switch (id) {
    case "ai-buddy":
      return (
        <div className="space-y-4">
          <div className="flex justify-end">
            <div className="bg-primary-500 text-white text-sm rounded-2xl rounded-br-sm px-4 py-3 max-w-[85%]">
              What is the reward for praying Fajr in congregation?
            </div>
          </div>
          <div className="flex justify-start">
            <div className="bg-gray-100 text-foreground text-sm rounded-2xl rounded-bl-sm px-4 py-3 max-w-[90%] leading-relaxed">
              The Prophet ﷺ said: &ldquo;Whoever prays Fajr is under the protection of Allah.&rdquo; (Muslim 657)
              <div className="flex items-center gap-1 mt-2 text-primary-500 text-xs">
                <BadgeCheck size={12} />
                Scholar-verified · Hadith cited
              </div>
            </div>
          </div>
          <p className="text-xs text-muted text-center">For guidance only — not a fatwa.</p>
        </div>
      );

    case "habits": {
      const items = [
        { label: "Fajr on time", done: true },
        { label: "Read Quran — 1 page", done: true },
        { label: "Morning Adhkar", done: true },
        { label: "Give charity", done: false },
      ];
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-foreground text-sm">Today&apos;s habits</p>
            <span className="flex items-center gap-1 text-xs font-bold text-orange-500">
              <Flame size={13} /> 12-day streak
            </span>
          </div>
          <div className="space-y-2">
            {items.map((it) => (
              <div key={it.label} className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2.5">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${it.done ? "bg-primary-500" : "border-2 border-gray-300"}`}>
                  {it.done && <Check size={12} className="text-white" />}
                </div>
                <span className={`text-sm ${it.done ? "text-foreground" : "text-muted"}`}>{it.label}</span>
              </div>
            ))}
          </div>
          <div className="pt-1">
            <div className="flex justify-between text-xs text-muted mb-1.5">
              <span>3 of 4 habits completed today</span>
              <span>75%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full" style={{ width: "75%" }} />
            </div>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <p className="text-sm font-semibold text-primary-600">Masha&apos;Allah! Almost there</p>
            <Sparkles size={15} className="text-amber-400 fill-amber-400" />
          </div>
        </div>
      );
    }

    case "learn":
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-foreground text-sm">Seerah · Lesson 4</p>
            <span className="text-xs font-bold text-violet-500">+10 XP</span>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-foreground mb-3">In which year did the Hijrah to Madinah take place?</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700 font-medium">
                <Check size={14} /> 622 CE
              </div>
              <div className="px-3 py-2 rounded-lg border border-border text-sm text-muted">610 CE</div>
              <div className="px-3 py-2 rounded-lg border border-border text-sm text-muted">632 CE</div>
            </div>
          </div>
          <p className="text-xs text-muted text-center">Correct! Reference: Seerah Ibn Hisham</p>
        </div>
      );

    case "calendar":
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-foreground text-sm">15 Ramadan 1447</p>
            <p className="text-xs text-muted">12 March</p>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <p key={i} className="text-[10px] text-muted font-medium">{d}</p>
            ))}
            {[10, 11, 12, 13, 14, 15, 16].map((d) => (
              <div
                key={d}
                className={`text-xs py-1.5 rounded-lg font-medium ${
                  d === 15 ? "bg-primary-500 text-white" : "text-foreground bg-gray-50"
                }`}
              >
                {d}
              </div>
            ))}
          </div>
          <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
            <Calendar size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Taraweeh at Central Mosque</p>
              <p className="text-xs text-muted">Tonight · 8:30 PM</p>
            </div>
          </div>

          {/* Period tracker — private layer for female users */}
          <div className="rounded-xl p-4 border border-pink-200 bg-pink-50/60">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Droplets size={13} className="text-pink-400" />
                <p className="text-xs font-semibold text-foreground">Period Tracker</p>
              </div>
              <span className="text-[10px] text-pink-500 font-medium bg-pink-100 px-2 py-0.5 rounded-full">Female only</span>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-3">
              {[8, 9, 10, 11, 12, 13, 14].map((d, idx) => (
                <div
                  key={d}
                  className={`h-6 rounded-md text-[10px] font-semibold flex items-center justify-center ${
                    idx < 3
                      ? "bg-pink-500 text-white"
                      : idx === 5
                      ? "border border-dashed border-pink-300 text-pink-500"
                      : "text-muted"
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted bg-white/70 rounded-lg px-3 py-2 mb-2">
              <span>Avg cycle: <strong className="text-foreground">28d</strong></span>
              <span>Avg period: <strong className="text-foreground">5d</strong></span>
            </div>
            <p className="text-[11px] text-pink-600 text-center font-semibold">Next period expected 9 Apr (28d away)</p>
            <p className="text-[10px] text-muted text-center mt-2">Also tracks missed fasting days to make up (Qadha).</p>
          </div>
        </div>
      );

    case "progress":
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted">Level 7</p>
              <p className="font-bold text-foreground text-lg">Talib</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center">
              <TrendingUp size={20} className="text-primary-500" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-muted mb-1.5">
              <span>2,340 XP</span>
              <span>3,000 XP</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full" style={{ width: "78%" }} />
            </div>
          </div>
          <div className="pt-2 border-t border-border space-y-2">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">Mosque leaderboard</p>
            {[{ rank: 1, name: "Ahmed", xp: 4820 }, { rank: 2, name: "You", xp: 2340 }].map((r) => (
              <div key={r.rank} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{r.rank}. {r.name}</span>
                <span className="text-muted text-xs">{r.xp.toLocaleString()} XP</span>
              </div>
            ))}
          </div>
        </div>
      );

    case "mosque":
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-foreground text-sm">Nearby mosques</p>
            <span className="text-xs text-muted">0.4 mi away</span>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-foreground mb-3">East London Mosque</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[{ name: "Dhuhr", time: "1:12 PM" }, { name: "Asr", time: "4:47 PM", next: true }, { name: "Maghrib", time: "7:58 PM" }].map((p) => (
                <div key={p.name} className={`rounded-lg py-2 ${p.next ? "bg-primary-500 text-white" : "bg-white text-foreground"}`}>
                  <p className="text-[10px] opacity-80">{p.name}</p>
                  <p className="text-xs font-bold mt-0.5">{p.time}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
            <Clock size={12} /> Next prayer: Asr in 47 minutes
          </p>
        </div>
      );

    case "leaderboard": {
      const rows = [
        { rank: 1, name: "Ahmed", xp: 4820 },
        { rank: 2, name: "Fatima", xp: 4510 },
        { rank: 3, name: "You", xp: 4280, me: true },
        { rank: 4, name: "Yusuf", xp: 3990 },
      ];
      const badge: Record<number, string> = { 1: "bg-yellow-400 text-yellow-900", 2: "bg-slate-300 text-slate-700", 3: "bg-orange-300 text-orange-900" };
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-foreground text-sm">Global leaderboard</p>
            <Trophy size={16} className="text-yellow-500" />
          </div>
          {rows.map((r) => (
            <div key={r.rank} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${r.me ? "bg-primary-50" : "bg-gray-50"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${badge[r.rank] ?? "text-muted"}`}>
                {r.rank}
              </div>
              <span className={`text-sm flex-1 ${r.me ? "font-semibold text-primary-600" : "text-foreground"}`}>{r.name}</span>
              <span className="text-xs text-muted">{r.xp.toLocaleString()} XP</span>
            </div>
          ))}
        </div>
      );
    }

    case "friends":
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2.5">
            <Search size={14} className="text-muted flex-shrink-0" />
            <span className="text-sm text-muted">Search by username...</span>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
            <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">AI</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">Aisha Ibrahim</p>
              <p className="text-xs text-muted">@aisha.i</p>
            </div>
            <span className="bg-primary-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0">+ Follow</span>
          </div>
          <div className="pt-2 border-t border-border flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
              <Flame size={12} className="text-orange-500" />
            </span>
            <p className="text-sm text-foreground"><span className="font-semibold">Aisha</span> just hit a 30-day Quran streak</p>
          </div>
        </div>
      );

    case "community":
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary-500 flex items-center justify-center text-white font-bold flex-shrink-0">CM</div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-sm font-bold text-foreground truncate">Central Mosque Youth</p>
                <BadgeCheck size={14} className="text-blue-500 flex-shrink-0" />
              </div>
              <p className="text-xs text-muted">@centralmosqueyouth · 842 followers</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-1">
              <CakeSlice size={14} className="text-primary-500" /> Charity Bake Sale
            </p>
            <p className="text-xs text-muted mb-3">Sat 14 March · 12–4 PM · Community Hall, Birmingham</p>
            <div className="flex items-center gap-4 text-xs text-muted">
              <span className="flex items-center gap-1"><Heart size={13} /> 96</span>
              <span className="flex items-center gap-1"><MessageCircle size={13} /> 14</span>
              <span className="flex items-center gap-1"><Share2 size={13} /> 8</span>
            </div>
          </div>
          <p className="text-xs text-muted text-center">Followers get notified the moment a new event goes live.</p>
        </div>
      );

    default:
      return null;
  }
}

export default function FeaturesPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 bg-[#fafafa]">
        {/* Hero */}
        <div className="max-w-4xl mx-auto px-4 text-center py-16">
          <h1 className="text-5xl font-bold text-foreground mb-5">
            Everything for your deen.<br />
            <span className="text-primary-500">All in one place.</span>
          </h1>
          <p className="text-xl text-muted leading-relaxed">
            Built with Islamic values, backed by authentic sources, and designed
            to help you grow, gently and consistently.
          </p>
        </div>

        {/* Features */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          {features.map(({ id, icon: Icon, name, tagline, description, bullets, highlight }, i) => (
            <section
              id={id}
              key={id}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center rounded-3xl ${
                highlight ? "bg-primary-50/60 p-6 lg:p-10 -mx-6 lg:-mx-10" : ""
              } ${i % 2 === 1 ? "lg:flex-row-reverse" : ""}`}
            >
              <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mb-5">
                  <Icon size={26} className="text-accent" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-2">{name}</h2>
                <p className="text-primary-500 font-semibold mb-4">{tagline}</p>
                <p className="text-muted leading-relaxed mb-6">{description}</p>
                <ul className="space-y-3">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-foreground">
                      <BadgeCheck size={16} className="text-primary-500 flex-shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>
                {id === "community" && (
                  <Link
                    href="/signup-community"
                    className="inline-flex items-center gap-2 mt-7 bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-colors"
                  >
                    Create a community account
                    <ArrowRight size={15} />
                  </Link>
                )}
              </div>

              <div className={`${i % 2 === 1 ? "lg:order-1" : ""} bg-card border border-border rounded-2xl p-8`}>
                <Mockup id={id} />
              </div>
            </section>
          ))}
        </div>

        {/* Trust section */}
        <div className="max-w-4xl mx-auto px-4 mt-24 py-16 bg-primary-50 rounded-3xl text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Our Islamic content commitment</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
            {[
              { icon: Shield, title: "Scholar-reviewed", desc: "All content reviewed before publishing" },
              { icon: BadgeCheck, title: "Cited sources", desc: "Every hadith includes reference number" },
              { icon: Zap, title: "Sunni tradition", desc: "Grounded in Sahih Bukhari & Muslim" },
            ].map(({ icon: I, title, desc }) => (
              <div key={title} className="bg-card rounded-xl p-5 border border-border">
                <I size={22} className="text-primary-500 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground text-sm mb-1">{title}</h3>
                <p className="text-xs text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
