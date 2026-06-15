"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import { CheckSquare, BookOpen, MessageCircle, ChevronRight } from "lucide-react";

const HABIT_OPTIONS = [
  "Fajr Salah", "Dhuhr Salah", "Asr Salah", "Maghrib Salah", "Isha Salah",
  "Quran (1 page)", "Morning Dhikr", "Evening Dhikr", "Fast (Monday/Thursday)",
  "Tahajjud", "Charity (daily)", "Seeking knowledge",
];

type Step = 1 | 2 | 3;

export default function SignupPage() {
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const router = useRouter();

  function toggleHabit(h: string) {
    setSelectedHabits((prev) =>
      prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h]
    );
  }

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setStep(2);
  }

  async function handleFinish() {
    setLoading(true);
    try {
      await signUp(email, password, name);
      toast.success("Bismillah! Welcome to Jannatie 🌟");
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign up failed. Try a different email.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch {
      toast.error("Google sign-in failed.");
    }
  }

  const steps = [
    { label: "Account", num: 1 },
    { label: "Habits", num: 2 },
    { label: "You&apos;re set", num: 3 },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-foreground text-white p-12">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold">Jannatie</span>
          <span className="arabic text-accent text-xl">جنتي</span>
        </Link>

        <div className="space-y-8">
          {[
            { icon: CheckSquare, title: "Track your daily habits", desc: "Salah, Quran, Dhikr and more." },
            { icon: BookOpen, title: "Learn and earn XP", desc: "Gamified Islamic knowledge." },
            { icon: MessageCircle, title: "Ask your AI Buddy", desc: "Scholar-reviewed answers 24/7." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-accent" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{title}</p>
                <p className="text-gray-400 text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-gray-500 text-xs">© 2025 Jannatie Ltd · UK GDPR compliant</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Step indicator */}
          <div className="flex items-center gap-0 mb-10">
            {steps.map(({ label, num }, i) => (
              <div key={num} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= num ? "bg-primary-500 text-white" : "bg-gray-200 text-muted"}`}>
                    {step > num ? "✓" : num}
                  </div>
                  <span className="text-[10px] text-muted mt-1">{label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mb-4 ${step > num ? "bg-primary-500" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="text-3xl font-bold text-foreground mb-2">Create your account</h1>
                <p className="text-muted mb-6">
                  Already have one?{" "}
                  <Link href="/login" className="text-primary-500 hover:underline font-medium">
                    Log in
                  </Link>
                </p>

                <button
                  onClick={handleGoogle}
                  className="w-full flex items-center justify-center gap-3 border border-border rounded-xl py-3 mb-5 hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.118 17.64 11.84 17.64 9.2z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  Sign up with Google
                </button>

                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 border-t border-border" />
                  <span className="text-xs text-muted">or</span>
                  <div className="flex-1 border-t border-border" />
                </div>

                <form onSubmit={handleStep1} className="space-y-4">
                  <Input id="name" label="Your name" placeholder="Aisha" value={name} onChange={(e) => setName(e.target.value)} required />
                  <Input id="email" type="email" label="Email address" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  <Input id="password" type="password" label="Password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
                  <Button type="submit" className="w-full py-3" size="lg">
                    Continue <ChevronRight size={16} />
                  </Button>
                </form>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="text-3xl font-bold text-foreground mb-2">Choose your habits</h1>
                <p className="text-muted mb-6">Select the daily Islamic practices you want to build. You can change these anytime.</p>

                <div className="grid grid-cols-2 gap-2 mb-8">
                  {HABIT_OPTIONS.map((h) => {
                    const selected = selectedHabits.includes(h);
                    return (
                      <button
                        key={h}
                        onClick={() => toggleHabit(h)}
                        className={`text-left text-sm px-3 py-2.5 rounded-xl border transition-all ${selected ? "border-primary-500 bg-primary-50 text-primary-500 font-medium" : "border-border text-foreground hover:border-primary-500/50"}`}
                      >
                        {selected && "✓ "}{h}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 py-3">
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)} className="flex-1 py-3">
                    Continue <ChevronRight size={16} />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">🌟</span>
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-3">You&apos;re all set!</h1>
                <p className="text-muted mb-2">
                  Bismillah, <strong>{name || "dear Muslim"}</strong>. Your Jannatie journey starts now.
                </p>
                <p className="text-sm text-muted mb-8">
                  {selectedHabits.length > 0
                    ? `You&apos;ve chosen ${selectedHabits.length} daily habits. Let&apos;s build them together.`
                    : "You can add habits anytime from your dashboard."}
                </p>

                <Button
                  onClick={handleFinish}
                  className="w-full py-3 text-base"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Enter Jannatie →"}
                </Button>

                <p className="text-xs text-muted mt-5">
                  By continuing, you agree to our{" "}
                  <Link href="/terms" className="underline">Terms</Link> and{" "}
                  <Link href="/privacy" className="underline">Privacy Policy</Link>.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
