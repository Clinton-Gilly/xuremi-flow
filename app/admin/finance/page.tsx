import { getFinancialAnalytics } from "@/lib/admin/service";
import { FinanceDashboard } from "@/components/admin/FinanceDashboard";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { CoinsIcon } from "lucide-react";

export default async function AdminFinancePage() {
  const { revenue, unitEconomics, invoices } = await getFinancialAnalytics();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E222B] pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <CoinsIcon className="size-5 text-emerald-400" />
            <span>Finance, Billing & Infrastructure Costs</span>
            <AdminBadge variant="success">Stripe Live</AdminBadge>
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Real-time revenue telemetry, per-tenant operational unit economics, compute burn vs subscription fees, and invoice lifecycle events.
          </p>
        </div>
      </div>

      <FinanceDashboard revenue={revenue} unitEconomics={unitEconomics} invoices={invoices} />
    </div>
  );
}
