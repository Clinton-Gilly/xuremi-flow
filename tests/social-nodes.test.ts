import { afterEach, describe, expect, it, vi } from "vitest";

import { linkedinPostNode } from "@/nodes/actions/linkedin-post";
import { xPostNode } from "@/nodes/actions/x-post";
import type { RunContext } from "@/nodes/define";

type FetchArgs = [input: string | URL | Request, init?: RequestInit];

function ctx<I>(inputs: I, credential?: Record<string, unknown>): RunContext<I> {
  return { inputs, credential, orgId: "org_test", executionId: "exec_test", nodeId: "node_test" };
}

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

function headersOf(init: RequestInit | undefined): Record<string, string> {
  return (init?.headers ?? {}) as Record<string, string>;
}

function bodyOf(init: RequestInit | undefined): Record<string, unknown> {
  return JSON.parse(typeof init?.body === "string" ? init.body : "{}") as Record<string, unknown>;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("x.postTweet", () => {
  it("is a free action requiring no Pro feature", () => {
    expect(xPostNode).toMatchObject({
      type: "x.postTweet",
      category: "action",
      credential: "x",
      requiresFeature: null,
      version: "v1",
    });
  });

  it("posts a tweet with Bearer token when only accessToken is provided", async () => {
    const fetchMock = reply({ data: { id: "tweet_12345", text: "Hello world on X!" } });

    const result = await xPostNode.run(
      ctx(
        { connectionId: "conn_x", text: "Hello world on X!" },
        { accessToken: "bearer_token_xyz" },
      ),
    );

    expect(result).toEqual({ tweetId: "tweet_12345", text: "Hello world on X!" });

    const [url, init] = fetchMock.mock.calls[0] as FetchArgs;
    expect(url).toBe("https://api.twitter.com/2/tweets");
    expect(init?.method).toBe("POST");
    expect(headersOf(init).Authorization).toBe("Bearer bearer_token_xyz");
    expect(bodyOf(init)).toEqual({ text: "Hello world on X!" });
  });

  it("signs the request with OAuth 1.0a when API keys and secrets are present", async () => {
    const fetchMock = reply({ data: { id: "tweet_oauth1", text: "OAuth 1.0a tweet" } });

    const result = await xPostNode.run(
      ctx(
        { connectionId: "conn_x", text: "OAuth 1.0a tweet" },
        {
          apiKey: "my_consumer_key",
          apiSecret: "my_consumer_secret",
          accessToken: "my_access_token",
          accessTokenSecret: "my_access_token_secret",
        },
      ),
    );

    expect(result).toEqual({ tweetId: "tweet_oauth1", text: "OAuth 1.0a tweet" });

    const [url, init] = fetchMock.mock.calls[0] as FetchArgs;
    expect(url).toBe("https://api.twitter.com/2/tweets");
    expect(init?.method).toBe("POST");
    const auth = headersOf(init).Authorization;
    expect(auth).toMatch(/^OAuth /);
    expect(auth).toContain('oauth_consumer_key="my_consumer_key"');
    expect(auth).toContain('oauth_token="my_access_token"');
    expect(auth).toContain('oauth_signature_method="HMAC-SHA1"');
    expect(bodyOf(init)).toEqual({ text: "OAuth 1.0a tweet" });
  });

  it("throws a retryable ConnectorError on rate limit 429", async () => {
    reply({ detail: "Rate limit exceeded" }, { status: 429, headers: { "retry-after": "60" } });

    await expect(
      xPostNode.run(
        ctx({ connectionId: "conn_x", text: "Rate limit test" }, { accessToken: "tok_123" }),
      ),
    ).rejects.toMatchObject({
      name: "ConnectorError",
      status: 429,
      retryAfter: "60",
    });
  });

  it("throws ConnectorError when access token is missing", async () => {
    await expect(
      xPostNode.run(ctx({ connectionId: "conn_x", text: "Missing token" }, {})),
    ).rejects.toThrow(/no access token/);
  });
});

describe("linkedin.post", () => {
  it("is a free action requiring no Pro feature", () => {
    expect(linkedinPostNode).toMatchObject({
      type: "linkedin.post",
      category: "action",
      credential: "linkedin",
      requiresFeature: null,
      version: "v1",
    });
  });

  it("posts an update with Bearer token using authorUrn from meta", async () => {
    const fetchMock = reply({ id: "urn:li:share:987654" });

    const result = await linkedinPostNode.run(
      ctx(
        { connectionId: "conn_li", text: "Hello LinkedIn network!" },
        {
          accessToken: "li_token_abc",
          meta: { authorUrn: "urn:li:person:user123" },
        },
      ),
    );

    expect(result).toEqual({ postId: "urn:li:share:987654", urn: "urn:li:share:987654" });

    const [url, init] = fetchMock.mock.calls[0] as FetchArgs;
    expect(url).toBe("https://api.linkedin.com/v2/ugcPosts");
    expect(init?.method).toBe("POST");
    expect(headersOf(init).Authorization).toBe("Bearer li_token_abc");

    const body = bodyOf(init);
    expect(body.author).toBe("urn:li:person:user123");
    expect(body.lifecycleState).toBe("PUBLISHED");
    const content = (body.specificContent as Record<string, unknown>)["com.linkedin.ugc.ShareContent"] as Record<
      string,
      unknown
    >;
    expect(content.shareCommentary).toEqual({ text: "Hello LinkedIn network!" });
    expect(content.shareMediaCategory).toBe("NONE");
  });

  it("supports attaching article links to the post", async () => {
    const fetchMock = reply({ id: "urn:li:share:article_share" });

    const result = await linkedinPostNode.run(
      ctx(
        {
          connectionId: "conn_li",
          text: "Check out our latest release!",
          linkUrl: "https://example.com/article",
          authorUrn: "urn:li:organization:org_999",
        },
        { accessToken: "li_token_abc" },
      ),
    );

    expect(result.postId).toBe("urn:li:share:article_share");

    const [, init] = fetchMock.mock.calls[0] as FetchArgs;
    const body = bodyOf(init);
    expect(body.author).toBe("urn:li:organization:org_999");
    const content = (body.specificContent as Record<string, unknown>)["com.linkedin.ugc.ShareContent"] as Record<
      string,
      unknown
    >;
    expect(content.shareMediaCategory).toBe("ARTICLE");
    expect(content.media).toEqual([{ status: "READY", originalUrl: "https://example.com/article" }]);
  });

  it("throws ConnectorError on 400 rejection", async () => {
    reply({ message: "Invalid author URN" }, { status: 400 });

    await expect(
      linkedinPostNode.run(
        ctx(
          { connectionId: "conn_li", text: "Invalid author", authorUrn: "invalid" },
          { accessToken: "li_token_abc" },
        ),
      ),
    ).rejects.toMatchObject({
      name: "ConnectorError",
      status: 400,
    });
  });
});
