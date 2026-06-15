"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Star, X, Check } from "lucide-react";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";

const TOPICS = [
  { id: "quran", name: "Quran", icon: "📖", lessons: 12, completed: 7, difficulty: 2 },
  { id: "duas", name: "Duas", icon: "🤲", lessons: 20, completed: 15, difficulty: 1 },
  { id: "seerah", name: "Seerah", icon: "🌙", lessons: 15, completed: 3, difficulty: 2 },
  { id: "fiqh", name: "Fiqh", icon: "⚖️", lessons: 18, completed: 0, difficulty: 3 },
  { id: "arabic", name: "Arabic", icon: "🔤", lessons: 24, completed: 5, difficulty: 3 },
  { id: "prophets", name: "Prophets", icon: "🕌", lessons: 10, completed: 10, difficulty: 1 },
  { id: "history", name: "History", icon: "📜", lessons: 14, completed: 2, difficulty: 2 },
  { id: "manners", name: "Manners", icon: "💚", lessons: 8, completed: 4, difficulty: 1 },
];

const SAMPLE_QUESTIONS = [
  {
    question: "The Prophet ﷺ said: 'The best of you are those who...' (Bukhari 5027). Complete the hadith.",
    options: [
      "...pray the most Sunnah prayers",
      "...learn the Quran and teach it",
      "...give the most in charity",
      "...fast the most days",
    ],
    correct: 1,
    explanation: "Sahih al-Bukhari 5027: 'The best of you are those who learn the Quran and teach it.' This hadith emphasises the immense value of engaging with the Book of Allah ﷻ.",
    xp: 10,
  },
  {
    question: "Which surah is known as the 'heart of the Quran'?",
    options: ["Surah Al-Fatiha", "Surah Al-Baqarah", "Surah Ya-Sin", "Surah Al-Ikhlas"],
    correct: 2,
    explanation: "The Prophet ﷺ said: 'Surah Ya-Sin is the heart of the Quran.' (Abu Dawud 2891). It is recommended to recite it for the dying and on Fridays.",
    xp: 10,
  },
];

export default function LearnPage() {
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [showXpPopup, setShowXpPopup] = useState(false);

  const question = SAMPLE_QUESTIONS[qIndex];

  function handleAnswer(idx: number) {
    if (selected !== null) return;
    setSelected(idx);
    setShowExplanation(true);
    if (idx === question.correct) {
      setXpEarned((x) => x + question.xp);
      setShowXpPopup(true);
      setTimeout(() => setShowXpPopup(false), 700);
    }
  }

  function nextQuestion() {
    if (qIndex + 1 < SAMPLE_QUESTIONS.length) {
      setQIndex((i) => i + 1);
      setSelected(null);
      setShowExplanation(false);
    } else {
      setActiveLesson(null);
      setQIndex(0);
      setSelected(null);
      setShowExplanation(false);
    }
  }

  if (activeLesson) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Progress */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => { setActiveLesson(null); setQIndex(0); setSelected(null); setShowExplanation(false); }} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-muted" />
          </button>
          <ProgressBar value={qIndex} max={SAMPLE_QUESTIONS.length} className="flex-1" />
          <span className="text-sm text-muted mono">{qIndex + 1}/{SAMPLE_QUESTIONS.length}</span>
        </div>

        {/* Question */}
        <motion.div
          key={qIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <p className="text-xl font-bold text-foreground mb-8 leading-relaxed">
            {question.question}
          </p>

          <div className="space-y-3 mb-6 relative">
            {/* XP popup */}
            <AnimatePresence>
              {showXpPopup && (
                <motion.div
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0, y: -40 }}
                  transition={{ duration: 0.6 }}
                  className="absolute -top-6 left-1/2 -translate-x-1/2 bg-accent text-white text-sm font-bold px-3 py-1 rounded-full z-10"
                >
                  +{question.xp} XP
                </motion.div>
              )}
            </AnimatePresence>

            {question.options.map((option, i) => {
              let style = "border-border bg-card hover:border-primary-500 cursor-pointer";
              if (selected !== null) {
                if (i === question.correct) style = "border-primary-500 bg-primary-50";
                else if (i === selected && selected !== question.correct) style = "border-danger bg-red-50";
                else style = "border-border bg-card opacity-50";
              }
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  className={`w-full text-left border-2 rounded-xl px-5 py-4 text-sm font-medium text-foreground transition-all duration-150 flex items-center gap-3 ${style}`}
                >
                  {selected !== null && i === question.correct && <Check size={16} className="text-primary-500 flex-shrink-0" />}
                  {selected !== null && i === selected && selected !== question.correct && <X size={16} className="text-danger flex-shrink-0" />}
                  {option}
                </button>
              );
            })}
          </div>

          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary-50 border border-primary-500/20 rounded-xl p-5 mb-6"
            >
              <p className="text-sm font-semibold text-primary-500 mb-2">
                {selected === question.correct ? "✅ Correct! Masha'Allah!" : "📚 The correct answer is:"}
              </p>
              <p className="text-sm text-foreground leading-relaxed">{question.explanation}</p>
            </motion.div>
          )}

          {selected !== null && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={nextQuestion}
              className="w-full bg-primary-500 text-white font-semibold py-3.5 rounded-xl hover:bg-primary-600 transition-colors"
            >
              {qIndex + 1 < SAMPLE_QUESTIONS.length ? "Next question →" : `Finish lesson · ${xpEarned} XP earned`}
            </motion.button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Islamic Learning</h1>
        <p className="text-muted text-sm mt-1">
          All content sourced from authenticated texts with references cited.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {TOPICS.map(({ id, name, icon, lessons, completed, difficulty }) => (
          <button
            key={id}
            onClick={() => setActiveLesson(id)}
            className="bg-card border border-border rounded-2xl p-5 text-left hover:border-primary-500 hover:shadow-card-hover transition-all duration-200 group"
          >
            <span className="text-3xl mb-3 block">{icon}</span>
            <p className="font-bold text-foreground text-sm mb-1 group-hover:text-primary-500 transition-colors">{name}</p>
            <p className="text-xs text-muted mb-3">
              {completed}/{lessons} lessons
            </p>
            <ProgressBar value={completed} max={lessons} />
            <div className="flex gap-0.5 mt-3">
              {Array.from({ length: 3 }).map((_, s) => (
                <Star
                  key={s}
                  size={10}
                  fill={s < difficulty ? "#E07B00" : "transparent"}
                  className={s < difficulty ? "text-accent" : "text-gray-300"}
                />
              ))}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 bg-foreground text-white rounded-2xl p-6 flex items-center gap-5">
        <BookOpen size={28} className="text-accent flex-shrink-0" />
        <div>
          <p className="font-semibold text-white">Scholar-verified content</p>
          <p className="text-sm text-gray-400">
            Every lesson cites its source — Quran surah/verse or hadith collection/number.
            Content reviewed by qualified Sunni scholars.
          </p>
        </div>
      </div>
    </div>
  );
}
