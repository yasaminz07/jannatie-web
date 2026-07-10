"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import toast from "react-hot-toast";
import {
  User, Bell, CreditCard, Shield, Trash2, ChevronRight,
  Check, X, Crown, Zap, Users2, ChevronDown, LifeBuoy, Eye, EyeOff, AlertTriangle,
} from "lucide-react";
import {
  collection, query, where, getDocs, getDoc, doc, updateDoc, deleteDoc, limit,
} from "firebase/firestore";
import {
  updateEmail, RecaptchaVerifier, linkWithPhoneNumber,
  unlink, PhoneAuthProvider,
  updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser,
  type ConfirmationResult,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { sendSecurityEmail } from "@/lib/security-email";
import { motion, AnimatePresence } from "framer-motion";

function getPwChecks(pw: string) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    symbol: /[^a-zA-Z0-9]/.test(pw),
  };
}

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
  { code: "+968", name: "Oman (+968)" },
  { code: "+974", name: "Qatar (+974)" },
  { code: "+965", name: "Kuwait (+965)" },
  { code: "+973", name: "Bahrain (+973)" },
  { code: "+967", name: "Yemen (+967)" },
  { code: "+93", name: "Afghanistan (+93)" },
  { code: "+94", name: "Sri Lanka (+94)" },
  { code: "+61", name: "Australia (+61)" },
  { code: "+27", name: "South Africa (+27)" },
  { code: "+254", name: "Kenya (+254)" },
  { code: "+233", name: "Ghana (+233)" },
  { code: "+55", name: "Brazil (+55)" },
  { code: "+65", name: "Singapore (+65)" },
];

const glassCard = {
  background: "rgba(255, 255, 255, 0.65)",
  border: "1px solid rgba(255, 255, 255, 0.80)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 4px 24px rgba(15, 23, 42, 0.07)",
} as const;

function NewsletterSection({ email }: { email: string }) {
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [actioning, setActioning] = useState(false);

  useEffect(() => {
    if (!email) return;
    getDoc(doc(db, "newsletterSubscribers", email.toLowerCase()))
      .then(snap => setSubscribed(snap.exists()))
      .catch(() => setSubscribed(false));
  }, [email]);

  async function handleUnsubscribe() {
    if (!email || actioning) return;
    setActioning(true);
    try {
      await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSubscribed(false);
      toast.success("Unsubscribed from newsletter.");
    } catch {
      toast.error("Couldn't unsubscribe. Please try again.");
    } finally {
      setActioning(false);
    }
  }

  async function handleSubscribe() {
    if (!email || actioning) return;
    setActioning(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setSubscribed(true);
      toast.success("Subscribed to newsletter!");
    } catch {
      toast.error("Couldn't subscribe. Please try again.");
    } finally {
      setActioning(false);
    }
  }

  return (
    <div className="rounded-2xl p-6 mb-4" style={glassCard}>
      <div className="flex items-center gap-2 mb-4">
        <Bell size={17} className="text-blue-600" />
        <h2 className="font-semibold text-slate-800">Email Preferences</h2>
      </div>
      <div className="flex items-center justify-between py-2.5 px-3 rounded-xl">
        <div>
          <p className="text-sm font-medium text-slate-700">Jannatie newsletter</p>
          <p className="text-xs text-slate-400 mt-0.5">Islamic tips, updates &amp; new features</p>
        </div>
        {subscribed === null ? (
          <span className="text-xs text-slate-300">...</span>
        ) : subscribed ? (
          <button
            onClick={handleUnsubscribe}
            disabled={actioning}
            className="text-xs font-semibold text-red-500 hover:text-red-600 disabled:opacity-50 transition-colors"
          >
            {actioning ? "..." : "Unsubscribe"}
          </button>
        ) : (
          <button
            onClick={handleSubscribe}
            disabled={actioning}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors"
          >
            {actioning ? "..." : "Subscribe"}
          </button>
        )}
      </div>
    </div>
  );
}

const inputCls = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white";

