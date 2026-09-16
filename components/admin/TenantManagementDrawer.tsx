"use client";

import { useState } from "react";
import { TenantRecord } from "@/types/admin";
import {
  changeTenantTierAction,
  overrideTenantQuotaAction,
  toggleTenantSuspensionAction,
} from "@/app/admin/actions";
import { AdminBadge } from "./AdminBadge";
import {
  BanIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  LayersIcon,
  ShieldAlertIcon,
  SlidersIcon,
  SparklesIcon,
  UserCheckIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface TenantManagementDrawerProps {
  tenant: TenantRecord | null;
  onClose: () => void;
  onUpdate: (updated: TenantRecord) => void;
}

export function TenantManagementDrawer({ tenant, onClose, onUpdate }: TenantManagementDrawerProps) {
  const [quotaInput, setQuotaInput] = useState<number>(tenant?.monthlyQuotaLimit || 50000);
  const [selectedTier, setSelectedTier] = useState<"Free" | "Team" | "Enterprise">(
    tenant?.planTier || "Team",
  );
  const [isUpdating, setIsUpdating] = useState(false);

  if (!tenant) return null;

  const handleSaveQuota = async () => {
    setIsUpdating(true);
    try {
      const res = await overrideTenantQuotaAction(tenant.id, quotaInput);
      if (res.success) {
        toast.success(`Monthly quota for ${tenant.organizationName} updated to ${quotaInput.toLocaleString()} runs`);
        onUpdate(res.tenant);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to override quota");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangeTier = async (newTier: "Free" | "Team" | "Enterprise") => {
    setSelectedTier(newTier);
    try {
      const res = await changeTenantTierAction(tenant.id, newTier);
      if (res.success) {
        toast.success(`Subscription tier updated to ${newTier}`);
        onUpdate(res.tenant);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change tier");
    }
  };

  const handleToggleSuspension = async () => {
    const targetSuspension = !tenant.isSuspended;
    try {
      const res = await toggleTenantSuspensionAction(tenant.id, targetSuspension);
      if (res.success) {
        if (targetSuspension) {
          toast.warning(`Account ${tenant.organizationName} suspended. All active sessions terminated.`);
        } else {
          toast.success(`Account ${tenant.organizationName} restored.`);
        }
        onUpdate(res.tenant);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update account status");
    }
  };

  const handleImpersonate = () => {
    toast.info(`Read-Only Impersonation Active: ${tenant.ownerEmail}`, {
      description: "Opening user workflow canvas with read-only security headers.",
    });
    window.open(`/w?impersonate_org=${tenant.orgId}&admin_readonly=1`, "_blank");
  };

  const quotaPercent = Math.min(100, Math.round((tenant.runsUsedThisMonth / tenant.monthlyQuotaLimit) * 100));

  return (
    <Sheet open={!!tenant} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="border-l border-[#1E222B] bg-[#0E1015] text-white sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base font-semibold text-white flex items-center gap-2">
            <UsersIcon className="size-4 text-emerald-400" />
            <span>Manage Tenant: {tenant.organizationName}</span>
          </SheetTitle>
          <SheetDescription className="text-xs text-[#94A3B8]">
            Tenant governance, plan overrides, quota boost, and security controls.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-6 text-xs">
          {/* Tenant Quick Info */}
          <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-4 space-y-2 font-mono">
            <div className="flex items-center justify-between font-sans">
              <span className="text-sm font-semibold text-white">{tenant.organizationName}</span>
              <AdminBadge variant={tenant.isSuspended ? "error" : "success"}>
                {tenant.isSuspended ? "Suspended" : "Active"}
              </AdminBadge>
            </div>
            <div className="text-[#94A3B8]">Owner: {tenant.ownerEmail}</div>
            <div className="text-[#94A3B8]">Org ID: {tenant.orgId}</div>
            <div className="text-[#94A3B8]">Workflows: {tenant.activeWorkflowsCount} active</div>
            <div className="text-[#94A3B8]">Joined: {new Date(tenant.createdAt).toLocaleDateString()}</div>
          </div>

          {/* Quota Usage & Limit Override */}
          <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <SlidersIcon className="size-3.5 text-sky-400" />
                <span>Monthly Quota Progress</span>
              </span>
              <span className="font-mono text-xs text-emerald-400">
                {tenant.runsUsedThisMonth.toLocaleString()} / {tenant.monthlyQuotaLimit.toLocaleString()} ({quotaPercent}%)
              </span>
            </div>

            <div className="h-2 w-full rounded-full bg-[#090A0C] overflow-hidden border border-[#1E222B]">
              <div
                className={`h-full transition-all duration-300 ${
                  quotaPercent > 90 ? "bg-rose-500" : quotaPercent > 70 ? "bg-amber-400" : "bg-emerald-500"
                }`}
                style={{ width: `${quotaPercent}%` }}
              />
            </div>

            <div className="pt-2">
              <label className="text-[11px] text-[#94A3B8]">Override Monthly Limit (Runs):</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  value={quotaInput}
                  onChange={(e) => setQuotaInput(parseInt(e.target.value) || 0)}
                  className="w-full rounded-lg border border-[#1E222B] bg-[#090A0C] px-3 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={handleSaveQuota}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* Subscription Tier Switcher */}
          <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-4 space-y-3">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <SparklesIcon className="size-3.5 text-amber-400" />
              <span>Subscription Tier Override</span>
            </span>

            <div className="grid grid-cols-3 gap-2">
              {(["Free", "Team", "Enterprise"] as const).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => handleChangeTier(tier)}
                  className={`rounded-lg border p-2.5 text-center font-medium transition-colors ${
                    tenant.planTier === tier
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold"
                      : "border-[#1E222B] bg-[#090A0C] text-[#94A3B8] hover:border-[#2E3440] hover:text-white"
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          {/* Administrative Security Actions */}
          <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-4 space-y-3">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <ShieldAlertIcon className="size-3.5 text-rose-400" />
              <span>Security & Impersonation</span>
            </span>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleImpersonate}
                className="w-full flex items-center justify-between rounded-lg border border-[#1E222B] bg-[#090A0C] px-3.5 py-2.5 text-xs text-[#94A3B8] hover:border-[#2E3440] hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <UserCheckIcon className="size-4 text-emerald-400" />
                  <span>Read-Only Impersonation ("Login-as-User")</span>
                </div>
                <ExternalLinkIcon className="size-3.5 text-[#64748B]" />
              </button>

              <button
                type="button"
                onClick={handleToggleSuspension}
                className={`w-full flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-xs transition-colors ${
                  tenant.isSuspended
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  <BanIcon className="size-4" />
                  <span>{tenant.isSuspended ? "Restore & Unsuspend Account" : "Suspend Account & Terminate Sessions"}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
