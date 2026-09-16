import { defineConnector } from "./define";

const TIMEOUT_MS = 15_000;

type LinkedInUserInfo = {
  sub?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
};

export const linkedinConnector = defineConnector({
  provider: "linkedin",
  name: "LinkedIn",
  category: "chat",
  kind: "apiKey",
  requiresFeature: null,
  docsUrl: "https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin",
  icon: "Share2",
  fields: [
    {
      name: "accessToken",
      label: "Access Token",
      kind: "secret",
      required: true,
      placeholder: "AQV...",
      help: "OAuth 2.0 Access Token with w_member_social (or w_organization_social) scope.",
    },
    {
      name: "authorUrn",
      label: "Author URN (optional)",
      kind: "text",
      required: false,
      placeholder: "urn:li:person:... or urn:li:organization:...",
      help: "Optional Author URN. If left blank, automatically discovered from your profile.",
    },
  ],

  async test(secret) {
    const token = secret.accessToken?.trim() ?? "";
    if (!token) {
      return { ok: false, error: "Access token is required." };
    }

    try {
      const response = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (response.status === 401) {
        return { ok: false, error: "LinkedIn rejected the access token." };
      }

      if (response.ok) {
        const payload = (await response.json().catch(() => ({}))) as LinkedInUserInfo;
        const authorUrn = secret.authorUrn?.trim() || (payload.sub ? `urn:li:person:${payload.sub}` : undefined);
        const name = payload.name;
        return {
          ok: true,
          label: name ? `LinkedIn: ${name}` : "LinkedIn",
          hint: token.slice(-4),
          meta: {
            authorUrn: authorUrn ?? null,
            name: name ?? null,
          },
        };
      }

      // If userinfo endpoint returned an unexpected response but custom authorUrn was provided
      if (secret.authorUrn?.trim()) {
        return {
          ok: true,
          label: "LinkedIn",
          hint: token.slice(-4),
          meta: {
            authorUrn: secret.authorUrn.trim(),
          },
        };
      }

      return {
        ok: false,
        error: `LinkedIn returned HTTP ${response.status}.`,
      };
    } catch {
      return { ok: false, error: "Could not reach LinkedIn API. Check your connection." };
    }
  },
});
