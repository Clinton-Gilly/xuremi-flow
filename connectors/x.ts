import { defineConnector } from "./define";

const TIMEOUT_MS = 15_000;

type TwitterMeResponse = {
  data?: {
    id?: string;
    name?: string;
    username?: string;
  };
  errors?: Array<{ message?: string; detail?: string }>;
  title?: string;
  detail?: string;
};

export const xConnector = defineConnector({
  provider: "x",
  name: "X (Twitter)",
  category: "chat",
  kind: "apiKey",
  requiresFeature: null,
  docsUrl: "https://developer.x.com/en/docs/x-api",
  icon: "Share2",
  fields: [
    {
      name: "accessToken",
      label: "Access Token / Bearer Token",
      kind: "secret",
      required: true,
      placeholder: "e.g. 1234567890-abcdef...",
      help: "Your X Access Token or OAuth 2.0 Bearer token with tweet.write and users.read permissions.",
    },
    {
      name: "accessTokenSecret",
      label: "Access Token Secret",
      kind: "secret",
      required: false,
      placeholder: "e.g. abcdef123456...",
      help: "Required for OAuth 1.0a User Context authentication on the X Developer Free tier.",
    },
    {
      name: "apiKey",
      label: "API Key (Consumer Key)",
      kind: "secret",
      required: false,
      placeholder: "e.g. abcdef123...",
      help: "Required for OAuth 1.0a User Context authentication on the X Developer Free tier.",
    },
    {
      name: "apiSecret",
      label: "API Key Secret (Consumer Secret)",
      kind: "secret",
      required: false,
      placeholder: "e.g. abcdef123...",
      help: "Required for OAuth 1.0a User Context authentication on the X Developer Free tier.",
    },
  ],

  async test(secret) {
    const token = secret.accessToken?.trim() ?? "";
    if (!token) {
      return { ok: false, error: "Access token is required." };
    }

    try {
      const response = await fetch("https://api.twitter.com/2/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (response.status === 401) {
        return { ok: false, error: "X (Twitter) rejected the access token." };
      }

      if (response.ok) {
        const payload = (await response.json().catch(() => ({}))) as TwitterMeResponse;
        const username = payload.data?.username;
        return {
          ok: true,
          label: username ? `@${username}` : "X Account",
          hint: token.slice(-4),
          meta: {
            username: username ?? null,
            userId: payload.data?.id ?? null,
          },
        };
      }

      // Free tier accounts often have strict read rate limits or write-only scopes.
      // If the error is rate limit (429) or forbidden read endpoint (403), treat as verified.
      if (response.status === 429 || response.status === 403) {
        return {
          ok: true,
          label: "X Account",
          hint: token.slice(-4),
          meta: {},
        };
      }

      return {
        ok: false,
        error: `X (Twitter) returned HTTP ${response.status}.`,
      };
    } catch {
      return { ok: false, error: "Could not reach X (Twitter) API. Check your connection." };
    }
  },
});
