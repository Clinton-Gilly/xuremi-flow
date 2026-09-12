import { airtableCreateRecordNode } from "./actions/airtable-create-record";
import { discordPostNode } from "./actions/discord-post";
import { emailSend } from "./actions/email-send";
import { githubCreateIssueNode } from "./actions/github-create-issue";
import { googleSheetsAppendRowNode } from "./actions/google-sheets-append";
import { googleSheetsGetRowsNode } from "./actions/google-sheets-get";
import { httpRequest } from "./actions/http-request";
import { linearCreateIssueNode } from "./actions/linear-create-issue";
import { notionCreatePageNode } from "./actions/notion-create-page";
import { postgresQueryNode } from "./actions/postgres-query";
import { sendgridSendEmailNode } from "./actions/sendgrid-send-email";
import { slackPostNode } from "./actions/slack-post";
import { supabaseInsertNode } from "./actions/supabase-insert";
import { teamsPostCardNode } from "./actions/teams-post-card";
import { telegramSendNode } from "./actions/telegram-send";
import { twilioSendSmsNode } from "./actions/twilio-send-sms";
import { agentNode } from "./ai/agent";
import { classifyNode } from "./ai/classify";
import { extractNode } from "./ai/extract";
import { llmNode } from "./ai/llm";
import { vectorStoreNode } from "./ai/vector-store";
import { subWorkflowNode } from "./actions/sub-workflow";
import { categoryOrder } from "./categories";
import type { AnyNodeDef, NodeCategory } from "./define";
import { approvalNode } from "./logic/approval";
import { codeNode } from "./logic/code";
import { conditionNode } from "./logic/condition";
import { datetimeFormatNode } from "./logic/datetime";
import { filterNode } from "./logic/filter";
import { loopNode } from "./logic/loop";
import { setNode } from "./logic/set";
import { switchNode } from "./logic/switch";
import { waitNode } from "./logic/wait";
import { waitForWebhookNode } from "./logic/wait-for-webhook";
import { batchNode } from "./logic/batch";
import { mergeNode } from "./logic/merge";
import { respondToWebhookNode } from "./actions/respond-to-webhook";
import { toJsonSchema, type JsonSchema } from "./schema";
import { errorTriggerNode } from "./triggers/error";
import { formTriggerNode } from "./triggers/form";
import { manualTrigger } from "./triggers/manual";
import { scheduleTriggerNode } from "./triggers/schedule";
import { stripeEventTriggerNode } from "./triggers/stripe-event";
import { telegramMessageTriggerNode } from "./triggers/telegram-message";
import { webhookTriggerNode } from "./triggers/webhook";

/** Adding a connector = one file here + one line in this array. */
const DEFINITIONS: readonly AnyNodeDef[] = [
  manualTrigger,
  webhookTriggerNode,
  formTriggerNode,
  scheduleTriggerNode,
  telegramMessageTriggerNode,
  stripeEventTriggerNode,
  errorTriggerNode,
  conditionNode,
  filterNode,
  switchNode,
  setNode,
  codeNode,
  datetimeFormatNode,
  waitNode,
  waitForWebhookNode,
  approvalNode,
  loopNode,
  mergeNode,
  batchNode,
  llmNode,
  extractNode,
  classifyNode,
  agentNode,
  vectorStoreNode,
  slackPostNode,
  discordPostNode,
  telegramSendNode,
  teamsPostCardNode,
  twilioSendSmsNode,
  notionCreatePageNode,
  airtableCreateRecordNode,
  linearCreateIssueNode,
  githubCreateIssueNode,
  supabaseInsertNode,
  googleSheetsAppendRowNode,
  googleSheetsGetRowsNode,
  postgresQueryNode,
  httpRequest,
  emailSend,
  sendgridSendEmailNode,
  respondToWebhookNode,
  subWorkflowNode,
];

export function buildRegistry(definitions: readonly AnyNodeDef[]): Record<string, AnyNodeDef> {
  const registry: Record<string, AnyNodeDef> = {};
  for (const definition of definitions) {
    if (registry[definition.type]) {
      throw new Error(`Duplicate node type in registry: ${definition.type}`);
    }
    registry[definition.type] = definition;
  }
  return registry;
}

/** Throws at module load if two definitions share a `type`. */
export const NODES: Record<string, AnyNodeDef> = buildRegistry(DEFINITIONS);

export interface CatalogueEntry {
  type: string;
  name: string;
  description: string;
  category: NodeCategory;
  icon: string;
  version: "v1" | "v2";
  requiresFeature: string | null;
  /** Whether the org's plan features cover this node. */
  allowed: boolean;
  /** The connection kind this node needs (`"ai"`, `"slack"`, a family), or null for none. */
  credential: string | null;
  /** …and whether it still runs without one, like the HTTP and Send email nodes. */
  credentialOptional: boolean;
  inputsSchema: JsonSchema;
  outputsSchema: JsonSchema;
  handles: string[];
}

function defaultInputs(definition: AnyNodeDef): unknown {
  const parsed = definition.inputs.safeParse({});
  return parsed.success ? parsed.data : {};
}

/**
 * The node list the sidebar and the Builder agent see. `features` are the org's Clerk feature
 * slugs (see `lib/plans.ts`); nodes the plan does not cover are still listed, but `allowed`
 * is false so the UI can dim them. Gating is enforced again in `runNode` (Phase 2).
 */
export function nodeCatalogue(features: readonly string[]): CatalogueEntry[] {
  return Object.values(NODES)
    .map((definition) => ({
      type: definition.type,
      name: definition.name,
      description: definition.description,
      category: definition.category,
      icon: definition.icon,
      version: definition.version,
      requiresFeature: definition.requiresFeature,
      allowed: !definition.requiresFeature || features.includes(definition.requiresFeature),
      credential: definition.credential,
      credentialOptional: definition.credentialOptional ?? false,
      inputsSchema: toJsonSchema(definition.inputs),
      outputsSchema: toJsonSchema(definition.outputs),
      handles: definition.handles?.(defaultInputs(definition)) ?? ["out"],
    }))
    .sort(
      (a, b) => categoryOrder(a.category) - categoryOrder(b.category) || a.name.localeCompare(b.name),
    );
}
