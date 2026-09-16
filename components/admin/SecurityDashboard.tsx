"use client";

import { useState } from "react";
import { AdminAuditLog, CredentialVaultHealth, RunawayLoopAlert } from "@/types/admin";
import { quarantineWorkflowAction } from "@/app/admin/actions";
import { AdminBadge } from "./AdminBadge";
import {
  AlertOctagonIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  KeyRoundIcon,
  RepeatIcon,
  SearchIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { toast } from "sonner";

interface SecurityDashboardProps {
  loopAlerts: RunawayLoopAlert[];
  vaultHealth: CredentialVaultHealth[];
  initialAuditLogs: { items: AdminAuditLog[]; total: number };
}

export function SecurityDashboard({
  loopAlerts: initialLoops,
  vaultHealth,
  initialAuditLogs,
}: SecurityDashboardProps) {
  const [loops, setLoops] = useState<RunawayLoopAlert[]>(initialLoops);
  const [auditLogs] = useState<AdminAuditLog[]>(initialAuditLogs.items);
  const [auditSearch, setAuditSearch] = useState("");

  const handleQuarantine = async (alert: RunawayLoopAlert) => {
    try {
      await quarantineWorkflowAction(alert.workflowId);
      toast.warning(`Runaway loop quarantined for workflow "${alert.workflowName}"`);
      setLoops((prev) =>
        prev.map((l) => (l.id === alert.id ? { ...l, isQuarantined: true } : l)),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to quarantine workflow");
    }
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (!auditSearch) return true;
    const q = auditSearch.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.targetResourceId.toLowerCase().includes(q) ||
      log.ipAddress.toLowerCase().includes(q) ||
      log.adminEmail.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Automated Loop Detection Alert Panel */}
      <div className="rounded-xl border border-rose-900/30 bg-rose-950/10 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-rose-900/30 pb-4">
          <div className="flex items-center gap-2">
            <RepeatIcon className="size-4 text-rose-400" />
            <h2 className="text-sm font-semibold tracking-tight text-white">
              Automated Infinite Loop & Recursion Abuse Detector
            </h2>
          </div>
          <AdminBadge variant="error">Anomaly Watch Active</AdminBadge>
        </div>

        {loops.length === 0 ? (
          <div className="py-4 text-center text-xs text-[#94A3B8]">
            <CheckCircle2Icon className="mx-auto size-6 text-emerald-400 mb-1" />
            <span>No runaway execution loops detected. Execution graph cycles are bounded.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {loops.map((alert) => (
              <div
                key={alert.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-rose-900/40 bg-[#0E1015] p-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{alert.workflowName}</span>
                    {alert.isQuarantined ? (
                      <AdminBadge variant="error">QUARANTINED</AdminBadge>
                    ) : (
                      <AdminBadge variant="warning">RAPID CYCLING</AdminBadge>
                    )}
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-[#94A3B8]">
                    Tenant: {alert.ownerEmail} • Rate:{" "}
                    <span className="text-rose-400 font-bold">{alert.cyclesPerMinute} runs/min</span> (threshold: {alert.thresholdExceeded}/min)
                  </div>
                </div>

                <div>
                  {!alert.isQuarantined && (
                    <button
                      type="button"
                      onClick={() => handleQuarantine(alert)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-500"
                    >
                      <AlertOctagonIcon className="size-3.5" />
                      <span>Quarantine Immediately</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Credential Vault Health Monitor */}
      <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-5 shadow-sm space-y-4">
        <div className="border-b border-[#1E222B] pb-4">
          <div className="flex items-center gap-2">
            <KeyRoundIcon className="size-4 text-sky-400" />
            <h2 className="text-sm font-semibold tracking-tight text-white">
              Credential Vault Health Monitor (Zero-Knowledge)
            </h2>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Monitor authorization health and expiration states of user OAuth tokens without ever exposing underlying keys or plaintext secrets.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {vaultHealth.map((item) => (
            <div
              key={item.connectionId}
              className="rounded-xl border border-[#1E222B] bg-[#090A0C] p-4 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-semibold uppercase text-white">{item.provider}</span>
                <AdminBadge
                  variant={
                    item.status === "healthy"
                      ? "success"
                      : item.status === "reconnect_required"
                      ? "error"
                      : "warning"
                  }
                >
                  {item.status === "healthy" ? "Healthy" : "Reconnect Required"}
                </AdminBadge>
              </div>

              <div className="font-medium text-white truncate">{item.label}</div>
              <div className="font-mono text-[11px] text-[#64748B]">Tenant: {item.tenantId}</div>

              <div className="pt-1 text-[11px] font-mono text-[#94A3B8]">
                {item.expiresInDays ? (
                  <span>Expires in {item.expiresInDays} days</span>
                ) : (
                  <span>Perpetual API credential</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Searchable Immutable Audit Trail Log */}
      <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E222B] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="size-4 text-emerald-400" />
              <h2 className="text-sm font-semibold tracking-tight text-white">
                Immutable Administrative Audit Trail Log
              </h2>
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Append-only audit log tracking every action, target resource ID, and IP address for <span className="font-mono text-emerald-400">sungurclinton@gmail.com</span>.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-[#1E222B] bg-[#090A0C] px-3 py-1.5 text-xs text-white max-w-xs">
            <SearchIcon className="size-3.5 text-[#64748B]" />
            <input
              type="text"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder="Search audit actions, IP, resource ID..."
              className="w-full bg-transparent placeholder:text-[#64748B] focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1E222B] bg-[#090A0C] text-[#94A3B8]">
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Admin Identity</th>
                <th className="px-4 py-3 font-medium">Action Type</th>
                <th className="px-4 py-3 font-medium">Target Resource</th>
                <th className="px-4 py-3 font-medium">IP Address</th>
                <th className="px-4 py-3 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E222B]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#1A1D24] transition-colors">
                  <td className="px-4 py-3 text-[#94A3B8]">
                    {new Date(log.timestamp).toLocaleTimeString()} • {new Date(log.timestamp).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-emerald-400">{log.adminEmail}</td>
                  <td className="px-4 py-3 text-white font-medium">{log.action}</td>
                  <td className="px-4 py-3 text-slate-300">{log.targetResourceId}</td>
                  <td className="px-4 py-3 text-[#94A3B8]">{log.ipAddress}</td>
                  <td className="px-4 py-3 text-right">
                    <AdminBadge variant="success">Logged</AdminBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
