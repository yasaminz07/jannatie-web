"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import toast from "react-hot-toast";
import { User, Bell, CreditCard, Shield, Trash2, ChevronRight, Phone } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const COUNTRY_CODES = [
  { code: "+44", name: "🇬🇧 UK (+44)" },
  { code: "+1", name: "🇺🇸 US/Canada (+1)" },
  { code: "+92", name: "🇵🇰 Pakistan (+92)" },
  { code: "+880", name: "🇧🇩 Bangladesh (+880)" },
  { code: "+91", name: "🇮🇳 India (+91)" },
  { code: "+20", name: "🇪🇬 Egypt (+20)" },
  { code: "+966", name: "🇸🇦 Saudi Arabia (+966)" },
  { code: "+971", name: "🇦🇪 UAE (+971)" },
  { code: "+49", name: "🇩🇪 Germany (+49)" },
  { code: "+33", name: "🇫🇷 France (+33)" },
  { code: "+31", name: "🇳🇱 Netherlands (+31)" },
  { code: "+90", name: "🇹🇷 Turkey (+90)" },
  { code: "+60", name: "🇲🇾 Malaysia (+60)" },
  { code: "+62", name: "🇮🇩 Indonesia (+62)" },
  { code: "+234", name: "🇳🇬 Nigeria (+234)" },
  { code: "+212", name: "🇲🇦 Morocco (+212)" },
  { code: "+216", name: "🇹🇳 Tunisia (+216)" },
  { code: "+213", name: "🇩🇿 Algeria (+213)" },
  { code: "+249", name: "🇸🇩 Sudan (+249)" },
  { code: "+252", name: "🇸🇴 Somalia (+252)" },
  { code: "+964", name: "🇮🇶 Iraq (+964)" },
  { code: "+962", name: "🇯🇴 Jordan (+962)" },
  { code: "+968", name: "🇴🇲 Oman (+968)" },
  { code: "+974", name: "🇶🇦 Qatar (+974)" },
  { code: "+965", name: "🇰🇼 Kuwait (+965)" },
  { code: "+973", name: "🇧🇭 Bahrain (+973)" },
  { code: "+967", name: "🇾🇪 Yemen (+967)" },
  { code: "+93", name: "🇦🇫 Afghanistan (+93)" },
  { code: "+94", name: "🇱🇰 Sri Lanka (+94)" },
  { code: "+61", name: "🇦🇺 Australia (+61)" },
  { code: "+27", name: "🇿🇦 South Africa (+27)" },
  { code: "+254", name: "🇰🇪 Kenya (+254)" },
  { code: "+233", name: "🇬🇭 Ghana (+233)" },
  { code: "+55", name: "🇧🇷 Brazil (+55)" },
  { code: "+65", name: "🇸🇬 Singapore (+65)" },
];

