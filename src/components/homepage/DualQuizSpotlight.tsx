"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { Swords, Zap, Globe, Timer, ArrowRight } from "lucide-react";

const demoQuestions = [
  {
    q: "How many chapters (surahs) are in the Quran?",
    options: ["99", "114", "120", "100"],
    correct: 1,
  },
  {
    q: "Which prayer is performed at dawn?",
    options: ["Isha", "Dhuhr", "Fajr", "Asr"],
    correct: 2,
  },
  {
    q: "What is said before starting to eat?",
    options: ["Alhamdulillah", "Bismillah", "SubhanAllah", "Astaghfirullah"],
    correct: 1,
  },
];

const THINK_MS = 2600;   // timer runs, options neutral
const REVEAL_MS = 1400;  // correct answer highlighted, scores tick

function BattleDemo({ active }: { active: boolean }) {
  const [qIndex, setQIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [scores, setScores] = useState({ you: 0, rival: 0 });
  const roundRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    function runRound() {
      if (cancelled) return;
      setRevealed(false);
      const reveal = setTimeout(() => {
        if (cancelled) return;
        setRevealed(true);
        // You always score; rival scores 2 rounds out of 3 — you stay ahead
        setScores((s) => ({
          you: s.you + 1,
          rival: s.rival + (roundRef.current % 3 === 1 ? 0 : 1),
        }));
        const next = setTimeout(() => {
          if (cancelled) return;
          roundRef.current++;
          setQIndex((i) => {
            if ((i + 1) % demoQuestions.length === 0) {
              setScores({ you: 0, rival: 0 }); // loop resets the match
              roundRef.current = 0;
            }
            return (i + 1) % demoQuestions.length;
          });
          runRound();
        }, REVEAL_MS);
        timers.push(next);
      }, THINK_MS);
      timers.push(reveal);
    }

    const timers: NodeJS.Timeout[] = [];
    runRound();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [active]);

  const question = demoQuestions[qIndex];

  return (
    <div className="glass-deep rounded-3xl p-6 relative overflow-hidden">
      {/* soft glow */}
      <div className="absolute -top-16 -right-12 w-52 h-52 rounded-full bg-indigo-400/15 blur-3xl pointer-events-none" />

      {/* Scoreboard */}
      <div className="relative flex items-center gap-3 mb-5">
        <div className="flex-1 glass-sm rounded-2xl px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #3b82f6, #4f46e5)" }}>
            You
          </div>
          <motion.p key={`you-${scores.you}`} initial={{ scale: 1.4 }} animate={{ scale: 1 }}
            className="text-2xl font-black text-blue-600 ml-auto">
            {scores.you}
          </motion.p>
        </div>

        <motion.div
          animate={{ rotate: [0, -8, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2.4, repeatDelay: 1.6 }}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border border-white/70"
          style={{ background: "rgba(224,231,255,0.8)" }}
        >
          <Swords size={17} className="text-indigo-500" />
        </motion.div>

        <div className="flex-1 glass-sm rounded-2xl px-4 py-3 flex items-center gap-3 flex-row-reverse">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            A
          </div>
          <motion.p key={`rival-${scores.rival}`} initial={{ scale: 1.4 }} animate={{ scale: 1 }}
            className="text-2xl font-black text-slate-500 mr-auto">
            {scores.rival}
          </motion.p>
        </div>
      </div>

      {/* Timer bar — restarts each question */}
      <div className="relative h-1.5 bg-slate-200/60 rounded-full overflow-hidden mb-5">
        {active && (
          <motion.div
            key={`timer-${qIndex}`}
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: (THINK_MS + REVEAL_MS) / 1000, ease: "linear" }}
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #34d399, #fbbf24, #f87171)" }}
          />
        )}
      </div>

      {/* Question */}
      <motion.div
        key={`q-${qIndex}`}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <p className="text-sm font-bold text-slate-900 mb-4 leading-snug">{question.q}</p>
        <div className="grid grid-cols-2 gap-2">
          {question.options.map((opt, i) => {
            const isCorrect = revealed && i === question.correct;
            return (
              <div
                key={`${qIndex}-${i}`}
                className="rounded-xl px-3 py-2.5 text-xs font-semibold text-center transition-all duration-300 border"
                style={isCorrect
                  ? { background: "rgba(209,250,229,0.85)", borderColor: "rgba(52,211,153,0.6)", color: "#047857", transform: "scale(1.03)" }
                  : { background: "rgba(255,255,255,0.45)", borderColor: "rgba(255,255,255,0.65)", color: "#475569" }}
              >
                {opt}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Reward strip */}
      <div className="relative flex items-center justify-center gap-2 mt-5 text-xs font-semibold text-indigo-500">
        <Zap size={13} />
        Winner takes +60 XP and 25 gems
      </div>
    </div>
  );
}

export default function DualQuizSpotlight() {
  const demoRef = useRef<HTMLDivElement>(null);
  const inView = useInView(demoRef, { amount: 0.35 });

  return (
    <section className="relative py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">

          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-4">
              Live multiplayer
            </p>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight mb-6">
              Challenge the Ummah
              <br />
              in a <span className="text-gradient">Dual Quiz.</span>
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-8">
              Get matched with another Muslim anywhere in the world and race
              through five questions head-to-head. Answer fast, answer right,
              and take the win.
            </p>

            <div className="space-y-4 mb-10">
              {[
                { Icon: Globe, text: "Random matchmaking with players worldwide" },
                { Icon: Timer, text: "15 seconds per question — think fast" },
                { Icon: Zap,   text: "Win XP and gems with every victory" },
              ].map(({ Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/70"
                    style={{ background: "rgba(224,231,255,0.7)" }}>
                    <Icon size={15} className="text-indigo-500" />
                  </div>
                  <p className="text-slate-600 text-sm font-medium">{text}</p>
                </div>
              ))}
            </div>

            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 text-white font-semibold text-sm px-6 py-3.5 rounded-2xl transition-all hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #4f46e5)",
                boxShadow: "0 10px 26px rgba(59,130,246,0.30), inset 0 1px 0 rgba(255,255,255,0.30)",
              }}
            >
              Find your first opponent
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Right — live battle demo */}
          <motion.div
            ref={demoRef}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <BattleDemo active={inView} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
