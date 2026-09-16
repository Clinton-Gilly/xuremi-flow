"use client";

import { useState } from "react";
import { AIModelSpendBreakdown, DynamicFallbackRule, IntegrationRateLimit } from "@/types/admin";
import { updateRateLimitGovernorAction } from "@/app/admin/actions";
import { AdminBadge } from "./AdminBadge";
import {
  ArrowRightIcon,
  BotIcon,
  CheckCircle2Icon,
  CpuIcon,
  FlameIcon,
  GaugeIcon,
  NetworkIcon,
  Settings2Icon,
  SlidersIcon,
  SparklesIcon,
  ZapIcon,
} from "lucide-react";
import { toast } from "sonner";

interface AIOpsDashboardProps {
  spend: AIModelSpendBreakdown[];
  fallbackRules: DynamicFallbackRule[];
  governors: IntegrationRateLimit[];
}

export function AIOpsDashboard({
  spend,
  fallbackRules: initialRules,
  governors: initialGovernors,
}: AIOpsDashboardProps) {
  const [rules, setRules] = useState<DynamicFallbackRule[]>(initialRules);
  const [governors, setGovernors] = useState<IntegrationRateLimit[]>(initialGovernors);
  const [editingGov, setEditingGov] = useState<{ integration: string; rps: number } | null>(null);

  const totalTokens = spend.reduce((acc, s) => acc + s.totalTokens, 0);
  const totalSpend = spend.reduce((acc, s) => acc + s.costKsh, 0);

  const handleToggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isEnabled: !r.isEnabled } : r)),
    );
    toast.success("Dynamic fallback routing rule updated");
  };

  const handleSaveGovernor = async (integration: string, maxRps: number) => {
    try {
      await updateRateLimitGovernorAction(integration, maxRps);
      setGovernors((prev) =>
        prev.map((g) => (g.integration === integration ? { ...g, maxRps } : g)),
      );
      toast.success(`Rate limit governor for ${integration} capped at ${maxRps} RPS`);
      setEditingGov(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update rate limit governor");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top AI Spend Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-4">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <span className="text-xs font-medium">30d Total Token Burn</span>
            <FlameIcon className="size-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white font-mono">
            {(totalTokens / 1000000).toFixed(1)}M
          </div>
          <div className="mt-1 text-[11px] text-[#94A3B8] font-mono">Prompt + completion tokens</div>
        </div>

        <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-4">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <span className="text-xs font-medium">Total Model API Spend</span>
            <SparklesIcon className="size-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-400 font-mono">
            KSh {totalSpend.toFixed(2)}
          </div>
          <div className="mt-1 text-[11px] text-emerald-400 font-mono">
            Blended cost: KSh 41.60 / 100k tokens
          </div>
        </div>

        <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-4">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <span className="text-xs font-medium">Fastest Endpoint (p50)</span>
            <ZapIcon className="size-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white font-mono">
            420 ms
          </div>
          <div className="mt-1 text-[11px] text-sky-400 font-mono">Google Gemini 2.5 Flash</div>
        </div>

        <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-4">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <span className="text-xs font-medium">Fallback Gateways</span>
            <NetworkIcon className="size-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white font-mono">
            2 Active
          </div>
          <div className="mt-1 text-[11px] text-purple-400 font-mono">Automated 429 & latency re-routing</div>
        </div>
      </div>

      {/* Model Spend Breakdown Table */}
      <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-5 shadow-sm space-y-4">
        <div className="border-b border-[#1E222B] pb-4">
          <div className="flex items-center gap-2">
            <BotIcon className="size-4 text-emerald-400" />
            <h2 className="text-sm font-semibold tracking-tight text-white">
              Model Token Burn & Provider Expenditure
            </h2>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Real-time tracking across Google Gemini, OpenAI, Claude, DeepSeek, and Groq inference pools.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1E222B] bg-[#090A0C] text-[#94A3B8] font-mono">
                <th className="px-4 py-3 font-medium">Provider & Model</th>
                <th className="px-4 py-3 font-medium">Prompt Tokens</th>
                <th className="px-4 py-3 font-medium">Completion Tokens</th>
                <th className="px-4 py-3 font-medium">Total Volume</th>
                <th className="px-4 py-3 font-medium">Cost (KSh)</th>
                <th className="px-4 py-3 font-medium">Avg Latency</th>
                <th className="px-4 py-3 font-medium text-right">Error Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E222B]">
              {spend.map((s) => (
                <tr key={s.modelName} className="hover:bg-[#1A1D24] transition-colors font-mono">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white uppercase">{s.provider}</div>
                    <div className="text-[11px] text-emerald-400">{s.modelName}</div>
                  </td>
                  <td className="px-4 py-3 text-[#94A3B8]">{(s.promptTokens / 1000).toLocaleString()}k</td>
                  <td className="px-4 py-3 text-[#94A3B8]">{(s.completionTokens / 1000).toLocaleString()}k</td>
                  <td className="px-4 py-3 text-white font-medium">{(s.totalTokens / 1000000).toFixed(2)}M</td>
                  <td className="px-4 py-3 text-emerald-400 font-semibold">KSh {s.costKsh.toFixed(2)}</td>
                  <td className="px-4 py-3 text-[#94A3B8]">{s.averageLatencyMs}ms</td>
                  <td className="px-4 py-3 text-right">
                    <AdminBadge variant={s.errorRatePercentage > 0.5 ? "error" : "success"}>
                      {s.errorRatePercentage}%
                    </AdminBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dynamic Provider Fallback Chains */}
      <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-5 shadow-sm space-y-4">
        <div className="border-b border-[#1E222B] pb-4">
          <div className="flex items-center gap-2">
            <NetworkIcon className="size-4 text-sky-400" />
            <h2 className="text-sm font-semibold tracking-tight text-white">
              Dynamic Provider Fallback & Redundancy Chains
            </h2>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Automatic failover triggers when primary model endpoint encounters rate limits (429) or latency degradation.
          </p>
        </div>

        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#1E222B] bg-[#090A0C] p-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="font-semibold text-white">{rule.primaryProvider}</span>
                  <ArrowRightIcon className="size-3 text-[#64748B]" />
                  <span className="text-sky-400">{rule.fallbackProvider}</span>
                  <ArrowRightIcon className="size-3 text-[#64748B]" />
                  <span className="text-purple-400">{rule.emergencyProvider}</span>
                </div>
                <div className="text-[11px] text-[#94A3B8]">
                  Failover condition:{" "}
                  <span className="font-mono text-amber-400">
                    {rule.triggerCondition === "rate_limit_429"
                      ? "HTTP 429 Rate Limit"
                      : "Latency > 5000ms"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <AdminBadge variant={rule.isEnabled ? "success" : "neutral"} dot={rule.isEnabled}>
                  {rule.isEnabled ? "ACTIVE" : "DISABLED"}
                </AdminBadge>
                <button
                  type="button"
                  onClick={() => handleToggleRule(rule.id)}
                  className="rounded-lg border border-[#1E222B] bg-[#14161B] px-3 py-1.5 text-xs text-[#94A3B8] hover:text-white"
                >
                  {rule.isEnabled ? "Disable" : "Enable"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rate-Limit Governors */}
      <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-5 shadow-sm space-y-4">
        <div className="border-b border-[#1E222B] pb-4">
          <div className="flex items-center gap-2">
            <GaugeIcon className="size-4 text-purple-400" />
            <h2 className="text-sm font-semibold tracking-tight text-white">
              Integration Rate-Limit Governors (RPS Caps)
            </h2>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Configure system-wide requests-per-second caps per external connector to prevent tripping upstream provider quotas.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {governors.map((gov) => {
            const isEditing = editingGov?.integration === gov.integration;
            const rpsVal = isEditing ? editingGov.rps : gov.maxRps;

            return (
              <div
                key={gov.integration}
                className="rounded-xl border border-[#1E222B] bg-[#090A0C] p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-white uppercase text-xs">
                    {gov.integration}
                  </span>
                  <AdminBadge variant="success">Governed</AdminBadge>
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#94A3B8]">Current Live Traffic:</span>
                  <span className="text-emerald-400 font-medium">{gov.currentRps} RPS</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                    <span>Maximum Cap:</span>
                    <span className="font-mono font-semibold text-white">{gov.maxRps} RPS</span>
                  </div>

                  {isEditing ? (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        value={rpsVal}
                        onChange={(e) =>
                          setEditingGov({
                            integration: gov.integration,
                            rps: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full rounded-lg border border-[#1E222B] bg-[#14161B] p-1.5 font-mono text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveGovernor(gov.integration, rpsVal)}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs text-white"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingGov({ integration: gov.integration, rps: gov.maxRps })}
                      className="mt-2 w-full rounded-lg border border-[#1E222B] bg-[#14161B] py-1.5 text-xs text-[#94A3B8] hover:text-white"
                    >
                      Adjust Cap
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
