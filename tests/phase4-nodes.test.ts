import { describe, expect, it, vi, beforeEach } from "vitest";
import { subWorkflowNode } from "../nodes/actions/sub-workflow";
import { vectorStoreNode } from "../nodes/ai/vector-store";

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

const mockQuery = vi.fn();

vi.mock("convex/browser", () => ({
  ConvexHttpClient: class {
    query = mockQuery;
  },
}));

describe("Phase 4: Sub-Workflows & Vector Store Nodes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ENGINE_SECRET = "test_engine_secret";
    process.env.CONVEX_URL = "https://test.convex.cloud";
  });

  describe("workflow.execute", () => {
    it("starts a sub-workflow in fire-and-forget mode", async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ executionId: "exec_sub_1", status: "started" }),
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
      })) as { executionId: string; status: string };

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/engine/run"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            workflowId: "wf_child_123",
            orgId: "org_test",
            payload: { orderId: "ord_999" },
          }),
        }),
      );
      expect(output.executionId).toBe("exec_sub_1");
      expect(output.status).toBe("started");
    });

    it("awaits sub-workflow completion and returns results", async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ executionId: "exec_sub_2", status: "started" }),
      });

      mockQuery
        .mockResolvedValueOnce({
          status: "completed",
          finishedAt: 123456789,
        })
        .mockResolvedValueOnce({
          steps: [{ nodeId: "step_done", output: { status: "processed", total: 150 } }],
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
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ executionId: "exec_sub_3", status: "started" }),
      });

      mockQuery.mockResolvedValueOnce({
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
