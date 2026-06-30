"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ChevronDown, Mail, LifeBuoy, MessageCircleQuestion, Send, CheckCircle2 } from "lucide-react";

const FAQS = [
  {
    q: "How do I reset my password?",
    a: "Go to the login page and select \"Forgot password\". We'll send a reset link to the email address on your account.",
  },
  {
    q: "How does the AI Buddy work?",
    a: "AI Buddy answers Islamic questions and always cites the exact hadith collection and number so you can verify it yourself. It's for guidance only and is never a fatwa.",
  },
  {
    q: "How do I cancel or change my subscription?",
    a: "Go to Settings → Subscription to upgrade, downgrade or cancel your plan at any time. Changes take effect at the end of your current billing period.",
  },
  {
    q: "What is a Community account?",
    a: "Community accounts are for mosques, businesses and organisers to post real events and announcements that normal users can discover, follow and engage with. Apply via \"Create a Community\" in the footer.",
  },
  {
    q: "How do I report a comment?",
    a: "On any comment under a community event post, select \"Report\" and tell us why. Our team reviews every report and may remove the comment.",
  },
  {
    q: "How is my data protected?",
    a: "We only collect what's needed to run the app and never sell your data. Read the full details in our Privacy Policy.",
  },
];

const inputCls =
  "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white";

export default function SupportPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to send message.");
      }
      setSent(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-12">
            <div className="flex items-center gap-2 mb-2">
              <LifeBuoy size={22} className="text-blue-600" />
              <h1 className="text-4xl font-bold text-foreground">Support</h1>
            </div>
            <p className="text-muted text-sm mb-12">We&apos;re here to help. Browse the Help Centre or contact our team directly.</p>

            {/* Help Centre */}
            <section id="help-centre" className="mb-16 scroll-mt-24">
              <div className="flex items-center gap-2 mb-5">
                <MessageCircleQuestion size={18} className="text-blue-600" />
                <h2 className="text-xl font-bold text-foreground">Help Centre</h2>
              </div>
              <div className="space-y-2">
                {FAQS.map((faq, i) => (
                  <div key={faq.q} className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
                    <button
                      onClick={() => setOpenIndex(openIndex === i ? null : i)}
                      className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
                    >
                      <span className="text-sm font-semibold text-slate-800">{faq.q}</span>
                      <ChevronDown size={16} className={`text-slate-400 flex-shrink-0 transition-transform ${openIndex === i ? "rotate-180" : ""}`} />
                    </button>
                    {openIndex === i && (
                      <div className="px-5 pb-4">
                        <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Contact Support */}
            <section id="contact" className="scroll-mt-24">
              <div className="flex items-center gap-2 mb-5">
                <Mail size={18} className="text-blue-600" />
                <h2 className="text-xl font-bold text-foreground">Contact Support</h2>
              </div>

              {sent ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                  <CheckCircle2 size={28} className="text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-emerald-800 mb-1">Message sent</p>
                  <p className="text-xs text-emerald-700">Our team will get back to you as soon as possible, in shaa Allah.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <input className={inputCls} placeholder="Your name" value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    <input type="email" className={inputCls} placeholder="Your email" value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <input className={inputCls} placeholder="Subject" value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                  <textarea className={inputCls} rows={5} placeholder="How can we help?" value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                  {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                  <button type="submit" disabled={sending}
                    className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl py-3 transition-colors">
                    <Send size={14} /> {sending ? "Sending..." : "Send message"}
                  </button>
                  <p className="text-xs text-slate-400 text-center">Or email us directly at jannatieteam@gmail.com</p>
                </form>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