const glassCard = {
  background: "rgba(255, 255, 255, 0.65)",
  border: "1px solid rgba(255, 255, 255, 0.80)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 4px 24px rgba(15, 23, 42, 0.07)",
} as const;

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6 mb-4" style={glassCard}>
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <Icon size={17} className="text-blue-600" />
      <h2 className="font-semibold text-slate-800">{title}</h2>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors ${value ? "bg-blue-600" : "bg-slate-200"}`}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          value ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { profile, user, logOut } = useAuth();
  const [name, setName] = useState(profile?.displayName ?? "");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [prayerReminders, setPrayerReminders] = useState(true);
  const [habitReminders, setHabitReminders] = useState(true);
  const [saving, setSaving] = useState(false);

  // Phone number — parse existing value if set
  const existingPhone = profile?.phone ?? "";
  const existingCountry = COUNTRY_CODES.find((c) => existingPhone.startsWith(c.code))?.code ?? "+44";
  const existingNumber = existingPhone.startsWith(existingCountry)
    ? existingPhone.slice(existingCountry.length)
    : existingPhone;
  const [phoneCountry, setPhoneCountry] = useState(existingCountry);
  const [phoneNumber, setPhoneNumber] = useState(existingNumber);

  const initials = (profile?.displayName ?? "J")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {};
      if (name.trim()) updates.displayName = name.trim();
      if (phoneNumber.trim()) {
        updates.phone = `${phoneCountry}${phoneNumber.trim()}`;
      } else {
        updates.phone = null;
      }
      await updateDoc(doc(db, "users", user.uid), updates);
      toast.success("Profile updated.");
    } catch {
      toast.error("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-5 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>

        {/* Profile */}
        <SectionCard>
          <SectionHeader icon={User} title="Profile" />

          <div className="flex items-center gap-4 mb-6">
            {profile?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.photoURL} alt={name} width={56} height={56}
                className="w-14 h-14 rounded-full object-cover flex-shrink-0 ring-2 ring-blue-200"
                style={{ width: 56, height: 56 }} />
            ) : (
              <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0 ring-2 ring-blue-200">
                {initials}
              </div>
            )}
            <div>
              <p className="font-semibold text-slate-800">{name || "Your name"}</p>
              <p className="text-sm text-slate-400">{user?.email}</p>
              {profile?.username && (
                <p className="text-xs text-slate-400">@{profile.username}</p>
              )}
            </div>
          </div>

          <div className="space-y-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Display name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 border border-slate-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
              <input
                type="email"
                value={user?.email ?? ""}
                disabled
                className="w-full rounded-xl px-4 py-3 text-sm text-slate-400 cursor-not-allowed border border-slate-200 bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Phone size={13} /> Phone number <span className="text-slate-400 font-normal">(optional — for SMS reminders)</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={phoneCountry}
                  onChange={(e) => setPhoneCountry(e.target.value)}
                  className="border border-slate-200 rounded-xl px-2 py-3 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0 max-w-[140px]"
                >
                  {COUNTRY_CODES.map(({ code, name: cname }) => (
                    <option key={code} value={code}>{cname}</option>
                  ))}
                </select>
                <input
                  type="tel"
                  placeholder="7911 123456"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9\s\-]/g, ""))}
                  className="w-full rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 border border-slate-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all flex-1"
                />
              </div>
              {profile?.phone && (
                <p className="text-xs text-emerald-600 mt-1">✓ Phone saved: {profile.phone}</p>
              )}
            </div>
          </div>

          <button
            onClick={saveProfile}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </SectionCard>

        {/* Notifications */}
        <SectionCard>
          <SectionHeader icon={Bell} title="Notifications" />
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
        </SectionCard>

        {/* Subscription */}
        <SectionCard>
          <SectionHeader icon={CreditCard} title="Subscription" />
          <div
            className="flex items-center justify-between p-4 rounded-xl mb-2 border border-slate-200 bg-slate-50"
          >
            <div>
              <p className="font-semibold text-slate-800 capitalize">
                {profile?.plan ?? "free"} Plan
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {profile?.plan === "free"
                  ? "5 AI messages per day · 10 lessons per month"
                  : "Unlimited access to all features"}
              </p>
            </div>
            {profile?.plan === "free" && (
              <a href="/pricing" className="text-sm font-semibold text-blue-600 hover:text-blue-500 flex items-center gap-0.5 transition-colors">
                Upgrade <ChevronRight size={14} />
              </a>
            )}
          </div>
        </SectionCard>

        {/* Privacy */}
        <SectionCard>
          <SectionHeader icon={Shield} title="Privacy and Security" />
          <div className="space-y-1">
            {["Change password", "Download my data"].map((label) => (
              <button
                key={label}
                className="w-full text-left text-sm text-slate-600 hover:text-slate-900 py-2.5 px-3 rounded-xl hover:bg-slate-100 transition-colors font-medium flex items-center justify-between"
              >
                {label}
                <ChevronRight size={14} className="text-slate-300" />
              </button>
            ))}
            <a href="/privacy" className="block text-sm text-blue-600 hover:text-blue-500 py-1 px-3 transition-colors">
              View Privacy Policy
            </a>
          </div>
        </SectionCard>

        {/* Danger zone */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(255, 255, 255, 0.65)",
            border: "1px solid rgba(254, 202, 202, 0.80)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 4px 24px rgba(15, 23, 42, 0.07)",
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
            <button className="bg-red-600 hover:bg-red-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors">
              Delete account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
