import { defineTool } from "eve/tools";
import { z } from "zod";

import { prepareConnectionRequest } from "../lib/connection-steps";
import { requireIdentity } from "../lib/session";
import { isToolFailure } from "../lib/tool-result";

export default defineTool({
  description:
    "Check for an existing connection or inform the user that a connection is required. " +
    "Returns the connectionId to configure the node with if available.",
  inputSchema: z.object({
    provider: z
      .string()
      .describe('The connector slug the workflow needs, e.g. "slack", "notion", "openai".'),
    reason: z
      .string()
      .describe("One sentence: which node needs it and what it will do. Shown to the user."),
  }),
  async execute({ provider, reason }, ctx) {
    const identity = requireIdentity(ctx);
    const context = await prepareConnectionRequest(identity, provider);
    if (isToolFailure(context)) return context;

    const usable = context.existing.filter((connection) => connection.status === "active");
    if (usable.length > 0) {
      return {
        connected: true,
        connectionId: usable[0].id,
        label: usable[0].label,
      };
    }

    return {
      connected: false,
      reason: `A ${context.providerName} connection is required (${reason}). Please connect ${context.providerName} via the Connections page or left sidebar palette, then continue building.`,
    };
  },
});
