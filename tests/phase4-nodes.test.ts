import { describe, expect, it, vi, beforeEach } from "vitest";
import { subWorkflowNode } from "../nodes/actions/sub-workflow";
import { vectorStoreNode } from "../nodes/ai/vector-store";

vi.mock("@/lib/engine-client", () => ({
  startRun: vi.fn(),
  pollExecutionCompletion: vi.fn(),
}));

vi.mock("@/lib/ai/providers", () => ({
  aiCredential: vi.fn(() => ({ provider: "openai", apiKey: "sk-mock-key", options: {} })),
  embeddingModelFor: vi.fn(() => ({ modelId: "text-embedding-3-small" })),
}));

vi.mock("ai", () => ({
  embed: vi.fn(async ({ value }: { value: string }) => ({
    embedding: value.includes("billing") ? [0.9, 0.1, 0.0] : [0.1, 0.9, 0.0],
  })),
  embedMany: vi.fn(async ({ values }: { values: string[] }) => ({
    embeddings: values.map((v) =>
      v.includes("invoice") || v.includes("payment") || v.includes("billing")
        ? [0.85, 0.15, 0.0]
        : [0.1, 0.85, 0.0],
    ),
  })),
}));

describe("Phase 4: Sub-Workflows & Vector Store Nodes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("workflow.execute", () => {
    it("starts a sub-workflow in fire-and-forget mode", async () => {
      const { startRun } = await import("@/lib/engine-client");
      vi.mocked(startRun).mockResolvedValueOnce({
        executionId: "exec_sub_1",
        runId: "run_sub_1",
      });

      const output = (await subWorkflowNode.run({
        inputs: subWorkflowNode.inputs.parse({
          workflowId: "wf_child_123",
          payload: { orderId: "ord_999" },
          waitForCompletion: false,
        }),
        orgId: "org_test",
        executionId: "exec_parent_1",
        nodeId: "sub_wf_1",
        planSlug: "free_org",
      })) as { executionId: string; runId?: string; status: string };

      expect(startRun).toHaveBeenCalledWith({
        orgId: "org_test",
        workflowId: "wf_child_123",
        trigger: {
          type: "subworkflow",
          payload: { orderId: "ord_999" },
        },
        planSlug: "free_org",
      });
      expect(output.executionId).toBe("exec_sub_1");
      expect(output.runId).toBe("run_sub_1");
      expect(output.status).toBe("started");
    });

    it("awaits sub-workflow completion and returns results", async () => {
      const { startRun, pollExecutionCompletion } = await import("@/lib/engine-client");
      vi.mocked(startRun).mockResolvedValueOnce({
        executionId: "exec_sub_2",
        runId: "run_sub_2",
      });
      vi.mocked(pollExecutionCompletion).mockResolvedValueOnce({
        status: "completed",
        finishedAt: 123456789,
        lastOutput: { status: "processed", total: 150 },
        outputs: { step_done: { status: "processed", total: 150 } },
      });

      const output = (await subWorkflowNode.run({
        inputs: subWorkflowNode.inputs.parse({
          workflowId: "wf_child_456",
          payload: { invoiceId: "inv_123" },
          waitForCompletion: true,
          timeoutSeconds: 10,
        }),
        orgId: "org_test",
        executionId: "exec_parent_2",
        nodeId: "sub_wf_1",
        planSlug: "pro",
      })) as { executionId: string; status: string; result: any; outputs: any };

      expect(output.executionId).toBe("exec_sub_2");
      expect(output.status).toBe("completed");
      expect(output.result).toEqual({ status: "processed", total: 150 });
      expect(output.outputs).toEqual({ step_done: { status: "processed", total: 150 } });
    });

    it("throws when the sub-workflow fails", async () => {
      const { startRun, pollExecutionCompletion } = await import("@/lib/engine-client");
      vi.mocked(startRun).mockResolvedValueOnce({
        executionId: "exec_sub_3",
        runId: "run_sub_3",
      });
      vi.mocked(pollExecutionCompletion).mockResolvedValueOnce({
        status: "failed",
        error: "Division by zero in calculation node",
      });

      await expect(
        subWorkflowNode.run({
          inputs: subWorkflowNode.inputs.parse({
            workflowId: "wf_child_fail",
            waitForCompletion: true,
          }),
          orgId: "org_test",
          executionId: "exec_parent_3",
          nodeId: "sub_wf_1",
          planSlug: "pro",
        }),
      ).rejects.toThrow("Sub-workflow (wf_child_fail) failed: Division by zero in calculation node");
    });
  });

  describe("ai.vectorStore", () => {
    it("performs semantic search and ranks matches by score", async () => {
      const documents = [
        { id: 1, text: "Customer invoice payment received via Stripe", category: "billing" },
        { id: 2, text: "New user registered with Gmail address", category: "auth" },
        { id: 3, text: "Updated billing subscription to Enterprise plan", category: "billing" },
      ];

      const output = (await vectorStoreNode.run({
        inputs: vectorStoreNode.inputs.parse({
          connectionId: "conn_openai_1",
          mode: "semanticSearch",
          query: "How do I check billing status?",
          documents,
          textKey: "text",
          topK: 2,
          minScore: 0.5,
        }),
        orgId: "org_test",
        executionId: "exec_vec_1",
        nodeId: "vec_1",
        planSlug: "pro",
      })) as {
        matches: { text: string; score: number; index: number; metadata: any }[];
        count: number;
        topMatch: any;
      };

      expect(output.count).toBe(2);
      expect(output.matches.length).toBe(2);
      // First match should be the highest similarity score
      expect(output.matches[0].score).toBeGreaterThanOrEqual(output.matches[1].score);
      expect(output.matches[0].text).toContain("invoice");
      expect(output.topMatch).toEqual(output.matches[0]);
    });

    it("generates embeddings in embedTexts mode", async () => {
      const documents = ["Short paragraph A", "Short paragraph B"];

      const output = (await vectorStoreNode.run({
        inputs: vectorStoreNode.inputs.parse({
          connectionId: "conn_openai_1",
          mode: "embedTexts",
          documents,
        }),
        orgId: "org_test",
        executionId: "exec_vec_2",
        nodeId: "vec_1",
        planSlug: "pro",
      })) as {
        matches: any[];
        count: number;
        embeddings: number[][];
      };

      expect(output.matches).toEqual([]);
      expect(output.count).toBe(0);
      expect(output.embeddings).toBeDefined();
      expect(output.embeddings.length).toBe(2);
    });

    it("handles empty documents gracefully", async () => {
      const output = (await vectorStoreNode.run({
        inputs: vectorStoreNode.inputs.parse({
          connectionId: "conn_openai_1",
          mode: "semanticSearch",
          query: "Find something",
          documents: [],
        }),
        orgId: "org_test",
        executionId: "exec_vec_3",
        nodeId: "vec_1",
        planSlug: "pro",
      })) as {
        matches: any[];
        count: number;
        topMatch: any;
      };

      expect(output.matches).toEqual([]);
      expect(output.count).toBe(0);
      expect(output.topMatch).toBeNull();
    });
  });
});
