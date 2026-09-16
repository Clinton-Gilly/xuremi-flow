import { getTenantsDirectory } from "@/lib/admin/service";
import { TenantDirectoryTable } from "@/components/admin/TenantDirectoryTable";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { UsersIcon } from "lucide-react";

export default async function AdminUsersPage() {
  const tenants = await getTenantsDirectory();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E222B] pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <UsersIcon className="size-5 text-emerald-400" />
            <span>Tenant & Organization Governance</span>
            <AdminBadge variant="neutral">{tenants.length} Orgs</AdminBadge>
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Tenant provisioning, quota limit overrides, subscription tier modifications, session suspension, and read-only impersonation.
          </p>
        </div>
      </div>

      <TenantDirectoryTable initialTenants={tenants} />
    </div>
  );
}
