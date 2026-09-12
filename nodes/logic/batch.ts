import { z } from "zod";
import { defineNode } from "../define";

function parseItems(value: unknown): unknown[] {
  if (value === undefined || value === null || value === "") return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Treat as single string item
    }
  }
  return [value];
}

/**
 * Split in Batches node:
 * Takes a list of items and divides it into sized chunks/batches.
 * Perfect for batching database insertions, avoiding API rate limits,
 * or pairing with "For each item" (logic.loop).
 */
export const batchNode = defineNode({
  type: "logic.batch",
  name: "Split in batches",
  description: "Split a list of items into smaller batches or chunks for rate-limiting or bulk processing.",
  category: "logic",
  guide: {
    summary:
      "Divides a large list into chunks of your chosen batch size. Use this before a loop or API call " +
      "to prevent rate-limit errors, or to execute bulk operations efficiently. Access all batches via " +
      "{{ this_node.batches }} or the first batch via {{ this_node.firstBatch }}.",
    outputs: { out: "batches array and summary metrics" },
  },
  icon: "Layers",
  credential: null,
  requiresFeature: null,
  version: "v1",
  inputs: z.object({
    items: z
      .any()
      .describe("The list of items to split into batches (e.g. {{ http_request_1.body.items }})")
      .meta({ label: "Items to batch" }),
    batchSize: z.coerce
      .number()
      .int()
      .min(1)
      .default(10)
      .describe("Maximum number of items per batch (e.g. 10, 50, 100)")
      .meta({ label: "Batch size" }),
  }),
  outputs: z.object({
    batches: z.array(z.array(z.any())).describe("Array of chunked batches"),
    totalBatches: z.number().describe("Total number of batches created"),
    totalItems: z.number().describe("Total number of items across all batches"),
    batchSize: z.number().describe("The configured batch size"),
    firstBatch: z.array(z.any()).describe("The first batch of items"),
  }),
  async run({ inputs }) {
    const rawItems = parseItems(inputs.items);
    const batchSize = Math.max(1, Math.floor(inputs.batchSize || 10));

    const batches: unknown[][] = [];
    for (let i = 0; i < rawItems.length; i += batchSize) {
      batches.push(rawItems.slice(i, i + batchSize));
    }

    return {
      batches,
      totalBatches: batches.length,
      totalItems: rawItems.length,
      batchSize,
      firstBatch: batches[0] ?? [],
    };
  },
});
