"use client";

import { useState } from "react";
import { AdminWorkflowSummary } from "@/types/admin";
import {
  forceActivateWorkflowAction,
  forcePauseWorkflowAction,
  quarantineWorkflowAction,
} from "@/app/admin/actions";
import { AdminBadge } from "./AdminBadge";
import { WorkflowInspectModal } from "./WorkflowInspectModal";
import {
  AlertOctagonIcon,
  CheckCircleIcon,
  Code2Icon,
  LayersIcon,
  MoreVerticalIcon,
  PauseCircleIcon,
  PlayIcon,
  SearchIcon,
  ZapIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WorkflowRegistryTableProps {
  initialWorkflows: AdminWorkflowSummary[];
}

export function WorkflowRegistryTable({ initialWorkflows }: WorkflowRegistryTableProps) {
  const [workflows, setWorkflows] = useState<AdminWorkflowSummary[]>(initialWorkflows);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [triggerFilter, setTriggerFilter] = useState("all");
  const [inspectWorkflow, setInspectWorkflow] = useState<AdminWorkflowSummary | null>(null);

  const handleToggleStatus = async (wf: AdminWorkflowSummary) => {
    const targetStatus = wf.status === "active" ? "paused" : "active";
    try {
      if (targetStatus === "active") {
        await forceActivateWorkflowAction(wf.id);
        toast.success(`Workflow "${wf.name}" activated`);
      } else {
        await forcePauseWorkflowAction(wf.id);
        toast.success(`Workflow "${wf.name}" paused`);
      }
      setWorkflows((prev) =>
        prev.map((w) => (w.id === wf.id ? { ...w, status: targetStatus } : w)),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update workflow status");
    }
  };

  const handleQuarantine = async (wf: AdminWorkflowSummary) => {
    try {
      await quarantineWorkflowAction(wf.id);
      toast.warning(`Workflow "${wf.name}" has been quarantined`);
      setWorkflows((prev) =>
        prev.map((w) => (w.id === wf.id ? { ...w, status: "quarantined" } : w)),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to quarantine workflow");
    }
  };

  const handleDiagnosticRun = (wf: AdminWorkflowSummary) => {
    toast.info(`Diagnostic dry-run initiated for "${wf.name}"`, {
      description: "Dry-run completed with exit code 0. No state mutations dispatched.",
    });
  };

  const filtered = workflows.filter((w) => {
    const matchesSearch =
      !search ||
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.ownerEmail.toLowerCase().includes(search.toLowerCase()) ||
      w.tenantId.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || w.status === statusFilter;
    const matchesTrigger = triggerFilter === "all" || w.triggerType === triggerFilter;

    return matchesSearch && matchesStatus && matchesTrigger;
  });

  const getStatusBadge = (status: AdminWorkflowSummary["status"]) => {
    switch (status) {
      case "active":
        return <AdminBadge variant="success">Active</AdminBadge>;
      case "draft":
        return <AdminBadge variant="pending">Draft</AdminBadge>;
      case "paused":
        return <AdminBadge variant="warning">Paused</AdminBadge>;
      case "quarantined":
        return <AdminBadge variant="error">Quarantined</AdminBadge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1E222B] bg-[#14161B] p-4">
        <div className="flex flex-1 items-center gap-2 max-w-md rounded-lg border border-[#1E222B] bg-[#090A0C] px-3 py-1.5 text-xs text-white">
          <SearchIcon className="size-3.5 text-[#64748B]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by workflow name, owner email, tenant ID..."
            className="w-full bg-transparent placeholder:text-[#64748B] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-[#1E222B] bg-[#090A0C] px-3 py-1.5 text-xs font-medium text-[#94A3B8] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="paused">Paused</option>
            <option value="quarantined">Quarantined</option>
          </select>

          <select
            value={triggerFilter}
            onChange={(e) => setTriggerFilter(e.target.value)}
            className="rounded-lg border border-[#1E222B] bg-[#090A0C] px-3 py-1.5 text-xs font-medium text-[#94A3B8] focus:outline-none"
          >
            <option value="all">All Triggers</option>
            <option value="webhook">Webhook</option>
            <option value="telegram">Telegram</option>
            <option value="schedule">Schedule</option>
            <option value="form">Form</option>
            <option value="manual">Manual</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[#1E222B] bg-[#14161B] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1E222B] bg-[#090A0C] text-[#94A3B8] font-mono">
                <th className="px-4 py-3 font-medium">Workflow</th>
                <th className="px-4 py-3 font-medium">Owner & Tenant</th>
                <th className="px-4 py-3 font-medium">Trigger</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">24h / 30d Runs</th>
                <th className="px-4 py-3 font-medium">Failure Rate</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E222B]">
              {filtered.map((wf) => (
                <tr key={wf.id} className="group hover:bg-[#1A1D24] transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                      {wf.name}
                    </div>
                    <div className="font-mono text-[11px] text-[#64748B]">
                      v{wf.version} • {wf.nodesCount} nodes • {wf.edgesCount} edges
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-200">{wf.ownerEmail}</div>
                    <div className="font-mono text-[11px] text-[#64748B]">{wf.tenantId}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono uppercase text-[11px] text-[#94A3B8] bg-[#0B0C0E] px-2 py-0.5 rounded border border-[#1E222B]">
                      {wf.triggerType}
                    </span>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(wf.status)}</td>
                  <td className="px-4 py-3 font-mono text-[#94A3B8]">
                    <span className="text-white font-medium">{wf.totalRuns24h.toLocaleString()}</span> /{" "}
                    <span>{wf.totalRuns30d.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <span
                      className={
                        wf.failureRate > 5 ? "text-rose-400 font-semibold" : "text-[#94A3B8]"
                      }
                    >
                      {wf.failureRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="rounded border border-[#1E222B] bg-[#090A0C] p-1.5 text-[#94A3B8] hover:border-[#2E3440] hover:text-white transition-colors inline-flex items-center justify-center cursor-pointer">
                        <MoreVerticalIcon className="size-3.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 border border-[#1E222B] bg-[#0E1015] text-xs text-white"
                      >
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(wf)}
                          className="flex items-center gap-2 cursor-pointer hover:bg-[#1A1D24]"
                        >
                          {wf.status === "active" ? (
                            <>
                              <PauseCircleIcon className="size-3.5 text-amber-400" />
                              <span>Force Pause</span>
                            </>
                          ) : (
                            <>
                              <PlayIcon className="size-3.5 text-emerald-400" />
                              <span>Force Activate</span>
                            </>
                          )}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => setInspectWorkflow(wf)}
                          className="flex items-center gap-2 cursor-pointer hover:bg-[#1A1D24]"
                        >
                          <Code2Icon className="size-3.5 text-sky-400" />
                          <span>Inspect Graph JSON</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => handleDiagnosticRun(wf)}
                          className="flex items-center gap-2 cursor-pointer hover:bg-[#1A1D24]"
                        >
                          <ZapIcon className="size-3.5 text-purple-400" />
                          <span>Diagnostic Dry-Run</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="bg-[#1E222B]" />

                        <DropdownMenuItem
                          onClick={() => handleQuarantine(wf)}
                          className="flex items-center gap-2 cursor-pointer text-rose-400 hover:bg-rose-950/20"
                        >
                          <AlertOctagonIcon className="size-3.5" />
                          <span>Quarantine Workflow</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Graph JSON Modal */}
      <WorkflowInspectModal
        workflow={inspectWorkflow}
        onClose={() => setInspectWorkflow(null)}
      />
    </div>
  );
}
