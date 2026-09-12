import { z } from "zod";
import { defineNode } from "../define";

const OPERATORS = [
  "equals",
  "notEquals",
  "contains",
  "notContains",
  "greaterThan",
  "lessThan",
  "isEmpty",
  "isNotEmpty",
  "matchesRegex",
] as const;

type Operator = (typeof OPERATORS)[number];

export const OPERATOR_LABELS: Record<Operator, string> = {
  equals: "is equal to",
  notEquals: "is not equal to",
  contains: "contains",
  notContains: "does not contain",
  greaterThan: "is greater than",
  lessThan: "is less than",
  isEmpty: "is empty",
  isNotEmpty: "is not empty",
  matchesRegex: "matches pattern (regex)",
};

export const UNARY_OPERATORS: readonly Operator[] = ["isEmpty", "isNotEmpty"];

function asNumbers(left: string, right: string): [number, number] | null {
  const [l, r] = [left.trim(), right.trim()];
  if (l === "" || r === "") return null;
  const [x, y] = [Number(l), Number(r)];
  return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : null;
}

function matchesRegex(text: string, pattern: string): boolean {
  try {
    return new RegExp(pattern).test(text);
  } catch {
    return false;
  }
}

function evaluate(left: string, op: Operator, right: string): boolean {
  const pair = asNumbers(left, right);

  switch (op) {
    case "equals":
      return pair ? pair[0] === pair[1] : left === right;
    case "notEquals":
      return pair ? pair[0] !== pair[1] : left !== right;
    case "contains":
      return left.includes(right);
    case "notContains":
      return !left.includes(right);
    case "greaterThan":
      return pair ? pair[0] > pair[1] : left > right;
    case "lessThan":
      return pair ? pair[0] < pair[1] : left < right;
    case "isEmpty":
      return left.trim() === "";
    case "isNotEmpty":
      return left.trim() !== "";
    case "matchesRegex":
      return matchesRegex(left, right);
  }
}

/**
 * Filter node: checks a value against a condition.
 * If true, routes down the "kept" handle. If false, routes down "discarded".
 * If an array of items is supplied, it filters the array into kept and discarded lists.
 */
export const filterNode = defineNode({
  type: "logic.filter",
  name: "Filter",
  description: "Filter incoming data and pass through only items that match your rules.",
  category: "logic",
  guide: {
    summary:
      "Test incoming data against your condition. Matching data continues down the “kept” path, " +
      "while non-matching data exits through “discarded”. If you provide a list of items, it also " +
      "splits them into matching and non-matching arrays.",
    outputs: { kept: "kept", discarded: "discarded" },
  },
  icon: "Filter",
  credential: null,
  requiresFeature: null,
  version: "v1",
  inputs: z.object({
    value: z.coerce
      .string()
      .default("")
      .describe("The value to evaluate, e.g. {{ trigger.body.status }}")
      .meta({ label: "Value to test" }),
    operator: z
      .enum(OPERATORS)
      .default("equals")
      .describe("Comparison operator to test against.")
      .meta({ label: "Condition", options: OPERATOR_LABELS }),
    compareValue: z.coerce
      .string()
      .default("")
      .describe("The reference value to compare against, e.g. active, 100, or a regex.")
      .meta({
        label: "Compare with",
        showWhen: {
          operator: OPERATORS.filter((entry) => !UNARY_OPERATORS.includes(entry)),
        },
      }),
    items: z
      .any()
      .optional()
      .describe("Optional: if an array of items is provided, it filters the array.")
      .meta({ label: "Items to filter (optional)" }),
  }),
  outputs: z.object({
    passed: z.boolean(),
    value: z.any(),
    operator: z.string(),
    kept: z.any(),
    discarded: z.any(),
    count: z.number(),
  }),
  handles: () => ["kept", "discarded"],
  handle: (out) => (out.passed ? "kept" : "discarded"),
  async run({ inputs }) {
    const passed = evaluate(inputs.value, inputs.operator, inputs.compareValue);

    let keptItems: unknown[] = [];
    let discardedItems: unknown[] = [];

    if (Array.isArray(inputs.items)) {
      for (const item of inputs.items) {
        const itemStr =
          typeof item === "string" ? item : typeof item === "number" ? String(item) : JSON.stringify(item);
        if (evaluate(itemStr, inputs.operator, inputs.compareValue)) {
          keptItems.push(item);
        } else {
          discardedItems.push(item);
        }
      }
    } else {
      if (passed) {
        keptItems = [inputs.value];
      } else {
        discardedItems = [inputs.value];
      }
    }

    return {
      passed,
      value: inputs.value,
      operator: inputs.operator,
      kept: Array.isArray(inputs.items) ? keptItems : passed ? inputs.value : null,
      discarded: Array.isArray(inputs.items) ? discardedItems : !passed ? inputs.value : null,
      count: keptItems.length,
    };
  },
});