function daysUntilAllowed(lastChangedIso: string | undefined, cooldownDays: number): number {
  if (!lastChangedIso) return 0;
  const elapsed = Date.now() - new Date(lastChangedIso).getTime();
  const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((cooldownMs - elapsed) / (24 * 60 * 60 * 1000)));
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors ${value ? "bg-blue-600" : "bg-slate-200"}`}
    >
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

const UPGRADE_PLANS = [
  {
    name: "Premium",
    monthly: 4.99,
    annual: 49.99,
    description: "Unlimited growth for serious learners.",
    popular: true,
    icon: Zap,
    features: [
      "Everything in Free",
      "Unlimited AI Buddy messages",
      "Unlimited lessons & topics",
      "Full analytics dashboard",
      "Offline mode (PWA)",
      "Streak Shield weekly pass",
      "Priority support",
    ],
    plan: "premium",
  },
  {
    name: "Family",
    monthly: 9.99,
    annual: 79.99,
    description: "Up to 5 accounts. Grow together.",
    popular: false,
    icon: Users2,
    features: [
      "5 separate family accounts",
      "All Premium features",
      "Family dashboard & leaderboard",
      "Shared calendar events",
      "Parental controls",
      "One shared billing",
    ],
    plan: "family",
  },
];

function CancelPremiumButton({ uid }: { uid: string }) {
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function handleCancel() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success("Subscription will cancel at the end of your billing period.");
      setConfirm(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not cancel subscription. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="text-xs text-rose-500 hover:text-rose-600 font-semibold transition-colors"
      >
        Cancel subscription
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500">Are you sure?</span>
      <button
        onClick={handleCancel}
        disabled={loading}
        className="text-xs text-rose-600 font-semibold hover:text-rose-700 transition-colors disabled:opacity-60"
      >
        {loading ? "Cancelling…" : "Yes, cancel"}
      </button>
      <button
        onClick={() => setConfirm(false)}
        className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
      >
        Keep it
      </button>
    </div>
  );
}

function UpgradeModal({ onClose }: { onClose: () => void }) {
  const [annual, setAnnual] = useState(false);
  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          border: "1px solid rgba(255,255,255,0.95)",
          boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Upgrade your plan</h2>
            <p className="text-sm text-slate-400 mt-0.5">Unlock unlimited Islamic growth</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <X size={15} className="text-slate-500" />
          </button>
        </div>

        {/* Toggle */}
        <div className="flex justify-center py-4 border-b border-slate-100">
          <div className="flex items-center gap-1 bg-slate-100 rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${!annual ? "bg-white shadow text-slate-900" : "text-slate-500"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${annual ? "bg-white shadow text-slate-900" : "text-slate-500"}`}
            >
              Annual
              <span className="text-[10px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">Save 33%</span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
          {UPGRADE_PLANS.map(({ name, monthly, annual: annualPrice, description, popular, icon: Icon, features, plan }) => {
            const price = annual ? (annualPrice / 12).toFixed(2) : monthly.toFixed(2);
            return (
              <div
                key={name}
                className={`relative rounded-2xl p-5 flex flex-col border ${popular ? "border-blue-400 bg-blue-50/60" : "border-slate-200 bg-white"}`}
              >
                {popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={16} className={popular ? "text-blue-600" : "text-slate-600"} />
                  <h3 className="font-bold text-slate-900">{name}</h3>
                </div>
                <p className="text-xs text-slate-400 mb-3">{description}</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-slate-900">£{price}</span>
                  <span className="text-xs text-slate-400 ml-1">/mo</span>
                  {annual && (
                    <p className="text-[11px] text-slate-400">Billed as £{annualPrice}/year</p>
                  )}
                </div>
                <ul className="space-y-1.5 mb-5 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-slate-600">
                      <Check size={12} className="text-blue-500 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={`/checkout?plan=${plan}&interval=${annual ? "annual" : "monthly"}`}
                  className={`block text-center text-sm font-semibold py-2.5 rounded-xl transition-colors ${
                    popular
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                  }`}
                >
                  Get {name}
                </a>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-slate-400 pb-4">
          Cancel anytime · Secure payment via Stripe
        </p>
      </motion.div>
    </div>
  );
}

type EditField = "name" | "username" | "phone" | "email" | "gender" | "password" | null;

export default function SettingsPage() {
  const { profile, user, logOut } = useAuth();
  const router = useRouter();
  const [expandedField, setExpandedField] = useState<EditField>(null);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [prayerReminders, setPrayerReminders] = useState(true);
  const [habitReminders, setHabitReminders] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Name edit
  const [newName, setNewName] = useState(profile?.displayName ?? "");
  const [savingName, setSavingName] = useState(false);
  const nameDaysLeft = daysUntilAllowed(profile?.nameLastChanged, 30);

  // Username edit
  const [newUsername, setNewUsername] = useState(profile?.username ?? "");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "taken" | "available">("idle");
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [savingUsername, setSavingUsername] = useState(false);
  const usernameDaysLeft = daysUntilAllowed(profile?.usernameLastChanged, 14);

  // Phone edit — multi-step OTP verification
  const existingPhone = profile?.phone ?? "";
  const existingCountry = COUNTRY_CODES.find((c) => existingPhone.startsWith(c.code))?.code ?? "+44";
  const existingNumber = existingPhone.startsWith(existingCountry) ? existingPhone.slice(existingCountry.length) : existingPhone;
  const [phoneCountry, setPhoneCountry] = useState(existingCountry);
  const [phoneNumber, setPhoneNumber] = useState(existingNumber);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const countryBtnRef = useRef<HTMLButtonElement>(null);
  const [pickerRect, setPickerRect] = useState<{ top: number; left: number } | null>(null);
  const [phoneStep, setPhoneStep] = useState<"enter" | "verify">("enter");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [confirmingOtp, setConfirmingOtp] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [confirmRemovePhone, setConfirmRemovePhone] = useState(false);
  const [removingPhone, setRemovingPhone] = useState(false);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  // Email edit
  const [newEmail, setNewEmail] = useState(user?.email ?? "");
  const [savingEmail, setSavingEmail] = useState(false);

  // Gender edit
  const [newGender, setNewGender] = useState<"" | "male" | "female">(profile?.gender ?? "");
  const [savingGender, setSavingGender] = useState(false);

  // Password change
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmNewPw, setConfirmNewPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmNewPw, setShowConfirmNewPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const hasPasswordProvider = user?.providerData.some((p) => p.providerId === "password") ?? false;
  const pwChecks = getPwChecks(newPw);
  const pwAllValid = pwChecks.length && pwChecks.upper && pwChecks.symbol;
  const pwMatch = confirmNewPw.length > 0 && newPw === confirmNewPw;

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePw, setDeletePw] = useState("");
  const [showDeletePw, setShowDeletePw] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const initials = (profile?.displayName ?? "J").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  // Close country picker on outside click
  useEffect(() => {
    if (!showCountryPicker) return;
    function handleClick(e: MouseEvent) {
      if (countryBtnRef.current && !countryBtnRef.current.contains(e.target as Node)) {
        setShowCountryPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showCountryPicker]);

  function toggle(field: EditField) {
    setExpandedField((prev) => (prev === field ? null : field));
    setUsernameStatus("idle");
    setNewName(profile?.displayName ?? "");
    setNewUsername(profile?.username ?? "");
    setNewGender(profile?.gender ?? "");
  }

  const handleUsernameInput = useCallback((val: string) => {
    const v = val.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 14);
    setNewUsername(v);
    setUsernameStatus("idle");
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    if (v.length < 5 || v === profile?.username) return;
    setUsernameStatus("checking");
    usernameTimer.current = setTimeout(async () => {
      const snap = await getDocs(query(collection(db, "users"), where("username", "==", v), limit(1)));
      setUsernameStatus(snap.empty ? "available" : "taken");
    }, 500);
  }, [profile?.username]);

  async function saveName() {
    if (!user || !newName.trim() || nameDaysLeft > 0) return;
    setSavingName(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: newName.trim(),
        nameLastChanged: new Date().toISOString(),
      });
      if (user.email) {
        await sendSecurityEmail(user.email, "name", newName.trim(), newName.trim());
      }
      toast.success("Name updated!");
      setExpandedField(null);
    } catch {
      toast.error("Failed to update name.");
    } finally {
      setSavingName(false);
    }
  }

  async function saveUsername() {
    if (!user || newUsername.length < 5 || usernameDaysLeft > 0) return;
    if (usernameStatus === "taken") { toast.error("That username is already taken."); return; }
    if (usernameStatus === "checking") { toast.error("Still checking availability."); return; }
    if (newUsername === profile?.username) { setExpandedField(null); return; }
    setSavingUsername(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        username: newUsername,
        usernameLastChanged: new Date().toISOString(),
      });
      if (user.email) {
        await sendSecurityEmail(user.email, "username", newUsername, profile?.displayName ?? undefined);
      }
      toast.success("Username updated!");
      setExpandedField(null);
    } catch {
      toast.error("Failed to update username.");
    } finally {
      setSavingUsername(false);
    }
  }

  function startResendCooldown() {
    setResendCooldown(60);
    const t = setInterval(() => {
      setResendCooldown((v) => { if (v <= 1) { clearInterval(t); return 0; } return v - 1; });
    }, 1000);
  }

  function initRecaptcha() {
    if (recaptchaRef.current) {
      try { recaptchaRef.current.clear(); } catch { /* ignore */ }
      recaptchaRef.current = null;
    }
    // Wipe DOM widget — clear() removes it from Firebase registry but leaves the HTML element
    const container = document.getElementById("phone-recaptcha");
    if (container) container.innerHTML = "";
    recaptchaRef.current = new RecaptchaVerifier(auth, "phone-recaptcha", { size: "invisible" });
  }

  async function sendOtp() {
    if (!auth.currentUser || !phoneNumber.trim()) return;
    const fullPhone = `${phoneCountry}${phoneNumber.trim()}`;
    setSendingOtp(true);
    setOtpError(null);
    try {
      initRecaptcha();
      // Unlink existing phone provider if already linked, so we can re-link with new number
      const linked = auth.currentUser.providerData.some(p => p.providerId === PhoneAuthProvider.PROVIDER_ID);
      if (linked) await unlink(auth.currentUser, PhoneAuthProvider.PROVIDER_ID);
      confirmationRef.current = await linkWithPhoneNumber(auth.currentUser, fullPhone, recaptchaRef.current!);
      setPhoneStep("verify");
      setOtpInput("");
      startResendCooldown();
      toast.success("Verification code sent to your phone!");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      console.error("[Phone OTP] error code:", code, "| message:", (err as Error).message, "| full:", err);
      if (code === "auth/operation-not-allowed") {
        toast.error("Could not send code. Hard-refresh the page (Ctrl+Shift+R) and try again.");
      } else if (code === "auth/invalid-phone-number") {
        setOtpError("Invalid phone number. Check the format and try again.");
      } else if (code === "auth/too-many-requests") {
        setOtpError("Too many attempts. Please wait a few minutes and try again.");
      } else if (code === "auth/credential-already-in-use") {
        setOtpError("This number is already linked to another account.");
      } else if (code === "auth/captcha-check-failed" || code === "auth/web-storage-unsupported") {
        setOtpError("reCAPTCHA check failed. Make sure third-party cookies are not blocked.");
      } else if (code === "auth/requires-recent-login") {
        toast.error("Session expired — please sign out and sign back in, then try again.");
      } else {
        toast.error(`Error: ${code ?? (err as Error).message ?? "unknown"}`, { duration: 8000 });
      }
      // Reset recaptcha on error so it can be reused
      recaptchaRef.current?.clear();
      recaptchaRef.current = null;
    } finally {
      setSendingOtp(false);
    }
  }

  async function confirmOtp() {
    if (!user || !confirmationRef.current || otpInput.length !== 6) return;
    const fullPhone = `${phoneCountry}${phoneNumber.trim()}`;
    setConfirmingOtp(true);
    setOtpError(null);
    try {
      await confirmationRef.current.confirm(otpInput);
      await updateDoc(doc(db, "users", user.uid), { phone: fullPhone });
      if (user.email) {
        await sendSecurityEmail(user.email, "phone", fullPhone, profile?.displayName ?? undefined);
      }
      toast.success("Phone number verified and saved!");
      setExpandedField(null);
      setPhoneStep("enter");
      setOtpInput("");
      confirmationRef.current = null;
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/invalid-verification-code") setOtpError("Incorrect code. Please try again.");
      else if (code === "auth/code-expired") setOtpError("Code has expired. Please request a new one.");
      else setOtpError("Verification failed. Please try again.");
    } finally {
      setConfirmingOtp(false);
    }
  }

  async function removePhone() {
    if (!user) return;
    setRemovingPhone(true);
    try {
      // Unlink phone from Firebase Auth if linked
      const linked = auth.currentUser?.providerData.some(p => p.providerId === PhoneAuthProvider.PROVIDER_ID);
      if (linked && auth.currentUser) await unlink(auth.currentUser, PhoneAuthProvider.PROVIDER_ID);
      await updateDoc(doc(db, "users", user.uid), { phone: null });
      setConfirmRemovePhone(false);
      setPhoneNumber("");
      setExpandedField(null);
      toast.success("Phone number removed.");
    } catch {
      toast.error("Failed to remove phone number.");
    } finally {
      setRemovingPhone(false);
    }
  }

  async function saveEmail() {
    if (!user || !newEmail.trim() || newEmail === user.email) return;
    setSavingEmail(true);
    try {
      const trimmedEmail = newEmail.trim();
      await updateEmail(auth.currentUser!, trimmedEmail);
      await sendSecurityEmail(trimmedEmail, "email", trimmedEmail, profile?.displayName ?? undefined);
      toast.success("Email updated!");
      setExpandedField(null);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/requires-recent-login") {
        toast.error("Session expired — please sign out and sign back in, then try again.");
      } else {
        toast.error("Failed to update email.");
      }
    } finally {
      setSavingEmail(false);
    }
  }

  async function saveGender() {
    if (!user || !newGender || newGender === profile?.gender) return;
    setSavingGender(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { gender: newGender });
      toast.success("Gender updated!");
      setExpandedField(null);
    } catch {
      toast.error("Failed to update gender.");
    } finally {
      setSavingGender(false);
    }
  }

  async function handleChangePassword() {
    if (!auth.currentUser || !auth.currentUser.email) return;
    if (!currentPw) { toast.error("Please enter your current password."); return; }
    if (!pwAllValid) { toast.error("New password doesn't meet all requirements."); return; }
    if (!pwMatch) { toast.error("New passwords don't match."); return; }
    setChangingPw(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPw);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPw);
      toast.success("Password updated!");
      setExpandedField(null);
      setCurrentPw(""); setNewPw(""); setConfirmNewPw("");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        toast.error("Current password is incorrect.");
      } else if (code === "auth/requires-recent-login") {
        toast.error("Session expired — please sign out and sign back in, then try again.");
      } else {
        toast.error("Failed to update password. Please try again.");
      }
    } finally {
      setChangingPw(false);
    }
  }

  async function handleDeleteAccount() {
    if (!auth.currentUser) return;
    if (hasPasswordProvider && !deletePw) { toast.error("Please enter your password to confirm."); return; }
    setDeleting(true);
    try {
      if (hasPasswordProvider && auth.currentUser.email) {
        const credential = EmailAuthProvider.credential(auth.currentUser.email, deletePw);
        await reauthenticateWithCredential(auth.currentUser, credential);
      }
      await deleteDoc(doc(db, "users", auth.currentUser.uid));
      await deleteUser(auth.currentUser);
      toast.success("Your account has been deleted.");
      router.push("/");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        toast.error("Incorrect password.");
      } else if (code === "auth/requires-recent-login") {
        toast.error("Session expired — please sign out and sign back in, then try again.");
      } else {
        toast.error("Failed to delete account. Please try again.");
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-5 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>

        {/* Profile card — avatar + name + username only */}
        <div className="rounded-2xl p-5 mb-4 flex items-center gap-4" style={glassCard}>
          {profile?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photoURL} alt={profile.displayName ?? ""} width={56} height={56}
              className="w-14 h-14 rounded-full object-cover flex-shrink-0 ring-2 ring-blue-200"
              style={{ width: 56, height: 56 }} />
          ) : (
            <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0 ring-2 ring-blue-200">
              {initials}
            </div>
          )}
          <div>
            <p className="font-semibold text-slate-900 text-lg leading-tight">{profile?.displayName ?? "Your name"}</p>
            {profile?.username && <p className="text-sm text-slate-400 mt-0.5">@{profile.username}</p>}
          </div>
        </div>

        {/* Personal Details */}
        <div className="rounded-2xl mb-4 overflow-hidden" style={glassCard}>
          <div className="flex items-center gap-2 px-6 pt-5 pb-3">
            <User size={17} className="text-blue-600" />
            <h2 className="font-semibold text-slate-800">Personal Details</h2>
          </div>

          {/* Name */}
          <div className="border-t border-slate-100">
            <button
              onClick={() => nameDaysLeft === 0 && toggle("name")}
              className={`w-full flex items-center justify-between px-6 py-4 transition-colors text-left ${nameDaysLeft === 0 ? "hover:bg-slate-50/60 cursor-pointer" : "cursor-default"}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Display name</p>
                <p className="text-sm text-slate-800 truncate">{profile?.displayName ?? "—"}</p>
              </div>
              {nameDaysLeft > 0 ? (
                <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 flex-shrink-0">
                  {nameDaysLeft}d remaining
                </span>
              ) : (
                <ChevronRight size={16} className={`text-slate-300 flex-shrink-0 transition-transform ${expandedField === "name" ? "rotate-90" : ""}`} />
              )}
            </button>
            <AnimatePresence>
              {expandedField === "name" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-5 pt-1 space-y-3 bg-slate-50/50">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Your display name"
                      className={inputCls}
                      autoFocus
                    />
                    <p className="text-xs text-slate-400">
                      You can change your display name once every 30 days.
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => setExpandedField(null)} className="flex-1 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors font-medium border border-slate-200 rounded-xl hover:bg-white">
                        Cancel
                      </button>
                      <button
                        onClick={saveName}
                        disabled={savingName || !newName.trim()}
                        className="flex-[2] py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {savingName ? "Saving…" : "Save name"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Username */}
          <div className="border-t border-slate-100">
            <button
              onClick={() => usernameDaysLeft === 0 && toggle("username")}
              className={`w-full flex items-center justify-between px-6 py-4 transition-colors text-left ${usernameDaysLeft === 0 ? "hover:bg-slate-50/60 cursor-pointer" : "cursor-default"}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Username</p>
                <p className="text-sm text-slate-800 truncate">@{profile?.username ?? "—"}</p>
              </div>
              {usernameDaysLeft > 0 ? (
                <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 flex-shrink-0">
                  {usernameDaysLeft}d remaining
                </span>
              ) : (
                <ChevronRight size={16} className={`text-slate-300 flex-shrink-0 transition-transform ${expandedField === "username" ? "rotate-90" : ""}`} />
              )}
            </button>
            <AnimatePresence>
              {expandedField === "username" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-5 pt-1 space-y-2 bg-slate-50/50">
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => handleUsernameInput(e.target.value)}
                      placeholder="new_username"
                      className={inputCls}
                      autoFocus
                    />
                    <div className="h-4">
                      {usernameStatus === "checking" && <p className="text-xs text-slate-400">Checking…</p>}
                      {usernameStatus === "taken" && (
                        <div className="flex items-center gap-1"><X size={10} className="text-red-400" /><p className="text-xs text-red-500">Already taken</p></div>
                      )}
                      {usernameStatus === "available" && (
                        <div className="flex items-center gap-1"><Check size={10} className="text-emerald-500" /><p className="text-xs text-emerald-600">Available</p></div>
                      )}
                      {usernameStatus === "idle" && <p className="text-xs text-slate-400">5–14 characters · letters, numbers, underscores</p>}
                    </div>
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      After changing your username you will need to wait 14 days before you can change it again.
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => setExpandedField(null)} className="flex-1 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors font-medium border border-slate-200 rounded-xl hover:bg-white">
                        Cancel
                      </button>
                      <button
                        onClick={saveUsername}
                        disabled={savingUsername || newUsername.length < 5 || usernameStatus === "taken" || usernameStatus === "checking"}
                        className="flex-[2] py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {savingUsername ? "Saving…" : "Save username"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Phone */}
          <div className="border-t border-slate-100">
            <button
              onClick={() => { toggle("phone"); setPhoneStep("enter"); setOtpInput(""); setOtpError(null); setConfirmRemovePhone(false); }}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/60 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Phone number</p>
                <p className="text-sm text-slate-800 truncate">{profile?.phone ?? <span className="text-slate-400">Not set</span>}</p>
              </div>
              <ChevronRight size={16} className={`text-slate-300 flex-shrink-0 transition-transform ${expandedField === "phone" ? "rotate-90" : ""}`} />
            </button>
            <AnimatePresence>
              {expandedField === "phone" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {/* Step 1: Enter phone number */}
                  {phoneStep === "enter" && (
                    <div className="px-6 pb-5 pt-1 space-y-3 bg-slate-50/50">
                      <p className="text-xs text-slate-400">
                        {profile?.phone ? "Enter a new phone number to replace the current one." : "Used for SMS habit reminders from friends. Optional."}
                      </p>
                      <div className="flex gap-2 relative">
                        {/* Custom country picker — portal so it escapes overflow:hidden */}
                        <div className="flex-shrink-0">
                          <button
                            ref={countryBtnRef}
                            type="button"
                            onClick={() => {
                              if (!showCountryPicker && countryBtnRef.current) {
                                const r = countryBtnRef.current.getBoundingClientRect();
                                setPickerRect({ top: r.bottom + 4, left: r.left });
                              }
                              setShowCountryPicker((v) => !v);
                            }}
                            className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-full whitespace-nowrap"
                          >
                            {COUNTRY_CODES.find((c) => c.code === phoneCountry)?.name.split(" (")[0] ?? phoneCountry}
                            <span className="text-slate-400 text-xs">{phoneCountry}</span>
                            <ChevronDown size={13} className={`text-slate-400 transition-transform ${showCountryPicker ? "rotate-180" : ""}`} />
                          </button>
                        </div>
                        <input
                          type="tel"
                          placeholder="7911 123456"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9\s\-]/g, ""))}
                          className={inputCls + " flex-1"}
                          autoFocus
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setExpandedField(null); setConfirmRemovePhone(false); }}
                          className="flex-1 py-2 text-sm text-slate-500 font-medium border border-slate-200 rounded-xl hover:bg-white transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={sendOtp}
                          disabled={sendingOtp || !phoneNumber.trim()}
                          className="flex-[2] py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {sendingOtp ? "Sending…" : "Send verification code"}
                        </button>
                      </div>
                      {/* Remove phone option */}
                      {profile?.phone && (
                        <div className="pt-1 border-t border-slate-100">
                          {confirmRemovePhone ? (
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-slate-500 flex-1">Remove your phone number?</p>
                              <button onClick={() => setConfirmRemovePhone(false)} className="text-xs text-slate-400 font-medium px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors">No</button>
                              <button
                                onClick={removePhone}
                                disabled={removingPhone}
                                className="text-xs text-red-600 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                              >
                                {removingPhone ? "Removing…" : "Yes, remove"}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmRemovePhone(true)}
                              className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                            >
                              Remove phone number
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 2: Enter OTP */}
                  {phoneStep === "verify" && (
                    <div className="px-6 pb-5 pt-3 space-y-4 bg-slate-50/50">
                      <div className="text-center pb-1">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <span className="text-2xl font-bold text-blue-600">#</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800">Enter your verification code</p>
                        <p className="text-xs text-slate-400 mt-1">
                          We sent a 6-digit SMS to <span className="font-medium text-slate-600">{phoneCountry} {phoneNumber}</span>
                        </p>
                      </div>

                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="000000"
                        value={otpInput}
                        onChange={(e) => {
                          setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6));
                          setOtpError(null);
                        }}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] text-slate-800 placeholder-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
                        autoFocus
                      />

                      {otpError && (
                        <p className="text-xs text-red-500 text-center flex items-center justify-center gap-1">
                          <X size={11} /> {otpError}
                        </p>
                      )}

                      <button
                        onClick={confirmOtp}
                        disabled={confirmingOtp || otpInput.length !== 6}
                        className="w-full py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {confirmingOtp ? "Verifying…" : "Verify number"}
                      </button>

                      <div className="flex items-center justify-between text-xs">
                        <button
                          onClick={() => { setPhoneStep("enter"); setOtpInput(""); setOtpError(null); }}
                          className="text-slate-400 hover:text-slate-700 transition-colors font-medium"
                        >
                          Change number
                        </button>
                        <button
                          onClick={resendCooldown === 0 ? sendOtp : undefined}
                          disabled={resendCooldown > 0 || sendingOtp}
                          className="text-blue-600 hover:text-blue-700 transition-colors font-medium disabled:text-slate-300"
                        >
                          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : sendingOtp ? "Sending…" : "Resend code"}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Email */}
          <div className="border-t border-slate-100">
            <button
              onClick={() => toggle("email")}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/60 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Email address</p>
                <p className="text-sm text-slate-800 truncate">{user?.email ?? "—"}</p>
              </div>
              <ChevronRight size={16} className={`text-slate-300 flex-shrink-0 transition-transform ${expandedField === "email" ? "rotate-90" : ""}`} />
            </button>
            <AnimatePresence>
              {expandedField === "email" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-5 pt-1 space-y-3 bg-slate-50/50">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="new@email.com"
                      className={inputCls}
                      autoFocus
                    />
                    <p className="text-xs text-slate-400">
                      A security notification will be sent to your current email after this change.
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => { setExpandedField(null); setNewEmail(user?.email ?? ""); }} className="flex-1 py-2 text-sm text-slate-500 font-medium border border-slate-200 rounded-xl hover:bg-white transition-colors">
                        Cancel
                      </button>
                      <button
                        onClick={saveEmail}
                        disabled={savingEmail || !newEmail.trim() || newEmail === user?.email}
                        className="flex-[2] py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {savingEmail ? "Saving…" : "Update email"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Gender — locked once set; only editable while unset (e.g. Google sign-up accounts) */}
          <div className="border-t border-slate-100">
            <button
              onClick={() => !profile?.gender && toggle("gender")}
              className={`w-full flex items-center justify-between px-6 py-4 transition-colors text-left ${!profile?.gender ? "hover:bg-slate-50/60 cursor-pointer" : "cursor-default"}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Gender</p>
                <p className="text-sm text-slate-800 truncate capitalize">{profile?.gender ?? <span className="text-slate-400 normal-case">Not set</span>}</p>
              </div>
              {!profile?.gender && (
                <ChevronRight size={16} className={`text-slate-300 flex-shrink-0 transition-transform ${expandedField === "gender" ? "rotate-90" : ""}`} />
              )}
            </button>
            <AnimatePresence>
              {expandedField === "gender" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-5 pt-1 space-y-3 bg-slate-50/50">
                    <div className="grid grid-cols-2 gap-2">
                      {(["male", "female"] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setNewGender(g)}
                          className={`py-2.5 rounded-xl border text-sm font-medium transition-all capitalize ${
                            newGender === g
                              ? "border-blue-600 bg-blue-50 text-blue-700"
                              : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400">
                      Used to show you relevant features, like the Period Tracker.
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => setExpandedField(null)} className="flex-1 py-2 text-sm text-slate-500 font-medium border border-slate-200 rounded-xl hover:bg-white transition-colors">
                        Cancel
                      </button>
                      <button
                        onClick={saveGender}
                        disabled={savingGender || !newGender || newGender === profile?.gender}
                        className="flex-[2] py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {savingGender ? "Saving…" : "Save gender"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-2xl p-6 mb-4" style={glassCard}>
          <div className="flex items-center gap-2 mb-5">
            <Bell size={17} className="text-blue-600" />
            <h2 className="font-semibold text-slate-800">Notifications</h2>
          </div>
          <div className="space-y-5">
            {[
              { label: "Prayer time reminders", desc: "Get notified before each Salah", value: prayerReminders, onChange: setPrayerReminders },
              { label: "Daily habit reminders", desc: "Morning reminder to log your habits", value: habitReminders, onChange: setHabitReminders },
              { label: "Email updates", desc: "Islamic tips and app news", value: emailNotifs, onChange: setEmailNotifs },
            ].map(({ label, desc, value, onChange }) => (
              <div key={label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                </div>
                <Toggle value={value} onChange={onChange} />
              </div>
            ))}
          </div>
        </div>

        {/* Subscription */}
        <div className="rounded-2xl p-6 mb-4" style={glassCard}>
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={17} className="text-blue-600" />
            <h2 className="font-semibold text-slate-800">Subscription</h2>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div>
              <p className="font-semibold text-slate-800 capitalize flex items-center gap-2">
                {profile?.plan ?? "free"} Plan
                {profile?.plan && profile.plan !== "free" && <Crown size={14} className="text-amber-500" />}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {profile?.plan === "free"
                  ? "5 AI messages per day · 10 lessons per month"
                  : "Unlimited access to all features"}
              </p>
            </div>
            {profile?.plan === "free" && (
              <button
                onClick={() => setShowUpgrade(true)}
                className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Crown size={13} /> Upgrade
              </button>
            )}
            {profile?.plan && profile.plan !== "free" && (
              <CancelPremiumButton uid={user?.uid ?? ""} />
            )}
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="rounded-2xl p-6 mb-4" style={glassCard}>
          <div className="flex items-center gap-2 mb-4">
            <Shield size={17} className="text-blue-600" />
            <h2 className="font-semibold text-slate-800">Privacy &amp; Security</h2>
          </div>
          <div className="space-y-1">
            {/* Change password */}
            <div className="rounded-xl overflow-hidden">
              <button
                onClick={() => toggle("password")}
                className="w-full text-left text-sm text-slate-600 hover:text-slate-900 py-2.5 px-3 rounded-xl hover:bg-slate-100 transition-colors font-medium flex items-center justify-between"
              >
                Change password
                <ChevronRight size={14} className={`text-slate-300 transition-transform ${expandedField === "password" ? "rotate-90" : ""}`} />
              </button>
              <AnimatePresence>
                {expandedField === "password" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {!hasPasswordProvider ? (
                      <p className="text-xs text-slate-400 px-3 pb-4 pt-1">
                        You signed in with Google, so there&apos;s no Jannatie password to change — manage it from your Google Account instead.
                      </p>
                    ) : (
                      <div className="px-3 pb-5 pt-1 space-y-3 bg-slate-50/50 rounded-xl">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Current password</label>
                          <div className="relative">
                            <input
                              type={showCurrentPw ? "text" : "password"}
                              value={currentPw}
                              onChange={(e) => setCurrentPw(e.target.value)}
                              placeholder="Current password"
                              className={inputCls + " pr-11"}
                              autoComplete="current-password"
                            />
                            <button type="button" onClick={() => setShowCurrentPw((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                              {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">New password</label>
                          <div className="relative">
                            <input
                              type={showNewPw ? "text" : "password"}
                              value={newPw}
                              onChange={(e) => setNewPw(e.target.value)}
                              placeholder="New password"
                              className={inputCls + " pr-11"}
                              autoComplete="new-password"
                            />
                            <button type="button" onClick={() => setShowNewPw((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                              {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                          {newPw.length > 0 && (
                            <div className="mt-2 flex flex-col gap-0.5">
                              {[
                                { label: "8+ characters", pass: pwChecks.length },
                                { label: "One capital letter", pass: pwChecks.upper },
                                { label: "One symbol", pass: pwChecks.symbol },
                              ].map(({ label, pass }) => (
                                <div key={label} className="flex items-center gap-1.5">
                                  {pass ? <Check size={10} className="text-emerald-500 flex-shrink-0" /> : <X size={10} className="text-red-400 flex-shrink-0" />}
                                  <span className={`text-xs ${pass ? "text-emerald-600" : "text-red-400"}`}>{label}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Confirm new password</label>
                          <div className="relative">
                            <input
                              type={showConfirmNewPw ? "text" : "password"}
                              value={confirmNewPw}
                              onChange={(e) => setConfirmNewPw(e.target.value)}
                              placeholder="Repeat new password"
                              className={inputCls + " pr-11"}
                              autoComplete="new-password"
                            />
                            <button type="button" onClick={() => setShowConfirmNewPw((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                              {showConfirmNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                          {confirmNewPw.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              {pwMatch ? <Check size={10} className="text-emerald-500" /> : <X size={10} className="text-red-400" />}
                              <span className={`text-xs ${pwMatch ? "text-emerald-600" : "text-red-400"}`}>
                                {pwMatch ? "Passwords match" : "Passwords don't match"}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setExpandedField(null); setCurrentPw(""); setNewPw(""); setConfirmNewPw(""); }}
                            className="flex-1 py-2 text-sm text-slate-500 font-medium border border-slate-200 rounded-xl hover:bg-white transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleChangePassword}
                            disabled={changingPw || !currentPw || !pwAllValid || !pwMatch}
                            className="flex-[2] py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {changingPw ? "Updating…" : "Update password"}
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <a href="/privacy" className="block text-sm text-blue-600 hover:text-blue-500 py-1 px-3 transition-colors">
              View Privacy Policy
            </a>
          </div>
        </div>

        {/* Help & Support */}
        <div className="rounded-2xl p-6 mb-4" style={glassCard}>
          <div className="flex items-center gap-2 mb-4">
            <LifeBuoy size={17} className="text-blue-600" />
            <h2 className="font-semibold text-slate-800">Help &amp; Support</h2>
          </div>
          <div className="space-y-1">
            <a
              href="/support#help-centre"
              className="w-full text-left text-sm text-slate-600 hover:text-slate-900 py-2.5 px-3 rounded-xl hover:bg-slate-100 transition-colors font-medium flex items-center justify-between"
            >
              Help Centre
              <ChevronRight size={14} className="text-slate-300" />
            </a>
            <a
              href="/support#contact"
              className="w-full text-left text-sm text-slate-600 hover:text-slate-900 py-2.5 px-3 rounded-xl hover:bg-slate-100 transition-colors font-medium flex items-center justify-between"
            >
              Contact Support
              <ChevronRight size={14} className="text-slate-300" />
            </a>
          </div>
        </div>

        {/* Email Preferences */}
        <NewsletterSection email={profile?.email ?? ""} />

        {/* Danger zone */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(255,255,255,0.65)",
            border: "1px solid rgba(254,202,202,0.80)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 4px 24px rgba(15,23,42,0.07)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Trash2 size={17} className="text-red-500" />
            <h2 className="font-semibold text-slate-800">Danger zone</h2>
          </div>
          <p className="text-sm text-slate-400 mb-5">These actions are permanent and cannot be undone.</p>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={logOut}
              className="text-slate-600 hover:text-slate-900 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors border border-slate-200 hover:bg-slate-100"
            >
              Sign out
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-600 hover:bg-red-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
            >
              Delete account
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => !deleting && setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
              style={{
                background: "rgba(255,255,255,0.98)",
                backdropFilter: "blur(32px)",
                WebkitBackdropFilter: "blur(32px)",
                border: "1px solid rgba(255,255,255,0.95)",
                boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-3">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Delete your account?</h2>
              <p className="text-sm text-slate-500 mb-4">
                This permanently deletes your profile, habits, progress, and everything else tied to your account. This cannot be undone.
              </p>
              {hasPasswordProvider && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Enter your password to confirm</label>
                  <div className="relative">
                    <input
                      type={showDeletePw ? "text" : "password"}
                      value={deletePw}
                      onChange={(e) => setDeletePw(e.target.value)}
                      placeholder="Password"
                      className={inputCls + " pr-11"}
                      autoComplete="current-password"
                    />
                    <button type="button" onClick={() => setShowDeletePw((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showDeletePw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeletePw(""); }}
                  disabled={deleting}
                  className="flex-1 py-2.5 text-sm text-slate-600 font-medium border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || (hasPasswordProvider && !deletePw)}
                  className="flex-[2] py-2.5 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-500 transition-colors disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Delete my account"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invisible reCAPTCHA container required by Firebase Phone Auth */}
      <div id="phone-recaptcha" />

      {/* Upgrade modal */}
      <AnimatePresence>
        {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
      </AnimatePresence>

      {/* Country picker portal — renders outside overflow:hidden accordion */}
      {showCountryPicker && pickerRect && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "fixed",
              top: pickerRect.top,
              left: pickerRect.left,
              width: 230,
              maxHeight: 280,
              overflowY: "auto",
              zIndex: 9999,
            }}
            className="rounded-2xl shadow-xl border border-slate-200 bg-white py-1"
          >
            {COUNTRY_CODES.map(({ code, name }) => (
              <button
                key={code}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent blur firing before click
                  setPhoneCountry(code);
                  setShowCountryPicker(false);
                }}
                className={`w-full text-left flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                  code === phoneCountry ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{name.split(" (")[0]}</span>
                <span className="text-xs text-slate-400 ml-2">{code}</span>
              </button>
            ))}
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
