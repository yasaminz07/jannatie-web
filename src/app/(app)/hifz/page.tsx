"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookMarked, ChevronLeft, ChevronRight, Check, CheckCircle2,
  Clock, Settings2, X, Bell,
  Pencil, StickyNote, Search,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ────────────────────────────────────────────────────────────────
// Surah data — 114 surahs (number, Arabic name, English name, verses)
// ────────────────────────────────────────────────────────────────
const SURAHS = [
  { n: 1,   ar: "الفاتحة",    en: "Al-Fatihah",      meaning: "The Opening",                    v: 7   },
  { n: 2,   ar: "البقرة",     en: "Al-Baqarah",      meaning: "The Cow",                        v: 286 },
  { n: 3,   ar: "آل عمران",   en: "Ali 'Imran",      meaning: "Family of Imran",                v: 200 },
  { n: 4,   ar: "النساء",     en: "An-Nisa",         meaning: "The Women",                      v: 176 },
  { n: 5,   ar: "المائدة",    en: "Al-Ma'idah",      meaning: "The Table Spread",               v: 120 },
  { n: 6,   ar: "الأنعام",    en: "Al-An'am",        meaning: "The Cattle",                     v: 165 },
  { n: 7,   ar: "الأعراف",    en: "Al-A'raf",        meaning: "The Heights",                    v: 206 },
  { n: 8,   ar: "الأنفال",    en: "Al-Anfal",        meaning: "The Spoils of War",              v: 75  },
  { n: 9,   ar: "التوبة",     en: "At-Tawbah",       meaning: "The Repentance",                 v: 129 },
  { n: 10,  ar: "يونس",       en: "Yunus",           meaning: "Jonah",                          v: 109 },
  { n: 11,  ar: "هود",        en: "Hud",             meaning: "Hud",                            v: 123 },
  { n: 12,  ar: "يوسف",       en: "Yusuf",           meaning: "Joseph",                         v: 111 },
  { n: 13,  ar: "الرعد",      en: "Ar-Ra'd",         meaning: "The Thunder",                    v: 43  },
  { n: 14,  ar: "إبراهيم",    en: "Ibrahim",         meaning: "Abraham",                        v: 52  },
  { n: 15,  ar: "الحجر",      en: "Al-Hijr",         meaning: "The Rocky Tract",                v: 99  },
  { n: 16,  ar: "النحل",      en: "An-Nahl",         meaning: "The Bee",                        v: 128 },
  { n: 17,  ar: "الإسراء",    en: "Al-Isra",         meaning: "The Night Journey",              v: 111 },
  { n: 18,  ar: "الكهف",      en: "Al-Kahf",         meaning: "The Cave",                       v: 110 },
  { n: 19,  ar: "مريم",       en: "Maryam",          meaning: "Mary",                           v: 98  },
  { n: 20,  ar: "طه",         en: "Taha",            meaning: "Ta-Ha",                          v: 135 },
  { n: 21,  ar: "الأنبياء",   en: "Al-Anbiya",       meaning: "The Prophets",                   v: 112 },
  { n: 22,  ar: "الحج",       en: "Al-Hajj",         meaning: "The Pilgrimage",                 v: 78  },
  { n: 23,  ar: "المؤمنون",   en: "Al-Mu'minun",     meaning: "The Believers",                  v: 118 },
  { n: 24,  ar: "النور",      en: "An-Nur",          meaning: "The Light",                      v: 64  },
  { n: 25,  ar: "الفرقان",    en: "Al-Furqan",       meaning: "The Criterion",                  v: 77  },
  { n: 26,  ar: "الشعراء",    en: "Ash-Shu'ara",     meaning: "The Poets",                      v: 227 },
  { n: 27,  ar: "النمل",      en: "An-Naml",         meaning: "The Ant",                        v: 93  },
  { n: 28,  ar: "القصص",      en: "Al-Qasas",        meaning: "The Stories",                    v: 88  },
  { n: 29,  ar: "العنكبوت",   en: "Al-'Ankabut",     meaning: "The Spider",                     v: 69  },
  { n: 30,  ar: "الروم",      en: "Ar-Rum",          meaning: "The Romans",                     v: 60  },
  { n: 31,  ar: "لقمان",      en: "Luqman",          meaning: "Luqman",                         v: 34  },
  { n: 32,  ar: "السجدة",     en: "As-Sajdah",       meaning: "The Prostration",                v: 30  },
  { n: 33,  ar: "الأحزاب",    en: "Al-Ahzab",        meaning: "The Combined Forces",            v: 73  },
  { n: 34,  ar: "سبأ",        en: "Saba",            meaning: "Sheba",                          v: 54  },
  { n: 35,  ar: "فاطر",       en: "Fatir",           meaning: "Originator",                     v: 45  },
  { n: 36,  ar: "يس",         en: "Ya-Sin",          meaning: "Ya Sin",                         v: 83  },
  { n: 37,  ar: "الصافات",    en: "As-Saffat",       meaning: "Those Ranged in Ranks",          v: 182 },
  { n: 38,  ar: "ص",          en: "Sad",             meaning: "Sad",                            v: 88  },
  { n: 39,  ar: "الزمر",      en: "Az-Zumar",        meaning: "The Groups",                     v: 75  },
  { n: 40,  ar: "غافر",       en: "Ghafir",          meaning: "The Forgiver",                   v: 85  },
  { n: 41,  ar: "فصلت",       en: "Fussilat",        meaning: "Explained in Detail",            v: 54  },
  { n: 42,  ar: "الشورى",     en: "Ash-Shura",       meaning: "The Consultation",               v: 53  },
  { n: 43,  ar: "الزخرف",     en: "Az-Zukhruf",      meaning: "The Ornaments of Gold",          v: 89  },
  { n: 44,  ar: "الدخان",     en: "Ad-Dukhan",       meaning: "The Smoke",                      v: 59  },
  { n: 45,  ar: "الجاثية",    en: "Al-Jathiyah",     meaning: "The Crouching",                  v: 37  },
  { n: 46,  ar: "الأحقاف",    en: "Al-Ahqaf",        meaning: "The Wind-Curved Sandhills",      v: 35  },
  { n: 47,  ar: "محمد",       en: "Muhammad",        meaning: "Muhammad",                       v: 38  },
  { n: 48,  ar: "الفتح",      en: "Al-Fath",         meaning: "The Victory",                    v: 29  },
  { n: 49,  ar: "الحجرات",    en: "Al-Hujurat",      meaning: "The Rooms",                      v: 18  },
  { n: 50,  ar: "ق",          en: "Qaf",             meaning: "Qaf",                            v: 45  },
  { n: 51,  ar: "الذاريات",   en: "Adh-Dhariyat",    meaning: "The Winnowing Winds",            v: 60  },
  { n: 52,  ar: "الطور",      en: "At-Tur",          meaning: "The Mount",                      v: 49  },
  { n: 53,  ar: "النجم",      en: "An-Najm",         meaning: "The Star",                       v: 62  },
  { n: 54,  ar: "القمر",      en: "Al-Qamar",        meaning: "The Moon",                       v: 55  },
  { n: 55,  ar: "الرحمن",     en: "Ar-Rahman",       meaning: "The Most Gracious",              v: 78  },
  { n: 56,  ar: "الواقعة",    en: "Al-Waqi'ah",      meaning: "The Inevitable",                 v: 96  },
  { n: 57,  ar: "الحديد",     en: "Al-Hadid",        meaning: "The Iron",                       v: 29  },
  { n: 58,  ar: "المجادلة",   en: "Al-Mujadila",     meaning: "The Pleading Woman",             v: 22  },
  { n: 59,  ar: "الحشر",      en: "Al-Hashr",        meaning: "The Exile",                      v: 24  },
  { n: 60,  ar: "الممتحنة",   en: "Al-Mumtahanah",   meaning: "She That is Examined",           v: 13  },
  { n: 61,  ar: "الصف",       en: "As-Saf",          meaning: "The Ranks",                      v: 14  },
  { n: 62,  ar: "الجمعة",     en: "Al-Jumu'ah",      meaning: "Friday",                         v: 11  },
  { n: 63,  ar: "المنافقون",  en: "Al-Munafiqun",    meaning: "The Hypocrites",                 v: 11  },
  { n: 64,  ar: "التغابن",    en: "At-Taghabun",     meaning: "Mutual Disillusion",             v: 18  },
  { n: 65,  ar: "الطلاق",     en: "At-Talaq",        meaning: "The Divorce",                    v: 12  },
  { n: 66,  ar: "التحريم",    en: "At-Tahrim",       meaning: "The Prohibition",                v: 12  },
  { n: 67,  ar: "الملك",      en: "Al-Mulk",         meaning: "The Sovereignty",                v: 30  },
  { n: 68,  ar: "القلم",      en: "Al-Qalam",        meaning: "The Pen",                        v: 52  },
  { n: 69,  ar: "الحاقة",     en: "Al-Haqqah",       meaning: "The Reality",                    v: 52  },
  { n: 70,  ar: "المعارج",    en: "Al-Ma'arij",      meaning: "The Ascending Stairways",        v: 44  },
  { n: 71,  ar: "نوح",        en: "Nuh",             meaning: "Noah",                           v: 28  },
  { n: 72,  ar: "الجن",       en: "Al-Jinn",         meaning: "The Jinn",                       v: 28  },
  { n: 73,  ar: "المزمل",     en: "Al-Muzzammil",    meaning: "The Enshrouded One",             v: 20  },
  { n: 74,  ar: "المدثر",     en: "Al-Muddaththir",  meaning: "The Cloaked One",                v: 56  },
  { n: 75,  ar: "القيامة",    en: "Al-Qiyamah",      meaning: "The Resurrection",               v: 40  },
  { n: 76,  ar: "الإنسان",    en: "Al-Insan",        meaning: "The Human",                      v: 31  },
  { n: 77,  ar: "المرسلات",   en: "Al-Mursalat",     meaning: "The Emissaries",                 v: 50  },
  { n: 78,  ar: "النبأ",      en: "An-Naba",         meaning: "The Tidings",                    v: 40  },
  { n: 79,  ar: "النازعات",   en: "An-Nazi'at",      meaning: "Those Who Drag Forth",           v: 46  },
  { n: 80,  ar: "عبس",        en: "'Abasa",          meaning: "He Frowned",                     v: 42  },
  { n: 81,  ar: "التكوير",    en: "At-Takwir",       meaning: "The Overthrowing",               v: 29  },
  { n: 82,  ar: "الإنفطار",   en: "Al-Infitar",      meaning: "The Cleaving",                   v: 19  },
  { n: 83,  ar: "المطففين",   en: "Al-Mutaffifin",   meaning: "The Defrauding",                 v: 36  },
  { n: 84,  ar: "الإنشقاق",   en: "Al-Inshiqaq",     meaning: "The Sundering",                  v: 25  },
  { n: 85,  ar: "البروج",     en: "Al-Buruj",        meaning: "The Mansions of the Stars",      v: 22  },
  { n: 86,  ar: "الطارق",     en: "At-Tariq",        meaning: "The Nightcomer",                 v: 17  },
  { n: 87,  ar: "الأعلى",     en: "Al-A'la",         meaning: "The Most High",                  v: 19  },
  { n: 88,  ar: "الغاشية",    en: "Al-Ghashiyah",    meaning: "The Overwhelming",               v: 26  },
  { n: 89,  ar: "الفجر",      en: "Al-Fajr",         meaning: "The Dawn",                       v: 30  },
  { n: 90,  ar: "البلد",      en: "Al-Balad",        meaning: "The City",                       v: 20  },
  { n: 91,  ar: "الشمس",      en: "Ash-Shams",       meaning: "The Sun",                        v: 15  },
  { n: 92,  ar: "الليل",      en: "Al-Layl",         meaning: "The Night",                      v: 21  },
  { n: 93,  ar: "الضحى",      en: "Ad-Duha",         meaning: "The Morning Hours",              v: 11  },
  { n: 94,  ar: "الشرح",      en: "Ash-Sharh",       meaning: "The Relief",                     v: 8   },
  { n: 95,  ar: "التين",      en: "At-Tin",          meaning: "The Fig",                        v: 8   },
  { n: 96,  ar: "العلق",      en: "Al-'Alaq",        meaning: "The Clot",                       v: 19  },
  { n: 97,  ar: "القدر",      en: "Al-Qadr",         meaning: "The Power",                      v: 5   },
  { n: 98,  ar: "البينة",     en: "Al-Bayyinah",     meaning: "The Clear Proof",                v: 8   },
  { n: 99,  ar: "الزلزلة",    en: "Az-Zalzalah",     meaning: "The Earthquake",                 v: 8   },
  { n: 100, ar: "العاديات",   en: "Al-'Adiyat",      meaning: "The Courser",                    v: 11  },
  { n: 101, ar: "القارعة",    en: "Al-Qari'ah",      meaning: "The Calamity",                   v: 11  },
  { n: 102, ar: "التكاثر",    en: "At-Takathur",     meaning: "The Rivalry in World Increase",  v: 8   },
  { n: 103, ar: "العصر",      en: "Al-'Asr",         meaning: "The Declining Day",              v: 3   },
  { n: 104, ar: "الهمزة",     en: "Al-Humazah",      meaning: "The Traducer",                   v: 9   },
  { n: 105, ar: "الفيل",      en: "Al-Fil",          meaning: "The Elephant",                   v: 5   },
  { n: 106, ar: "قريش",       en: "Quraysh",         meaning: "Quraysh",                        v: 4   },
  { n: 107, ar: "الماعون",    en: "Al-Ma'un",        meaning: "Small Kindnesses",               v: 7   },
  { n: 108, ar: "الكوثر",     en: "Al-Kawthar",      meaning: "Abundance",                      v: 3   },
  { n: 109, ar: "الكافرون",   en: "Al-Kafirun",      meaning: "The Disbelievers",               v: 6   },
  { n: 110, ar: "النصر",      en: "An-Nasr",         meaning: "The Divine Support",             v: 3   },
  { n: 111, ar: "المسد",      en: "Al-Masad",        meaning: "The Palm Fibre",                 v: 5   },
  { n: 112, ar: "الإخلاص",    en: "Al-Ikhlas",       meaning: "Sincerity",                      v: 4   },
  { n: 113, ar: "الفلق",      en: "Al-Falaq",        meaning: "The Daybreak",                   v: 5   },
  { n: 114, ar: "الناس",      en: "An-Nas",          meaning: "Mankind",                        v: 6   },
] as const;

