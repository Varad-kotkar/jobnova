"use client";

import type { Metadata } from "next";
import { useState } from "react";

export default function ContactPage() {
  const [type, setType] = useState<"general" | "removal" | "bug">("general");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, connect to a form service (Formspree, Resend, etc.)
    setSubmitted(true);
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 space-y-10">
      <div className="border-b border-gray-100 pb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Contact Us</h1>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          Have a question, found a bug, or need to request content removal? We&apos;re here to help.
        </p>
      </div>

      {/* Contact type tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "general", label: "💬 General Question" },
          { key: "removal", label: "🔒 Content Removal / DMCA" },
          { key: "bug", label: "🐛 Report a Bug" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setType(t.key as typeof type)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              type === t.key
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {submitted ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center space-y-3">
          <div className="text-4xl">✅</div>
          <h2 className="text-lg font-bold text-emerald-900">Message Sent!</h2>
          <p className="text-sm text-emerald-700">
            We&apos;ve received your message and will respond within 2–3 business days.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-2 text-xs font-semibold text-emerald-700 hover:underline"
          >
            Send another message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {type === "removal" && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <strong>For DMCA / content removal requests:</strong> Please include the specific job listing
              URL(s) you want removed and a brief explanation of why. We process valid requests within{" "}
              <strong>7 business days</strong>.
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5" htmlFor="contact-name">
                Full Name
              </label>
              <input
                id="contact-name"
                type="text"
                required
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5" htmlFor="contact-email">
                Email Address
              </label>
              <input
                id="contact-email"
                type="email"
                required
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="you@company.com"
              />
            </div>
          </div>

          {type === "removal" && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5" htmlFor="contact-url">
                Job Listing URL(s) to Remove
              </label>
              <input
                id="contact-url"
                type="text"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="https://jobnova.app/jobs/..."
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5" htmlFor="contact-message">
              Message
            </label>
            <textarea
              id="contact-message"
              required
              rows={5}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
              placeholder={
                type === "removal"
                  ? "Describe the content you want removed and your rights as the rights holder..."
                  : type === "bug"
                  ? "Describe the bug, including steps to reproduce it..."
                  : "How can we help you?"
              }
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            Send Message →
          </button>
        </form>
      )}

      {/* Direct email fallback */}
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 space-y-2">
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Direct Email Contacts</p>
        <div className="space-y-1.5 text-sm text-gray-600">
          <p>General: <a href="mailto:hello@jobnova.app" className="text-blue-600 hover:underline font-semibold">hello@jobnova.app</a></p>
          <p>Legal / DMCA: <a href="mailto:legal@jobnova.app" className="text-blue-600 hover:underline font-semibold">legal@jobnova.app</a></p>
          <p>Privacy: <a href="mailto:privacy@jobnova.app" className="text-blue-600 hover:underline font-semibold">privacy@jobnova.app</a></p>
        </div>
      </div>
    </main>
  );
}
