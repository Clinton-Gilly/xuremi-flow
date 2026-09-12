import { defineConnector } from "./define";

const TIMEOUT_MS = 15_000;

export const sendgridConnector = defineConnector({
  provider: "sendgrid",
  name: "SendGrid",
  category: "email",
  kind: "apiKey",
  requiresFeature: null,
  fields: [
    {
      name: "apiKey",
      label: "API key",
      kind: "secret",
      placeholder: "SG.…",
      help: "Mail Send permissions are required.",
      required: true,
    },
  ],
  docsUrl: "https://app.sendgrid.com/settings/api_keys",
  icon: "Mail",

  async test(secret) {
    const apiKey = secret.apiKey?.trim();
    if (!apiKey) return { ok: false, error: "Paste a SendGrid API key (SG.…)." };

    let response: Response;
    try {
      response = await fetch("https://api.sendgrid.com/v3/scopes", {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      return { ok: false, error: "Could not reach SendGrid. Check your connection and try again." };
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { ok: false, error: "SendGrid rejected that API key." };
      }
      const detail = (await response.text().catch(() => "")).slice(0, 200);
      return { ok: false, error: `SendGrid refused the request: ${detail || `HTTP ${response.status}`}` };
    }

    return {
      ok: true,
      label: "SendGrid",
      hint: apiKey.slice(-4),
      meta: {},
    };
  },
});
