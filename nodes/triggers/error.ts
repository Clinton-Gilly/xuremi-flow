import { z } from "zod";
import { defineNode } from "../define";

/**
 * Error trigger:
 * Starts the workflow automatically whenever another workflow in the organization fails.
 * Supplies details about the failed workflow, execution ID, error message, and timestamp.
 */
export const errorTriggerNode = defineNode({
  type: "error.trigger",
  name: "Error trigger",
  description: "Starts this workflow automatically whenever another workflow in your organization fails.",
  category: "trigger",
  guide: {
    summary:
      "Acts as a global incident handler. Whenever any workflow in your workspace fails, this trigger " +
      "starts this workflow with the failure details (error message, failed workflow ID, execution ID, " +
      "and timestamp) so you can send alert notifications to Slack, Discord, or Email.",
    outputs: { out: "error and execution metadata" },
  },
  icon: "AlertTriangle",
  credential: null,
  requiresFeature: null,
  version: "v1",
  inputs: z.object({
    workflowFilter: z
      .string()
      .optional()
      .default("")
      .describe("Optional workflow ID to filter on. Leave empty to listen to all workflows.")
      .meta({ label: "Filter by Workflow ID" }),
  }),
  outputs: z.object({
    executionId: z.string().describe("ID of the execution that failed"),
    workflowId: z.string().describe("ID of the workflow that failed"),
    workflowName: z.string().describe("Name of the workflow that failed"),
    error: z.string().describe("Error message describing why the run failed"),
    failedAt: z.number().describe("Timestamp when the failure occurred"),
  }),
  async run({ inputs }) {
    // When run directly or tested via sample:
    return {
      executionId: "sample_execution_id",
      workflowId: inputs.workflowFilter || "sample_workflow_id",
      workflowName: "Sample Workflow",
      error: "Sample error message: node execution failed",
      failedAt: Date.now(),
    };
  },
});
