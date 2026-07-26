"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getApiUrl } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
  action?: { label: string; href: string };
}

const QUICK_ACTIONS = [
  { icon: "🔍", label: "Find Python jobs", prompt: "Find me remote Python developer jobs" },
  { icon: "📄", label: "Improve resume", prompt: "How can I improve my resume to get more interviews?" },
  { icon: "💰", label: "Estimate salary", prompt: "What is the average salary for a senior React developer in India?" },
  { icon: "🎯", label: "Prep interview", prompt: "Give me the top 10 React interview questions for a senior role" },
  { icon: "✉️", label: "Cover letter tips", prompt: "How do I write a compelling cover letter for a software engineering role?" },
  { icon: "🤝", label: "Negotiate offer", prompt: "How do I negotiate a higher salary offer?" },
];

async function askCareerCoach(
  token: string | null,
  message: string,
): Promise<string> {
  if (!token) {
    return "Please sign in to use the AI Career Coach. Your conversations are private and personalized to your profile.";
  }
  try {
    const res = await fetch(`${getApiUrl()}/api/career-coach/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.reply || data.response || data.message || "Got it! Let me help you with that.";
    }
    return "I'm having trouble connecting right now. Please try again in a moment.";
  } catch {
    return "Network error. Please check your connection and try again.";
  }
}

export default function AICopilot() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! I'm your JobNova AI Career Coach 👋\n\nI can help you find jobs, improve your resume, prep for interviews, estimate salaries, or negotiate offers. What would you like to do?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: text.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Detect navigation intents
    let action: Message["action"] | undefined;
    const lower = text.toLowerCase();
    if (lower.includes("find") && (lower.includes("job") || lower.includes("python") || lower.includes("react") || lower.includes("remote"))) {
      const query = text.replace(/find me?|find|show me?|show/gi, "").trim();
      action = { label: "Browse Matching Jobs →", href: `/jobs?q=${encodeURIComponent(query)}` };
    } else if (lower.includes("tracker") || lower.includes("application")) {
      action = { label: "Open Job Tracker →", href: "/tracker" };
    } else if (lower.includes("resume") || lower.includes("ats")) {
      action = { label: "Go to Resume Analyzer →", href: "/dashboard?tab=profile" };
    } else if (lower.includes("interview")) {
      action = { label: "Open Interview Coach →", href: "/career-coach" };
    }

    const reply = await askCareerCoach(token, text.trim());
    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      text: reply,
      timestamp: new Date(),
      action,
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 px-4 py-3 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 ${
          open ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        aria-label="Open AI Career Coach"
      >
        <span className="text-lg">✨</span>
        <span className="text-xs font-bold hidden sm:block">AI Career Coach</span>
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm sm:max-w-md flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
          style={{ height: "520px" }}>
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-sm font-black text-white">
                ✨
              </div>
              <div>
                <p className="text-sm font-bold text-white">AI Career Coach</p>
                <p className="text-[10px] text-blue-100 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Ready to help
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-xl p-1.5 text-white/70 hover:bg-white/20 hover:text-white transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  {msg.action && (
                    <Link
                      href={msg.action.href as any}
                      onClick={() => setOpen(false)}
                      className="mt-2 inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition"
                    >
                      {msg.action.label}
                    </Link>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-white border border-slate-200 px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="px-4 pt-2 pb-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Actions</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_ACTIONS.map((qa) => (
                  <button
                    key={qa.label}
                    onClick={() => sendMessage(qa.prompt)}
                    className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 hover:border-blue-300 transition"
                  >
                    {qa.icon} {qa.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your career..."
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="flex items-center justify-center h-8 w-8 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-40"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
