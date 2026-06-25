"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, BadgeCheck, AlertCircle } from "lucide-react";
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
    <div className="flex gap-1.5 p-3 px-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-slate-300 animate-pulse-dot"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </div>
  );
}

const headerStyle = {
  background: "rgba(255, 255, 255, 0.80)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderBottom: "1px solid rgba(255, 255, 255, 0.90)",
  boxShadow: "0 2px 12px rgba(15, 23, 42, 0.05)",
};

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
          content: "I apologise. I am unable to connect right now. Please try again shortly. For urgent matters, please consult a qualified Islamic scholar.",
          verified: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-screen max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="px-5 py-4" style={headerStyle}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 ring-1 ring-blue-200">
            <span className="text-white text-sm font-bold">J</span>
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">Jannatie AI</p>
            <p className="text-xs text-slate-400">Scholar-reviewed · Sunni knowledge base</p>
          </div>
          {!isPremium && (
            <div
              className="ml-auto text-xs text-slate-500 px-3 py-1 rounded-full font-medium"
              style={{ background: "rgba(248, 250, 252, 0.90)", border: "1px solid rgba(226, 232, 240, 0.80)" }}
            >
              {Math.max(0, FREE_LIMIT - msgCount)} messages left
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div>
              <div className="text-3xl mb-3 font-arabic text-blue-600">بِسْمِ اللَّهِ</div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Assalamu Alaikum</h2>
              <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
                Ask me anything about Islam. I will always cite the hadith or Quran verse so you can verify my answer.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="text-sm text-left px-4 py-3 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white/90 transition-colors"
                  style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.80)" }}
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
                  <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1 ring-1 ring-blue-200">
                    <span className="text-white text-xs font-bold">J</span>
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "text-slate-700 rounded-bl-sm"
                  }`}
                  style={
                    msg.role === "ai"
                      ? {
                          background: "rgba(255, 255, 255, 0.80)",
                          border: "1px solid rgba(255, 255, 255, 0.90)",
                          backdropFilter: "blur(20px)",
                          boxShadow: "0 2px 12px rgba(15, 23, 42, 0.05)",
                        }
                      : {}
                  }
                >
                  {msg.content}
                  {msg.role === "ai" && (
                    <div
                      className="mt-2 pt-2 flex items-center gap-1.5 text-xs text-slate-400"
                      style={{ borderTop: "1px solid rgba(226, 232, 240, 0.80)" }}
                    >
                      {msg.verified ? (
                        <>
                          <BadgeCheck size={11} className="text-blue-600" />
                          <span className="text-blue-600">Scholar-verified</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={11} />
                          <span>For guidance only. Not a fatwa.</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                  <span className="text-white text-xs font-bold">J</span>
                </div>
                <div
                  className="rounded-2xl rounded-bl-sm"
                  style={{
                    background: "rgba(255, 255, 255, 0.80)",
                    border: "1px solid rgba(255, 255, 255, 0.90)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div
        className="px-5 py-4"
        style={{
          ...headerStyle,
          borderBottom: "none",
          borderTop: "1px solid rgba(255, 255, 255, 0.90)",
        }}
      >
        {!canSend ? (
          <div className="text-center py-3">
            <p className="text-sm text-slate-500 mb-2">You have used your 5 free messages today.</p>
            <a href="/pricing" className="text-blue-600 text-sm font-semibold hover:underline">
              Upgrade to Premium for unlimited messages
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
              className="flex-1 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all border border-slate-200 bg-white/80"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-11 h-11 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-500 disabled:opacity-35 transition-colors flex-shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
        )}
        <p className="text-[10px] text-slate-400 text-center mt-2">
          AI responses are for guidance only. Not a fatwa. Always consult a qualified scholar for personal rulings.
        </p>
      </div>

      <AnimatePresence />
    </div>
  );
}
