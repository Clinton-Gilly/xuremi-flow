import { defineConnector } from "./define";

const TIMEOUT_MS = 15_000;

export const supabaseConnector = defineConnector({
  provider: "supabase",
  name: "Supabase",
  category: "data",
  kind: "apiKey",
  requiresFeature: null,
  fields: [
    {
      name: "projectUrl",
      label: "Project URL",
      kind: "url",
      placeholder: "https://xyzcompany.supabase.co",
      help: "Project Settings → API → Project URL",
      required: true,
    },
    {
      name: "apiKey",
      label: "API Key",
      kind: "secret",
      placeholder: "eyJhbGci…",
      help: "Project Settings → API → anon or service_role key",
      required: true,
    },
  ],
  docsUrl: "https://supabase.com/dashboard/project/_/settings/api",
  icon: "Database",

  async test(secret) {
    const projectUrl = secret.projectUrl?.trim().replace(/\/+$/, "");
    const apiKey = secret.apiKey?.trim();
    if (!projectUrl || !apiKey) {
      return { ok: false, error: "Paste both Project URL and API Key." };
    }
    if (!projectUrl.startsWith("https://")) {
      return { ok: false, error: "Supabase Project URL must start with https://." };
    }

    let response: Response;
    try {
      response = await fetch(`${projectUrl}/rest/v1/`, {
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      return { ok: false, error: "Could not reach Supabase. Check your Project URL and try again." };
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { ok: false, error: "Supabase rejected that API key." };
      }
      const detail = (await response.text().catch(() => "")).slice(0, 200);
      return { ok: false, error: `Supabase refused the request: ${detail || `HTTP ${response.status}`}` };
    }

    let host = "supabase";
    try {
      host = new URL(projectUrl).hostname.split(".")[0];
    } catch {
      // ignore
    }

    return {
      ok: true,
      label: `Supabase (${host})`,
      hint: apiKey.slice(-4),
      meta: { projectUrl },
    };
  },
});
