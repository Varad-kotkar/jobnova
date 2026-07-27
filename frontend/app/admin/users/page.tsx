"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Users, Shield, User } from "lucide-react";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Users Registry</h1>
        <p className="text-xs text-slate-400">Registered candidates and platform administrators</p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
          <Shield className="w-5 h-5 text-blue-400 shrink-0" />
          <div>
            <p className="font-bold text-white">Permanent System Administrator</p>
            <p className="text-slate-400">kotkarvarad12@gmail.com • Role: Administrator (Superuser)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
