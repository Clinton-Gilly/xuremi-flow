import { z } from "zod";
import { ConnectorError, defineNode } from "../define";

export const twilioSendSmsNode = defineNode({
  type: "twilio.sendSms",
  name: "Twilio: Send SMS",
  description: "Send an SMS or WhatsApp message through Twilio.",
  category: "chat",
  icon: "PhoneCall",
  credential: "twilio",
  requiresFeature: null,
  version: "v1",
  inputs: z.object({
    connectionId: z.string().describe("Your Twilio connection"),
    to: z.string().min(1).describe("Recipient phone number (e.g. +1234567890 or whatsapp:+1234567890)").meta({ label: "To" }),
    from: z.string().min(1).describe("Twilio sender phone number or Messaging Service SID").meta({ label: "From" }),
    body: z.string().min(1).describe("SMS or WhatsApp message text").meta({ label: "Message text" }),
  }),
  outputs: z.object({
    sid: z.string(),
    status: z.string(),
  }),
  async run({ inputs, credential }) {
    const accountSid = typeof credential?.accountSid === "string" ? credential.accountSid : "";
    const authToken = typeof credential?.authToken === "string" ? credential.authToken : "";
    if (!accountSid || !authToken) {
      throw new ConnectorError("Twilio credentials missing. Re-test your connection.", 400);
    }

    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const params = new URLSearchParams({
      To: inputs.to,
      From: inputs.from,
      Body: inputs.body,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      },
    );

    const text = await response.text();
    let body: Record<string, unknown> = {};
    try {
      body = JSON.parse(text);
    } catch {
      // ignore
    }

    if (!response.ok) {
      const errorMsg = typeof body.message === "string" ? body.message : text;
      throw new ConnectorError(`Twilio send failed: ${errorMsg}`, response.status);
    }

    const sid = typeof body.sid === "string" ? body.sid : "";
    const status = typeof body.status === "string" ? body.status : "sent";

    return { sid, status };
  },
});
