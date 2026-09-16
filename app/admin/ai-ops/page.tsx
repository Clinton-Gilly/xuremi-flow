import { getAIOpsState } from "@/lib/admin/service";
import { AIOpsDashboard } from "@/components/admin/AIOpsDashboard";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { BotIcon } from "lucide-react";

export default async function AdminAIOpsPage() {
  const { spend, fallbackRules, governors } = await getAIOpsState();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E222B] pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BotIcon className="size-5 text-emerald-400" />
            <span>AI Fleet Operations & Provider Governors</span>
            <AdminBadge variant="brand">Multi-Model Active</AdminBadge>
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Token expenditure tracking across Google Gemini, OpenAI, Claude, DeepSeek, dynamic multi-tier fallback chains, and RPS rate-limit governors.
          </p>
        </div>
      </div>

      <AIOpsDashboard spend={spend} fallbackRules={fallbackRules} governors={governors} />
    </div>
  );
}
