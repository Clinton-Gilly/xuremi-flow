import { defineConnector } from "./define";

const TIMEOUT_MS = 15_000;

export const googleSheetsConnector = defineConnector({
  provider: "google-sheets",
  name: "Google Sheets",
  category: "data",
  kind: "apiKey",
  requiresFeature: null,
  fields: [
    {
      name: "accessToken",
      label: "OAuth Access Token",
      kind: "secret",
      placeholder: "ya29…",
      help: "A Google OAuth2 access token with the https://www.googleapis.com/auth/spreadsheets scope.",
      required: true,
    },
  ],
  docsUrl: "https://developers.google.com/sheets/api/guides/authorizing",
  icon: "Table",

  async test(secret) {
    const token = secret.accessToken?.trim();
    if (!token) {
      return { ok: false, error: "Paste a Google OAuth access token." };
    }

    let response: Response;
    try {
      response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`,
        { signal: AbortSignal.timeout(TIMEOUT_MS) },
      );
    } catch {
      return { ok: false, error: "Could not reach Google to verify the token." };
    }

    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (!response.ok || data.error) {
      const description = typeof data.error_description === "string" ? data.error_description : "";
      return {
        ok: false,
        error: description
          ? `Google rejected the token: ${description}`
          : "Google rejected that access token. Ensure it is valid and not expired.",
      };
    }

    const email = typeof data.email === "string" ? data.email : "";
    const scope = typeof data.scope === "string" ? data.scope : "";

    return {
      ok: true,
      label: `Google Sheets${email ? ` (${email})` : ""}`,
      hint: token.slice(-4),
      meta: {
        ...(email ? { email } : {}),
        ...(scope ? { scope } : {}),
      },
    };
  },
});
