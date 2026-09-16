"use client";

import { useState } from "react";
import { TenantRecord } from "@/types/admin";
import { AdminBadge } from "./AdminBadge";
import { TenantManagementDrawer } from "./TenantManagementDrawer";
import { SearchIcon, Settings2Icon, UsersIcon } from "lucide-react";

interface TenantDirectoryTableProps {
  initialTenants: TenantRecord[];
}

export function TenantDirectoryTable({ initialTenants }: TenantDirectoryTableProps) {
  const [tenants, setTenants] = useState<TenantRecord[]>(initialTenants);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [activeTenant, setActiveTenant] = useState<TenantRecord | null>(null);

  const handleUpdate = (updated: TenantRecord) => {
    setTenants((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setActiveTenant(updated);
  };

  const filtered = tenants.filter((t) => {
    const matchesSearch =
      !search ||
      t.organizationName.toLowerCase().includes(search.toLowerCase()) ||
      t.ownerEmail.toLowerCase().includes(search.toLowerCase()) ||
      t.orgId.toLowerCase().includes(search.toLowerCase());

    const matchesPlan = planFilter === "all" || t.planTier.toLowerCase() === planFilter.toLowerCase();

    return matchesSearch && matchesPlan;
  });

  const getTierBadge = (tier: TenantRecord["planTier"]) => {
    switch (tier) {
      case "Enterprise":
        return <AdminBadge variant="brand">Enterprise</AdminBadge>;
      case "Team":
        return <AdminBadge variant="success">Team</AdminBadge>;
      case "Free":
        return <AdminBadge variant="pending">Free</AdminBadge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Plan Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1E222B] bg-[#14161B] p-4">
        <div className="flex flex-1 items-center gap-2 max-w-md rounded-lg border border-[#1E222B] bg-[#090A0C] px-3 py-1.5 text-xs text-white">
          <SearchIcon className="size-3.5 text-[#64748B]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by organization, owner email, or org ID..."
            className="w-full bg-transparent placeholder:text-[#64748B] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="rounded-lg border border-[#1E222B] bg-[#090A0C] px-3 py-1.5 text-xs font-medium text-[#94A3B8] focus:outline-none"
          >
            <option value="all">All Plans</option>
            <option value="enterprise">Enterprise</option>
            <option value="team">Team</option>
            <option value="free">Free</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="overflow-hidden rounded-xl border border-[#1E222B] bg-[#14161B] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1E222B] bg-[#090A0C] text-[#94A3B8] font-mono">
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Owner Email</th>
                <th className="px-4 py-3 font-medium">Plan Tier</th>
                <th className="px-4 py-3 font-medium">Workflows</th>
                <th className="px-4 py-3 font-medium">Monthly Quota Progress</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E222B]">
              {filtered.map((tenant) => {
                const percent = Math.min(100, Math.round((tenant.runsUsedThisMonth / tenant.monthlyQuotaLimit) * 100));

                return (
                  <tr key={tenant.id} className="group hover:bg-[#1A1D24] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                        {tenant.organizationName}
                      </div>
                      <div className="font-mono text-[11px] text-[#64748B]">{tenant.orgId}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-200">{tenant.ownerEmail}</td>
                    <td className="px-4 py-3">{getTierBadge(tenant.planTier)}</td>
                    <td className="px-4 py-3 font-mono text-[#94A3B8]">{tenant.activeWorkflowsCount} active</td>
                    <td className="px-4 py-3 min-w-[200px]">
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#94A3B8] mb-1">
                        <span>
                          {tenant.runsUsedThisMonth.toLocaleString()} / {tenant.monthlyQuotaLimit.toLocaleString()}
                        </span>
                        <span className={percent > 90 ? "text-rose-400 font-bold" : "text-[#64748B]"}>
                          {percent}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[#090A0C] overflow-hidden border border-[#1E222B]">
                        <div
                          className={`h-full transition-all ${
                            percent > 90 ? "bg-rose-500" : percent > 70 ? "bg-amber-400" : "bg-emerald-500"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <AdminBadge variant={tenant.isSuspended ? "error" : "success"}>
                        {tenant.isSuspended ? "Suspended" : "Active"}
                      </AdminBadge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setActiveTenant(tenant)}
                        className="inline-flex items-center gap-1.5 rounded border border-[#1E222B] bg-[#0B0C0E] px-2.5 py-1 text-xs text-[#94A3B8] hover:border-[#2E3440] hover:text-white transition-colors"
                      >
                        <Settings2Icon className="size-3.5" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tenant Management Drawer */}
      <TenantManagementDrawer
        tenant={activeTenant}
        onClose={() => setActiveTenant(null)}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
