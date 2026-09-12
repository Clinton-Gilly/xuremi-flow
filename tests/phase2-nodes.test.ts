import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { googleSheetsConnector } from "@/connectors/google-sheets";
import { postgresConnector, parsePostgresUrl } from "@/connectors/postgres";
import { googleSheetsAppendRowNode } from "@/nodes/actions/google-sheets-append";
import { googleSheetsGetRowsNode } from "@/nodes/actions/google-sheets-get";
import { postgresQueryNode } from "@/nodes/actions/postgres-query";
import { CONNECTORS } from "@/connectors/registry";
import { NODES } from "@/nodes/registry";

describe("Phase 2: Google Sheets Connector & Nodes", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("registers in CONNECTORS and NODES", () => {
    expect(CONNECTORS["google-sheets"]).toBeDefined();
    expect(NODES["googlesheets.appendRow"]).toBeDefined();
    expect(NODES["googlesheets.getRows"]).toBeDefined();
  });

  it("validates empty token in test()", async () => {
    const res = await googleSheetsConnector.test({ accessToken: "" });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toContain("Paste a Google OAuth");
    }
  });

  it("validates valid token in test()", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ email: "user@example.com", scope: "spreadsheets" }),
    } as Response);

    const res = await googleSheetsConnector.test({ accessToken: "valid_token_123" });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.label).toContain("user@example.com");
      expect(res.hint).toBe("_123");
    }
  });

  it("appends row to spreadsheet", async () => {
    let calledUrl = "";
    let calledHeaders: Record<string, string> = {};
    let calledBody: any = null;

    globalThis.fetch = vi.fn().mockImplementation(async (url, init) => {
      calledUrl = String(url);
      calledHeaders = init?.headers as Record<string, string>;
      calledBody = JSON.parse(init?.body as string);

      return {
        ok: true,
        json: async () => ({
          updates: {
            spreadsheetId: "sheet_123",
            updatedRange: "Sheet1!A5:C5",
            updatedRows: 1,
            updatedColumns: 3,
            updatedCells: 3,
          },
        }),
      } as Response;
    });

    const result = await googleSheetsAppendRowNode.run({
      inputs: {
        connectionId: "conn_gsheets",
        spreadsheetId: "sheet_123",
        range: "Sheet1!A:C",
        values: ["Alice", "alice@example.com", 250],
        valueInputOption: "USER_ENTERED",
      },
      credential: { accessToken: "test_token_xyz" },
      orgId: "org_1",
      executionId: "exec_1",
      nodeId: "append_1",
    });

    expect(decodeURIComponent(calledUrl)).toContain(
      "https://sheets.googleapis.com/v4/spreadsheets/sheet_123/values/Sheet1!A:C:append",
    );
    expect(calledHeaders["Authorization"]).toBe("Bearer test_token_xyz");
    expect(calledBody).toEqual({ values: [["Alice", "alice@example.com", 250]] });
    expect(result.updatedRange).toBe("Sheet1!A5:C5");
    expect(result.updatedRows).toBe(1);
    expect(result.updatedCells).toBe(3);
  });

  it("reads rows from spreadsheet", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        range: "Sheet1!A1:B2",
        values: [
          ["Name", "Score"],
          ["Alice", "95"],
        ],
      }),
    } as Response);

    const result = await googleSheetsGetRowsNode.run({
      inputs: {
        connectionId: "conn_gsheets",
        spreadsheetId: "sheet_123",
        range: "Sheet1!A1:B2",
      },
      credential: { accessToken: "test_token_xyz" },
      orgId: "org_1",
      executionId: "exec_1",
      nodeId: "get_1",
    });

    expect(result.range).toBe("Sheet1!A1:B2");
    expect(result.values).toHaveLength(2);
    expect(result.rowCount).toBe(2);
    expect(result.values[1][0]).toBe("Alice");
  });
});

describe("Phase 2: PostgreSQL Connector & Node", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("registers in CONNECTORS and NODES", () => {
    expect(CONNECTORS["postgres"]).toBeDefined();
    expect(NODES["postgres.query"]).toBeDefined();
  });

  it("parses postgres connection URL cleanly", () => {
    const parsed = parsePostgresUrl(
      "postgres://admin:secret@ep-demo.us-east-2.aws.neon.tech/production?sslmode=require",
    );
    expect(parsed.host).toBe("ep-demo.us-east-2.aws.neon.tech");
    expect(parsed.database).toBe("production");
    expect(parsed.user).toBe("admin");
    expect(parsed.httpEndpoint).toBe("https://ep-demo.us-east-2.aws.neon.tech/sql");
  });

  it("tests postgres connection successfully", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rows: [{ test_connection: 1 }] }),
    } as Response);

    const res = await postgresConnector.test({
      connectionString: "postgres://user:pass@ep-test.neon.tech/mydb",
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.label).toContain("ep-test.neon.tech/mydb");
    }
  });

  it("executes parameterized SQL query", async () => {
    let calledBody: any = null;

    globalThis.fetch = vi.fn().mockImplementation(async (_url, init) => {
      calledBody = JSON.parse(init?.body as string);
      return {
        ok: true,
        json: async () => ({
          rows: [
            { id: 1, name: "Alice", active: true },
            { id: 2, name: "Bob", active: true },
          ],
          command: "SELECT",
        }),
      } as Response;
    });

    const result = await postgresQueryNode.run({
      inputs: {
        connectionId: "conn_pg",
        sql: "SELECT * FROM users WHERE active = $1;",
        params: [true],
      },
      credential: {
        connectionString: "postgres://user:pass@ep-demo.neon.tech/neondb",
      },
      orgId: "org_1",
      executionId: "exec_1",
      nodeId: "query_1",
    });

    expect(calledBody).toEqual({
      query: "SELECT * FROM users WHERE active = $1;",
      params: [true],
    });
    expect(result.rowCount).toBe(2);
    expect(result.rows[0].name).toBe("Alice");
    expect(result.command).toBe("SELECT");
  });
});
