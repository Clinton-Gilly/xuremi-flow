"use client";

import { useState } from "react";
import { ConnectorKillSwitch, DLQEntry, MaintenanceBannerState } from "@/types/admin";
import {
  replayAllDLQAction,
  replayDLQAction,
  toggleKillSwitchAction,
  updateMaintenanceBannerAction,
} from "@/app/admin/actions";
import { AdminBadge } from "./AdminBadge";
import {
  ActivityIcon,
  AlertOctagonIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  Code2Icon,
  CpuIcon,
  EyeIcon,
  RadioIcon,
  RefreshCwIcon,
  ServerIcon,
  ShieldAlertIcon,
  Volume2Icon,
  ZapIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PerformanceDashboardProps {
  killSwitches: ConnectorKillSwitch[];
  dlq: DLQEntry[];
  maintenanceBanner: MaintenanceBannerState;
}

export function PerformanceDashboard({
  killSwitches: initialSwitches,
  dlq: initialDlq,
  maintenanceBanner: initialBanner,
}: PerformanceDashboardProps) {
  const [switches, setSwitches] = useState<ConnectorKillSwitch[]>(initialSwitches);
  const [dlq, setDlq] = useState<DLQEntry[]>(initialDlq);
  const [banner, setBanner] = useState<MaintenanceBannerState>(initialBanner);
  const [inspectDlq, setInspectDlq] = useState<DLQEntry | null>(null);
  const [bannerMessage, setBannerMessage] = useState(initialBanner.message);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handleToggleKillSwitch = async (sw: ConnectorKillSwitch) => {
    const targetState = !sw.isFrozen;
    try {
      await toggleKillSwitchAction(sw.connectorId, targetState, targetState ? "Admin degradation override" : undefined);
      if (targetState) {
        toast.warning(`Kill-switch ENGAGED for ${sw.name}. All outbound node executions frozen platform-wide.`);
      } else {
        toast.success(`Kill-switch DISENGAGED for ${sw.name}. Resuming normal execution.`);
      }
      setSwitches((prev) =>
        prev.map((k) => (k.connectorId === sw.connectorId ? { ...k, isFrozen: targetState } : k)),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle kill switch");
    }
  };

  const handleToggleBanner = async () => {
    setIsBroadcasting(true);
    const updated: MaintenanceBannerState = {
      isActive: !banner.isActive,
      message: bannerMessage,
      severity: "warning",
    };
    try {
      await updateMaintenanceBannerAction(updated);
      setBanner(updated);
      if (updated.isActive) {
        toast.success("Maintenance banner broadcasted to all active tenant dashboards");
      } else {
        toast.info("Maintenance banner deactivated");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update maintenance banner");
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleReplaySingle = async (item: DLQEntry) => {
    try {
      await replayDLQAction(item.id);
      toast.success(`Replay dispatched for run ${item.runHash}`);
      setDlq((prev) => prev.filter((d) => d.id !== item.id));
      setInspectDlq(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to replay DLQ item");
    }
  };

  const handleReplayAll = async () => {
    try {
      const res = await replayAllDLQAction();
      toast.success(`Dispatched bulk replay for ${res.count} dead-letter executions`);
      setDlq([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to bulk replay DLQ");
    }
  };

  return (
    <div className="space-y-6">
      {/* Engine Concurrency & Backpressure Diagnostics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-4">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <span className="text-xs font-medium">Worker Concurrency Saturation</span>
            <CpuIcon className="size-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white font-mono">
            74% <span className="text-xs font-normal text-[#64748B]">(148 / 200 pool)</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-[#090A0C] overflow-hidden border border-[#1E222B]">
            <div className="h-full bg-emerald-500" style={{ width: "74%" }} />
          </div>
        </div>

        <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-4">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <span className="text-xs font-medium">Redis Backpressure Lag</span>
            <ServerIcon className="size-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-400 font-mono">
            0.04 ms
          </div>
          <div className="mt-1 text-[11px] text-[#94A3B8] font-mono">
            <span>Zero pipeline queue saturation</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-4">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <span className="text-xs font-medium">Average Job Wait Time</span>
            <ClockIcon className="size-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white font-mono">
            18 ms
          </div>
          <div className="mt-1 text-[11px] text-emerald-400 font-mono">
            <span>Immediate dequeue execution</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-4">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <span className="text-xs font-medium">Dead Letter Queue (DLQ)</span>
            <AlertOctagonIcon className="size-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-rose-400 font-mono">
            {dlq.length} <span className="text-xs font-normal text-[#64748B]">retained</span>
          </div>
          <div className="mt-1 text-[11px] text-[#94A3B8] font-mono">
            <span>Requires manual triage or replay</span>
          </div>
        </div>
      </div>

      {/* Incident Switchboard & Connector Kill-Switches */}
      <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-5 shadow-sm space-y-4">
        <div className="border-b border-[#1E222B] pb-4">
          <div className="flex items-center gap-2">
            <ShieldAlertIcon className="size-4 text-amber-400" />
            <h2 className="text-sm font-semibold tracking-tight text-white">
              Incident Switchboard & Global Connector Kill-Switches
            </h2>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Instantly freeze individual integration connectors platform-wide during third-party degradations to prevent cascading worker timeouts.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {switches.map((sw) => (
            <div
              key={sw.connectorId}
              className={`flex items-center justify-between rounded-xl border p-3.5 transition-colors ${
                sw.isFrozen
                  ? "border-rose-500/40 bg-rose-950/20"
                  : "border-[#1E222B] bg-[#090A0C] hover:border-[#2E3440]"
              }`}
            >
              <div>
                <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                  <span>{sw.name}</span>
                  {sw.isFrozen && <AdminBadge variant="error">FROZEN</AdminBadge>}
                </div>
                <div className="text-[11px] font-mono text-[#64748B] mt-0.5">
                  ID: {sw.connectorId}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggleKillSwitch(sw)}
                className={`rounded-lg px-2.5 py-1 text-xs font-mono font-medium transition-colors ${
                  sw.isFrozen
                    ? "bg-emerald-600 text-white hover:bg-emerald-500"
                    : "border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                }`}
              >
                {sw.isFrozen ? "Unfreeze" : "Kill Switch"}
              </button>
            </div>
          ))}
        </div>

        {/* Global Maintenance Banner Broadcaster */}
        <div className="rounded-xl border border-[#1E222B] bg-[#090A0C] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2Icon className="size-4 text-sky-400" />
              <span className="text-xs font-semibold text-white">Broadcast Maintenance Banner to Dashboards</span>
            </div>
            <AdminBadge variant={banner.isActive ? "warning" : "neutral"} dot={banner.isActive}>
              {banner.isActive ? "BROADCASTING LIVE" : "INACTIVE"}
            </AdminBadge>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={bannerMessage}
              onChange={(e) => setBannerMessage(e.target.value)}
              placeholder="e.g. Scheduled infrastructure upgrade in progress. Runs may experience slight delay."
              className="w-full rounded-lg border border-[#1E222B] bg-[#14161B] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
            />
            <button
              type="button"
              disabled={isBroadcasting}
              onClick={handleToggleBanner}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors ${
                banner.isActive
                  ? "bg-rose-600 hover:bg-rose-500"
                  : "bg-sky-600 hover:bg-sky-500"
              }`}
            >
              {banner.isActive ? "Deactivate Banner" : "Broadcast Banner"}
            </button>
          </div>
        </div>
      </div>

      {/* Dead Letter Queue (DLQ) Inspector */}
      <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E222B] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <AlertOctagonIcon className="size-4 text-rose-400" />
              <h2 className="text-sm font-semibold tracking-tight text-white">
                Dead Letter Queue (DLQ) Inspector & Bulk Replayer
              </h2>
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Permanently exhausted execution failures quarantined for manual payload inspection and bulk replay.
            </p>
          </div>

          {dlq.length > 0 && (
            <button
              type="button"
              onClick={handleReplayAll}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
            >
              <RefreshCwIcon className="size-3.5" />
              <span>Bulk Replay All ({dlq.length})</span>
            </button>
          )}
        </div>

        {dlq.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#94A3B8]">
            <CheckCircle2Icon className="mx-auto size-8 text-emerald-400 mb-2" />
            <div className="font-medium text-white">Dead Letter Queue is empty</div>
            <div>All workflow executions are healthy and completing normally.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1E222B] bg-[#090A0C] text-[#94A3B8] font-mono">
                  <th className="px-4 py-3 font-medium">Run Hash</th>
                  <th className="px-4 py-3 font-medium">Workflow</th>
                  <th className="px-4 py-3 font-medium">Tenant</th>
                  <th className="px-4 py-3 font-medium">Exhausted Error</th>
                  <th className="px-4 py-3 font-medium">Attempts</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E222B]">
                {dlq.map((item) => (
                  <tr key={item.id} className="hover:bg-[#1A1D24] transition-colors">
                    <td className="px-4 py-3 font-mono text-emerald-400 font-medium">{item.runHash}</td>
                    <td className="px-4 py-3 font-medium text-white">{item.workflowName}</td>
                    <td className="px-4 py-3 font-mono text-[#94A3B8]">{item.tenantId}</td>
                    <td className="px-4 py-3 text-rose-300 font-mono text-[11px] max-w-xs truncate">
                      {item.errorMessage}
                    </td>
                    <td className="px-4 py-3 font-mono text-[#94A3B8]">{item.attempts} max</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setInspectDlq(item)}
                          className="inline-flex items-center gap-1 rounded border border-[#1E222B] bg-[#0B0C0E] px-2 py-1 text-xs text-[#94A3B8] hover:text-white"
                        >
                          <EyeIcon className="size-3" />
                          <span>Inspect Payload</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReplaySingle(item)}
                          className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-500"
                        >
                          <RefreshCwIcon className="size-3" />
                          <span>Replay</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DLQ Payload Inspector Modal */}
      <Dialog open={!!inspectDlq} onOpenChange={(open) => !open && setInspectDlq(null)}>
        <DialogContent className="border border-[#1E222B] bg-[#0E1015] text-white sm:max-w-xl">
          {inspectDlq && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base font-semibold text-white">
                  <Code2Icon className="size-4 text-emerald-400" />
                  <span>DLQ Payload Inspector: {inspectDlq.runHash}</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-[#94A3B8]">
                  {inspectDlq.workflowName} • {inspectDlq.errorMessage}
                </DialogDescription>
              </DialogHeader>

              <div className="max-h-72 overflow-y-auto rounded-lg border border-[#1E222B] bg-[#090A0C] p-3 font-mono text-xs text-emerald-300">
                <pre>{JSON.stringify(inspectDlq.payload, null, 2)}</pre>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1E222B]">
                <button
                  type="button"
                  onClick={() => setInspectDlq(null)}
                  className="rounded border border-[#1E222B] bg-[#14161B] px-3 py-1.5 text-xs text-[#94A3B8] hover:text-white"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleReplaySingle(inspectDlq)}
                  className="inline-flex items-center gap-1.5 rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
                >
                  <RefreshCwIcon className="size-3.5" />
                  <span>Replay Execution</span>
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
