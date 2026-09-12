import { z } from "zod";
import { defineNode } from "../define";

/**
 * Respond to Webhook node:
 * Provides a synchronous HTTP response back to the inbound webhook caller.
 * The engine records the status, headers, and body on the step row, allowing
 * the webhook trigger route to respond to the waiting client.
 */
export const respondToWebhookNode = defineNode({
  type: "webhook.respond",
  name: "Respond to Webhook",
  description: "Send a custom HTTP response back to the webhook caller that triggered this run.",
  category: "action",
  icon: "Send",
  credential: null,
  requiresFeature: null,
  version: "v1",
  inputs: z.object({
    status: z.coerce
      .number()
      .default(200)
      .describe("HTTP status code to return, e.g. 200, 201, 400, 404.")
      .meta({ label: "HTTP Status Code" }),
    contentType: z
      .enum(["application/json", "text/plain", "text/html"])
      .default("application/json")
      .describe("Content-Type header for the HTTP response.")
      .meta({
        label: "Response Format",
        options: {
          "application/json": "JSON (application/json)",
          "text/plain": "Plain Text (text/plain)",
          "text/html": "HTML (text/html)",
        },
      }),
    body: z
      .any()
      .default({ success: true })
      .describe("Response body: a JSON object, text, or template reference like {{ ai_1.reply }}.")
      .meta({ label: "Response Body" }),
    headers: z
      .array(z.object({ key: z.string().min(1), value: z.string() }))
      .default([])
      .describe("Optional HTTP headers to send back to the caller.")
      .meta({ label: "Custom Headers" }),
  }),
  outputs: z.object({
    status: z.number(),
    contentType: z.string(),
    headers: z.record(z.string(), z.string()),
    body: z.any(),
    responded: z.boolean(),
  }),
  async run({ inputs }) {
    const headersMap: Record<string, string> = {
      "content-type": inputs.contentType,
    };

    if (Array.isArray(inputs.headers)) {
      for (const h of inputs.headers) {
        if (h.key) {
          headersMap[h.key.toLowerCase()] = h.value;
        }
      }
    }

    return {
      status: inputs.status,
      contentType: inputs.contentType,
      headers: headersMap,
      body: inputs.body,
      responded: true,
    };
  },
});
