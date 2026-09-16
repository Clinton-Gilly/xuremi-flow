import { getIncidentFeed, getSystemOverviewMetrics, getTelemetrySeries } from "@/lib/admin/service";
import { TelemetryChart } from "@/components/admin/TelemetryChart";
import { IncidentFeed } from "@/components/admin/IncidentFeed";
import { AdminBadge } from "@/components/admin/AdminBadge";
import {
  ActivityIcon,
  CheckCircle2Icon,
  ClockIcon,
  CoinsIcon,
  DatabaseIcon,
  LayersIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";

export default async function AdminOverviewPage() {
  const [kpis, telemetry, incidents] = await Promise.all([
    getSystemOverviewMetrics(),
    getTelemetrySeries("24h"),
    getIncidentFeed(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6">
      {/* Top Banner / Headline */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E222B] pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>System Telemetry & Platform Overview</span>
            <AdminBadge variant="success" dot>
              Live Fleet Active
            </AdminBadge>
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Global operational heartbeat for Xuremi Flow multi-tenant execution cluster.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 rounded-lg border border-[#1E222B] bg-[#14161B] px-3 py-1.5">
            <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[#94A3B8]">Queue Saturation:</span>
            <span className="font-semibold text-white">
              {kpis.activeWorkerConcurrency} / {kpis.maxWorkerCapacity} workers
            </span>
          </div>
        </div>
      </div>

      {/* KPI Metrics Row (6 Cards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* 1. Total Tenants */}
        <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-4">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <span className="text-xs font-medium">Registered Tenants</span>
            <UsersIcon className="size-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white font-mono">
            {kpis.totalTenants.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
            <TrendingUpIcon className="size-3" />
            <span>+14.2% this month</span>
          </div>
        </div>

        {/* 2. Active Workflows */}
        <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-4">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <span className="text-xs font-medium">Workflows</span>
            <LayersIcon className="size-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white font-mono">
            {kpis.activeWorkflows.total.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#94A3B8] font-mono">
            <span className="text-emerald-400">{kpis.activeWorkflows.published} pub</span>
            <span>•</span>
            <span className="text-slate-400">{kpis.activeWorkflows.draft} dft</span>
            <span>•</span>
            <span className="text-amber-400">{kpis.activeWorkflows.paused} psd</span>
          </div>
        </div>

        {/* 3. Execution Volume */}
        <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-4">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <span className="text-xs font-medium">24h / 30d Volume</span>
            <ActivityIcon className="size-4 text-purple-400" />
          </div>
          <div className="mt-2 text-xl font-bold tracking-tight text-white font-mono">
            {(kpis.executionVolume.last24h / 1000).toFixed(1)}k <span className="text-xs text-[#64748B]">/ {(kpis.executionVolume.last30d / 1000000).toFixed(2)}M</span>
          </div>
          <div className="mt-1 text-[11px] text-[#94A3B8] font-mono">
            <span>Durable step runs</span>
          </div>
        </div>

        {/* 4. Global Failure Rate */}
        <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-4">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <span className="text-xs font-medium">Global Error Rate</span>
            <TrendingDownIcon className="size-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-400 font-mono">
            {kpis.globalFailureRate}%
          </div>
          <div className="mt-1 text-[11px] text-[#94A3B8] font-mono">
            <span>SLA Target: &lt; 2.0%</span>
          </div>
        </div>

        {/* 5. Estimated MRR */}
        <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-4">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <span className="text-xs font-medium">Estimated MRR</span>
            <CoinsIcon className="size-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white font-mono">
            KSh {kpis.estimatedMRR.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-emerald-400 font-mono">
            <span>+18.6% QoQ growth</span>
          </div>
        </div>

        {/* 6. Redis Queue Depth */}
        <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-4">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <span className="text-xs font-medium">Redis Queue Depth</span>
            <DatabaseIcon className="size-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white font-mono">
            {kpis.redisQueueDepth} <span className="text-xs text-[#64748B]">jobs</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-400 font-mono">
            <span>0 backpressure lag</span>
          </div>
        </div>
      </div>

      {/* Dual-axis Telemetry Chart */}
      <TelemetryChart data={telemetry} />

      {/* Live Incident Feed */}
      <IncidentFeed initialIncidents={incidents} />
    </div>
  );
}
