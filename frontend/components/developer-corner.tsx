"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import type { Route } from "next";
import { getMemes, MemeData } from "@/lib/api";

// Curated static memes as fallback when API has no content yet
const STATIC_MEMES: MemeData[] = [
  {
    id: "static-1",
    title: "When the code finally works after hours of debugging",
    image_url: "https://i.imgur.com/LRoXmn8.gif",
    category: "developer",
    is_pinned: false,
    is_active: true,
    alt_text: "Celebration GIF — code finally works",
  },
  {
    id: "static-2",
    title: "Me explaining my project to the recruiter vs reality",
    image_url: "https://i.imgur.com/fNMXMpL.gif",
    category: "placement",
    is_pinned: false,
    is_active: true,
    alt_text: "Expectation vs reality developer meme",
  },
  {
    id: "static-3",
    title: "Fixing one bug introduces three more",
    image_url: "https://i.imgur.com/lKT1VDV.gif",
    category: "developer",
    is_pinned: false,
    is_active: true,
    alt_text: "Fixing bugs meme",
  },
  {
    id: "static-4",
    title: "Interview: Name all design patterns. Me: ...",
    image_url: "https://i.imgur.com/j2s2ZtF.gif",
    category: "interview",
    is_pinned: false,
    is_active: true,
    alt_text: "Interview blank stare meme",
  },
  {
    id: "static-5",
    title: "Monday motivation: Your future self will thank you 🚀",
    image_url: "https://i.imgur.com/bvKhAUQ.gif",
    category: "motivation",
    is_pinned: false,
    is_active: true,
    alt_text: "Monday motivation gif",
  },
];

const CATEGORIES = [
  { key: "all", label: "🌟 All", emoji: "🌟" },
  { key: "developer", label: "💻 Dev Life", emoji: "💻" },
  { key: "placement", label: "🎓 Placement", emoji: "🎓" },
  { key: "interview", label: "😅 Interview", emoji: "😅" },
  { key: "motivation", label: "🔥 Motivation", emoji: "🔥" },
  { key: "humor", label: "😂 Humor", emoji: "😂" },
];

// Career motivation rotating quotes
const MOTIVATION_QUOTES = [
  {
    quote: "Career First. Everything Else Will Follow.",
    sub: "Start applying. Start growing. Start winning.",
    cta: "Find Jobs Now",
    href: "/jobs",
    gradient: "from-violet-600 via-purple-600 to-indigo-700",
  },
  {
    quote: "Every Expert Was Once a Beginner.",
    sub: "Your dream job is one application away. Don't stop.",
    cta: "Browse Internships",
    href: "/jobs?employment_type=Internship",
    gradient: "from-blue-600 via-cyan-600 to-teal-700",
  },
  {
    quote: "Code Your Future. Build What You Imagine.",
    sub: "Top tech companies are hiring freshers and interns right now.",
    cta: "Fresher Jobs",
    href: "/jobs?experience_level=Fresher",
    gradient: "from-emerald-600 via-green-600 to-teal-700",
  },
  {
    quote: "Rejected Today, Hired Tomorrow.",
    sub: "Persistence is the rarest skill in tech. Keep going.",
    cta: "Interview Tips",
    href: "/career-coach",
    gradient: "from-orange-600 via-red-600 to-pink-700",
  },
];

function MemeCard({ meme }: { meme: MemeData }) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200 p-6 flex items-center justify-center min-h-[180px]">
        <div className="text-center">
          <div className="text-4xl mb-2">😄</div>
          <p className="text-xs text-slate-500 font-medium">{meme.title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col">
      {meme.is_pinned && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 px-3 py-1 text-xs font-bold text-white text-center">
          📌 Featured
        </div>
      )}
      <div className="relative overflow-hidden bg-slate-100" style={{ aspectRatio: "16/9" }}>
        <img
          src={meme.image_url}
          alt={meme.alt_text || meme.title}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </div>
      <div className="p-3">
        <p className="text-xs font-semibold text-slate-700 line-clamp-2 leading-relaxed">
          {meme.title}
        </p>
        <span className="mt-1.5 inline-block text-[10px] font-bold uppercase tracking-wide text-slate-400">
          {meme.category}
        </span>
      </div>
    </div>
  );
}

function MotivationCard() {
  const [index, setIndex] = useState(0);
  const card = MOTIVATION_QUOTES[index];

  // Auto-rotate every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % MOTIVATION_QUOTES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className={`rounded-2xl bg-gradient-to-br ${card.gradient} p-8 text-white flex flex-col justify-between min-h-[260px] shadow-xl transition-all duration-700`}
    >
      <div className="space-y-3">
        <div className="flex gap-1 mb-4">
          {MOTIVATION_QUOTES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-8 bg-white" : "w-3 bg-white/40"
              }`}
              aria-label={`Quote ${i + 1}`}
            />
          ))}
        </div>
        <h3 className="text-xl font-extrabold leading-tight">
          &ldquo;{card.quote}&rdquo;
        </h3>
        <p className="text-sm text-white/80 leading-relaxed">{card.sub}</p>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <Link
          href={card.href as Route}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 px-4 py-2 text-sm font-bold transition-all"
        >
          {card.cta} →
        </Link>
        <Link
          href="/career-coach"
          className="text-xs text-white/70 hover:text-white transition font-semibold"
        >
          Career Coach
        </Link>
      </div>
    </div>
  );
}

interface DeveloperCornerProps {
  initialMemes?: MemeData[];
}

export default function DeveloperCorner({ initialMemes }: DeveloperCornerProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [memes, setMemes] = useState<MemeData[]>(initialMemes || []);
  const [loading, setLoading] = useState(!initialMemes);

  useEffect(() => {
    getMemes()
      .then((data) => {
        if (data.length > 0) setMemes(data);
        else setMemes(STATIC_MEMES);
      })
      .catch(() => setMemes(STATIC_MEMES))
      .finally(() => setLoading(false));
  }, []);

  const filteredMemes =
    activeCategory === "all"
      ? memes
      : memes.filter((m) => m.category === activeCategory);

  const displayMemes = filteredMemes.slice(0, 8);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="text-2xl">😄</span> Developer Corner
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Memes, motivation & engineering humor for the community
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeCategory === cat.key
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-900"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Meme Grid — 2 columns inside left 2/3 */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-slate-100 animate-pulse"
                  style={{ aspectRatio: "16/9" }}
                />
              ))}
            </div>
          ) : displayMemes.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {displayMemes.map((meme) => (
                <MemeCard key={meme.id} meme={meme} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center bg-slate-50/50">
              <div className="text-4xl mb-3">😄</div>
              <p className="text-sm font-semibold text-slate-600">
                No memes in this category yet.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try a different category or check back soon!
              </p>
            </div>
          )}
        </div>

        {/* Career Motivation Card — right 1/3 */}
        <div className="space-y-4">
          <MotivationCard />

          {/* Quick Links */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Career Resources
            </p>
            {[
              { href: "/jobs?employment_type=Internship", label: "🎓 Find Internships" },
              { href: "/jobs?experience_level=Fresher", label: "👨‍🎓 Fresher Jobs" },
              { href: "/career-coach", label: "🤖 AI Career Coach" },
              { href: "/jobs?country=India", label: "🇮🇳 India Tech Jobs" },
              { href: "/jobs?remote=true", label: "🌍 Remote Jobs" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href as Route}
                className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-blue-600 py-1.5 border-b border-slate-50 last:border-0 transition-colors"
              >
                {link.label}
                <span className="ml-auto text-slate-300">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
