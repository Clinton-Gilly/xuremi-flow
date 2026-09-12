import { z } from "zod";
import { ConnectorError, defineNode } from "../define";

const TIMEOUT_MS = 20_000;

function toRowArray(val: unknown): unknown[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "object" && val !== null) {
    return Object.values(val as Record<string, unknown>);
  }
  return [val];
}

export const googleSheetsAppendRowNode = defineNode({
  type: "googlesheets.appendRow",
  name: "Append spreadsheet row",
  description: "Add a row of values to a Google Sheet.",
  category: "data",
  icon: "Table",
  credential: "google-sheets",
  requiresFeature: null,
  version: "v1",
  inputs: z.object({
    connectionId: z.string().describe("The Google Sheets connection to use."),
    spreadsheetId: z
      .string()
      .min(1)
      .describe("The Spreadsheet ID from the Google Sheets URL.")
      .meta({ label: "Spreadsheet ID" }),
    range: z
      .string()
      .default("Sheet1!A:Z")
      .describe("The sheet name or cell range, e.g. Sheet1 or Sheet1!A:Z.")
      .meta({ label: "Sheet or range" }),
    values: z
      .any()
      .describe("Values to append: array e.g. ['John', 'john@test.com'] or an object.")
      .meta({ label: "Row values" }),
    valueInputOption: z
      .enum(["USER_ENTERED", "RAW"])
      .default("USER_ENTERED")
      .describe("How values should be parsed (USER_ENTERED handles numbers and dates automatically).")
      .meta({
        label: "Value parsing",
        options: {
          USER_ENTERED: "Parsed (User entered)",
          RAW: "Raw text",
        },
      }),
  }),
  outputs: z.object({
    updatedRange: z.string(),
    updatedRows: z.number(),
    updatedColumns: z.number(),
    updatedCells: z.number(),
  }),
  async run({ inputs, credential }) {
    const token = typeof credential?.accessToken === "string" ? credential.accessToken.trim() : "";
    if (!token) {
      throw new ConnectorError("Missing Google Sheets OAuth access token.", 401);
    }

    const row = toRowArray(inputs.values);
    const encodedRange = encodeURIComponent(inputs.range);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      inputs.spreadsheetId,
    )}/values/${encodedRange}:append?valueInputOption=${inputs.valueInputOption}&insertDataOption=INSERT_ROWS`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: [row],
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      throw new ConnectorError("Could not reach Google Sheets API.", 503);
    }

    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (!response.ok) {
      const err = (data.error as { message?: string })?.message ?? `HTTP ${response.status}`;
      throw new ConnectorError(`Google Sheets refused append: ${err}`, response.status);
    }

    const updates = (data.updates as Record<string, unknown>) ?? {};

    return {
      updatedRange: typeof updates.updatedRange === "string" ? updates.updatedRange : inputs.range,
      updatedRows: typeof updates.updatedRows === "number" ? updates.updatedRows : 1,
      updatedColumns: typeof updates.updatedColumns === "number" ? updates.updatedColumns : row.length,
      updatedCells: typeof updates.updatedCells === "number" ? updates.updatedCells : row.length,
    };
  },
});
