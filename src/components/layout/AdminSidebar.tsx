"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BarChart3, ShieldCheck, LogOut, Home, Users, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { label: "Analytics", href: "/admin", icon: BarChart3 },
  { label: "Communities", href: "/admin/communities", icon: Users },
  { label: "Reports", href: "/admin/reports", icon: Flag },
  { label: "Community Applications", href: "/admin/community-applications", icon: ShieldCheck },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logOut } = useAuth();

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
      <div className="px-5 py-3 border-b border-slate-200/60 flex items-center gap-2.5 flex-shrink-0">
        <Image src="/images/logo-white.PNG" alt="Jannatie" width={18} height={18}
          className="object-contain" style={{ filter: "brightness(0)" }} />
        <span className="text-sm font-bold text-slate-900 tracking-tight">Jannatie Admin</span>
      </div>

      <nav className="flex-1 px-3 py-3 flex flex-col justify-between overflow-hidden">
        <div className="space-y-0.5">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-blue-600/10 text-blue-700 border border-blue-200"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-900/5 border border-transparent"
                )}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </div>

        <div className="border-t border-slate-200/60 pt-2 space-y-0.5">
          <Link href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-900/5 transition-all border border-transparent">
            <Home size={15} />
            Back to app
          </Link>
          <button onClick={logOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all border border-transparent">
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </nav>
    </aside>
  );
}
