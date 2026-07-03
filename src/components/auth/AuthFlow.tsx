"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, limit } from "firebase/firestore";
import toast from "react-hot-toast";
import { Eye, EyeOff, Check, X, ChevronRight, ArrowLeft } from "lucide-react";
import { trackFunnelStep } from "@/lib/analytics-tracker";

const COUNTRY_CODES = [
  { code: "+44", name: "UK (+44)" },
  { code: "+1", name: "US/Canada (+1)" },
  { code: "+92", name: "Pakistan (+92)" },
  { code: "+880", name: "Bangladesh (+880)" },
  { code: "+91", name: "India (+91)" },
  { code: "+20", name: "Egypt (+20)" },
  { code: "+966", name: "Saudi Arabia (+966)" },
  { code: "+971", name: "UAE (+971)" },
  { code: "+49", name: "Germany (+49)" },
  { code: "+33", name: "France (+33)" },
  { code: "+31", name: "Netherlands (+31)" },
  { code: "+32", name: "Belgium (+32)" },
  { code: "+46", name: "Sweden (+46)" },
  { code: "+47", name: "Norway (+47)" },
  { code: "+45", name: "Denmark (+45)" },
  { code: "+353", name: "Ireland (+353)" },
  { code: "+90", name: "Turkey (+90)" },
  { code: "+60", name: "Malaysia (+60)" },
  { code: "+62", name: "Indonesia (+62)" },
  { code: "+234", name: "Nigeria (+234)" },
  { code: "+212", name: "Morocco (+212)" },
  { code: "+216", name: "Tunisia (+216)" },
  { code: "+213", name: "Algeria (+213)" },
  { code: "+249", name: "Sudan (+249)" },
  { code: "+252", name: "Somalia (+252)" },
  { code: "+964", name: "Iraq (+964)" },
  { code: "+962", name: "Jordan (+962)" },
  { code: "+961", name: "Lebanon (+961)" },
  { code: "+968", name: "Oman (+968)" },
  { code: "+974", name: "Qatar (+974)" },
  { code: "+965", name: "Kuwait (+965)" },
  { code: "+973", name: "Bahrain (+973)" },
  { code: "+967", name: "Yemen (+967)" },
  { code: "+98", name: "Iran (+98)" },
  { code: "+93", name: "Afghanistan (+93)" },
  { code: "+94", name: "Sri Lanka (+94)" },
  { code: "+977", name: "Nepal (+977)" },
  { code: "+61", name: "Australia (+61)" },
  { code: "+64", name: "New Zealand (+64)" },
  { code: "+27", name: "South Africa (+27)" },
  { code: "+254", name: "Kenya (+254)" },
  { code: "+255", name: "Tanzania (+255)" },
  { code: "+256", name: "Uganda (+256)" },
  { code: "+233", name: "Ghana (+233)" },
  { code: "+221", name: "Senegal (+221)" },
  { code: "+243", name: "DR Congo (+243)" },
  { code: "+86", name: "China (+86)" },
  { code: "+81", name: "Japan (+81)" },
  { code: "+82", name: "South Korea (+82)" },
  { code: "+65", name: "Singapore (+65)" },
  { code: "+63", name: "Philippines (+63)" },
  { code: "+66", name: "Thailand (+66)" },
  { code: "+55", name: "Brazil (+55)" },
  { code: "+7", name: "Russia (+7)" },
  { code: "+380", name: "Ukraine (+380)" },
  { code: "+48", name: "Poland (+48)" },
  { code: "+34", name: "Spain (+34)" },
  { code: "+39", name: "Italy (+39)" },
  { code: "+41", name: "Switzerland (+41)" },
];

const HABITS = [
  "5 Daily Prayers (Salah)",
  "Memorise Quran (Hifz)",
  "Morning Dhikr",
  "Evening Dhikr",
  "Fast (Monday & Thursday)",
  "Tahajjud",
  "Charity (daily)",
  "Seeking knowledge",
];

