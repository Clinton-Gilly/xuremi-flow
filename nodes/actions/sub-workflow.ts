import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ConnectorError, defineNode } from "../define";

function appOrigin(): string {
  const configured = (process.env.APP_ORIGIN ?? "").trim().replace(/\/+$/, "");
  const isVercel = process.env.VERCEL === "1";

  if (isVercel && (!configured || configured.includes("localhost") || configured.includes("papaflow"))) {
    const vercelOrigin = process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "";
    if (vercelOrigin) return vercelOrigin.replace(/\/+$/, "");
  }

  if (configured) return configured;

  const vercelFallback = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "";
  if (vercelFallback) return vercelFallback.replace(/\/+$/, "");

  return "http://localhost:3000";
}

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
  async run({ inputs, orgId }) {
    const { workflowId, payload, waitForCompletion = true, timeoutSeconds = 30 } = inputs;

    if (!workflowId || workflowId.trim() === "") {
      throw new ConnectorError("Workflow ID is required to execute a sub-workflow", 400);
    }

    const origin = appOrigin();
    const secret = (process.env.ENGINE_SECRET ?? "").trim();
    const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || "";

    const runRes = await fetch(`${origin}/api/engine/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
      },
      body: JSON.stringify({
        workflowId,
        orgId,
        payload: payload && typeof payload === "object" ? payload : { value: payload },
      }),
    });

    if (!runRes.ok) {
      const errBody = (await runRes.json().catch(() => ({}))) as { error?: string };
      throw new ConnectorError(
        `Failed to trigger sub-workflow (${workflowId}): ${errBody.error || runRes.statusText}`,
        runRes.status >= 400 && runRes.status < 500 ? 400 : 500,
      );
    }

    const runJson = (await runRes.json()) as { executionId: string };
    const executionId = runJson.executionId;

    if (!waitForCompletion) {
      return {
        executionId,
        status: "started",
      };
    }

    if (!convexUrl || !secret) {
      // In testing or minimal environment, return execution started
      return {
        executionId,
        status: "started",
      };
    }

    const client = new ConvexHttpClient(convexUrl);
    const startTime = Date.now();
    const timeoutMs = timeoutSeconds * 1000;

    while (Date.now() - startTime < timeoutMs) {
      const execStatus = await client.query(api.engine.getExecutionStatus, {
        secret,
        executionId: executionId as Id<"executions">,
      });

      if (execStatus && (execStatus.status === "completed" || execStatus.status === "failed")) {
        if (execStatus.status === "failed") {
          throw new ConnectorError(
            `Sub-workflow (${workflowId}) failed: ${execStatus.error || "Unknown error"}`,
            500,
          );
        }

        const stepsRes = await client.query(api.engine.getExecutionSteps, {
          secret,
          executionId: executionId as Id<"executions">,
        });

        const outputs: Record<string, unknown> = {};
        let lastOutput: unknown = null;
        for (const step of stepsRes?.steps ?? []) {
          if (step.output !== undefined) {
            outputs[step.nodeId] = step.output;
            lastOutput = step.output;
          }
        }

        return {
          executionId,
          status: "completed",
          result: lastOutput,
          outputs,
          durationMs: Date.now() - startTime,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    throw new ConnectorError(
      `Sub-workflow (${workflowId}) timed out after ${timeoutSeconds}s`,
      504,
    );
  },
});
