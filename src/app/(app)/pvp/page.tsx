"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords, Trophy, Clock, CheckCircle, XCircle,
  Crown, Zap, Loader2, Star, Shield, Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  collection, addDoc, getDocs, doc, updateDoc, onSnapshot,
  deleteDoc, serverTimestamp, runTransaction, query, where, limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TOPIC_QUESTIONS, type Question } from "../learn/questions";
import { useRouter } from "next/navigation";

// ─── Constants ───────────────────────────────────────────────────────────────
const QUESTION_COUNT = 5;
const TIMER_SEC = 15;
const XP_WIN = 60;
const XP_LOSE = 15;
const XP_DRAW = 30;
const GEMS_WIN = 25;
const GEMS_DRAW = 10;

// ─── Types ────────────────────────────────────────────────────────────────────
interface PvPQuestion {
  question: string;
  options: string[];
  correct: number;
}

interface PlayerData {
  uid: string;
  displayName: string;
  username: string;
  photoURL: string | null;
  answers: Record<string, number>; // questionIndex (string) → chosen option index (-1 = timeout)
  score: number;
}

interface PvPMatch {
  status: "waiting" | "active" | "complete";
  questions: PvPQuestion[];
  p1: PlayerData;
  p2: PlayerData | null;
  winner: string | "draw" | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getRandomPvPQuestions(): PvPQuestion[] {
  const seen = new Set<Question[]>();
  const pool: PvPQuestion[] = [];
  for (const bank of Object.values(TOPIC_QUESTIONS)) {
    if (!seen.has(bank)) {
      seen.add(bank);
      for (const q of bank) {
        pool.push({ question: q.question, options: q.options, correct: q.correct });
      }
    }
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, QUESTION_COUNT);
}

function PlayerAvatar({
  data, size = 44, ring = false,
}: { data: PlayerData; size?: number; ring?: boolean }) {
  const initials = (data.displayName || data.username || "?")
    .split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  const ringClass = ring ? "ring-2 ring-offset-1 ring-emerald-400" : "";
  if (data.photoURL) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={data.photoURL} alt={data.displayName}
        className={`rounded-full object-cover flex-shrink-0 ${ringClass}`}
        style={{ width: size, height: size }} />
    );
  }
  return (
    <div className={`rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0 ${ringClass}`}
      style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PvPPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  type Phase = "lobby" | "searching" | "battle" | "result";
  const [phase, setPhase] = useState<Phase>("lobby");
  const [matchId, setMatchId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<"p1" | "p2" | null>(null);
  const [matchData, setMatchData] = useState<PvPMatch | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Battle UI state
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SEC);
  const [showCorrect, setShowCorrect] = useState(false); // brief reveal after answering

  // Result state
  const [resultXp, setResultXp] = useState(0);
  const [resultGems, setResultGems] = useState(0);
  const [resultOutcome, setResultOutcome] = useState<"win" | "lose" | "draw">("draw");

  const unsubRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseRef = useRef<Phase>("lobby");
  phaseRef.current = phase;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubRef.current?.();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Reset timer when advancing to next question
  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(TIMER_SEC);
    setHasAnswered(false);
    setSelected(null);
    setShowCorrect(false);
  };

  // Subscribe to match
  useEffect(() => {
    if (!matchId) return;
    unsubRef.current?.();
    const matchRef = doc(db, "pvpMatches", matchId);
    unsubRef.current = onSnapshot(matchRef, async (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as PvPMatch;
      setMatchData(data);

      if (data.status === "active" && phaseRef.current === "searching") {
        // Opponent joined — start battle
        setPhase("battle");
        resetTimer();
      }

      if (data.status === "complete" && phaseRef.current !== "result") {
        phaseRef.current = "result";
        setPhase("result");
        if (timerRef.current) clearInterval(timerRef.current);
      }
    });
    return () => unsubRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  // Timer logic — runs when we're in "battle" and haven't answered current Q
  useEffect(() => {
    if (phase !== "battle") return;
    if (hasAnswered) return;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Auto-submit timeout (-1 = no answer)
          handleAnswer(-1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, hasAnswered, currentQ]);

  // Detect match completion once both players have answered all questions
  useEffect(() => {
    if (!matchData || !matchId || !myRole || phase !== "battle") return;
    const p1AnswerCount = Object.keys(matchData.p1.answers ?? {}).length;
    const p2AnswerCount = Object.keys(matchData.p2?.answers ?? {}).length;

    if (p1AnswerCount >= QUESTION_COUNT && p2AnswerCount >= QUESTION_COUNT && matchData.status !== "complete") {
      // P1 writes the winner to avoid double writes
      if (myRole === "p1") {
        const p1Score = matchData.p1.score;
        const p2Score = matchData.p2?.score ?? 0;
        const winner = p1Score > p2Score ? matchData.p1.uid
          : p2Score > p1Score ? matchData.p2!.uid
          : "draw";
        updateDoc(doc(db, "pvpMatches", matchId), {
          status: "complete",
          winner,
        }).catch(console.error);
      }
    }
  }, [matchData, matchId, myRole, phase]);

  // ── Award XP/gems when entering result screen ────────────────────────────────
  useEffect(() => {
    if (phase !== "result" || !matchData || !user || !profile) return;

    const me = myRole === "p1" ? matchData.p1 : matchData.p2;
    if (!me) return;

    let outcome: "win" | "lose" | "draw" = "draw";
    let xp = XP_DRAW;
    let gems = GEMS_DRAW;

    if (matchData.winner === "draw") {
      outcome = "draw";
    } else if (matchData.winner === user.uid) {
      outcome = "win";
      xp = XP_WIN;
      gems = GEMS_WIN;
    } else {
      outcome = "lose";
      xp = XP_LOSE;
      gems = 0;
    }

    setResultOutcome(outcome);
    setResultXp(xp);
    setResultGems(gems);

    const newXp = (profile.xp ?? 0) + xp;
    const newGems = (profile.gems ?? 0) + gems;
    updateDoc(doc(db, "users", user.uid), { xp: newXp, gems: newGems }).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Matchmaking ───────────────────────────────────────────────────────────────
  async function findOrCreateMatch() {
    if (!user || !profile) return;
    setError(null);
    setPhase("searching");

    const me: PlayerData = {
      uid: user.uid,
      displayName: profile.displayName ?? profile.username ?? "Player",
      username: profile.username ?? user.uid.slice(0, 8),
      photoURL: profile.photoURL ?? null,
      answers: {},
      score: 0,
    };

    try {
      // Look for a waiting match (not our own)
      const waitingQuery = query(
        collection(db, "pvpMatches"),
        where("status", "==", "waiting"),
        limit(10)
      );
      const snap = await getDocs(waitingQuery);
      const available = snap.docs.find((d) => d.data().p1?.uid !== user.uid);

      if (available) {
        // Try to join as P2 using a transaction to avoid race conditions
        const matchRef = doc(db, "pvpMatches", available.id);
        let joined = false;
        try {
          await runTransaction(db, async (tx) => {
            const fresh = await tx.get(matchRef);
            if (!fresh.exists() || fresh.data().status !== "waiting") {
              throw new Error("taken");
            }
            tx.update(matchRef, {
              p2: me,
              status: "active",
            });
            joined = true;
          });
        } catch {
          joined = false;
        }

        if (joined) {
          setMatchId(available.id);
          setMyRole("p2");
          setCurrentQ(0);
          resetTimer();
          setPhase("battle");
          return;
        }
      }

      // Create a new match as P1
      const questions = getRandomPvPQuestions();
      const newMatch = await addDoc(collection(db, "pvpMatches"), {
        status: "waiting",
        questions,
        p1: me,
        p2: null,
        winner: null,
        createdAt: serverTimestamp(),
      });
      setMatchId(newMatch.id);
      setMyRole("p1");
    } catch (err) {
      console.error("PvP matchmaking error:", err);
      setError("Could not connect. Please try again.");
      setPhase("lobby");
    }
  }

  async function cancelSearch() {
    if (matchId) {
      try {
        await deleteDoc(doc(db, "pvpMatches", matchId));
      } catch {
        // ignore
      }
    }
    unsubRef.current?.();
    setMatchId(null);
    setMyRole(null);
    setMatchData(null);
    setPhase("lobby");
  }

  async function forfeit() {
    if (!matchId || !matchData || !user) return;
    const opponentUid = myRole === "p1" ? matchData.p2?.uid : matchData.p1.uid;
    if (!opponentUid) { await cancelSearch(); return; }
    await updateDoc(doc(db, "pvpMatches", matchId), {
      status: "complete",
      winner: opponentUid,
    });
  }

  // ── Answer submission ─────────────────────────────────────────────────────────
  async function handleAnswer(chosenIndex: number) {
    if (!matchId || !matchData || !myRole || !user) return;
    if (hasAnswered) return;

    clearInterval(timerRef.current!);
    setHasAnswered(true);
    setSelected(chosenIndex);

    const myPlayer = myRole === "p1" ? matchData.p1 : matchData.p2;
    if (!myPlayer) return;

    const isCorrect = chosenIndex === matchData.questions[currentQ]?.correct;
    const newAnswers = { ...myPlayer.answers, [String(currentQ)]: chosenIndex };
    const newScore = myPlayer.score + (isCorrect ? 1 : 0);

    // Show correct answer briefly, then advance
    setShowCorrect(true);

    try {
      await updateDoc(doc(db, "pvpMatches", matchId), {
        [`${myRole}.answers`]: newAnswers,
        [`${myRole}.score`]: newScore,
      });
    } catch (err) {
      console.error("Failed to save answer:", err);
    }

    // Advance to next question after 1.2s
    setTimeout(() => {
      if (currentQ + 1 < QUESTION_COUNT) {
        setCurrentQ((q) => q + 1);
        resetTimer();
      }
      // If this was the last question, wait for matchData update to trigger result
    }, 1200);
  }

  function rematch() {
    unsubRef.current?.();
    setMatchId(null);
    setMyRole(null);
    setMatchData(null);
    setCurrentQ(0);
    resetTimer();
    setPhase("lobby");
  }

  // ── Derived data ──────────────────────────────────────────────────────────────
  const myPlayer = matchData && myRole ? (myRole === "p1" ? matchData.p1 : matchData.p2) : null;
  const opPlayer = matchData && myRole ? (myRole === "p1" ? matchData.p2 : matchData.p1) : null;
  const myAnswerCount = Object.keys(myPlayer?.answers ?? {}).length;
  const opAnswerCount = Object.keys(opPlayer?.answers ?? {}).length;
  const waitingForOp = myAnswerCount >= QUESTION_COUNT && opAnswerCount < QUESTION_COUNT;
  const currentQuestion = matchData?.questions[currentQ];
  const timerPercent = (timeLeft / TIMER_SEC) * 100;
  const timerColor = timeLeft > 8 ? "bg-emerald-400" : timeLeft > 4 ? "bg-amber-400" : "bg-red-400";

  if (!user || !profile) return null;

  // ── Lobby ─────────────────────────────────────────────────────────────────────
  if (phase === "lobby") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, repeatDelay: 2 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              <Swords size={38} className="text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dual Quiz</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              Challenge a random opponent live
            </p>
          </div>

          {/* How it works */}
          <div className="rounded-2xl p-5 mb-5 space-y-3"
            style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}>
            {[
              { icon: <Users size={16} />, text: "Matched with a random player worldwide" },
              { icon: <Clock size={16} />, text: `${QUESTION_COUNT} questions · ${TIMER_SEC}s per question` },
              { icon: <Trophy size={16} />, text: "Most correct answers wins" },
              { icon: <Zap size={16} />, text: `Win: +${XP_WIN} XP & ${GEMS_WIN} gems · Draw: +${XP_DRAW} XP` },
            ].map(({ icon, text }, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                <span className="text-indigo-500 flex-shrink-0">{icon}</span>
                {text}
              </div>
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center mb-4">{error}</p>
          )}

          <button
            onClick={findOrCreateMatch}
            className="w-full py-4 rounded-2xl font-bold text-white text-base transition-transform active:scale-95"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            Find Opponent
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Searching / Waiting for opponent ─────────────────────────────────────────
  if (phase === "searching") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="relative w-24 h-24 mx-auto mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute inset-0 rounded-full border-4 border-indigo-200 border-t-indigo-600"
            />
            <div className="absolute inset-3 rounded-full bg-indigo-600 flex items-center justify-center">
              <Swords size={28} className="text-white" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Searching for opponent…
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
            You&apos;ll be matched with another player shortly
          </p>
          <button
            onClick={cancelSearch}
            className="px-6 py-2.5 rounded-xl font-medium text-sm transition-colors"
            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
          >
            Cancel
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Result screen ─────────────────────────────────────────────────────────────
  if (phase === "result") {
    const myFinalScore = myPlayer?.score ?? 0;
    const opFinalScore = opPlayer?.score ?? 0;

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm text-center"
        >
          {/* Outcome banner */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
            className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{
              background: resultOutcome === "win"
                ? "linear-gradient(135deg, #f59e0b, #ef4444)"
                : resultOutcome === "draw"
                ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                : "linear-gradient(135deg, #94a3b8, #64748b)",
            }}
          >
            {resultOutcome === "win" && <Crown size={40} className="text-white" />}
            {resultOutcome === "lose" && <Shield size={40} className="text-white" />}
            {resultOutcome === "draw" && <Star size={40} className="text-white" />}
          </motion.div>

          <h2 className="text-3xl font-black mb-1 text-slate-900 dark:text-white">
            {resultOutcome === "win" ? "Victory!" : resultOutcome === "lose" ? "Defeated" : "Draw!"}
          </h2>

          {/* Scores */}
          <div className="flex items-center justify-center gap-6 my-5">
            {myPlayer && (
              <div className="text-center">
                <PlayerAvatar data={myPlayer} size={48} />
                <p className="text-xs text-slate-500 mt-1 truncate max-w-[72px]">{myPlayer.displayName}</p>
                <p className="text-2xl font-black text-indigo-600">{myFinalScore}</p>
              </div>
            )}
            <p className="text-slate-400 font-bold text-lg">vs</p>
            {opPlayer && (
              <div className="text-center">
                <PlayerAvatar data={opPlayer} size={48} />
                <p className="text-xs text-slate-500 mt-1 truncate max-w-[72px]">{opPlayer.displayName}</p>
                <p className="text-2xl font-black text-red-500">{opFinalScore}</p>
              </div>
            )}
          </div>

          {/* Rewards */}
          <div className="rounded-2xl p-4 mb-6"
            style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}>
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-0.5">XP Earned</p>
                <p className="text-xl font-black text-indigo-600">+{resultXp}</p>
              </div>
              {resultGems > 0 && (
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-0.5">Gems</p>
                  <p className="text-xl font-black text-amber-500">+{resultGems} 💎</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/learn")}
              className="flex-1 py-3 rounded-xl font-semibold text-sm transition-colors text-slate-700 dark:text-slate-300"
              style={{ background: "rgba(100,116,139,0.1)" }}
            >
              Back to Learn
            </button>
            <button
              onClick={rematch}
              className="flex-1 py-3 rounded-xl font-semibold text-sm text-white transition-transform active:scale-95"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              Play Again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Battle screen ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col p-4 max-w-lg mx-auto">
      {/* Scoreboard */}
      <div className="flex items-center gap-2 mb-4">
        {/* Me */}
        <div className="flex-1 rounded-2xl p-3 flex items-center gap-2"
          style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}>
          {myPlayer && <PlayerAvatar data={myPlayer} size={36} ring />}
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
              {myPlayer?.displayName ?? "You"}
            </p>
            <p className="text-lg font-black text-indigo-600 leading-tight">{myPlayer?.score ?? 0}</p>
          </div>
        </div>

        {/* VS pill */}
        <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(99,102,241,0.12)" }}>
          <Swords size={16} className="text-indigo-500" />
        </div>

        {/* Opponent */}
        <div className="flex-1 rounded-2xl p-3 flex items-center gap-2 flex-row-reverse"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}>
          {opPlayer
            ? <PlayerAvatar data={opPlayer} size={36} />
            : (
              <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <Loader2 size={16} className="text-slate-400 animate-spin" />
              </div>
            )
          }
          <div className="min-w-0 text-right">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
              {opPlayer?.displayName ?? "Waiting…"}
            </p>
            <p className="text-lg font-black text-red-500 leading-tight">{opPlayer?.score ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1 justify-center mb-4">
        {Array.from({ length: QUESTION_COUNT }, (_, i) => {
          const myAns = myPlayer?.answers[String(i)];
          const answered = myAns !== undefined;
          const correct = answered && myAns === matchData?.questions[i]?.correct;
          return (
            <div key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentQ && !answered
                  ? "bg-indigo-500 scale-125"
                  : answered
                  ? correct ? "bg-emerald-400" : "bg-red-400"
                  : "bg-slate-200 dark:bg-slate-700"
              }`}
            />
          );
        })}
      </div>

      {/* Opponent progress */}
      <p className="text-xs text-center text-slate-400 mb-3">
        Opponent: {opAnswerCount}/{QUESTION_COUNT} answered
      </p>

      {/* Waiting for opponent overlay */}
      {waitingForOp ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col items-center justify-center"
        >
          <Loader2 size={40} className="text-indigo-400 animate-spin mb-4" />
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
            Waiting for opponent…
          </p>
          <p className="text-slate-400 text-sm mt-1">{opAnswerCount}/{QUESTION_COUNT} answered</p>
        </motion.div>
      ) : (
        <>
          {/* Timer bar */}
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mb-5 overflow-hidden">
            <motion.div
              className={`h-full rounded-full transition-colors ${timerColor}`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>

          {/* Timer label */}
          <div className={`flex items-center gap-1 justify-end mb-4 text-xs font-semibold ${
            timeLeft <= 4 ? "text-red-500" : timeLeft <= 8 ? "text-amber-500" : "text-slate-400"
          }`}>
            <Clock size={12} />
            {timeLeft}s
          </div>

          {/* Question card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
            >
              <div className="rounded-2xl p-5 mb-5"
                style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.12)" }}>
                <p className="text-xs font-semibold text-indigo-400 mb-2">
                  Question {currentQ + 1} of {QUESTION_COUNT}
                </p>
                <p className="text-base font-semibold text-slate-900 dark:text-white leading-snug">
                  {currentQuestion?.question}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQuestion?.options.map((opt, i) => {
                  const isSelected = selected === i;
                  const isCorrect = i === currentQuestion.correct;
                  let bg = "rgba(248,250,252,0.9)";
                  let border = "rgba(226,232,240,0.7)";
                  let textColor = "text-slate-800 dark:text-slate-200";

                  if (showCorrect) {
                    if (isCorrect) {
                      bg = "rgba(209,250,229,0.9)";
                      border = "rgba(52,211,153,0.6)";
                      textColor = "text-emerald-800";
                    } else if (isSelected && !isCorrect) {
                      bg = "rgba(254,226,226,0.9)";
                      border = "rgba(248,113,113,0.5)";
                      textColor = "text-red-800";
                    }
                  } else if (isSelected) {
                    bg = "rgba(199,210,254,0.5)";
                    border = "rgba(99,102,241,0.5)";
                    textColor = "text-indigo-900 dark:text-indigo-100";
                  }

                  return (
                    <motion.button
                      key={i}
                      whileTap={hasAnswered ? {} : { scale: 0.98 }}
                      onClick={() => !hasAnswered && handleAnswer(i)}
                      disabled={hasAnswered}
                      className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${textColor}`}
                      style={{ background: bg, border: `1px solid ${border}` }}
                    >
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: "rgba(99,102,241,0.12)", color: "#6366f1" }}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {showCorrect && isCorrect && <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />}
                      {showCorrect && isSelected && !isCorrect && <XCircle size={16} className="text-red-400 flex-shrink-0" />}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Forfeit */}
          <button
            onClick={forfeit}
            className="mt-6 w-full py-2.5 rounded-xl text-sm font-medium text-red-400 transition-colors"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}
          >
            Forfeit Match
          </button>
        </>
      )}
    </div>
  );
}
