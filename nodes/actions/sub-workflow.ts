import { z } from "zod";
import type { Id } from "@/convex/_generated/dataModel";
import { pollExecutionCompletion, startRun } from "@/lib/engine-client";
import { ConnectorError, defineNode } from "../define";

/**
 * Execute Sub-Workflow node:
 * Runs another workflow in your organization. Supports both synchronous execution
 * (waiting for the sub-workflow to complete and returning its outputs) and asynchronous
 * fire-and-forget execution.
 */
export const subWorkflowNode = defineNode({
  type: "workflow.execute",
  name: "Execute Sub-Workflow",
  description: "Run another workflow in your workspace, pass parameters, and optionally await results.",
  category: "action",
  guide: {
    summary:
      "Trigger another workflow as a sub-routine. Pass parameters into its trigger payload with " +
      "{{ this_node.payload }}. When “wait for completion” is enabled, execution pauses until the sub-workflow " +
      "finishes and returns its outputs via {{ this_node.result }}.",
    outputs: { out: "sub-workflow execution result and outputs" },
  },
  icon: "Workflow",
  credential: null,
  requiresFeature: null,
  version: "v1",
  inputs: z.object({
    workflowId: z
      .string()
      .min(1)
      .describe("The ID of the workflow to execute")
      .meta({ label: "Workflow ID" }),
    payload: z
      .any()
      .optional()
      .describe("Data or parameters to pass into the sub-workflow's trigger payload")
      .meta({ label: "Input payload" }),
    waitForCompletion: z
      .boolean()
      .default(true)
      .describe("Wait for the sub-workflow to finish before continuing")
      .meta({ label: "Wait for completion" }),
    timeoutSeconds: z.coerce
      .number()
      .int()
      .min(1)
      .max(60)
      .default(30)
      .describe("Maximum seconds to wait if waiting for completion")
      .meta({ label: "Timeout (seconds)" }),
  }),
  outputs: z.object({
    executionId: z.string().describe("The ID of the sub-workflow execution"),
    runId: z.string().optional().describe("Workflow SDK run identifier"),
    status: z.string().describe("Execution status (completed, started, failed)"),
    result: z.any().optional().describe("Final output of the sub-workflow"),
    outputs: z.record(z.string(), z.any()).optional().describe("Outputs of all nodes in the sub-workflow"),
    durationMs: z.number().optional().describe("Duration of execution in milliseconds"),
  }),
  async run({ inputs, orgId, planSlug, executionId }) {
    const { workflowId, payload, waitForCompletion = true, timeoutSeconds = 30 } = inputs;

    // Self-recursion protection
    if (!workflowId || workflowId.trim() === "") {
      throw new ConnectorError("Workflow ID is required to execute a sub-workflow", 400);
    }

    const startResult = await startRun({
      orgId,
      workflowId: workflowId as Id<"workflows">,
      trigger: {
        type: "subworkflow",
        payload: payload ?? {},
      },
      planSlug: planSlug || "free_org",
    });

    if (!waitForCompletion) {
      return {
        executionId: startResult.executionId,
        runId: startResult.runId,
        status: "started",
      };
    }

    const startTime = Date.now();
    const pollResult = await pollExecutionCompletion(startResult.executionId, timeoutSeconds * 1000);
    const durationMs = Date.now() - startTime;

    if (pollResult.status === "failed") {
      throw new ConnectorError(
        `Sub-workflow (${workflowId}) failed: ${pollResult.error || "Unknown error"}`,
        500,
      );
    }

    if (pollResult.status === "timeout") {
      throw new ConnectorError(
        `Sub-workflow (${workflowId}) timed out after ${timeoutSeconds}s`,
        504,
      );
    }

    return {
      executionId: startResult.executionId,
      runId: startResult.runId,
      status: pollResult.status,
      result: pollResult.lastOutput,
      outputs: pollResult.outputs,
      durationMs,
    };
  },
});
