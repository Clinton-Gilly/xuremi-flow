import { describe, expect, it } from "vitest";
import { filterNode } from "@/nodes/logic/filter";
import { respondToWebhookNode } from "@/nodes/actions/respond-to-webhook";
import { NODES } from "@/nodes/registry";

describe("Phase 1: Filter Node (logic.filter)", () => {
  it("evaluates equality condition correctly", async () => {
    const passedRes = await filterNode.run({
      inputs: {
        value: "active",
        operator: "equals",
        compareValue: "active",
      },
      orgId: "org_1",
      executionId: "exec_1",
      nodeId: "filter_1",
    });

    expect(passedRes.passed).toBe(true);
    expect(passedRes.value).toBe("active");
    expect(filterNode.handle?.(passedRes)).toBe("kept");

    const failedRes = await filterNode.run({
      inputs: {
        value: "inactive",
        operator: "equals",
        compareValue: "active",
      },
      orgId: "org_1",
      executionId: "exec_1",
      nodeId: "filter_1",
    });

    expect(failedRes.passed).toBe(false);
    expect(filterNode.handle?.(failedRes)).toBe("discarded");
  });

  it("evaluates number comparisons", async () => {
    const greaterRes = await filterNode.run({
      inputs: {
        value: "100",
        operator: "greaterThan",
        compareValue: "50",
      },
      orgId: "org_1",
      executionId: "exec_1",
      nodeId: "filter_1",
    });
    expect(greaterRes.passed).toBe(true);
    expect(filterNode.handle?.(greaterRes)).toBe("kept");

    const lessRes = await filterNode.run({
      inputs: {
        value: "100",
        operator: "lessThan",
        compareValue: "50",
      },
      orgId: "org_1",
      executionId: "exec_1",
      nodeId: "filter_1",
    });
    expect(lessRes.passed).toBe(false);
    expect(filterNode.handle?.(lessRes)).toBe("discarded");
  });

  it("evaluates unary operators (isEmpty / isNotEmpty)", async () => {
    const emptyRes = await filterNode.run({
      inputs: {
        value: "   ",
        operator: "isEmpty",
        compareValue: "",
      },
      orgId: "org_1",
      executionId: "exec_1",
      nodeId: "filter_1",
    });
    expect(emptyRes.passed).toBe(true);

    const notEmptyRes = await filterNode.run({
      inputs: {
        value: "hello",
        operator: "isNotEmpty",
        compareValue: "",
      },
      orgId: "org_1",
      executionId: "exec_1",
      nodeId: "filter_1",
    });
    expect(notEmptyRes.passed).toBe(true);
  });

  it("filters an array of items into kept and discarded", async () => {
    const items = [10, 25, 5, 80, 15];
    const res = await filterNode.run({
      inputs: {
        value: "10",
        operator: "greaterThan",
        compareValue: "20",
        items,
      },
      orgId: "org_1",
      executionId: "exec_1",
      nodeId: "filter_1",
    });

    expect(res.kept).toEqual([25, 80]);
    expect(res.discarded).toEqual([10, 5, 15]);
    expect(res.count).toBe(2);
  });
});

describe("Phase 1: Respond to Webhook Node (webhook.respond)", () => {
  it("produces standard JSON response by default", async () => {
    const res = await respondToWebhookNode.run({
      inputs: {
        status: 200,
        contentType: "application/json",
        body: { message: "ok" },
        headers: [],
      },
      orgId: "org_1",
      executionId: "exec_1",
      nodeId: "webhook_respond_1",
    });

    expect(res.status).toBe(200);
    expect(res.contentType).toBe("application/json");
    expect(res.headers).toEqual({ "content-type": "application/json" });
    expect(res.body).toEqual({ message: "ok" });
    expect(res.responded).toBe(true);
  });

  it("supports custom HTTP headers and plain text content type", async () => {
    const res = await respondToWebhookNode.run({
      inputs: {
        status: 201,
        contentType: "text/plain",
        body: "Created successfully",
        headers: [{ key: "X-Custom-Header", value: "xuremi-v1" }],
      },
      orgId: "org_1",
      executionId: "exec_1",
      nodeId: "webhook_respond_1",
    });

    expect(res.status).toBe(201);
    expect(res.contentType).toBe("text/plain");
    expect(res.headers).toEqual({
      "content-type": "text/plain",
      "x-custom-header": "xuremi-v1",
    });
    expect(res.body).toBe("Created successfully");
  });
});

describe("Registry contains Phase 1 nodes", () => {
  it("registers logic.filter and webhook.respond", () => {
    expect(NODES["logic.filter"]).toBeDefined();
    expect(NODES["webhook.respond"]).toBeDefined();
    expect(NODES["logic.filter"].category).toBe("logic");
    expect(NODES["webhook.respond"].category).toBe("action");
  });
});
