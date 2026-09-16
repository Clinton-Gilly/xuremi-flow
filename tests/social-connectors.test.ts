import { afterEach, describe, expect, it, vi } from "vitest";

import { linkedinConnector } from "@/connectors/linkedin";
import { xConnector } from "@/connectors/x";

type FetchArgs = [input: string | URL | Request, init?: RequestInit];

function mockFetch(impl: (...args: FetchArgs) => Promise<Response>) {
  const fetchMock = vi.fn(impl);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function reply(body: unknown, init: ResponseInit = {}) {
  return mockFetch(async () =>
    new Response(JSON.stringify(body), {
      status: init.status ?? 200,
      headers: { "content-type": "application/json", ...(init.headers as Record<string, string>) },
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("xConnector", () => {
  it("declares expected provider properties for free plan", () => {
    expect(xConnector).toMatchObject({
      provider: "x",
      name: "X (Twitter)",
      category: "chat",
      kind: "apiKey",
      requiresFeature: null,
    });
    expect(xConnector.fields.map((f) => f.name)).toEqual([
      "accessToken",
      "accessTokenSecret",
      "apiKey",
      "apiSecret",
    ]);
  });

  it("validates credentials against users/me and captures username", async () => {
    reply({ data: { id: "user_123", username: "xuremidev", name: "Xuremi Dev" } });

    const result = await xConnector.test({ accessToken: "valid_token_xyz" });
    expect(result).toEqual({
      ok: true,
      label: "@xuremidev",
      hint: "_xyz",
      meta: {
        username: "xuremidev",
        userId: "user_123",
      },
    });
  });

  it("gracefully succeeds on free tier read rate limits (429/403)", async () => {
    reply({ title: "Too Many Requests", status: 429 }, { status: 429 });

    const result = await xConnector.test({ accessToken: "free_token_1234" });
    expect(result).toEqual({
      ok: true,
      label: "X Account",
      hint: "1234",
      meta: {},
    });
  });

  it("fails when access token is rejected with 401", async () => {
    reply({ title: "Unauthorized", status: 401 }, { status: 401 });

    const result = await xConnector.test({ accessToken: "bad_token" });
    expect(result).toEqual({
      ok: false,
      error: "X (Twitter) rejected the access token.",
    });
  });

  it("fails when access token is blank", async () => {
    const result = await xConnector.test({ accessToken: "" });
    expect(result.ok).toBe(false);
  });
});

describe("linkedinConnector", () => {
  it("declares expected provider properties for free plan", () => {
    expect(linkedinConnector).toMatchObject({
      provider: "linkedin",
      name: "LinkedIn",
      category: "chat",
      kind: "apiKey",
      requiresFeature: null,
    });
    expect(linkedinConnector.fields.map((f) => f.name)).toEqual(["accessToken", "authorUrn"]);
  });

  it("validates token against /v2/userinfo and resolves person authorUrn", async () => {
    reply({ sub: "person_abc", name: "Jane Doe" });

    const result = await linkedinConnector.test({ accessToken: "li_tok_9999" });
    expect(result).toEqual({
      ok: true,
      label: "LinkedIn: Jane Doe",
      hint: "9999",
      meta: {
        authorUrn: "urn:li:person:person_abc",
        name: "Jane Doe",
      },
    });
  });

  it("honors custom authorUrn if provided", async () => {
    reply({ sub: "person_abc", name: "Jane Doe" });

    const result = await linkedinConnector.test({
      accessToken: "li_tok_9999",
      authorUrn: "urn:li:organization:corp123",
    });
    expect(result).toEqual({
      ok: true,
      label: "LinkedIn: Jane Doe",
      hint: "9999",
      meta: {
        authorUrn: "urn:li:organization:corp123",
        name: "Jane Doe",
      },
    });
  });

  it("fails when access token is rejected with 401", async () => {
    reply({ message: "Invalid access token" }, { status: 401 });

    const result = await linkedinConnector.test({ accessToken: "expired_token" });
    expect(result).toEqual({
      ok: false,
      error: "LinkedIn rejected the access token.",
    });
  });
});
