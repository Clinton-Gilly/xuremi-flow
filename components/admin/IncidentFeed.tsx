"use client";

import { useState } from "react";
import { IncidentRecord } from "@/types/admin";
import { retryIncidentAction } from "@/app/admin/actions";
import { AdminBadge } from "./AdminBadge";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  Code2Icon,
  RefreshCwIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface IncidentFeedProps {
  initialIncidents: IncidentRecord[];
}

export function IncidentFeed({ initialIncidents }: IncidentFeedProps) {
  const [incidents, setIncidents] = useState<IncidentRecord[]>(initialIncidents);
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const handleRetry = async (inc: IncidentRecord) => {
    setRetryingId(inc.id);
    try {
      const res = await retryIncidentAction(inc.id);
      if (res.success) {
        toast.success(`Retry scheduled for run ${inc.runHash}`);
        setIncidents((prev) =>
          prev.map((i) => (i.id === inc.id ? { ...i, status: "retrying", retriesCount: i.retriesCount + 1 } : i)),
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to retry execution");
    } finally {
      setRetryingId(null);
    }
  };

  const getCategoryBadge = (cat: IncidentRecord["category"]) => {
    switch (cat) {
      case "external_outage":
        return <AdminBadge variant="warning">External Provider 429/5xx</AdminBadge>;
      case "engine_timeout":
        return <AdminBadge variant="error">Engine Timeout</AdminBadge>;
      case "user_logic_error":
        return <AdminBadge variant="pending">User Logic Error</AdminBadge>;
    }
  };

  return (
    <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#1E222B] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangleIcon className="size-4 text-rose-400" />
            <h2 className="text-sm font-semibold tracking-tight text-white">Live Incident & Failure Feed</h2>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Real-time execution failures across all tenants with automated root-cause classification and replay triggers.
          </p>
        </div>

        <span className="font-mono text-xs text-[#94A3B8] border border-[#1E222B] bg-[#0B0C0E] px-2.5 py-1 rounded-md">
          {incidents.length} active incidents
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1E222B] text-[#94A3B8] font-mono">
              <th className="pb-3 font-medium">Run Hash</th>
              <th className="pb-3 font-medium">Workflow & Tenant</th>
              <th className="pb-3 font-medium">Classification</th>
              <th className="pb-3 font-medium">Failure Reason</th>
              <th className="pb-3 font-medium">Latency</th>
              <th className="pb-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E222B]">
            {incidents.map((inc) => (
              <tr key={inc.id} className="group hover:bg-[#1A1D24] transition-colors">
                <td className="py-3 font-mono text-emerald-400 font-medium">{inc.runHash}</td>
                <td className="py-3">
                  <div className="font-medium text-white group-hover:text-emerald-300 transition-colors">
                    {inc.workflowName}
                  </div>
                  <div className="font-mono text-[11px] text-[#64748B]">{inc.tenantEmail}</div>
                </td>
                <td className="py-3">{getCategoryBadge(inc.category)}</td>
                <td className="py-3 max-w-xs truncate text-[#94A3B8] font-mono text-[11px]">
                  {inc.errorMessage}
                </td>
                <td className="py-3 font-mono text-[#94A3B8]">{inc.latencyMs}ms</td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedIncident(inc)}
                      className="inline-flex items-center gap-1 rounded border border-[#1E222B] bg-[#0B0C0E] px-2 py-1 text-xs text-[#94A3B8] hover:border-[#2E3440] hover:text-white transition-colors"
                    >
                      <SearchIcon className="size-3" />
                      <span>Inspect</span>
                    </button>

                    <button
                      type="button"
                      disabled={retryingId === inc.id || inc.status === "retrying"}
                      onClick={() => handleRetry(inc)}
                      className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
                    >
                      <RefreshCwIcon className={`size-3 ${retryingId === inc.id ? "animate-spin" : ""}`} />
                      <span>{inc.status === "retrying" ? "Retrying..." : "Retry"}</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Inspect Drawer */}
      <Sheet open={!!selectedIncident} onOpenChange={(open) => !open && setSelectedIncident(null)}>
        <SheetContent className="border-l border-[#1E222B] bg-[#0E1015] text-white sm:max-w-lg overflow-y-auto">
          {selectedIncident && (
            <div className="space-y-5">
              <SheetHeader>
                <SheetTitle className="text-base font-semibold text-white flex items-center gap-2">
                  <AlertTriangleIcon className="size-4 text-rose-400" />
                  <span>Execution Diagnostics: {selectedIncident.runHash}</span>
                </SheetTitle>
                <SheetDescription className="text-xs text-[#94A3B8]">
                  Root cause analysis and payload inspector for failed step.
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 text-xs font-mono">
                <div className="rounded-lg border border-[#1E222B] bg-[#14161B] p-3 space-y-2">
                  <div className="text-[#64748B] text-[11px] uppercase tracking-wider">Workflow Metadata</div>
                  <div className="text-white font-sans font-medium text-sm">{selectedIncident.workflowName}</div>
                  <div className="text-[#94A3B8]">ID: {selectedIncident.workflowId}</div>
                  <div className="text-[#94A3B8]">Tenant: {selectedIncident.tenantEmail} ({selectedIncident.tenantId})</div>
                  <div className="text-[#94A3B8]">Failed Step: {selectedIncident.failedStepNodeId} ({selectedIncident.failedStepNodeType})</div>
                  <div className="text-[#94A3B8]">Latency: {selectedIncident.latencyMs}ms • Retries: {selectedIncident.retriesCount}</div>
                </div>

                <div className="rounded-lg border border-rose-900/30 bg-rose-950/20 p-3 space-y-1">
                  <div className="text-rose-400 text-[11px] uppercase tracking-wider font-semibold">Error Diagnostic</div>
                  <div className="text-rose-200 text-xs break-words">{selectedIncident.errorMessage}</div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[#64748B] text-[11px] uppercase tracking-wider">Input Payload JSON</div>
                  <pre className="rounded-lg border border-[#1E222B] bg-[#090A0C] p-3 text-[11px] text-emerald-300 overflow-x-auto">
                    {JSON.stringify(selectedIncident.inputPayload, null, 2)}
                  </pre>
                </div>

                {selectedIncident.outputPayload && (
                  <div className="space-y-1.5">
                    <div className="text-[#64748B] text-[11px] uppercase tracking-wider">Output / Rejection Response</div>
                    <pre className="rounded-lg border border-[#1E222B] bg-[#090A0C] p-3 text-[11px] text-amber-300 overflow-x-auto">
                      {JSON.stringify(selectedIncident.outputPayload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#1E222B]">
                <button
                  type="button"
                  onClick={() => setSelectedIncident(null)}
                  className="rounded border border-[#1E222B] bg-[#14161B] px-3 py-1.5 text-xs text-[#94A3B8] hover:text-white"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleRetry(selectedIncident);
                    setSelectedIncident(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
                >
                  <RefreshCwIcon className="size-3.5" />
                  <span>Retry Execution</span>
                </button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
