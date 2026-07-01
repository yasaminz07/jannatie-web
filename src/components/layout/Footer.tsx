"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Instagram, Twitter, Youtube, Facebook, ArrowRight, Apple, Smartphone } from "lucide-react";

const footerLinks = {
  Company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Pricing", href: "/pricing" },
    { label: "For Mosques", href: "/pricing#mosque" },
    { label: "Create a Community", href: "/signup-community" },
    { label: "Support", href: "/support" },
  ],
  Legal: [
    { label: "Community Guidelines", href: "/community-guidelines" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
};

const apps = [
  { label: "iOS App", Icon: Apple },
  { label: "Android App", Icon: Smartphone },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subState, setSubState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [subMsg, setSubMsg] = useState("");

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || subState === "loading") return;
    setSubState("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) { setSubState("error"); setSubMsg(data.error ?? "Something went wrong."); return; }
      setSubState("done");
      setSubMsg("You're subscribed! Check your inbox for a welcome email.");
      setEmail("");
    } catch {
      setSubState("error");
      setSubMsg("Couldn't subscribe. Please try again.");
    }
  }

  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/images/logo-white.PNG"
                alt="Jannatie"
                width={42}
                height={42}
                className="object-contain"
              />
              <span className="text-2xl font-bold text-white">Jannatie</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs mb-6">
              Your AI-powered Islamic growth companion. Grow your deen, build
              your habits, every single day.
            </p>
            {/* Newsletter */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-white mb-2">
                Get Islamic tips & updates
              </p>
              {subState === "done" ? (
                <p className="text-sm text-emerald-400 font-medium">{subMsg}</p>
              ) : (
                <>
                  <form className="flex gap-2" onSubmit={handleSubscribe}>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={subState === "loading"}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      {subState === "loading" ? "..." : "Subscribe"}
                    </button>
                  </form>
                  {subState === "error" && (
                    <p className="text-xs text-red-400 mt-1.5">{subMsg}</p>
                  )}
                </>
              )}
            </div>
            {/* Social */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-widest">
                Follow Us
              </h3>
              <div className="flex gap-3">
                {[
                  { Icon: Instagram, href: "https://instagram.com/jannatie" },
                  { Icon: Twitter, href: "https://twitter.com/jannatie" },
                  { Icon: Youtube, href: "https://youtube.com/@jannatie" },
                  { Icon: Facebook, href: "https://facebook.com/jannatie" },
                ].map(({ Icon, href }) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors text-slate-400 hover:text-white"
                  >
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Features — single CTA button, not a full list */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-widest">
              Features
            </h3>
            <Link
              href="/features"
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-blue-600 text-white text-sm font-medium px-3.5 py-2 rounded-lg transition-colors"
            >
              Explore features
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-widest">
                {section}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Apps — not live yet */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-widest">
              Apps
            </h3>
            <ul className="space-y-3">
              {apps.map(({ label, Icon }) => (
                <li key={label} className="flex items-center gap-2 text-sm text-slate-500">
                  <Icon size={14} className="text-slate-600" />
                  {label}
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 bg-slate-800 rounded-full px-1.5 py-0.5">
                    Soon
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 text-right">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Jannatie Ltd. All rights reserved. Registered in England & Wales.
          </p>
        </div>
      </div>
    </footer>
  );
}
