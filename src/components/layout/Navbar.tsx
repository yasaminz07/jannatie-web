"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, LayoutDashboard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const navLinks = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, logOut } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const displayName = profile?.displayName ?? user?.displayName ?? "";
  const initials = displayName
    ? displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : (user?.email?.[0]?.toUpperCase() ?? "?");
  const photoURL = profile?.photoURL ?? user?.photoURL ?? null;

  async function handleSignOut() {
    setDropdownOpen(false);
    await logOut();
    router.push("/");
  }

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled ? "bg-white/90 backdrop-blur-xl border-b border-slate-100" : "bg-transparent"
        )}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo-black.PNG"
              alt="Jannatie"
              width={24}
              height={24}
              className="object-contain"
              priority
            />
            <span className="text-xl font-bold text-slate-900 tracking-tight">Jannatie</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  pathname === link.href ? "text-blue-600" : "text-slate-500 hover:text-slate-900"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              // ── Logged-in: avatar + name + dropdown ──
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors"
                >
                  {/* Avatar */}
                  {photoURL ? (
                    <Image
                      src={photoURL}
                      width={32}
                      height={32}
                      alt={displayName}
                      className="rounded-full object-cover w-8 h-8"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {initials}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-slate-800 max-w-[140px] truncate">
                    {displayName || "My Account"}
                  </span>
                  <motion.div animate={{ rotate: dropdownOpen ? 180 : 0 }} transition={{ duration: 0.18 }}>
                    <ChevronDown size={14} className="text-slate-400" />
                  </motion.div>
                </button>

                {/* Dropdown */}
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.14 }}
                      className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden"
                      style={{
                        background: "white",
                        border: "1px solid rgba(226,232,240,0.90)",
                        boxShadow: "0 8px 32px rgba(15,23,42,0.12)",
                      }}
                    >
                      {/* User info header */}
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                        <p className="text-[11px] text-slate-400 truncate">@{profile?.username ?? user.email}</p>
                      </div>
                      <Link
                        href="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <LayoutDashboard size={15} className="text-slate-400" />
                        Dashboard
                      </Link>
                      <div className="h-px bg-slate-100 mx-3" />
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <LogOut size={15} />
                        Log out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-2"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile burger */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-700"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>
      </header>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-white flex flex-col pt-20 px-6 md:hidden"
          >
            <div className="flex flex-col gap-6 mt-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-2xl font-bold text-slate-900 hover:text-blue-600 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="mt-10 flex flex-col gap-3">
              {user ? (
                <>
                  {/* Mobile: user info */}
                  <div className="flex items-center gap-3 px-1 py-2 mb-1">
                    {photoURL ? (
                      <Image src={photoURL} width={40} height={40} alt={displayName} className="rounded-full object-cover w-10 h-10" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                        {initials}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-slate-900">{displayName}</p>
                      <p className="text-xs text-slate-400">@{profile?.username ?? user.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    className="bg-blue-600 text-white text-center font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="border border-slate-200 text-slate-600 text-center font-semibold py-3 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="border border-slate-200 text-slate-900 text-center font-semibold py-3 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-blue-600 text-white text-center font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Sign up free
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
