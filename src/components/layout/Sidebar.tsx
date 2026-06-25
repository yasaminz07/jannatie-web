"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, CheckSquare, BookOpen, MessageCircle,
  Calendar, TrendingUp, Settings, Building2, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Habits", href: "/habits", icon: CheckSquare },
  { label: "Learn", href: "/learn", icon: BookOpen },
  { label: "AI Buddy", href: "/ai", icon: MessageCircle },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Progress", href: "/progress", icon: TrendingUp },
  { label: "Mosque", href: "/mosque", icon: Building2 },
];

function UserAvatar({ name, photoURL, size = 34 }: { name: string; photoURL?: string | null; size?: number }) {
  if (photoURL) {
    return (
      <Image
        src={photoURL}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
      />
    );
  }
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold ring-1 ring-blue-200"
    >
      {initials}
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, logOut } = useAuth();
  const name = profile?.displayName ?? "User";

  return (
    <aside
      className="hidden md:flex flex-col w-60 h-screen fixed left-0 top-0 z-30"
      style={{
        background: "rgba(255, 255, 255, 0.55)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRight: "1px solid rgba(255, 255, 255, 0.80)",
        boxShadow: "4px 0 24px rgba(15, 23, 42, 0.06)",
      }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-200/60">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Image
            src="/images/logo-white.PNG"
            alt="Jannatie"
            width={20}
            height={20}
            className="object-contain"
            style={{ filter: "brightness(0)" }}
          />
          <span className="text-base font-bold text-slate-900 tracking-tight">Jannatie</span>
        </Link>
      </div>

      {/* User profile */}
      {profile && (
        <div className="px-4 py-4 border-b border-slate-200/60">
          <div className="flex items-center gap-3 mb-3">
            <UserAvatar name={name} photoURL={profile.photoURL} size={34} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{name}</p>
              {profile.username && (
                <p className="text-xs text-slate-400 truncate">@{profile.username}</p>
              )}
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-1.5">
            <span>Level {profile.level}</span>
            <span>{profile.xp} XP</span>
          </div>
          <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${profile.xp % 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-blue-600/10 text-blue-700 border border-blue-200"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-900/5 border border-transparent"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 border-t border-slate-200/60 pt-3 space-y-0.5">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border",
            pathname === "/settings"
              ? "bg-blue-600/10 text-blue-700 border-blue-200"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-900/5 border-transparent"
          )}
        >
          <Settings size={16} />
          Settings
        </Link>
        <button
          onClick={logOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all border border-transparent"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
