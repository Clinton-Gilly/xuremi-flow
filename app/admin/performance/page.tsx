import { getPerformanceDiagnostics } from "@/lib/admin/service";
import { PerformanceDashboard } from "@/components/admin/PerformanceDashboard";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { ActivityIcon } from "lucide-react";

export default async function AdminPerformancePage() {
  const { killSwitches, dlq, maintenanceBanner } = await getPerformanceDiagnostics();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E222B] pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ActivityIcon className="size-5 text-purple-400" />
            <span>Worker Fleets, DLQ & Incident Switchboard</span>
            <AdminBadge variant="success" dot>
              Cluster Healthy
            </AdminBadge>
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Engine concurrency telemetry, dead letter queue inspection and bulk replaying, connector kill-switches, and live dashboard announcement broadcasts.
          </p>
        </div>
      </div>

      <PerformanceDashboard
        killSwitches={killSwitches}
        dlq={dlq}
        maintenanceBanner={maintenanceBanner}
      />
    </div>
  );
}