const HIFZ_PRESETS = [
  {
    id: "gentle",
    name: "Gentle",
    desc: "Perfect for starting out",
    amount: "5 ayat / day",
    completion: "~3.5 years to complete",
  },
  {
    id: "steady",
    name: "Steady",
    desc: "Building a consistent routine",
    amount: "10 ayat / day",
    completion: "~1.7 years to complete",
  },
  {
    id: "committed",
    name: "Committed",
    desc: "The traditional student pace",
    amount: "1 page / day",
    completion: "~13 months to complete",
  },
  {
    id: "intensive",
    name: "Intensive",
    desc: "For the dedicated student",
    amount: "2 pages / day",
    completion: "~7 months to complete",
  },
  {
    id: "custom",
    name: "Custom",
    desc: "Set your own goal",
    amount: "Your pace",
    completion: "",
  },
];

function getChecks(pw: string) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    symbol: /[^a-zA-Z0-9]/.test(pw),
  };
}

type View = "login" | "s1" | "s2" | "hifz" | "s3" | "forgot" | "google-username";

const variants = {
  enter: (d: number) => ({
    x: d * 52,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as number[] },
  },
  exit: (d: number) => ({
    x: -d * 52,
    opacity: 0,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as number[] },
  }),
};

const inputCls =
  "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.118 17.64 11.84 17.64 9.2z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center mb-7">
      {([1, 2, 3] as const).map((n, i) => (
        <div key={n} className="flex items-center flex-1 last:flex-none">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
              current > n
                ? "bg-blue-600 text-white"
                : current === n
                ? "bg-blue-600 text-white ring-4 ring-blue-100"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            {current > n ? <Check size={12} /> : n}
          </div>
          {i < 2 && (
            <div
              className={`flex-1 h-px mx-2 transition-colors duration-300 ${
                current > n + 1 ? "bg-blue-600" : "bg-slate-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function AuthFlow({
  initialView = "login",
}: {
  initialView?: "login" | "s1";
}) {
  const [view, setView] = useState<View>(initialView);
  const [dir, setDir] = useState(1);

  // Login
  const [username, setUsername] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup
  const [fullName, setFullName] = useState("");
  const [suUsername, setSuUsername] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [signupLoading, setSignupLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "taken" | "available"
  >("idle");
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Gender & phone (signup)
  const [gender, setGender] = useState<"" | "male" | "female">("");
  const [phoneCountry, setPhoneCountry] = useState("+44");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Hifz plan
  const [hifzPreset, setHifzPreset] = useState("");
  const [hifzAmount, setHifzAmount] = useState("");
  const [hifzUnit, setHifzUnit] = useState<"ayat" | "pages">("ayat");

  // Forgot password
  const [fpEmail, setFpEmail] = useState("");
  const [fpSent, setFpSent] = useState(false);
  const [fpLoading, setFpLoading] = useState(false);

  // Google username pick
  const [gUsername, setGUsername] = useState("");
  const [gUsernameStatus, setGUsernameStatus] = useState<"idle" | "checking" | "taken" | "available">("idle");
  const gUsernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [gUsernameLoading, setGUsernameLoading] = useState(false);

  const { signIn, signUp, signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";

  const checks = getChecks(pw);
  const allValid = checks.length && checks.upper && checks.symbol;
  const pwMatch = confirmPw.length > 0 && pw === confirmPw;

  function go(to: View, forward = true) {
    setDir(forward ? 1 : -1);
    setView(to);
  }

  function handleUsernameChange(val: string) {
    const v = val
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 14);
    setSuUsername(v);
    setUsernameStatus("idle");
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    if (v.length < 5) return;
    setUsernameStatus("checking");
    usernameTimer.current = setTimeout(async () => {
      const snap = await getDocs(
        query(collection(db, "users"), where("username", "==", v), limit(1))
      );
      setUsernameStatus(snap.empty ? "available" : "taken");
    }, 500);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const snap = await getDocs(
        query(
          collection(db, "users"),
          where("username", "==", username.toLowerCase().trim())
        )
      );
      if (snap.empty) {
        toast.error("No account found with that username.");
        return;
      }
      await signIn(snap.docs[0].data().email, loginPw);
      toast.success("Welcome back!");
      router.push(redirectTo);
    } catch {
      toast.error("Incorrect username or password.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleGoogle() {
    try {
      await signInWithGoogle();
      const uid = auth.currentUser?.uid;
      if (uid) {
        const snap = await getDoc(doc(db, "users", uid));
        if (!snap.exists() || !snap.data()?.username) {
          go("google-username");
          return;
        }
      }
      router.push(redirectTo);
    } catch {
      toast.error("Google sign-in failed. Please try again.");
    }
  }

  function handleGUsernameChange(val: string) {
    const v = val.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 14);
    setGUsername(v);
    setGUsernameStatus("idle");
    if (gUsernameTimer.current) clearTimeout(gUsernameTimer.current);
    if (v.length < 5) return;
    setGUsernameStatus("checking");
    gUsernameTimer.current = setTimeout(async () => {
      const snap = await getDocs(query(collection(db, "users"), where("username", "==", v), limit(1)));
      setGUsernameStatus(snap.empty ? "available" : "taken");
    }, 500);
  }

  async function handleGUsernameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (gUsername.length < 5) { toast.error("Username must be at least 5 characters."); return; }
    if (gUsernameStatus === "taken") { toast.error("That username is already taken."); return; }
    if (gUsernameStatus === "checking") { toast.error("Still checking availability. Please wait."); return; }
    const uid = auth.currentUser?.uid;
    if (!uid) { toast.error("Session expired. Please sign in again."); go("login", false); return; }
    setGUsernameLoading(true);
    try {
      await updateDoc(doc(db, "users", uid), { username: gUsername });
      trackFunnelStep("signed_up");
      trackFunnelStep("completed_onboarding");
      toast.success("Username set!");
      router.push(redirectTo);
    } catch {
      toast.error("Failed to save username. Please try again.");
    } finally {
      setGUsernameLoading(false);
    }
  }

  function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!gender) {
      toast.error("Please select your gender to continue.");
      return;
    }
    if (suUsername.length < 5) {
      toast.error("Username must be at least 5 characters.");
      return;
    }
    if (usernameStatus === "taken") {
      toast.error("That username is already taken.");
      return;
    }
    if (usernameStatus === "checking") {
      toast.error("Still checking username availability. Please wait.");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }
    if (!allValid) {
      toast.error("Password doesn't meet all requirements.");
      return;
    }
    if (pw !== confirmPw) {
      toast.error("Passwords don't match.");
      return;
    }
    go("s2");
  }

  async function handleSignup() {
    setSignupLoading(true);
    try {
      await signUp(email, pw, fullName, suUsername);
      const uid = auth.currentUser?.uid;
      if (uid) {
        const extra: Record<string, unknown> = {
          habits: selectedHabits,
          gender,
        };
        if (phoneNumber.trim()) {
          extra.phone = `${phoneCountry}${phoneNumber.trim()}`;
        }
        if (selectedHabits.includes("Memorise Quran (Hifz)") && hifzPreset) {
          extra.hifzPlan = {
            preset: hifzPreset,
            ...(hifzPreset === "custom"
              ? { amount: parseInt(hifzAmount) || 0, unit: hifzUnit }
              : {}),
          };
        }
        await updateDoc(doc(db, "users", uid), extra);
      }
      trackFunnelStep("signed_up");
      trackFunnelStep("completed_onboarding");
      if (selectedHabits.length > 0) trackFunnelStep("started_habit_plan");
      toast.success("Bismillah! Welcome to Jannatie.");
      router.push(redirectTo);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Sign up failed. Please try again."
      );
    } finally {
      setSignupLoading(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setFpLoading(true);
    try {
      const res = await fetch("/api/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail.trim() }),
      });
      if (!res.ok) throw new Error("failed");
      setFpSent(true);
    } catch {
      toast.error("No account found with that email address.");
    } finally {
      setFpLoading(false);
    }
  }

  function toggleHabit(h: string) {
    setSelectedHabits((prev) =>
      prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h]
    );
  }

  return (
    <div className="min-h-screen bg-white relative flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.4,
        }}
      />
      {/* Top gradient wash */}
      <div className="absolute top-0 inset-x-0 h-80 bg-gradient-to-b from-blue-50/70 to-transparent pointer-events-none" />

      <div className="relative w-full max-w-[440px]">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center justify-center gap-2 mb-8 group"
        >
          <Image
            src="/images/logo-black.PNG"
            alt="Jannatie"
            width={26}
            height={26}
            className="object-contain"
          />
          <span className="text-xl font-bold text-slate-900">Jannatie</span>
        </Link>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/70 ring-1 ring-slate-100 overflow-hidden">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={view}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              className="p-8"
            >
              {/* ─── LOGIN ─── */}
              {view === "login" && (
                <>
                  <h1 className="text-2xl font-bold text-slate-900 mb-1">
                    Welcome back
                  </h1>
                  <p className="text-slate-500 text-sm mb-6">
                    No account?{" "}
                    <button
                      onClick={() => go("s1")}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      Sign up free
                    </button>
                  </p>

                  <button
                    type="button"
                    onClick={handleGoogle}
                    className="w-full flex items-center justify-center gap-3 border border-slate-200 rounded-xl py-3 mb-5 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
                  >
                    <GoogleIcon />
                    Continue with Google
                  </button>

                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex-1 border-t border-slate-100" />
                    <span className="text-xs text-slate-400">or</span>
                    <div className="flex-1 border-t border-slate-100" />
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Username
                      </label>
                      <input
                        className={inputCls}
                        type="text"
                        placeholder="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoComplete="username"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => go("forgot")}
                          className="text-xs text-blue-600"
                        >
                          Forgot?
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          className={inputCls + " pr-11"}
                          type={showLoginPw ? "text" : "password"}
                          placeholder="enter your password"
                          value={loginPw}
                          onChange={(e) => setLoginPw(e.target.value)}
                          required
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPw((v) => !v)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          aria-label="Toggle password"
                        >
                          {showLoginPw ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm disabled:opacity-60"
                    >
                      {loginLoading ? "Signing in..." : "Sign in"}
                    </button>
                  </form>

                  <p className="text-center text-xs text-slate-400 mt-5">
                    By signing in you agree to our{" "}
                    <Link href="/terms" className="underline">
                      Terms
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="underline">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </>
              )}

              {/* ─── SIGNUP STEP 1 ─── */}
              {view === "s1" && (
                <>
                  <StepIndicator current={1} />

                  <h1 className="text-2xl font-bold text-slate-900 mb-1">
                    Create your account
                  </h1>
                  <p className="text-slate-500 text-sm mb-5">
                    Already have one?{" "}
                    <button
                      onClick={() => go("login", false)}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      Log in
                    </button>
                  </p>

                  <button
                    type="button"
                    onClick={handleGoogle}
                    className="w-full flex items-center justify-center gap-3 border border-slate-200 rounded-xl py-3 mb-5 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
                  >
                    <GoogleIcon />
                    Continue with Google
                  </button>

                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex-1 border-t border-slate-100" />
                    <span className="text-xs text-slate-400">or</span>
                    <div className="flex-1 border-t border-slate-100" />
                  </div>

                  <form onSubmit={handleStep1} className="space-y-3.5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Full name
                      </label>
                      <input
                        className={inputCls}
                        placeholder="Your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        What&apos;s your gender? <span className="text-red-400">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(["male", "female"] as const).map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setGender(g)}
                            className={`py-2.5 rounded-xl border text-sm font-medium transition-all capitalize ${
                              gender === g
                                ? "border-blue-600 bg-blue-50 text-blue-700"
                                : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            {g === "male" ? "Male" : "Female"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Username
                      </label>
                      <input
                        className={inputCls}
                        placeholder="Enter a username"
                        value={suUsername}
                        onChange={(e) =>
                          handleUsernameChange(e.target.value)
                        }
                        required
                      />
                      <div className="mt-1 h-4">
                        {usernameStatus === "checking" && (
                          <p className="text-xs text-slate-400">Checking...</p>
                        )}
                        {usernameStatus === "taken" && (
                          <div className="flex items-center gap-1">
                            <X size={10} className="text-red-400" />
                            <p className="text-xs text-red-500">
                              Already taken
                            </p>
                          </div>
                        )}
                        {usernameStatus === "available" && (
                          <div className="flex items-center gap-1">
                            <Check size={10} className="text-emerald-500" />
                            <p className="text-xs text-emerald-600">
                              Available
                            </p>
                          </div>
                        )}
                        {usernameStatus === "idle" && (
                          <p className="text-xs text-slate-400">
                            5–14 chars
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Email
                      </label>
                      <input
                        className={inputCls}
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          className={inputCls + " pr-11"}
                          type={showPw ? "text" : "password"}
                          placeholder="Create a password"
                          value={pw}
                          onChange={(e) => setPw(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((v) => !v)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          aria-label="Toggle password"
                        >
                          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {pw.length > 0 && (
                        <div className="mt-2 flex flex-col gap-0.5">
                          {[
                            { label: "8+ characters", pass: checks.length },
                            { label: "One capital letter", pass: checks.upper },
                            { label: "One symbol", pass: checks.symbol },
                          ].map(({ label, pass }) => (
                            <div
                              key={label}
                              className="flex items-center gap-1.5"
                            >
                              {pass ? (
                                <Check
                                  size={10}
                                  className="text-emerald-500 flex-shrink-0"
                                />
                              ) : (
                                <X
                                  size={10}
                                  className="text-red-400 flex-shrink-0"
                                />
                              )}
                              <span
                                className={`text-xs ${
                                  pass ? "text-emerald-600" : "text-red-400"
                                }`}
                              >
                                {label}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Confirm password
                      </label>
                      <div className="relative">
                        <input
                          className={inputCls + " pr-11"}
                          type={showConfirm ? "text" : "password"}
                          placeholder="Repeat your password"
                          value={confirmPw}
                          onChange={(e) => setConfirmPw(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((v) => !v)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          aria-label="Toggle password"
                        >
                          {showConfirm ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                      {confirmPw.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          {pwMatch ? (
                            <Check size={10} className="text-emerald-500" />
                          ) : (
                            <X size={10} className="text-red-400" />
                          )}
                          <span
                            className={`text-xs ${
                              pwMatch ? "text-emerald-600" : "text-red-400"
                            }`}
                          >
                            {pwMatch
                              ? "Passwords match"
                              : "Passwords don't match"}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={usernameStatus === "checking" || usernameStatus === "taken"}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-1.5 mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {usernameStatus === "checking" ? "Checking username..." : <>Continue <ChevronRight size={15} /></>}
                    </button>
                  </form>
                </>
              )}

              {/* ─── SIGNUP STEP 2 ─── */}
              {view === "s2" && (
                <>
                  <StepIndicator current={2} />

                  <h1 className="text-2xl font-bold text-slate-900 mb-1">
                    Your daily habits
                  </h1>
                  <p className="text-slate-500 text-sm mb-5">
                    Pick what you want to build. You can change these anytime.
                  </p>

                  <div className="grid grid-cols-2 gap-2 mb-6">
                    {HABITS.map((h) => {
                      const sel = selectedHabits.includes(h);
                      return (
                        <button
                          key={h}
                          type="button"
                          onClick={() => toggleHabit(h)}
                          className={`text-left text-xs px-3 py-2.5 rounded-xl border transition-all leading-snug flex items-start gap-2 ${
                            sel
                              ? "border-blue-600 bg-blue-50 text-blue-700 font-medium"
                              : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border transition-colors ${
                              sel
                                ? "bg-blue-600 border-blue-600"
                                : "border-slate-300"
                            }`}
                          >
                            {sel && (
                              <Check size={9} className="text-white" />
                            )}
                          </span>
                          {h}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => go("s1", false)}
                      className="flex-1 border border-slate-200 text-slate-600 font-semibold py-3 rounded-xl hover:bg-slate-50 transition-colors text-sm flex items-center justify-center gap-1.5"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        selectedHabits.includes("Memorise Quran (Hifz)")
                          ? go("hifz")
                          : go("s3")
                      }
                      className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-1.5"
                    >
                      Continue <ChevronRight size={15} />
                    </button>
                  </div>
                </>
              )}

              {/* ─── HIFZ PLAN ─── */}
              {view === "hifz" && (
                <>
                  <StepIndicator current={2} />

                  <h1 className="text-2xl font-bold text-slate-900 mb-1">
                    Your Hifz plan
                  </h1>
                  <p className="text-slate-500 text-sm mb-5">
                    How much would you like to memorise each day? You can adjust this anytime.
                  </p>

                  <div className="space-y-2 mb-5">
                    {HIFZ_PRESETS.map((plan) => {
                      const sel = hifzPreset === plan.id;
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setHifzPreset(plan.id)}
                          className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all ${
                            sel
                              ? "border-blue-600 bg-blue-50"
                              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className={`text-sm font-semibold ${sel ? "text-blue-700" : "text-slate-900"}`}>
                                {plan.name}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">{plan.desc}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className={`text-sm font-bold ${sel ? "text-blue-600" : "text-slate-700"}`}>
                                {plan.amount}
                              </p>
                              {plan.completion && (
                                <p className="text-xs text-slate-400">{plan.completion}</p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {hifzPreset === "custom" && (
                    <div className="mb-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-sm font-medium text-slate-700 mb-3">How much per day?</p>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          placeholder="e.g. 3"
                          value={hifzAmount}
                          onChange={(e) => setHifzAmount(e.target.value)}
                          className={inputCls + " flex-1"}
                        />
                        <div className="flex border border-slate-200 rounded-xl overflow-hidden">
                          {(["ayat", "pages"] as const).map((u) => (
                            <button
                              key={u}
                              type="button"
                              onClick={() => setHifzUnit(u)}
                              className={`px-4 text-sm font-medium transition-colors ${
                                hifzUnit === u
                                  ? "bg-blue-600 text-white"
                                  : "bg-white text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              {u}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {!hifzPreset && (
                    <button
                      type="button"
                      onClick={() => setHifzPreset("gentle")}
                      className="text-xs text-blue-600 hover:underline mb-4 block"
                    >
                      Not sure? Start with Gentle (5 ayat/day)
                    </button>
                  )}

                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => go("s2", false)}
                      className="flex-1 border border-slate-200 text-slate-600 font-semibold py-3 rounded-xl hover:bg-slate-50 transition-colors text-sm flex items-center justify-center gap-1.5"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <button
                      type="button"
                      disabled={!hifzPreset || (hifzPreset === "custom" && !hifzAmount)}
                      onClick={() => go("s3")}
                      className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Continue <ChevronRight size={15} />
                    </button>
                  </div>
                </>
              )}

              {/* ─── SIGNUP STEP 3 ─── */}
              {view === "s3" && (
                <>
                  <StepIndicator current={3} />

                  <div className="text-center pt-2 pb-4">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
                      <Check size={28} className="text-blue-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">
                      You&apos;re all set!
                    </h1>
                    <p className="text-slate-500 text-sm mb-1">
                      Bismillah,{" "}
                      <strong className="text-slate-800">
                        {fullName || "dear Muslim"}
                      </strong>
                      .
                    </p>
                    <p className="text-slate-400 text-sm mb-6">
                      {selectedHabits.length > 0
                        ? `${selectedHabits.length} habit${
                            selectedHabits.length > 1 ? "s" : ""
                          } ready to build.`
                        : "You can add habits from your dashboard anytime."}
                    </p>

                    {/* Phone number — optional */}
                    <div className="text-left mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Phone number <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <p className="text-xs text-slate-400 mb-2.5">
                        Add your number so friends can send you habit reminders via SMS.
                      </p>
                      <div className="flex gap-2">
                        <select
                          value={phoneCountry}
                          onChange={(e) => setPhoneCountry(e.target.value)}
                          className="border border-slate-200 rounded-xl px-2 py-2.5 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0 max-w-[140px]"
                        >
                          {COUNTRY_CODES.map(({ code, name }) => (
                            <option key={code} value={code}>{name}</option>
                          ))}
                        </select>
                        <input
                          type="tel"
                          placeholder="7911 123456"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9\s\-]/g, ""))}
                          className={inputCls + " flex-1"}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSignup}
                      disabled={signupLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm disabled:opacity-60 mb-3"
                    >
                      {signupLoading
                        ? "Creating account..."
                        : "Enter Jannatie →"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        selectedHabits.includes("Memorise Quran (Hifz)")
                          ? go("hifz", false)
                          : go("s2", false)
                      }
                      className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Back
                    </button>

                    <p className="text-xs text-slate-400 mt-5">
                      By continuing you agree to our{" "}
                      <Link href="/terms" className="underline">
                        Terms
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="underline">
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </div>
                </>
              )}

              {/* ─── FORGOT PASSWORD ─── */}
              {view === "forgot" && (
                <>
                  {!fpSent ? (
                    <>
                      <button
                        type="button"
                        onClick={() => go("login", false)}
                        className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 transition-colors text-sm mb-6"
                      >
                        <ArrowLeft size={14} /> Back to login
                      </button>

                      <h1 className="text-2xl font-bold text-slate-900 mb-2">
                        Reset your password
                      </h1>
                      <p className="text-slate-500 text-sm mb-6">
                        Enter the email linked to your account and we&apos;ll
                        send a reset link.
                      </p>

                      <form
                        onSubmit={handleForgotPassword}
                        className="space-y-4"
                      >
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Email address
                          </label>
                          <input
                            className={inputCls}
                            type="email"
                            placeholder="your@email.com"
                            value={fpEmail}
                            onChange={(e) => setFpEmail(e.target.value)}
                            required
                            autoComplete="email"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={fpLoading}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm disabled:opacity-60"
                        >
                          {fpLoading ? "Sending..." : "Send reset link"}
                        </button>
                      </form>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
                        <Check size={28} className="text-emerald-500" />
                      </div>
                      <h1 className="text-2xl font-bold text-slate-900 mb-3">
                        Check your inbox
                      </h1>
                      <p className="text-slate-500 text-sm leading-relaxed mb-8">
                        We sent a reset link to{" "}
                        <strong className="text-slate-900">{fpEmail}</strong>.
                        Check your spam folder if you don&apos;t see it.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setFpSent(false);
                          setFpEmail("");
                          go("login", false);
                        }}
                        className="flex items-center justify-center gap-1.5 text-sm text-blue-600 hover:underline font-medium w-full"
                      >
                        <ArrowLeft size={14} /> Back to login
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* ─── GOOGLE USERNAME PICK ─── */}
              {view === "google-username" && (
                <>
                  <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
                    <GoogleIcon />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center">
                    One last step
                  </h1>
                  <p className="text-slate-500 text-sm mb-6 text-center">
                    Choose a username for your Jannatie account. You&apos;ll use this to log in.
                  </p>

                  <form onSubmit={handleGUsernameSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Username
                      </label>
                      <input
                        className={inputCls}
                        placeholder="Enter a username"
                        value={gUsername}
                        onChange={(e) => handleGUsernameChange(e.target.value)}
                        required
                        autoFocus
                      />
                      <div className="mt-1 h-4">
                        {gUsernameStatus === "checking" && (
                          <p className="text-xs text-slate-400">Checking...</p>
                        )}
                        {gUsernameStatus === "taken" && (
                          <div className="flex items-center gap-1">
                            <X size={10} className="text-red-400" />
                            <p className="text-xs text-red-500">Already taken</p>
                          </div>
                        )}
                        {gUsernameStatus === "available" && (
                          <div className="flex items-center gap-1">
                            <Check size={10} className="text-emerald-500" />
                            <p className="text-xs text-emerald-600">Available</p>
                          </div>
                        )}
                        {gUsernameStatus === "idle" && (
                          <p className="text-xs text-slate-400">
                            5–14 chars
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={gUsernameLoading || gUsernameStatus === "taken" || gUsernameStatus === "checking"}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm disabled:opacity-60"
                    >
                      {gUsernameLoading ? "Saving..." : "Continue to Jannatie →"}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
