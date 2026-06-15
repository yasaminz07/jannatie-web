"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  MessageCircle,
  Calendar,
  TrendingUp,
  Settings,
  Building2,
  LogOut,
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

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, logOut } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-60 bg-sidebar text-white h-screen fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-bold text-white">Jannatie</span>
          <span className="arabic text-accent text-lg">جنتي</span>
        </Link>
      </div>

      {/* XP / Streak bar */}
      {profile && (
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">
              Level {profile.level}
            </span>
            <span className="text-xs text-accent mono">
              🔥 {profile.streak}
            </span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-500"
              style={{ width: `${(profile.xp % 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {profile.xp} XP
          </p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-primary-500/10 text-primary-500 border border-primary-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-white/10 space-y-1">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
            pathname === "/settings"
              ? "bg-primary-500/10 text-primary-500"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
        >
          <Settings size={18} />
          Settings
        </Link>
        <button
          onClick={logOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-danger hover:bg-danger/5 transition-all duration-150"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
