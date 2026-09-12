import { z } from "zod";
import { ConnectorError, defineNode } from "../define";

const TIMEOUT_MS = 20_000;

export const googleSheetsGetRowsNode = defineNode({
  type: "googlesheets.getRows",
  name: "Get spreadsheet rows",
  description: "Read rows and cell data from a Google Sheet.",
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
      .default("Sheet1!A1:Z50")
      .describe("Cell range to read, e.g. Sheet1!A1:Z50 or Sheet1.")
      .meta({ label: "Range" }),
  }),
  outputs: z.object({
    range: z.string(),
    values: z.array(z.array(z.any())),
    rowCount: z.number(),
  }),
  async run({ inputs, credential }) {
    const token = typeof credential?.accessToken === "string" ? credential.accessToken.trim() : "";
    if (!token) {
      throw new ConnectorError("Missing Google Sheets OAuth access token.", 401);
    }

    const encodedRange = encodeURIComponent(inputs.range);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      inputs.spreadsheetId,
    )}/values/${encodedRange}`;

    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      throw new ConnectorError("Could not reach Google Sheets API.", 503);
    }

    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (!response.ok) {
      const err = (data.error as { message?: string })?.message ?? `HTTP ${response.status}`;
      throw new ConnectorError(`Google Sheets refused read: ${err}`, response.status);
    }

    const rawValues = Array.isArray(data.values) ? (data.values as unknown[][]) : [];

    return {
      range: typeof data.range === "string" ? data.range : inputs.range,
      values: rawValues,
      rowCount: rawValues.length,
    };
  },
});
