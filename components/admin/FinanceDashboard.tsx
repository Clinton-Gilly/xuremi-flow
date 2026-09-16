"use client";

import { useState } from "react";
import { InvoiceEvent, RevenueTelemetry, TenantUnitEconomics } from "@/types/admin";
import { AdminBadge } from "./AdminBadge";
import { BillingControlsModal } from "./BillingControlsModal";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  CoinsIcon,
  CreditCardIcon,
  DollarSignIcon,
  FileTextIcon,
  GiftIcon,
  PieChartIcon,
  TrendingUpIcon,
} from "lucide-react";

interface FinanceDashboardProps {
  revenue: RevenueTelemetry;
  unitEconomics: TenantUnitEconomics[];
  invoices: InvoiceEvent[];
}

export function FinanceDashboard({ revenue, unitEconomics, invoices }: FinanceDashboardProps) {
  const [isControlsOpen, setIsControlsOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Revenue Telemetry Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-4">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <span className="text-xs font-medium">Monthly Recurring Revenue</span>
            <CoinsIcon className="size-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white font-mono">
            KSh {revenue.mrr.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
            <TrendingUpIcon className="size-3" />
            <span>+12.4% vs last month</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-4">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <span className="text-xs font-medium">Annual Run Rate (ARR)</span>
            <CoinsIcon className="size-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white font-mono">
            KSh {revenue.arr.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-[#94A3B8] font-mono">
            <span>Projected annualized</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-4">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <span className="text-xs font-medium">Active Paid Subscriptions</span>
            <CreditCardIcon className="size-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white font-mono">
            {revenue.activePaidSubscriptions}
          </div>
          <div className="mt-1 text-[11px] text-emerald-400 font-mono">
            <span>+9 new this cycle</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-4">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <span className="text-xs font-medium">Renewal Churn Rate</span>
            <PieChartIcon className="size-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-400 font-mono">
            {revenue.renewalChurnRate}%
          </div>
          <div className="mt-1 text-[11px] text-[#94A3B8] font-mono">
            <span>Industry avg: 3.5%</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-4">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <span className="text-xs font-medium">Payment Webhook Health</span>
            <CheckCircle2Icon className="size-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-400 font-mono">
            {revenue.paymentWebhookErrorsCount} Errors
          </div>
          <div className="mt-1 text-[11px] text-[#94A3B8] font-mono">
            <span>Stripe/Clerk 100% synced</span>
          </div>
        </div>
      </div>

      {/* Unit Economics Table */}
      <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E222B] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <CoinsIcon className="size-4 text-emerald-400" />
              <h2 className="text-sm font-semibold tracking-tight text-white">
                Workspace Unit Economics & Cost Efficiency
              </h2>
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Direct operational cost estimation per tenant (LLM API tokens + compute units) vs subscription revenue.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsControlsOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition-colors"
          >
            <GiftIcon className="size-3.5" />
            <span>Issue Promotional Credits</span>
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1E222B] bg-[#090A0C] text-[#94A3B8] font-mono">
                <th className="px-4 py-3 font-medium">Workspace</th>
                <th className="px-4 py-3 font-medium">Tier</th>
                <th className="px-4 py-3 font-medium">Sub Revenue</th>
                <th className="px-4 py-3 font-medium">LLM Token Cost</th>
                <th className="px-4 py-3 font-medium">Compute Units</th>
                <th className="px-4 py-3 font-medium">Total Cost</th>
                <th className="px-4 py-3 font-medium">Net Margin</th>
                <th className="px-4 py-3 font-medium text-right">Profitability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E222B]">
              {unitEconomics.map((econ) => (
                <tr key={econ.tenantId} className="group hover:bg-[#1A1D24] transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{econ.organizationName}</div>
                    <div className="font-mono text-[11px] text-[#64748B]">{econ.ownerEmail}</div>
                  </td>
                  <td className="px-4 py-3 font-mono">{econ.planTier}</td>
                  <td className="px-4 py-3 font-mono text-emerald-400 font-medium">
                    KSh {econ.subscriptionRevenueMonthly.toLocaleString()}/mo
                  </td>
                  <td className="px-4 py-3 font-mono text-[#94A3B8]">KSh {econ.llmTokenCostMonthly.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-[#94A3B8]">KSh {econ.computeCostMonthly.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-[#94A3B8]">KSh {econ.totalCostMonthly.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono font-medium">
                    <span className={econ.netMarginPercentage < 0 ? "text-rose-400" : "text-emerald-400"}>
                      {econ.netMarginPercentage}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {econ.isUnprofitable ? (
                      <AdminBadge variant="error">Unprofitable</AdminBadge>
                    ) : (
                      <AdminBadge variant="success">Profitable</AdminBadge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-5 shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#1E222B] pb-4">
          <FileTextIcon className="size-4 text-sky-400" />
          <h2 className="text-sm font-semibold tracking-tight text-white">Recent Invoice Events</h2>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1E222B] bg-[#090A0C] text-[#94A3B8] font-mono">
                <th className="px-4 py-3 font-medium">Invoice ID</th>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E222B]">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#1A1D24] transition-colors font-mono">
                  <td className="px-4 py-3 text-emerald-400">{inv.id}</td>
                  <td className="px-4 py-3 font-sans text-white">{inv.organizationName}</td>
                  <td className="px-4 py-3 text-[#94A3B8]">{new Date(inv.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-white font-medium">KSh {inv.amountKsh.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <AdminBadge variant="success">Paid</AdminBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Billing Controls Modal */}
      <BillingControlsModal isOpen={isControlsOpen} onClose={() => setIsControlsOpen(false)} />
    </div>
  );
}
