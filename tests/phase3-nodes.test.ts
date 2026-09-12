import { describe, expect, it } from "vitest";
import { mergeNode } from "../nodes/logic/merge";
import { batchNode } from "../nodes/logic/batch";
import { errorTriggerNode } from "../nodes/triggers/error";

describe("Phase 3: Logic & Error Nodes", () => {
  describe("logic.merge", () => {
    it("combines two objects in combine mode", async () => {
      const output = (await mergeNode.run({
        inputs: mergeNode.inputs.parse({
          mode: "combine",
          input1: { id: 1, name: "Alice" },
          input2: { role: "Admin", email: "alice@example.com" },
        }),
        orgId: "org_1",
        executionId: "exec_1",
        nodeId: "merge_1",
        planSlug: "free_org",
      })) as {
        result: Record<string, unknown>;
        input1: unknown;
        input2: unknown;
        mode: string;
      };

      expect(output.mode).toBe("combine");
      expect(output.result).toEqual({
        id: 1,
        name: "Alice",
        role: "Admin",
        email: "alice@example.com",
      });
      expect(output.input1).toEqual({ id: 1, name: "Alice" });
      expect(output.input2).toEqual({ role: "Admin", email: "alice@example.com" });
    });

    it("appends two arrays in append mode", async () => {
      const output = (await mergeNode.run({
        inputs: mergeNode.inputs.parse({
          mode: "append",
          input1: [{ id: 1 }, { id: 2 }],
          input2: [{ id: 3 }, { id: 4 }],
        }),
        orgId: "org_1",
        executionId: "exec_1",
        nodeId: "merge_1",
        planSlug: "free_org",
      })) as {
        result: unknown[];
        count: number;
        mode: string;
      };

      expect(output.mode).toBe("append");
      expect(output.count).toBe(4);
      expect(output.result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
    });

    it("handles JSON-stringified arrays in append mode", async () => {
      const output = (await mergeNode.run({
        inputs: mergeNode.inputs.parse({
          mode: "append",
          input1: JSON.stringify(["a", "b"]),
          input2: ["c"],
        }),
        orgId: "org_1",
        executionId: "exec_1",
        nodeId: "merge_1",
        planSlug: "free_org",
      })) as {
        result: unknown[];
        count: number;
      };

      expect(output.count).toBe(3);
      expect(output.result).toEqual(["a", "b", "c"]);
    });

    it("joins two datasets by key (left join)", async () => {
      const output = (await mergeNode.run({
        inputs: mergeNode.inputs.parse({
          mode: "combineByKey",
          joinKey: "id",
          joinType: "left",
          input1: [
            { id: 1, name: "Item 1" },
            { id: 2, name: "Item 2" },
          ],
          input2: [
            { id: 1, price: 100 },
            { id: 3, price: 300 },
          ],
        }),
        orgId: "org_1",
        executionId: "exec_1",
        nodeId: "merge_1",
        planSlug: "free_org",
      })) as {
        result: Record<string, unknown>[];
        count: number;
      };

      expect(output.count).toBe(2);
      expect(output.result).toEqual([
        { id: 1, name: "Item 1", price: 100 },
        { id: 2, name: "Item 2" },
      ]);
    });

    it("joins two datasets by key (inner join)", async () => {
      const output = (await mergeNode.run({
        inputs: mergeNode.inputs.parse({
          mode: "combineByKey",
          joinKey: "id",
          joinType: "inner",
          input1: [
            { id: 1, name: "Item 1" },
            { id: 2, name: "Item 2" },
          ],
          input2: [
            { id: 1, price: 100 },
            { id: 3, price: 300 },
          ],
        }),
        orgId: "org_1",
        executionId: "exec_1",
        nodeId: "merge_1",
        planSlug: "free_org",
      })) as {
        result: Record<string, unknown>[];
        count: number;
      };

      expect(output.count).toBe(1);
      expect(output.result).toEqual([{ id: 1, name: "Item 1", price: 100 }]);
    });

    it("joins two datasets by key (outer join)", async () => {
      const output = (await mergeNode.run({
        inputs: mergeNode.inputs.parse({
          mode: "combineByKey",
          joinKey: "id",
          joinType: "outer",
          input1: [{ id: 1, name: "Item 1" }],
          input2: [
            { id: 1, price: 100 },
            { id: 2, price: 200 },
          ],
        }),
        orgId: "org_1",
        executionId: "exec_1",
        nodeId: "merge_1",
        planSlug: "free_org",
      })) as {
        result: Record<string, unknown>[];
        count: number;
      };

      expect(output.count).toBe(2);
      expect(output.result).toEqual([
        { id: 1, name: "Item 1", price: 100 },
        { id: 2, price: 200 },
      ]);
    });

    it("selects input in chooseBranch mode", async () => {
      const output1 = (await mergeNode.run({
        inputs: mergeNode.inputs.parse({
          mode: "chooseBranch",
          branchToKeep: "input1",
          input1: "alpha",
          input2: "beta",
        }),
        orgId: "org_1",
        executionId: "exec_1",
        nodeId: "merge_1",
        planSlug: "free_org",
      })) as { result: unknown };
      expect(output1.result).toBe("alpha");

      const output2 = (await mergeNode.run({
        inputs: mergeNode.inputs.parse({
          mode: "chooseBranch",
          branchToKeep: "input2",
          input1: "alpha",
          input2: "beta",
        }),
        orgId: "org_1",
        executionId: "exec_1",
        nodeId: "merge_1",
        planSlug: "free_org",
      })) as { result: unknown };
      expect(output2.result).toBe("beta");
    });
  });

  describe("logic.batch", () => {
    it("splits items into batches correctly", async () => {
      const items = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));
      const output = (await batchNode.run({
        inputs: batchNode.inputs.parse({
          items,
          batchSize: 10,
        }),
        orgId: "org_1",
        executionId: "exec_1",
        nodeId: "batch_1",
        planSlug: "free_org",
      })) as {
        batches: unknown[][];
        totalBatches: number;
        totalItems: number;
        batchSize: number;
        firstBatch: unknown[];
      };

      expect(output.totalBatches).toBe(3);
      expect(output.totalItems).toBe(25);
      expect(output.batchSize).toBe(10);
      expect(output.batches[0].length).toBe(10);
      expect(output.batches[1].length).toBe(10);
      expect(output.batches[2].length).toBe(5);
      expect(output.firstBatch).toEqual(output.batches[0]);
    });

    it("handles exact multiples of batch size", async () => {
      const items = [1, 2, 3, 4];
      const output = (await batchNode.run({
        inputs: batchNode.inputs.parse({
          items,
          batchSize: 2,
        }),
        orgId: "org_1",
        executionId: "exec_1",
        nodeId: "batch_1",
        planSlug: "free_org",
      })) as {
        batches: unknown[][];
        totalBatches: number;
        totalItems: number;
      };

      expect(output.totalBatches).toBe(2);
      expect(output.totalItems).toBe(4);
      expect(output.batches).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });

    it("handles empty items list", async () => {
      const output = (await batchNode.run({
        inputs: batchNode.inputs.parse({
          items: [],
          batchSize: 10,
        }),
        orgId: "org_1",
        executionId: "exec_1",
        nodeId: "batch_1",
        planSlug: "free_org",
      })) as {
        batches: unknown[][];
        totalBatches: number;
        totalItems: number;
        firstBatch: unknown[];
      };

      expect(output.totalBatches).toBe(0);
      expect(output.totalItems).toBe(0);
      expect(output.batches).toEqual([]);
      expect(output.firstBatch).toEqual([]);
    });
  });

  describe("error.trigger", () => {
    it("validates inputs and executes sample output", async () => {
      const output = await errorTriggerNode.run({
        inputs: errorTriggerNode.inputs.parse({
          workflowFilter: "wf_target_1",
        }),
        orgId: "org_1",
        executionId: "exec_1",
        nodeId: "error_trigger_1",
        planSlug: "free_org",
      });

      expect(output.workflowId).toBe("wf_target_1");
      expect(output.workflowName).toBe("Sample Workflow");
      expect(typeof output.executionId).toBe("string");
      expect(typeof output.error).toBe("string");
      expect(typeof output.failedAt).toBe("number");
    });
  });
});
