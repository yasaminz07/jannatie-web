"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
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
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled ? "glass-nav border-b border-border" : "bg-transparent"
        )}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl font-bold text-foreground tracking-tight">
              Jannatie
            </span>
            <span className="arabic text-accent text-lg leading-none">
              جنتي
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium relative group transition-colors",
                  pathname === link.href
                    ? "text-primary-500"
                    : "text-foreground hover:text-primary-500"
                )}
              >
                {link.label}
                <span
                  className={cn(
                    "absolute -bottom-0.5 left-0 h-0.5 bg-primary-500 transition-all duration-200",
                    pathname === link.href ? "w-full" : "w-0 group-hover:w-full"
                  )}
                />
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="bg-primary-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-600 hover:shadow-blue-glow transition-all duration-150 hover:scale-[1.02]"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-foreground border border-foreground px-4 py-2 rounded-lg hover:bg-foreground hover:text-white transition-all duration-150"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="bg-primary-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-600 hover:shadow-blue-glow transition-all duration-150 hover:scale-[1.02]"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile burger */}
          <button
            className="md:hidden p-2 rounded-lg text-foreground"
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
            className="fixed inset-0 z-40 bg-background flex flex-col pt-20 px-6 md:hidden"
          >
            <div className="flex flex-col gap-6 mt-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-2xl font-bold text-foreground hover:text-primary-500 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="mt-10 flex flex-col gap-3">
              {user ? (
                <Link
                  href="/dashboard"
                  className="bg-primary-500 text-white text-center font-semibold py-3 rounded-xl"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="border border-foreground text-foreground text-center font-semibold py-3 rounded-xl"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-primary-500 text-white text-center font-semibold py-3 rounded-xl"
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
