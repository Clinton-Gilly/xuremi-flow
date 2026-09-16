import { getAdminAuditLogs } from "@/lib/admin/audit";
import { getSecurityAbuseState } from "@/lib/admin/service";
import { SecurityDashboard } from "@/components/admin/SecurityDashboard";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { ShieldAlertIcon } from "lucide-react";

export default async function AdminSecurityPage() {
  const [{ loopAlerts, vaultHealth }, auditLogs] = await Promise.all([
    getSecurityAbuseState(),
    getAdminAuditLogs({ limit: 50 }),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E222B] pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ShieldAlertIcon className="size-5 text-rose-400" />
            <span>Security, Abuse Isolation & Audit Trail</span>
            <AdminBadge variant="brand">Immutable Logging</AdminBadge>
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Real-time runaway loop quarantine, zero-knowledge OAuth credential vault health monitoring, and tamper-resistant administrative audit logs.
          </p>
        </div>
      </div>

      <SecurityDashboard
        loopAlerts={loopAlerts}
        vaultHealth={vaultHealth}
        initialAuditLogs={auditLogs}
      />
    </div>
  );
}
