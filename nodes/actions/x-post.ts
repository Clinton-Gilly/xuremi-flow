import { z } from "zod";

import { ConnectorError, defineNode } from "../define";

const TIMEOUT_MS = 30_000;

type TweetSuccessResponse = {
  data?: {
    id: string;
    text: string;
  };
};

type TweetErrorResponse = {
  title?: string;
  detail?: string;
  status?: number;
  errors?: Array<{ message?: string; detail?: string }>;
};

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

async function generateOAuth1Header({
  url,
  method,
  apiKey,
  apiSecret,
  accessToken,
  accessTokenSecret,
}: {
  url: string;
  method: string;
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceBytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(nonceBytes);
  const nonce = Array.from(nonceBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  const sortedKeys = Object.keys(oauthParams).sort();
  const paramString = sortedKeys.map((k) => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`).join("&");

  const baseString = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(paramString)}`;
  const signingKeyString = `${percentEncode(apiSecret)}&${percentEncode(accessTokenSecret)}`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(signingKeyString);
  const messageData = encoder.encode(baseString);

  const cryptoKey = await globalThis.crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );

  const signatureBuffer = await globalThis.crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const signatureBytes = new Uint8Array(signatureBuffer);
  const signature = btoa(String.fromCharCode(...signatureBytes));

  const authHeaderEntries = [
    ...sortedKeys.map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`),
    `oauth_signature="${percentEncode(signature)}"`,
  ];

  return `OAuth ${authHeaderEntries.join(", ")}`;
}

export const xPostNode = defineNode({
  type: "x.postTweet",
  name: "X: Post tweet",
  description: "Publish a post (tweet) to X (Twitter) using free or standard tier API.",
  category: "action",
  icon: "Share2",
  credential: "x",
  requiresFeature: null,
  version: "v1",
  inputs: z.object({
    connectionId: z.string(),
    text: z.string().min(1).max(280).describe("Post content (up to 280 characters for standard accounts)."),
  }),
  outputs: z.object({
    tweetId: z.string(),
    text: z.string(),
  }),
  async run({ inputs, credential }) {
    const accessToken = typeof credential?.accessToken === "string" ? credential.accessToken.trim() : "";
    if (!accessToken) {
      throw new ConnectorError("This X connection has no access token — reconnect it.", 400);
    }

    const apiKey = typeof credential?.apiKey === "string" ? credential.apiKey.trim() : "";
    const apiSecret = typeof credential?.apiSecret === "string" ? credential.apiSecret.trim() : "";
    const accessTokenSecret =
      typeof credential?.accessTokenSecret === "string" ? credential.accessTokenSecret.trim() : "";

    const url = "https://api.twitter.com/2/tweets";

    let authHeader: string;
    if (apiKey && apiSecret && accessTokenSecret) {
      authHeader = await generateOAuth1Header({
        url,
        method: "POST",
        apiKey,
        apiSecret,
        accessToken,
        accessTokenSecret,
      });
    } else {
      authHeader = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: inputs.text }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const payload = (await response.json().catch(() => ({}))) as TweetSuccessResponse & TweetErrorResponse;

    if (!response.ok) {
      const errorMsg =
        payload.detail ||
        payload.errors?.[0]?.message ||
        payload.title ||
        `HTTP ${response.status}`;

      if (response.status === 429) {
        const resetHeader = response.headers.get("x-rate-limit-reset");
        const retryAfter = resetHeader
          ? String(Math.max(1, Math.ceil(Number(resetHeader) - Date.now() / 1000)))
          : response.headers.get("retry-after") ?? undefined;

        throw new ConnectorError(`X rate limit reached: ${errorMsg}`, 429, retryAfter);
      }

      throw new ConnectorError(
        `X refused the post: ${errorMsg}`,
        response.status >= 500 ? response.status : 400,
      );
    }

    const tweetId = payload.data?.id;
    if (!tweetId) {
      throw new ConnectorError("X accepted the post but returned no tweet id.", 502);
    }

    return {
      tweetId,
      text: payload.data?.text ?? inputs.text,
    };
  },
});
