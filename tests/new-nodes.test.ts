import { afterEach, describe, expect, it, vi } from "vitest";
import { sendgridSendEmailNode } from "@/nodes/actions/sendgrid-send-email";
import { supabaseInsertNode } from "@/nodes/actions/supabase-insert";
import { twilioSendSmsNode } from "@/nodes/actions/twilio-send-sms";
import { ConnectorError, type RunContext } from "@/nodes/define";
import { codeNode } from "@/nodes/logic/code";
import { datetimeFormatNode } from "@/nodes/logic/datetime";

type FetchArgs = [input: string | URL | Request, init?: RequestInit];

function ctx<I>(inputs: I, credential?: Record<string, unknown>): RunContext<I> {
  return {
    inputs,
    credential,
    orgId: "org_test",
    executionId: "exec_test",
    nodeId: "node_test",
  };
}

function mockFetch(impl: (...args: FetchArgs) => Promise<Response>) {
  const fetchMock = vi.fn(impl);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("logic.code (JavaScript expression)", () => {
  it("evaluates a mathematical expression", async () => {
    const res = await codeNode.run(
      ctx({ code: "input.a + input.b", input: { a: 10, b: 32 } }),
    );
    expect(res).toEqual({ result: 42 });
  });

  it("evaluates an array transformation", async () => {
    const res = await codeNode.run(
      ctx({
        code: "input.users.map(u => u.name)",
        input: { users: [{ name: "Alice" }, { name: "Bob" }] },
      }),
    );
    expect(res).toEqual({ result: ["Alice", "Bob"] });
  });

  it("handles explicit return statements", async () => {
    const res = await codeNode.run(
      ctx({
        code: "const doubled = input.val * 2; return { doubled, original: input.val };",
        input: { val: 21 },
      }),
    );
    expect(res).toEqual({ result: { doubled: 42, original: 21 } });
  });

  it("throws a ConnectorError on syntax error or runtime failure", async () => {
    await expect(
      codeNode.run(ctx({ code: "throw new Error('boom')", input: {} })),
    ).rejects.toThrow(/Code execution error: boom/);
  });
});

describe("datetime.format", () => {
  it("formats a specified date into ISO and timestamp", async () => {
    const res = await datetimeFormatNode.run(
      ctx({
        date: "2026-09-12T12:00:00.000Z",
        format: "iso",
        offsetMinutes: 0,
      }),
    );
    expect(res.iso).toBe("2026-09-12T12:00:00.000Z");
    expect(res.formatted).toBe("2026-09-12T12:00:00.000Z");
    expect(res.timestamp).toBe(new Date("2026-09-12T12:00:00.000Z").getTime());
  });

  it("applies positive minute offset", async () => {
    const res = await datetimeFormatNode.run(
      ctx({
        date: "2026-09-12T12:00:00.000Z",
        format: "iso",
        offsetMinutes: 60,
      }),
    );
    expect(res.iso).toBe("2026-09-12T13:00:00.000Z");
  });

  it("formats date_only and time_only correctly", async () => {
    const resDate = await datetimeFormatNode.run(
      ctx({
        date: "2026-09-12T12:30:45.000Z",
        format: "date_only",
        offsetMinutes: 0,
      }),
    );
    expect(resDate.formatted).toBe("2026-09-12");

    const resTime = await datetimeFormatNode.run(
      ctx({
        date: "2026-09-12T12:30:45.000Z",
        format: "time_only",
        offsetMinutes: 0,
      }),
    );
    expect(resTime.formatted).toBe("12:30:45");
  });

  it("throws a ConnectorError on an invalid date string", async () => {
    await expect(
      datetimeFormatNode.run(ctx({ date: "not-a-date", format: "iso", offsetMinutes: 0 })),
    ).rejects.toThrow(/Invalid date string/);
  });
});

describe("twilio.sendSms", () => {
  it("sends SMS with Basic auth and returns sid", async () => {
    mockFetch(async (url, init) => {
      expect(String(url)).toBe(
        "https://api.twilio.com/2010-04-01/Accounts/AC12345/Messages.json",
      );
      expect(init?.method).toBe("POST");
      const authHeader = (init?.headers as Record<string, string>)["Authorization"];
      expect(authHeader).toBe(`Basic ${Buffer.from("AC12345:token123").toString("base64")}`);

      return new Response(JSON.stringify({ sid: "SM123456", status: "queued" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const res = await twilioSendSmsNode.run(
      ctx(
        {
          connectionId: "conn_1",
          to: "+1234567890",
          from: "+1987654321",
          body: "Hello from test",
        },
        { accountSid: "AC12345", authToken: "token123" },
      ),
    );

    expect(res).toEqual({ sid: "SM123456", status: "queued" });
  });

  it("throws if Twilio credentials are missing", async () => {
    await expect(
      twilioSendSmsNode.run(
        ctx({
          connectionId: "conn_1",
          to: "+1234567890",
          from: "+1987654321",
          body: "Hello",
        }),
      ),
    ).rejects.toThrow(/Twilio credentials missing/);
  });
});

describe("sendgrid.sendEmail", () => {
  it("sends an email with Authorization Bearer and json payload", async () => {
    mockFetch(async (url, init) => {
      expect(String(url)).toBe("https://api.sendgrid.com/v3/mail/send");
      expect(init?.method).toBe("POST");
      const headers = init?.headers as Record<string, string>;
      expect(headers["Authorization"]).toBe("Bearer SG.fake-key");

      const body = JSON.parse(String(init?.body));
      expect(body.personalizations[0].to[0].email).toBe("recipient@example.com");
      expect(body.subject).toBe("Test Subject");

      return new Response("", { status: 202 });
    });

    const res = await sendgridSendEmailNode.run(
      ctx(
        {
          connectionId: "conn_sg",
          to: "recipient@example.com",
          from: "sender@example.com",
          subject: "Test Subject",
          text: "Hello plain text",
        },
        { apiKey: "SG.fake-key" },
      ),
    );

    expect(res).toEqual({ status: "sent" });
  });

  it("throws if neither text nor html is provided", async () => {
    await expect(
      sendgridSendEmailNode.run(
        ctx(
          {
            connectionId: "conn_sg",
            to: "recipient@example.com",
            from: "sender@example.com",
            subject: "Test Subject",
          },
          { apiKey: "SG.fake-key" },
        ),
      ),
    ).rejects.toThrow(/Either plain text or HTML body is required/);
  });
});

describe("supabase.insertRow", () => {
  it("sends POST to PostgREST endpoint with apikey and Bearer token", async () => {
    mockFetch(async (url, init) => {
      expect(String(url)).toBe("https://myproject.supabase.co/rest/v1/customers");
      expect(init?.method).toBe("POST");
      const headers = init?.headers as Record<string, string>;
      expect(headers["apikey"]).toBe("sb-anon-key");
      expect(headers["Authorization"]).toBe("Bearer sb-anon-key");
      expect(headers["Prefer"]).toBe("return=representation");

      const body = JSON.parse(String(init?.body));
      expect(body).toEqual({ name: "Jane Doe", email: "jane@example.com" });

      return new Response(JSON.stringify([{ id: 1, name: "Jane Doe" }]), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    });

    const res = await supabaseInsertNode.run(
      ctx(
        {
          connectionId: "conn_sb",
          table: "customers",
          row: { name: "Jane Doe", email: "jane@example.com" },
        },
        {
          projectUrl: "https://myproject.supabase.co",
          apiKey: "sb-anon-key",
        },
      ),
    );

    expect(res).toEqual({ inserted: [{ id: 1, name: "Jane Doe" }] });
  });

  it("throws if Supabase credentials are missing", async () => {
    await expect(
      supabaseInsertNode.run(
        ctx({
          connectionId: "conn_sb",
          table: "customers",
          row: { name: "Jane" },
        }),
      ),
    ).rejects.toThrow(/Supabase connection credentials missing/);
  });
});
