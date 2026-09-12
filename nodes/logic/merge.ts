import { z } from "zod";
import { defineNode } from "../define";

const MERGE_MODES = ["combine", "append", "combineByKey", "chooseBranch"] as const;
type MergeMode = (typeof MERGE_MODES)[number];

const JOIN_TYPES = ["inner", "left", "outer"] as const;
type JoinType = (typeof JOIN_TYPES)[number];

function toArray(value: unknown): unknown[] {
  if (value === undefined || value === null || value === "") return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Not a JSON array, treat as single string item
    }
  }
  return [value];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function combineObjects(input1: unknown, input2: unknown): Record<string, unknown> {
  const obj1 = isPlainObject(input1) ? input1 : { input1 };
  const obj2 = isPlainObject(input2) ? input2 : { input2 };
  return { ...obj1, ...obj2 };
}

function joinDatasets(
  list1: unknown[],
  list2: unknown[],
  joinKey: string,
  joinType: JoinType,
): unknown[] {
  const map2 = new Map<string, Record<string, unknown>[]>();
  for (const item of list2) {
    if (isPlainObject(item)) {
      const keyVal = String(item[joinKey] ?? "");
      if (keyVal !== "") {
        const existing = map2.get(keyVal) ?? [];
        existing.push(item);
        map2.set(keyVal, existing);
      }
    }
  }

  const matchedKeys = new Set<string>();
  const results: unknown[] = [];

  for (const item of list1) {
    if (!isPlainObject(item)) {
      if (joinType !== "inner") results.push(item);
      continue;
    }

    const keyVal = String(item[joinKey] ?? "");
    const matches = keyVal !== "" ? map2.get(keyVal) : undefined;

    if (matches && matches.length > 0) {
      matchedKeys.add(keyVal);
      for (const match of matches) {
        results.push({ ...item, ...match });
      }
    } else if (joinType !== "inner") {
      results.push(item);
    }
  }

  if (joinType === "outer") {
    for (const item of list2) {
      if (isPlainObject(item)) {
        const keyVal = String(item[joinKey] ?? "");
        if (!matchedKeys.has(keyVal)) {
          results.push(item);
        }
      } else {
        results.push(item);
      }
    }
  }

  return results;
}

/**
 * Merge node: Combines or joins data from two different branches or inputs.
 * Supports combine (wait for both/merge objects), append (concatenate lists),
 * combineByKey (SQL-like join on matching property), and chooseBranch.
 */
export const mergeNode = defineNode({
  type: "logic.merge",
  name: "Merge",
  description: "Combine, merge, or join data from two different branches or inputs.",
  category: "logic",
  guide: {
    summary:
      "Combine data from multiple branches. Use “combine” to merge objects from both inputs, " +
      "“append” to concatenate lists, “combineByKey” to join records that share a common key, " +
      "or “chooseBranch” to pick which input to pass through.",
    outputs: { out: "the merged result" },
  },
  icon: "GitMerge",
  credential: null,
  requiresFeature: null,
  version: "v1",
  inputs: z.object({
    mode: z
      .enum(MERGE_MODES)
      .default("combine")
      .describe("How to merge the inputs")
      .meta({ label: "Merge mode" }),
    input1: z
      .any()
      .optional()
      .describe("Data from the first input (e.g. {{ branch_1.data }})")
      .meta({ label: "Input 1" }),
    input2: z
      .any()
      .optional()
      .describe("Data from the second input (e.g. {{ branch_2.data }})")
      .meta({ label: "Input 2" }),
    joinKey: z
      .string()
      .optional()
      .default("id")
      .describe("Property name to join on when mode is combineByKey (e.g. id, email)")
      .meta({ label: "Join key" }),
    joinType: z
      .enum(JOIN_TYPES)
      .optional()
      .default("left")
      .describe("Join strategy for combineByKey: inner, left, or outer")
      .meta({ label: "Join type" }),
    branchToKeep: z
      .enum(["input1", "input2"])
      .optional()
      .default("input1")
      .describe("Which branch to output when mode is chooseBranch")
      .meta({ label: "Branch to keep" }),
  }),
  outputs: z.object({
    result: z.any().describe("The merged output data"),
    input1: z.any().optional().describe("Input 1 payload as received"),
    input2: z.any().optional().describe("Input 2 payload as received"),
    count: z.number().optional().describe("Number of items in result when result is a list"),
    mode: z.string().describe("The merge mode used"),
  }),
  async run({ inputs }) {
    const { mode, input1, input2, joinKey = "id", joinType = "left", branchToKeep = "input1" } =
      inputs;

    switch (mode) {
      case "combine": {
        const merged = combineObjects(input1, input2);
        return {
          result: merged,
          input1,
          input2,
          mode,
        };
      }
      case "append": {
        const list1 = toArray(input1);
        const list2 = toArray(input2);
        const appended = [...list1, ...list2];
        return {
          result: appended,
          input1,
          input2,
          count: appended.length,
          mode,
        };
      }
      case "combineByKey": {
        const list1 = toArray(input1);
        const list2 = toArray(input2);
        const joined = joinDatasets(list1, list2, joinKey, joinType);
        return {
          result: joined,
          input1,
          input2,
          count: joined.length,
          mode,
        };
      }
      case "chooseBranch": {
        const chosen = branchToKeep === "input2" ? input2 : input1;
        return {
          result: chosen,
          input1,
          input2,
          count: Array.isArray(chosen) ? chosen.length : undefined,
          mode,
        };
      }
    }
  },
});
