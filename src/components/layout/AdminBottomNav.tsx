"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { BarChart3, ShieldCheck, Users, Flag, Mail, MoreHorizontal, Home, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { label: "Analytics", href: "/admin", icon: BarChart3 },
  { label: "Communities", href: "/admin/communities", icon: Users },
  { label: "Reports", href: "/admin/reports", icon: Flag },
  { label: "Applications", href: "/admin/community-applications", icon: ShieldCheck },
  { label: "Newsletter", href: "/admin/newsletter", icon: Mail },
];

export default function AdminBottomNav() {
  const pathname = usePathname();
  const { logOut } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [moreOpen]);

  return (
    <>
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40 bg-black/20"
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              ref={sheetRef}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl"
              style={{
                background: "rgba(255,255,255,0.97)",
                backdropFilter: "blur(32px)",
                WebkitBackdropFilter: "blur(32px)",
                border: "1px solid rgba(255,255,255,0.95)",
                boxShadow: "0 -8px 40px rgba(15,23,42,0.12)",
              }}
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-8 h-1 bg-slate-200 rounded-full" />
              </div>
              <div className="px-5 pb-8 space-y-1">
                <Link href="/dashboard" onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-slate-100 transition-colors">
                  <Home size={16} /> Back to app
                </Link>
                <button onClick={() => { logOut(); setMoreOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-slate-100 transition-colors">
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30"
        style={{
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.90)",
          boxShadow: "0 -4px 24px rgba(15,23,42,0.06)",
        }}
      >
        <div className="flex items-center justify-around px-1 py-2">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} className="flex flex-col items-center gap-1 px-2 py-1 min-w-0">
                <Icon size={20} className={cn("transition-colors flex-shrink-0", active ? "text-blue-600" : "text-slate-400")} />
                <span className={cn("text-[10px] font-medium transition-colors truncate max-w-[56px] text-center", active ? "text-blue-600" : "text-slate-400")}>
                  {label}
                </span>
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(o => !o)}
            className="flex flex-col items-center gap-1 px-2 py-1"
          >
            <MoreHorizontal size={20} className={cn("transition-colors", moreOpen ? "text-blue-600" : "text-slate-400")} />
            <span className={cn("text-[10px] font-medium", moreOpen ? "text-blue-600" : "text-slate-400")}>
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
