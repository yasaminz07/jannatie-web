"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";
import { User, Bell, CreditCard, Shield, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const { profile, user, logOut } = useAuth();
  const [name, setName] = useState(profile?.displayName ?? "");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [prayerReminders, setPrayerReminders] = useState(true);
  const [habitReminders, setHabitReminders] = useState(true);

  function saveProfile() {
    toast.success("Profile updated.");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-8">Settings</h1>

      {/* Profile */}
      <Card className="p-6 mb-5">
        <div className="flex items-center gap-2 mb-5">
          <User size={18} className="text-primary-500" />
          <h2 className="font-semibold text-foreground">Profile</h2>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
            {name.charAt(0) || "J"}
          </div>
          <div>
            <p className="font-semibold text-foreground">{name || "Your name"}</p>
            <p className="text-sm text-muted">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Input id="name" label="Display name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input id="email" type="email" label="Email" value={user?.email ?? ""} disabled className="opacity-60" />
        </div>

        <div className="mt-5">
          <Button onClick={saveProfile}>Save changes</Button>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6 mb-5">
        <div className="flex items-center gap-2 mb-5">
          <Bell size={18} className="text-primary-500" />
          <h2 className="font-semibold text-foreground">Notifications</h2>
        </div>

        <div className="space-y-4">
          {[
            { label: "Prayer time reminders", desc: "Get notified before each Salah", value: prayerReminders, onChange: setPrayerReminders },
            { label: "Daily habit reminders", desc: "Morning reminder to log your habits", value: habitReminders, onChange: setHabitReminders },
            { label: "Email updates", desc: "Islamic tips and app news", value: emailNotifs, onChange: setEmailNotifs },
          ].map(({ label, desc, value, onChange }) => (
            <div key={label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted">{desc}</p>
              </div>
              <button
                onClick={() => onChange(!value)}
                className={`relative w-11 h-6 rounded-full transition-colors ${value ? "bg-primary-500" : "bg-gray-200"}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Subscription */}
      <Card className="p-6 mb-5">
        <div className="flex items-center gap-2 mb-5">
          <CreditCard size={18} className="text-primary-500" />
          <h2 className="font-semibold text-foreground">Subscription</h2>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-4">
          <div>
            <p className="font-semibold text-foreground capitalize">{profile?.plan ?? "free"} Plan</p>
            <p className="text-xs text-muted">
              {profile?.plan === "free"
                ? "5 AI messages/day · 10 lessons/month"
                : "Unlimited access to all features"}
            </p>
          </div>
          {profile?.plan === "free" && (
            <a href="/pricing" className="text-sm font-semibold text-primary-500 hover:underline">
              Upgrade →
            </a>
          )}
        </div>

        {profile?.plan !== "free" && (
          <Button variant="ghost" size="sm" className="text-danger border-danger hover:bg-danger">
            Cancel subscription
          </Button>
        )}
      </Card>

      {/* Privacy & Security */}
      <Card className="p-6 mb-5">
        <div className="flex items-center gap-2 mb-5">
          <Shield size={18} className="text-primary-500" />
          <h2 className="font-semibold text-foreground">Privacy & Security</h2>
        </div>
        <div className="space-y-3">
          <Button variant="ghost" size="sm" className="w-full justify-start">Change password</Button>
          <Button variant="ghost" size="sm" className="w-full justify-start">Download my data</Button>
          <a href="/privacy" className="block text-sm text-primary-500 hover:underline">View Privacy Policy →</a>
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="p-6 border-danger/20">
        <div className="flex items-center gap-2 mb-4">
          <Trash2 size={18} className="text-danger" />
          <h2 className="font-semibold text-foreground">Danger zone</h2>
        </div>
        <p className="text-sm text-muted mb-4">These actions are permanent and cannot be undone.</p>
        <div className="flex gap-3 flex-wrap">
          <Button variant="ghost" onClick={logOut}>Sign out</Button>
          <Button variant="danger" size="sm">Delete account</Button>
        </div>
      </Card>
    </div>
  );
}
