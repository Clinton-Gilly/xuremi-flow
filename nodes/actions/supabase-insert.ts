import { z } from "zod";
import { ConnectorError, defineNode } from "../define";

export const supabaseInsertNode = defineNode({
  type: "supabase.insertRow",
  name: "Supabase: Insert row",
  description: "Insert a new record into a Supabase table.",
  category: "data",
  icon: "Database",
  credential: "supabase",
  requiresFeature: null,
  version: "v1",
  inputs: z.object({
    connectionId: z.string().describe("Your Supabase connection"),
    table: z.string().min(1).describe("Target database table name").meta({ label: "Table name" }),
    row: z.record(z.string(), z.any()).describe("Object containing row values to insert").meta({ label: "Row data (JSON)" }),
  }),
  outputs: z.object({
    inserted: z.any(),
  }),
  async run({ inputs, credential }) {
    const projectUrl = typeof credential?.projectUrl === "string" ? credential.projectUrl.trim().replace(/\/+$/, "") : "";
    const apiKey = typeof credential?.apiKey === "string" ? credential.apiKey.trim() : "";
    if (!projectUrl || !apiKey) {
      throw new ConnectorError("Supabase connection credentials missing. Re-test your connection.", 400);
    }

    const response = await fetch(`${projectUrl}/rest/v1/${inputs.table}`, {
      method: "POST",
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(inputs.row),
    });

    const text = await response.text();
    let body: unknown = null;
    try {
      body = JSON.parse(text);
    } catch {
      // ignore
    }

    if (!response.ok) {
      const detail = typeof body === "object" && body !== null && "message" in body ? String((body as Record<string, unknown>).message) : text;
      throw new ConnectorError(`Supabase insert failed: ${detail || `HTTP ${response.status}`}`, response.status);
    }

    return { inserted: body };
  },
});
