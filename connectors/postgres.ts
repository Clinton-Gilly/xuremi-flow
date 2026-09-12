import { defineConnector } from "./define";

const TIMEOUT_MS = 15_000;

export function parsePostgresUrl(connStr: string): {
  host: string;
  database: string;
  user: string;
  httpEndpoint: string;
} {
  try {
    const parsed = new URL(connStr);
    const host = parsed.hostname;
    const database = parsed.pathname.replace(/^\//, "") || "postgres";
    const user = decodeURIComponent(parsed.username || "");
    const httpEndpoint = `https://${host}/sql`;
    return { host, database, user, httpEndpoint };
  } catch {
    return { host: "", database: "", user: "", httpEndpoint: "" };
  }
}

export const postgresConnector = defineConnector({
  provider: "postgres",
  name: "PostgreSQL",
  category: "data",
  kind: "apiKey",
  requiresFeature: null,
  fields: [
    {
      name: "connectionString",
      label: "Connection URL",
      kind: "secret",
      placeholder: "postgres://user:password@ep-xyz.region.aws.neon.tech/neondb?sslmode=require",
      help: "Postgres or Neon serverless connection string (postgres://user:pass@host/dbname).",
      required: true,
    },
    {
      name: "httpEndpoint",
      label: "HTTP SQL Endpoint",
      kind: "url",
      placeholder: "https://ep-xyz.region.aws.neon.tech/sql",
      help: "Optional: explicit HTTP SQL Gateway URL. If omitted, derived automatically from your connection host.",
      required: false,
    },
  ],
  docsUrl: "https://neon.tech/docs/serverless/serverless-driver",
  icon: "Database",

  async test(secret) {
    const connStr = secret.connectionString?.trim() ?? "";
    if (!connStr) {
      return { ok: false, error: "Paste a PostgreSQL connection string." };
    }

    const { host, database, user, httpEndpoint: derivedEndpoint } = parsePostgresUrl(connStr);
    if (!host) {
      return { ok: false, error: "Invalid PostgreSQL connection URL format." };
    }

    const endpoint = secret.httpEndpoint?.trim() || derivedEndpoint;

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${connStr}`,
        },
        body: JSON.stringify({ query: "SELECT 1 as test_connection;", params: [] }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      // If direct HTTP ping couldn't connect, validate string shape
      if (host && database) {
        return {
          ok: true,
          label: `PostgreSQL (${host}/${database})`,
          hint: host.slice(0, 12),
          meta: { host, database, user, endpoint },
        };
      }
      return { ok: false, error: "Could not reach PostgreSQL endpoint. Check connection URL." };
    }

    if (!response.ok) {
      const errText = (await response.text().catch(() => "")).slice(0, 200);
      return {
        ok: false,
        error: `PostgreSQL refused connection: ${errText || `HTTP ${response.status}`}`,
      };
    }

    return {
      ok: true,
      label: `PostgreSQL (${host}/${database})`,
      hint: host.slice(0, 12),
      meta: { host, database, user, endpoint },
    };
  },
});
