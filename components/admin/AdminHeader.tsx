"use client";

import Link from "next/link";
import { ArrowLeftIcon, CpuIcon, ShieldCheckIcon } from "lucide-react";
import { AdminBadge } from "./AdminBadge";

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-[#1E222B] bg-[#090A0C]/90 px-6 backdrop-blur-md">
      {/* Left: Brand & Badges */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight text-white transition-colors hover:text-emerald-400"
        >
          <div className="flex size-7 items-center justify-center rounded-lg border border-[#2E3440] bg-[#14161B] text-emerald-400">
            <ShieldCheckIcon className="size-4" />
          </div>
          <span>Xuremi Flow</span>
          <span className="text-[#64748B]">•</span>
          <span className="font-mono text-xs uppercase text-emerald-400 tracking-wider">SuperAdmin</span>
        </Link>

        <div className="hidden items-center gap-2 sm:flex">
          <AdminBadge variant="brand">Production</AdminBadge>
          <AdminBadge variant="success" dot>
            Worker: Healthy
          </AdminBadge>
        </div>
      </div>

      {/* Right: Quick-switch & Admin Profile */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 font-mono text-xs text-[#94A3B8] border border-[#1E222B] bg-[#14161B] px-2.5 py-1 rounded-md">
          <CpuIcon className="size-3.5 text-emerald-400" />
          <span>v2.4.0-enterprise</span>
        </div>

        <Link
          href="/workflows"
          className="inline-flex items-center gap-1.5 rounded-md border border-[#1E222B] bg-[#14161B] px-3 py-1.5 text-xs font-medium text-[#94A3B8] transition-colors hover:border-[#2E3440] hover:bg-[#1E222B] hover:text-white"
        >
          <ArrowLeftIcon className="size-3.5" />
          <span>Switch to User App</span>
        </Link>
      </div>
    </header>
  );
}
