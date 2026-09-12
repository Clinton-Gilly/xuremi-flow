import { z } from "zod";
import { ConnectorError, defineNode } from "../define";

export const codeNode = defineNode({
  type: "logic.code",
  name: "JavaScript expression",
  description: "Run a lightweight JavaScript expression or transform on inputs.",
  category: "logic",
  guide: {
    summary:
      "Transform data using a JavaScript expression or function body. Access inputs via `input` or `context`. " +
      "For example: `input.items.map(x => x.name)` or `return { total: input.a + input.b };`.",
  },
  icon: "Code",
  credential: null,
  requiresFeature: null,
  version: "v1",
  inputs: z.object({
    code: z
      .string()
      .min(1)
      .describe("JavaScript expression or code body. E.g. `input.a + input.b` or `return input.items.length;`.")
      .meta({ label: "Code" }),
    input: z
      .any()
      .optional()
      .describe("Data passed into the expression, accessible as `input` or `context`.")
      .meta({ label: "Input data" }),
  }),
  outputs: z.object({
    result: z.any(),
  }),
  async run({ inputs }) {
    const rawCode = inputs.code.trim();
    const data = inputs.input;

    try {
      const fnBody =
        rawCode.includes("return ") || rawCode.startsWith("throw ") || rawCode.includes(";")
          ? rawCode
          : `return (${rawCode});`;
      const fn = new Function("input", "context", fnBody);
      const result = fn(data, data);
      return { result: result === undefined ? null : result };
    } catch (cause) {
      const msg = cause instanceof Error ? cause.message : String(cause);
      throw new ConnectorError(`Code execution error: ${msg}`, 400);
    }
  },
});
