"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import toast from "react-hot-toast";
import { User, Bell, CreditCard, Shield, Trash2, ChevronRight } from "lucide-react";

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

  const initials = (profile?.displayName ?? "J")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function saveProfile() {
    toast.success("Profile updated.");
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-5 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>

        {/* Profile */}
        <SectionCard>
          <SectionHeader icon={User} title="Profile" />
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0 ring-2 ring-blue-200">
              {initials}
            </div>
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
          </div>

          <button
            onClick={saveProfile}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            Save changes
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
