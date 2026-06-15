"use client";

import Link from "next/link";
import { Instagram, Twitter, Youtube, Facebook } from "lucide-react";

const footerLinks = {
  Features: [
    { label: "AI Buddy", href: "/features#ai-buddy" },
    { label: "Habit Tracker", href: "/features#habits" },
    { label: "Learning Game", href: "/features#learn" },
    { label: "Islamic Calendar", href: "/features#calendar" },
    { label: "Progress & XP", href: "/features#progress" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Pricing", href: "/pricing" },
    { label: "For Mosques", href: "/pricing#mosque" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/privacy#cookies" },
    { label: "UK GDPR", href: "/privacy#gdpr" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-[#0D0D0D] text-white border-t-2 border-accent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-bold text-white">Jannatie</span>
              <span className="arabic text-accent text-xl leading-none">جنتي</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Your AI-powered Islamic growth companion. Grow your deen, build
              your habits, every single day.
            </p>
            {/* Newsletter */}
            <div className="mt-6">
              <p className="text-sm font-semibold text-white mb-2">
                Get Islamic tips & updates
              </p>
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
                <button
                  type="submit"
                  className="bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">
                {section}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Social */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">
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
                  className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-primary-500 transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Jannatie Ltd. All rights reserved.
            Registered in England & Wales.
          </p>
          <p className="text-xs text-gray-500">
            ICO Registration No. XXXXXXX · Built with ♥ for the Ummah
          </p>
        </div>
      </div>
    </footer>
  );
}
