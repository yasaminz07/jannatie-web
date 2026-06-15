"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, BadgeCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface Message {
  role: "user" | "ai";
  content: string;
  verified?: boolean;
}

const SUGGESTED_PROMPTS = [
  "What is the ruling on combining prayers while travelling?",
  "What are the conditions for Salah to be valid?",
  "What dua should I read before sleeping?",
  "What is the reward for praying Fajr in congregation?",
  "How do I perform ghusl correctly?",
];

function TypingIndicator() {
  return (
    <div className="flex gap-1.5 p-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-muted animate-pulse-dot"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </div>
  );
}

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [msgCount, setMsgCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { profile } = useAuth();

  const FREE_LIMIT = 5;
  const isPremium = profile?.plan !== "free";
  const canSend = isPremium || msgCount < FREE_LIMIT;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Check if there's a pre-filled question from dashboard
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      if (q) setInput(q);
    }
  }, []);

  async function sendMessage(text?: string) {
    const msg = text ?? input.trim();
    if (!msg || !canSend) return;

    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setInput("");
    setLoading(true);
    setMsgCount((c) => c + 1);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: data.reply, verified: data.verified ?? true },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "I apologise — I'm unable to connect right now. Please try again shortly. For urgent matters, please consult a qualified Islamic scholar.",
          verified: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-screen max-w-3xl mx-auto">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-border bg-background">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">J</span>
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">Jannatie AI</p>
            <p className="text-xs text-muted">Scholar-reviewed · Sunni knowledge base</p>
          </div>
          {!isPremium && (
            <div className="ml-auto text-xs text-muted bg-gray-100 px-3 py-1 rounded-full">
              {FREE_LIMIT - msgCount} messages left today
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div>
              <div className="arabic text-accent text-3xl mb-2">بِسْمِ اللَّهِ</div>
              <h2 className="text-xl font-bold text-foreground mb-2">Assalamu Alaikum!</h2>
              <p className="text-muted text-sm max-w-sm">
                Ask me anything about Islam. I&apos;ll always cite the hadith or Quran verse so you can verify my answer.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="text-sm text-left px-4 py-2.5 rounded-xl border border-border hover:border-primary-500 hover:text-primary-500 transition-colors text-foreground"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "ai" && (
                  <div className="w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                    <span className="text-white text-xs font-bold">J</span>
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary-500 text-white rounded-br-sm"
                      : "bg-card border border-border text-foreground rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                  {msg.role === "ai" && (
                    <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-1.5 text-xs text-muted">
                      {msg.verified ? (
                        <>
                          <BadgeCheck size={11} className="text-primary-500" />
                          <span className="text-primary-500">Scholar-verified</span>
                        </>
                      ) : (
                        <span>For guidance only · not a fatwa</span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                  <span className="text-white text-xs font-bold">J</span>
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-bl-sm">
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="px-4 sm:px-6 py-4 border-t border-border bg-background">
        {!canSend ? (
          <div className="text-center py-3">
            <p className="text-sm text-muted mb-2">You&apos;ve used your 5 free messages today.</p>
            <a href="/pricing" className="text-primary-500 text-sm font-semibold hover:underline">
              Upgrade to Premium for unlimited messages →
            </a>
          </div>
        ) : (
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Ask about Islam..."
              className="flex-1 border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary-500"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-11 h-11 bg-primary-500 text-white rounded-xl flex items-center justify-center hover:bg-primary-600 disabled:opacity-40 transition-colors flex-shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
        )}
        <p className="text-[10px] text-muted text-center mt-2">
          AI responses are for guidance only — not a fatwa. Always consult a qualified scholar for personal rulings.
        </p>
      </div>
    </div>
  );
}
