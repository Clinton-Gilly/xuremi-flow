"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ActivityIcon,
  BotIcon,
  CoinsIcon,
  LayersIcon,
  LayoutGridIcon,
  LayoutTemplateIcon,
  ShieldAlertIcon,
  UsersIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutGridIcon, exact: true },
  { href: "/admin/workflows", label: "Workflows", icon: LayersIcon },
  { href: "/admin/users", label: "Users & Orgs", icon: UsersIcon },
  { href: "/admin/finance", label: "Finance & Costs", icon: CoinsIcon },
  { href: "/admin/performance", label: "Performance & DLQ", icon: ActivityIcon },
  { href: "/admin/ai-ops", label: "AI Fleet & Ops", icon: BotIcon },
  { href: "/admin/security", label: "Security & Audit", icon: ShieldAlertIcon },
  { href: "/admin/templates", label: "Templates", icon: LayoutTemplateIcon },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="w-full border-b border-[#1E222B] bg-[#090A0C]">
      <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-6 scrollbar-none">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex shrink-0 items-center gap-2 px-3.5 py-3 text-xs font-medium transition-colors",
                isActive
                  ? "text-white"
                  : "text-[#94A3B8] hover:text-slate-200 hover:bg-[#14161B]/50 rounded-t-md",
              )}
            >
              <Icon
                className={cn(
                  "size-3.5 transition-colors",
                  isActive ? "text-emerald-400" : "text-[#64748B] group-hover:text-slate-300",
                )}
              />
              <span>{item.label}</span>
              {isActive && (
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-emerald-500 shadow-[0_-2px_6px_rgba(16,185,129,0.3)]" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
