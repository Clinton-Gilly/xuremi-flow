import { getGlobalWorkflows } from "@/lib/admin/service";
import { WorkflowRegistryTable } from "@/components/admin/WorkflowRegistryTable";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { LayersIcon } from "lucide-react";

export default async function AdminWorkflowsPage() {
  const workflows = await getGlobalWorkflows({});

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E222B] pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <LayersIcon className="size-5 text-sky-400" />
            <span>Global Workflow Registry</span>
            <AdminBadge variant="neutral">{workflows.length} Total</AdminBadge>
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Audit, inspect canvas DAG graphs, execute dry-runs, or quarantine rogue automations across all tenant environments.
          </p>
        </div>
      </div>

      <WorkflowRegistryTable initialWorkflows={workflows} />
    </div>
  );
}
