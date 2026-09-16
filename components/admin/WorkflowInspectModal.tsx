"use client";

import { AdminWorkflowSummary } from "@/types/admin";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Code2Icon, CopyIcon } from "lucide-react";
import { toast } from "sonner";

interface WorkflowInspectModalProps {
  workflow: AdminWorkflowSummary | null;
  onClose: () => void;
}

export function WorkflowInspectModal({ workflow, onClose }: WorkflowInspectModalProps) {
  if (!workflow) return null;

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(workflow.graph, null, 2));
    toast.success("Workflow Graph JSON copied to clipboard");
  };

  return (
    <Dialog open={!!workflow} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border border-[#1E222B] bg-[#0E1015] text-white sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-white">
              <Code2Icon className="size-4 text-emerald-400" />
              <span>Canvas Graph JSON: {workflow.name}</span>
            </DialogTitle>
            <button
              type="button"
              onClick={copyJson}
              className="mr-6 inline-flex items-center gap-1 rounded border border-[#1E222B] bg-[#14161B] px-2.5 py-1 text-xs text-[#94A3B8] hover:text-white"
            >
              <CopyIcon className="size-3" />
              <span>Copy</span>
            </button>
          </div>
          <DialogDescription className="text-xs text-[#94A3B8]">
            Syntax-highlighted workflow topology, active node specifications, and DAG edge connections.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 max-h-[420px] overflow-y-auto rounded-lg border border-[#1E222B] bg-[#090A0C] p-4 font-mono text-xs text-emerald-300">
          <pre className="whitespace-pre-wrap">{JSON.stringify(workflow.graph, null, 2)}</pre>
        </div>

        <div className="flex items-center justify-between border-t border-[#1E222B] pt-3 text-xs text-[#94A3B8]">
          <span>
            {workflow.nodesCount} nodes • {workflow.edgesCount} edges • Trigger: {workflow.triggerType}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[#1E222B] bg-[#14161B] px-3 py-1 text-xs text-[#94A3B8] hover:text-white"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
