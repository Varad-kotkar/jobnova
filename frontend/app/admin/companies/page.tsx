"use client";

import React from "react";
import { Building2 } from "lucide-react";

export default function AdminCompaniesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Companies Directory</h1>
        <p className="text-xs text-slate-400">Verified hiring employers and partner organizations</p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <p className="text-xs text-slate-400 text-center py-6">Verified employer companies: Stripe, Vercel, Linear, Figma, Notion, Supabase, Datadog, Cloudflare, Shopify, GitHub, Anthropic, Tailwind Labs, PlanetScale, Resend, Netflix.</p>
      </div>
    </div>
  );
}
