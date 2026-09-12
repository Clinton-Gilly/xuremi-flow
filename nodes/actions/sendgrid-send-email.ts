import { z } from "zod";
import { ConnectorError, defineNode } from "../define";

export const sendgridSendEmailNode = defineNode({
  type: "sendgrid.sendEmail",
  name: "SendGrid: Send email",
  description: "Send an email via SendGrid.",
  category: "action",
  icon: "Mail",
  credential: "sendgrid",
  requiresFeature: null,
  version: "v1",
  inputs: z.object({
    connectionId: z.string().describe("Your SendGrid connection"),
    to: z.string().email().describe("Recipient email address").meta({ label: "To" }),
    from: z.string().email().describe("Verified sender email address in SendGrid").meta({ label: "From" }),
    subject: z.string().min(1).describe("Email subject line").meta({ label: "Subject" }),
    text: z.string().optional().describe("Plain text email content").meta({ label: "Text body" }),
    html: z.string().optional().describe("HTML email content").meta({ label: "HTML body" }),
  }),
  outputs: z.object({
    status: z.string(),
  }),
  async run({ inputs, credential }) {
    const apiKey = typeof credential?.apiKey === "string" ? credential.apiKey : "";
    if (!apiKey) {
      throw new ConnectorError("SendGrid API key missing. Re-test your connection.", 400);
    }

    if (!inputs.text && !inputs.html) {
      throw new ConnectorError("Either plain text or HTML body is required.", 400);
    }

    const content: { type: string; value: string }[] = [];
    if (inputs.text) {
      content.push({ type: "text/plain", value: inputs.text });
    }
    if (inputs.html) {
      content.push({ type: "text/html", value: inputs.html });
    }

    const payload = {
      personalizations: [{ to: [{ email: inputs.to }] }],
      from: { email: inputs.from },
      subject: inputs.subject,
      content,
    };

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new ConnectorError(`SendGrid send failed: ${text || `HTTP ${response.status}`}`, response.status);
    }

    return { status: "sent" };
  },
});
