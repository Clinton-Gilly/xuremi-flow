import { defineConnector } from "./define";

const TIMEOUT_MS = 15_000;

export const twilioConnector = defineConnector({
  provider: "twilio",
  name: "Twilio",
  category: "chat",
  kind: "apiKey",
  requiresFeature: null,
  fields: [
    {
      name: "accountSid",
      label: "Account SID",
      kind: "text",
      placeholder: "AC…",
      help: "Found in your Twilio Console dashboard.",
      required: true,
    },
    {
      name: "authToken",
      label: "Auth Token",
      kind: "secret",
      placeholder: "…",
      help: "Your Twilio Account Auth Token.",
      required: true,
    },
  ],
  docsUrl: "https://console.twilio.com",
  icon: "PhoneCall",

  async test(secret) {
    const accountSid = secret.accountSid?.trim();
    const authToken = secret.authToken?.trim();
    if (!accountSid || !authToken) {
      return { ok: false, error: "Paste both Account SID and Auth Token." };
    }
    if (!accountSid.startsWith("AC")) {
      return { ok: false, error: "Twilio Account SID usually begins with 'AC'." };
    }

    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    let response: Response;
    try {
      response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
        headers: { Authorization: `Basic ${auth}` },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      return { ok: false, error: "Could not reach Twilio. Check your credentials and try again." };
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { ok: false, error: "Twilio rejected those credentials." };
      }
      const detail = (await response.text().catch(() => "")).slice(0, 200);
      return { ok: false, error: `Twilio refused the request: ${detail || `HTTP ${response.status}`}` };
    }

    return {
      ok: true,
      label: `Twilio (${accountSid.slice(-4)})`,
      hint: accountSid.slice(-4),
      meta: { accountSid },
    };
  },
});