const TOTAL_VERSES = SURAHS.reduce((s, x) => s + x.v, 0); // 6236

const HIFZ_PRESETS = [
  { id: "gentle",    subtitle: "5 ayat per day",    amount: 5,  unit: "ayat"  },
  { id: "steady",    subtitle: "10 ayat per day",   amount: 10, unit: "ayat"  },
  { id: "committed", subtitle: "1 page per day",    amount: 1,  unit: "pages" },
  { id: "intensive", subtitle: "2 pages per day",   amount: 2,  unit: "pages" },
  { id: "custom",    subtitle: "Custom pace",        amount: null, unit: null  },
] as const;

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

type SurahStatus = "memorised" | "in-progress";
type SurahStatusMap = Record<string, SurahStatus>;
type SurahFilter = "all" | "memorised" | "in-progress" | "not-started";
type Tab = "overview" | "surahs" | "calendar" | "plan";

interface HifzPlan {
  preset: string;
  amount?: number;
  unit?: string;
  days?: number[];
  time?: string;
  log?: Record<string, boolean>;
  surahStatus?: SurahStatusMap;
  notes?: Record<string, string>;
}

const todayStr = new Date().toISOString().slice(0, 10);
const todayDayIndex = (new Date().getDay() + 6) % 7;

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`;
}

function dateStr(y: number, m: number, d: number) {
  return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

const glassCard = {
  background: "rgba(255,255,255,0.65)",
  border: "1px solid rgba(255,255,255,0.80)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 4px 24px rgba(15,23,42,0.07)",
} as const;

// ────────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────────
export default function HifzPage() {
  const { profile, user } = useAuth();
  const hifzPlan = profile?.hifzPlan as HifzPlan | undefined;

  const [tab, setTab] = useState<Tab>("overview");
  const [surahFilter, setSurahFilter] = useState<SurahFilter>("all");
  const [surahSearch, setSurahSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // Calendar
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [noteModal, setNoteModal] = useState<{ date: string; text: string } | null>(null);
  const [noteText, setNoteText] = useState("");

  // Plan edit
  const [editingPlan, setEditingPlan] = useState(false);
  const [editPreset, setEditPreset] = useState(hifzPlan?.preset ?? "steady");
  const [editAmount, setEditAmount] = useState(String(hifzPlan?.amount ?? ""));
  const [editUnit, setEditUnit] = useState<"ayat" | "pages">((hifzPlan?.unit as "ayat" | "pages") ?? "ayat");
  const [editDays, setEditDays] = useState<number[]>(hifzPlan?.days ?? [0,1,2,3,4,5,6]);
  const [editTime, setEditTime] = useState(hifzPlan?.time ?? "07:30");

  // Derived — memoised so downstream useMemos get stable references
  const surahStatus = useMemo<SurahStatusMap>(
    () => (hifzPlan?.surahStatus ?? {}) as SurahStatusMap,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(hifzPlan?.surahStatus)]
  );
  const notes = useMemo<Record<string, string>>(
    () => (hifzPlan?.notes ?? {}) as Record<string, string>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(hifzPlan?.notes)]
  );
  const log = useMemo<Record<string, boolean>>(
    () => hifzPlan?.log ?? {},
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(hifzPlan?.log)]
  );

  const memorisedCount = useMemo(
    () => SURAHS.filter(s => surahStatus[String(s.n)] === "memorised").length,
    [surahStatus]
  );
  const inProgressCount = useMemo(
    () => SURAHS.filter(s => surahStatus[String(s.n)] === "in-progress").length,
    [surahStatus]
  );
  const memorisedVerses = useMemo(
    () => SURAHS.filter(s => surahStatus[String(s.n)] === "memorised").reduce((a, s) => a + s.v, 0),
    [surahStatus]
  );

  const isTodayScheduled = hifzPlan
    ? (hifzPlan.days ? hifzPlan.days.includes(todayDayIndex) : true)
    : false;
  const isDoneToday = !!log[todayStr];

  const planSubtitle = (() => {
    if (!hifzPlan) return "";
    if (hifzPlan.amount && hifzPlan.unit) return `${hifzPlan.amount} ${hifzPlan.unit}/day`;
    return HIFZ_PRESETS.find(p => p.id === hifzPlan.preset)?.subtitle ?? "";
  })();

  // ── Firestore helpers ──────────────────────────────────────────

  async function patchPlan(patch: Partial<HifzPlan>) {
    if (!user?.uid) return;
    const updated = { ...hifzPlan, ...patch };
    await updateDoc(doc(db, "users", user.uid), { hifzPlan: updated });
  }

  async function markDone() {
    if (!user?.uid || isDoneToday) return;
    setSaving(true);
    await updateDoc(doc(db, "users", user.uid), {
      [`hifzPlan.log.${todayStr}`]: true,
    });
    setSaving(false);
  }

  async function saveNote() {
    if (!user?.uid || !noteModal) return;
    const updated = { ...notes };
    if (noteText.trim()) updated[noteModal.date] = noteText.trim();
    else delete updated[noteModal.date];
    await updateDoc(doc(db, "users", user.uid), { "hifzPlan.notes": updated });
    setNoteModal(null);
  }

  async function savePlan() {
    if (!user?.uid) return;
    const preset = HIFZ_PRESETS.find(p => p.id === editPreset);
    const patch: Partial<HifzPlan> = {
      preset: editPreset,
      amount: editPreset === "custom" ? (Number(editAmount) || undefined) : (preset?.amount ?? undefined),
      unit: editPreset === "custom" ? editUnit : (preset?.unit ?? undefined),
      days: editDays,
      time: editTime,
    };
    await patchPlan(patch);
    setEditingPlan(false);
  }

  // ── Filtered surah list ────────────────────────────────────────

  const filteredSurahs = useMemo(() => {
    const q = surahSearch.toLowerCase();
    return SURAHS.filter(s => {
      const matchesSearch = !q
        || s.en.toLowerCase().includes(q)
        || s.ar.includes(q)
        || s.meaning.toLowerCase().includes(q)
        || String(s.n).includes(q);
      const status = surahStatus[String(s.n)];
      const matchesFilter =
        surahFilter === "all" ? true :
        surahFilter === "memorised" ? status === "memorised" :
        surahFilter === "in-progress" ? status === "in-progress" :
        !status;
      return matchesSearch && matchesFilter;
    });
  }, [surahSearch, surahFilter, surahStatus]);

  // ── Calendar data ──────────────────────────────────────────────

  const calDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7; // 0=Mon
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells: Array<{ day: number | null; ds: string | null }> = [];
    for (let i = 0; i < startDayOfWeek; i++) cells.push({ day: null, ds: null });
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, ds: dateStr(calYear, calMonth, d) });
    }
    return cells;
  }, [calYear, calMonth]);

  // ────────────────────────────────────────────────────────────────
  // No plan state
  // ────────────────────────────────────────────────────────────────

  if (!hifzPlan) {
    return (
      <div className="min-h-screen">
        <div className="max-w-2xl mx-auto px-5 py-8">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/habits" className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <ChevronLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Hifz Tracker</h1>
              <p className="text-sm text-slate-500 mt-0.5">Track your Quran memorisation journey</p>
            </div>
          </div>

          <div className="rounded-2xl p-10 text-center" style={glassCard}>
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <BookMarked size={28} className="text-blue-400" />
            </div>
            <h2 className="text-base font-semibold text-slate-700 mb-2">No Hifz plan set up yet</h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed max-w-xs mx-auto">
              Set up your Hifz plan on the Habits page first. Choose your pace, schedule, and reminder time — then come back here to track your progress.
            </p>
            <Link
              href="/habits"
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors"
            >
              <BookMarked size={15} /> Set up Hifz plan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────
  // Main tracker
  // ────────────────────────────────────────────────────────────────

  const pct = Math.round((memorisedCount / 114) * 100);
  const circumference = 2 * Math.PI * 44;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-5 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/habits" className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0">
            <ChevronLeft size={18} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-900">Hifz Tracker</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {planSubtitle}
              {hifzPlan.days && (
                <span className="ml-1.5 text-slate-400">
                  · {hifzPlan.days.length === 7 ? "every day" : hifzPlan.days.map(d => DAY_LABELS[d].slice(0,2)).join(", ")}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => { setEditingPlan(true); setTab("plan"); }}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors flex-shrink-0"
          >
            <Settings2 size={14} /> Edit plan
          </button>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: "rgba(241,245,249,0.8)" }}>
          {(["overview","surahs","calendar","plan"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                tab === t
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t === "surahs" ? "Surah List" : t === "calendar" ? "Calendar" : t === "plan" ? "Plan" : "Overview"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ───── OVERVIEW ───── */}
          {tab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>

              {/* Circular progress + stats */}
              <div className="rounded-2xl p-6 mb-4" style={glassCard}>
                <div className="flex items-center gap-8">
                  {/* SVG ring */}
                  <div className="relative flex-shrink-0">
                    <svg width="104" height="104" viewBox="0 0 104 104">
                      <circle cx="52" cy="52" r="44" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                      <circle
                        cx="52" cy="52" r="44"
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        transform="rotate(-90 52 52)"
                        style={{ transition: "stroke-dashoffset 0.6s ease" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-slate-900">{pct}%</span>
                      <span className="text-[10px] text-slate-400 font-medium">Complete</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div className="rounded-xl p-3" style={{ background: "rgba(248,250,252,0.8)", border: "1px solid rgba(226,232,240,0.8)" }}>
                      <p className="text-xl font-bold text-slate-800">{memorisedCount}</p>
                      <p className="text-[11px] text-slate-500 font-medium">Memorised</p>
                      <p className="text-[10px] text-slate-400">{114 - memorisedCount} left</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: "rgba(248,250,252,0.8)", border: "1px solid rgba(226,232,240,0.8)" }}>
                      <p className="text-xl font-bold text-slate-800">{inProgressCount}</p>
                      <p className="text-[11px] text-slate-500 font-medium">In Progress</p>
                      <p className="text-[10px] text-slate-400">surahs</p>
                    </div>
                    <div className="rounded-xl p-3 col-span-2" style={{ background: "rgba(248,250,252,0.8)", border: "1px solid rgba(226,232,240,0.8)" }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[11px] text-slate-500 font-medium">Verses memorised</p>
                        <p className="text-[11px] text-slate-500 font-semibold">{memorisedVerses.toLocaleString()} / {TOTAL_VERSES.toLocaleString()}</p>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(memorisedVerses / TOTAL_VERSES) * 100}%`, transition: "width 0.6s ease" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Today's session */}
              <div className="rounded-2xl p-5 mb-4" style={glassCard}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 mb-0.5">
                      {isTodayScheduled
                        ? `Today — ${planSubtitle}`
                        : "Rest day — no session scheduled"}
                    </p>
                    {isDoneToday
                      ? <p className="text-xs text-emerald-600 font-semibold">Done! Masha&apos;Allah ✓</p>
                      : isTodayScheduled
                      ? <p className="text-xs text-slate-400">Mark done after your session</p>
                      : <p className="text-xs text-slate-400">Enjoy your break</p>
                    }
                  </div>
                  {isTodayScheduled && !isDoneToday && (
                    <button
                      onClick={markDone}
                      disabled={saving}
                      className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-2 rounded-xl transition-colors flex-shrink-0 ml-3"
                    >
                      <Check size={13} /> Mark done
                    </button>
                  )}
                  {isDoneToday && <CheckCircle2 size={22} className="text-emerald-500 flex-shrink-0 ml-3" />}
                </div>
              </div>

              {/* This week strip */}
              <div className="rounded-2xl p-5" style={glassCard}>
                <p className="text-xs font-semibold text-slate-500 mb-3">This Week</p>
                <div className="grid grid-cols-7 gap-1.5">
                  {DAY_LABELS.map((label, i) => {
                    const d = new Date();
                    const offset = i - todayDayIndex;
                    d.setDate(d.getDate() + offset);
                    const ds = d.toISOString().slice(0, 10);
                    const done = !!log[ds];
                    const isToday = i === todayDayIndex;
                    const scheduled = hifzPlan.days ? hifzPlan.days.includes(i) : true;
                    const isPast = d < new Date(new Date().setHours(0,0,0,0));
                    const hasNote = !!notes[ds];
                    return (
                      <button
                        key={label}
                        onClick={() => { setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); setTab("calendar"); }}
                        className="flex flex-col items-center gap-1"
                      >
                        <span className={`text-[9px] font-semibold ${isToday ? "text-blue-600" : "text-slate-400"}`}>{label.slice(0,2)}</span>
                        <div className={`w-full aspect-square rounded-lg flex items-center justify-center relative transition-all ${
                          done ? "bg-blue-600 border border-blue-500"
                          : isToday && scheduled ? "bg-white border-2 border-blue-400"
                          : scheduled && isPast ? "bg-slate-100 border border-slate-200"
                          : scheduled ? "bg-white/60 border border-slate-100"
                          : "bg-slate-50 border border-slate-100"
                        }`}>
                          {done && <Check size={11} className="text-white" />}
                          {isToday && !done && scheduled && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                          {hasNote && <div className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-amber-400" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ───── SURAH LIST ───── */}
          {tab === "surahs" && (
            <motion.div key="surahs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>

              {/* Search + filter */}
              <div className="rounded-2xl p-4 mb-4" style={glassCard}>
                <div className="relative mb-3">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search surah name or number…"
                    value={surahSearch}
                    onChange={e => setSurahSearch(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700"
                  />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {(["all","not-started","in-progress","memorised"] as SurahFilter[]).map(f => (
                    <button
                      key={f}
                      onClick={() => setSurahFilter(f)}
                      className={`text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all ${
                        surahFilter === f
                          ? f === "memorised" ? "bg-blue-600 border-blue-600 text-white"
                          : f === "in-progress" ? "bg-amber-500 border-amber-500 text-white"
                          : "bg-slate-800 border-slate-800 text-white"
                          : "border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {f === "all" ? `All (114)` : f === "not-started" ? `Not started (${114 - memorisedCount - inProgressCount})` : f === "in-progress" ? `In progress (${inProgressCount})` : `Memorised (${memorisedCount})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Surah rows */}
              <div className="space-y-1.5">
                {filteredSurahs.length === 0 && (
                  <div className="rounded-2xl p-8 text-center text-slate-400 text-sm" style={glassCard}>
                    No surahs match your search.
                  </div>
                )}
                {filteredSurahs.map(s => {
                  const status = surahStatus[String(s.n)];
                  return (
                    <motion.div
                      key={s.n}
                      layout
                      className="rounded-xl px-4 py-3 flex items-center gap-3 transition-all"
                      style={glassCard}
                    >
                      {/* Number badge */}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                        status === "memorised" ? "bg-blue-600 text-white"
                        : status === "in-progress" ? "bg-amber-400 text-white"
                        : "bg-slate-100 text-slate-500"
                      }`}>
                        {s.n}
                      </div>

                      {/* Names */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800">{s.en}</span>
                          <span className="text-slate-400 text-sm font-medium" dir="rtl">{s.ar}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{s.v} verses · {s.meaning}</p>
                      </div>

                      {/* Two direct status buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => {
                            const key = String(s.n);
                            const next = status === "in-progress" ? null : "in-progress";
                            const updated: Record<string, SurahStatus> = next === null
                              ? Object.fromEntries(Object.entries(surahStatus).filter(([k]) => k !== key))
                              : { ...surahStatus, [key]: next };
                            if (user?.uid) updateDoc(doc(db, "users", user.uid), { "hifzPlan.surahStatus": updated });
                          }}
                          title="In Progress"
                          className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                            status === "in-progress"
                              ? "bg-amber-400 border-amber-400 text-white"
                              : "border-slate-200 text-slate-300 hover:border-amber-300 hover:text-amber-400"
                          }`}
                        >
                          <Clock size={13} />
                        </button>
                        <button
                          onClick={() => {
                            const key = String(s.n);
                            const next = status === "memorised" ? null : "memorised";
                            const updated: Record<string, SurahStatus> = next === null
                              ? Object.fromEntries(Object.entries(surahStatus).filter(([k]) => k !== key))
                              : { ...surahStatus, [key]: next };
                            if (user?.uid) updateDoc(doc(db, "users", user.uid), { "hifzPlan.surahStatus": updated });
                          }}
                          title="Memorised"
                          className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                            status === "memorised"
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-slate-200 text-slate-300 hover:border-blue-300 hover:text-blue-500"
                          }`}
                        >
                          <Check size={13} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <p className="text-center text-[11px] text-slate-400 mt-4">
                <Clock size={10} className="inline mr-1" />= In Progress &nbsp;·&nbsp; <Check size={10} className="inline mr-1" />= Memorised &nbsp;·&nbsp; Tap again to remove
              </p>
            </motion.div>
          )}

          {/* ───── CALENDAR ───── */}
          {tab === "calendar" && (
            <motion.div key="calendar" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>

              {/* Month nav */}
              <div className="rounded-2xl p-5 mb-4" style={glassCard}>
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <h2 className="text-sm font-bold text-slate-800">{MONTH_NAMES[calMonth]} {calYear}</h2>
                  <button
                    onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d => (
                    <div key={d} className="text-center text-[10px] font-semibold text-slate-400 py-1">{d}</div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-1">
                  {calDays.map((cell, idx) => {
                    if (!cell.day || !cell.ds) {
                      return <div key={`empty-${idx}`} />;
                    }
                    const ds = cell.ds;
                    const done = !!log[ds];
                    const hasNote = !!notes[ds];
                    const isToday = ds === todayStr;
                    const dayOfWeek = (new Date(ds).getDay() + 6) % 7;
                    const scheduled = hifzPlan.days ? hifzPlan.days.includes(dayOfWeek) : true;
                    const isPast = ds < todayStr;
                    const isMissed = scheduled && isPast && !done;
                    const isFuture = ds > todayStr;

                    return (
                      <button
                        key={ds}
                        onClick={() => {
                          setNoteModal({ date: ds, text: notes[ds] ?? "" });
                          setNoteText(notes[ds] ?? "");
                        }}
                        className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-semibold transition-all hover:scale-105 ${
                          isToday && done ? "bg-blue-600 text-white shadow-sm"
                          : isToday ? "bg-white border-2 border-blue-400 text-blue-600"
                          : done ? "bg-blue-500 text-white"
                          : isMissed ? "bg-red-50 border border-red-200 text-red-400"
                          : isFuture && scheduled ? "bg-white/60 border border-slate-100 text-slate-400"
                          : !scheduled ? "bg-slate-50 text-slate-300"
                          : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {cell.day}
                        {done && !isToday && <Check size={8} className="absolute bottom-0.5" />}
                        {hasNote && (
                          <div className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${done ? "bg-amber-300" : "bg-amber-400"}`} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex gap-4 mt-4 flex-wrap">
                  {[
                    { color: "bg-blue-500", label: "Done" },
                    { color: "bg-red-100 border border-red-200", label: "Missed" },
                    { color: "bg-slate-100", label: "Rest / future" },
                    { color: "bg-amber-400", label: "Has note", dot: true },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-1.5">
                      {item.dot
                        ? <div className="w-2 h-2 rounded-full bg-amber-400" />
                        : <div className={`w-3 h-3 rounded ${item.color}`} />
                      }
                      <span className="text-[10px] text-slate-400">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent notes */}
              {Object.keys(notes).length > 0 && (
                <div className="rounded-2xl p-5" style={glassCard}>
                  <p className="text-xs font-semibold text-slate-500 mb-3 flex items-center gap-1.5">
                    <StickyNote size={13} /> Recent notes
                  </p>
                  <div className="space-y-2">
                    {Object.entries(notes)
                      .sort(([a], [b]) => b.localeCompare(a))
                      .slice(0, 5)
                      .map(([date, text]) => (
                        <button
                          key={date}
                          onClick={() => { setNoteModal({ date, text }); setNoteText(text); }}
                          className="w-full text-left rounded-xl px-3 py-2.5 hover:bg-slate-50 transition-colors"
                          style={{ border: "1px solid rgba(226,232,240,0.6)" }}
                        >
                          <p className="text-[11px] text-slate-400 mb-0.5">{date}</p>
                          <p className="text-xs text-slate-600 line-clamp-2">{text}</p>
                        </button>
                      ))
                    }
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ───── PLAN ───── */}
          {tab === "plan" && (
            <motion.div key="plan" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              {!editingPlan ? (
                /* View mode */
                <div className="rounded-2xl p-6" style={glassCard}>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-sm font-bold text-slate-800">Your Hifz Plan</h2>
                    <button
                      onClick={() => {
                        setEditPreset(hifzPlan.preset ?? "steady");
                        setEditAmount(String(hifzPlan.amount ?? ""));
                        setEditUnit((hifzPlan.unit as "ayat" | "pages") ?? "ayat");
                        setEditDays(hifzPlan.days ?? [0,1,2,3,4,5,6]);
                        setEditTime(hifzPlan.time ?? "07:30");
                        setEditingPlan(true);
                      }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl p-4" style={{ background: "rgba(219,234,254,0.5)", border: "1px solid rgba(147,197,253,0.4)" }}>
                      <p className="text-[11px] text-blue-500 font-semibold mb-1">Daily goal</p>
                      <p className="text-sm font-bold text-blue-800">{planSubtitle}</p>
                    </div>
                    <div className="rounded-xl p-4" style={{ border: "1px solid rgba(226,232,240,0.8)", background: "rgba(248,250,252,0.8)" }}>
                      <p className="text-[11px] text-slate-500 font-semibold mb-1">Schedule</p>
                      <p className="text-sm font-semibold text-slate-800">
                        {hifzPlan.days?.length === 7 ? "Every day" : hifzPlan.days?.map(d => DAY_LABELS[d]).join(", ") ?? "Every day"}
                      </p>
                    </div>
                    {hifzPlan.time && (
                      <div className="rounded-xl p-4" style={{ border: "1px solid rgba(226,232,240,0.8)", background: "rgba(248,250,252,0.8)" }}>
                        <p className="text-[11px] text-slate-500 font-semibold mb-1">
                          <Bell size={10} className="inline mr-1" />Reminder
                        </p>
                        <p className="text-sm font-semibold text-slate-800">{formatTime(hifzPlan.time)}</p>
                      </div>
                    )}
                    <div className="rounded-xl p-4" style={{ background: "rgba(240,253,244,0.5)", border: "1px solid rgba(134,239,172,0.4)" }}>
                      <p className="text-[11px] text-emerald-600 font-semibold mb-1">Progress</p>
                      <p className="text-sm font-bold text-emerald-800">
                        {memorisedCount} / 114 surahs memorised ({pct}%)
                      </p>
                      <p className="text-[11px] text-emerald-600 mt-0.5">
                        {memorisedVerses.toLocaleString()} of {TOTAL_VERSES.toLocaleString()} verses
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Edit mode */
                <div className="rounded-2xl p-6" style={glassCard}>
                  <div className="flex items-center gap-3 mb-5">
                    <button onClick={() => setEditingPlan(false)} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                      <ChevronLeft size={16} />
                    </button>
                    <h2 className="text-sm font-bold text-slate-800">Edit Hifz Plan</h2>
                  </div>

                  {/* Preset picker */}
                  <p className="text-xs font-semibold text-slate-600 mb-2">Daily pace</p>
                  <div className="space-y-2 mb-4">
                    {HIFZ_PRESETS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setEditPreset(p.id)}
                        className="w-full text-left rounded-xl px-4 py-3 transition-all"
                        style={
                          editPreset === p.id
                            ? { background: "rgba(37,99,235,0.08)", border: "1.5px solid rgba(59,130,246,0.40)" }
                            : { background: "rgba(248,250,252,0.80)", border: "1.5px solid rgba(226,232,240,0.80)" }
                        }
                      >
                        <p className={`text-sm font-semibold ${editPreset === p.id ? "text-blue-700" : "text-slate-700"}`}>{p.subtitle}</p>
                      </button>
                    ))}
                  </div>

                  {editPreset === "custom" && (
                    <div className="flex gap-3 mb-4">
                      <input
                        type="number"
                        placeholder="Amount"
                        value={editAmount}
                        onChange={e => setEditAmount(e.target.value)}
                        className="flex-1 rounded-xl px-3 py-2.5 text-sm text-slate-800 border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                      <select
                        value={editUnit}
                        onChange={e => setEditUnit(e.target.value as "ayat" | "pages")}
                        className="rounded-xl px-3 py-2.5 text-sm text-slate-700 border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      >
                        <option value="ayat">Ayat/day</option>
                        <option value="pages">Pages/day</option>
                      </select>
                    </div>
                  )}

                  {/* Days */}
                  <p className="text-xs font-semibold text-slate-600 mb-2 mt-4">Memorisation days</p>
                  <div className="grid grid-cols-7 gap-1.5 mb-4">
                    {DAY_LABELS.map((label, i) => {
                      const active = editDays.includes(i);
                      return (
                        <button
                          key={label}
                          onClick={() => setEditDays(prev => active ? prev.filter(d => d !== i) : [...prev, i].sort((a,b) => a - b))}
                          className={`py-2 rounded-xl text-[11px] font-bold transition-all ${active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}
                        >
                          {label.slice(0,2)}
                        </button>
                      );
                    })}
                  </div>

                  {/* Reminder time — custom picker */}
                  <p className="text-xs font-semibold text-slate-600 mb-2 mt-4">
                    <Bell size={11} className="inline mr-1 text-blue-600" />Reminder time
                  </p>
                  <div className="flex items-center gap-2 mb-5">
                    {/* Hour */}
                    <select
                      value={(() => { const h = parseInt(editTime.split(":")[0]); return String(h % 12 || 12); })()}
                      onChange={e => {
                        const [, m] = editTime.split(":");
                        const h24old = parseInt(editTime.split(":")[0]);
                        const ispm = h24old >= 12;
                        let h = parseInt(e.target.value) % 12;
                        if (ispm) h += 12;
                        setEditTime(`${String(h).padStart(2,"0")}:${m}`);
                      }}
                      className="flex-1 rounded-xl px-3 py-3 text-sm font-semibold text-slate-800 border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none text-center cursor-pointer"
                    >
                      {Array.from({length: 12}, (_,i) => i+1).map(h => (
                        <option key={h} value={h}>{String(h).padStart(2,"0")}</option>
                      ))}
                    </select>
                    <span className="text-slate-400 font-bold text-lg">:</span>
                    {/* Minute */}
                    <select
                      value={editTime.split(":")[1]}
                      onChange={e => {
                        const h = editTime.split(":")[0];
                        setEditTime(`${h}:${e.target.value}`);
                      }}
                      className="flex-1 rounded-xl px-3 py-3 text-sm font-semibold text-slate-800 border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none text-center cursor-pointer"
                    >
                      {Array.from({length: 60}, (_,i) => String(i).padStart(2,"0")).map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    {/* AM / PM toggle */}
                    {(() => {
                      const h24 = parseInt(editTime.split(":")[0]);
                      const ispm = h24 >= 12;
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            const [hStr, mStr] = editTime.split(":");
                            let h = parseInt(hStr);
                            h = ispm ? h - 12 : h + 12;
                            if (h < 0) h += 24;
                            if (h >= 24) h -= 24;
                            setEditTime(`${String(h).padStart(2,"0")}:${mStr}`);
                          }}
                          className="px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors flex-shrink-0 min-w-[52px]"
                        >
                          {ispm ? "PM" : "AM"}
                        </button>
                      );
                    })()}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setEditingPlan(false)} className="flex-1 border border-slate-200 text-slate-500 font-semibold py-3 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={savePlan}
                      disabled={editDays.length === 0}
                      className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-40"
                    >
                      Save changes
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Note modal ── */}
      <AnimatePresence>
        {noteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setNoteModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              className="rounded-3xl p-6 w-full max-w-md"
              style={{
                background: "rgba(255,255,255,0.96)",
                backdropFilter: "blur(32px)",
                border: "1px solid rgba(255,255,255,0.95)",
                boxShadow: "0 20px 60px rgba(15,23,42,0.14)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">{noteModal.date}</p>
                  <h3 className="text-base font-bold text-slate-900">
                    {log[noteModal.date] ? "Session done ✓" : noteModal.date === todayStr ? "Today" : noteModal.date > todayStr ? "Upcoming" : "Missed session"}
                  </h3>
                </div>
                <button onClick={() => setNoteModal(null)} className="text-slate-400 hover:text-slate-700 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Add a note for this day — what you memorised, how it went, what to review…"
                rows={5}
                className="w-full rounded-xl px-4 py-3 text-sm text-slate-700 border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none mb-4"
              />
              <div className="flex gap-3">
                <button onClick={() => setNoteModal(null)} className="flex-1 border border-slate-200 text-slate-500 font-semibold py-3 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                {noteText.trim() !== (noteModal.text ?? "") && (
                  <button
                    onClick={saveNote}
                    className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
                  >
                    {noteText.trim() ? "Save note" : "Delete note"}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
