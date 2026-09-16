import { z } from "zod";

import { ConnectorError, defineNode } from "../define";

const TIMEOUT_MS = 30_000;

type LinkedInUgcPostResponse = {
  id?: string;
  message?: string;
  status?: number;
};

type LinkedInUserInfo = {
  sub?: string;
};

export const linkedinPostNode = defineNode({
  type: "linkedin.post",
  name: "LinkedIn: Create post",
  description: "Publish an update or article share to LinkedIn.",
  category: "action",
  icon: "Share2",
  credential: "linkedin",
  requiresFeature: null,
  version: "v1",
  inputs: z.object({
    connectionId: z.string(),
    text: z.string().min(1).describe("The text content of your LinkedIn post."),
    authorUrn: z
      .string()
      .optional()
      .describe("Optional Author URN (e.g. urn:li:person:... or urn:li:organization:...). If empty, uses your profile URN."),
    linkUrl: z
      .string()
      .url()
      .optional()
      .describe("Optional link URL to attach as an article share."),
  }),
  outputs: z.object({
    postId: z.string(),
    urn: z.string(),
  }),
  async run({ inputs, credential }) {
    const accessToken = typeof credential?.accessToken === "string" ? credential.accessToken.trim() : "";
    if (!accessToken) {
      throw new ConnectorError("This LinkedIn connection has no access token — reconnect it.", 400);
    }

    const meta = credential?.meta as Record<string, unknown> | undefined;
    const metaAuthorUrn = typeof meta?.authorUrn === "string" ? meta.authorUrn : "";

    let authorUrn =
      (typeof inputs.authorUrn === "string" && inputs.authorUrn.trim()) ||
      metaAuthorUrn ||
      (typeof credential?.authorUrn === "string" && credential.authorUrn.trim()) ||
      "";

    if (!authorUrn) {
      // Auto-detect from userinfo endpoint
      try {
        const userinfoRes = await fetch("https://api.linkedin.com/v2/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (userinfoRes.ok) {
          const userinfo = (await userinfoRes.json().catch(() => ({}))) as LinkedInUserInfo;
          if (userinfo.sub) {
            authorUrn = `urn:li:person:${userinfo.sub}`;
          }
        }
      } catch {
        // Handled below if authorUrn remains empty
      }
    }

    if (!authorUrn) {
      throw new ConnectorError(
        "Could not determine LinkedIn author URN. Please specify authorUrn or reconnect your account.",
        400,
      );
    }

    const body: Record<string, unknown> = {
      author: authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: inputs.text,
          },
          shareMediaCategory: inputs.linkUrl ? "ARTICLE" : "NONE",
          ...(inputs.linkUrl
            ? {
                media: [
                  {
                    status: "READY",
                    originalUrl: inputs.linkUrl,
                  },
                ],
              }
            : {}),
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const payload = (await response.json().catch(() => ({}))) as LinkedInUgcPostResponse;

    if (!response.ok) {
      const errorMsg = payload.message || `HTTP ${response.status}`;

      if (response.status === 429) {
        const retryAfter = response.headers.get("retry-after") ?? undefined;
        throw new ConnectorError(`LinkedIn rate limit reached: ${errorMsg}`, 429, retryAfter);
      }

      throw new ConnectorError(
        `LinkedIn refused the post: ${errorMsg}`,
        response.status >= 500 ? response.status : 400,
      );
    }

    const postId = payload.id;
    if (typeof postId !== "string" || !postId) {
      throw new ConnectorError("LinkedIn accepted the post but returned no post ID.", 502);
    }

    return {
      postId,
      urn: postId,
    };
  },
});
