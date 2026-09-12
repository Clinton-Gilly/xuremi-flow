import { z } from "zod";
import { parsePostgresUrl } from "@/connectors/postgres";
import { ConnectorError, defineNode } from "../define";

const TIMEOUT_MS = 25_000;

export const postgresQueryNode = defineNode({
  type: "postgres.query",
  name: "Execute SQL query",
  description: "Run a parameterized SQL query against your PostgreSQL database.",
  category: "data",
  icon: "Database",
  credential: "postgres",
  requiresFeature: null,
  version: "v1",
  inputs: z.object({
    connectionId: z.string().describe("The PostgreSQL connection to use."),
    sql: z
      .string()
      .min(1)
      .describe("SQL query to run, e.g. SELECT * FROM users WHERE status = $1 LIMIT 50;")
      .meta({ label: "SQL Query" }),
    params: z
      .array(z.any())
      .default([])
      .describe("Optional query parameters replacing $1, $2, etc.")
      .meta({ label: "Parameters ($1, $2, …)" }),
  }),
  outputs: z.object({
    rows: z.array(z.any()),
    rowCount: z.number(),
    command: z.string(),
  }),
  async run({ inputs, credential }) {
    const connStr =
      typeof credential?.connectionString === "string" ? credential.connectionString.trim() : "";
    if (!connStr) {
      throw new ConnectorError("Missing PostgreSQL connection string.", 401);
    }

    const { httpEndpoint: derivedEndpoint } = parsePostgresUrl(connStr);
    const customEndpoint =
      typeof credential?.httpEndpoint === "string" ? credential.httpEndpoint.trim() : "";
    const endpoint = customEndpoint || derivedEndpoint;

    if (!endpoint || !endpoint.startsWith("https://")) {
      throw new ConnectorError(
        "Could not determine valid HTTPS endpoint for PostgreSQL query execution.",
        400,
      );
    }

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${connStr}`,
        },
        body: JSON.stringify({
          query: inputs.sql,
          params: inputs.params,
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      throw new ConnectorError("Could not reach PostgreSQL server or HTTP SQL gateway.", 503);
    }

    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (!response.ok) {
      const msg = typeof data.message === "string" ? data.message : `HTTP ${response.status}`;
      throw new ConnectorError(`PostgreSQL query error: ${msg}`, response.status);
    }

    // Standard Neon/Postgres HTTP responses return rows or results array
    let rows: unknown[] = [];
    let command = "SELECT";

    if (Array.isArray(data.rows)) {
      rows = data.rows;
    } else if (Array.isArray(data)) {
      rows = data;
    } else if (Array.isArray(data.results) && data.results.length > 0) {
      const first = data.results[0] as Record<string, unknown>;
      if (Array.isArray(first?.rows)) rows = first.rows;
      if (typeof first?.command === "string") command = first.command;
    }

    return {
      rows,
      rowCount: rows.length,
      command,
    };
  },
});
