/**
 * Strict TypeScript types for the Xuremi Flow Enterprise SuperAdmin suite.
 */

export const SUPERADMIN_EMAIL = "sungurclinton@gmail.com";

export type AdminRole = "superadmin";

export type StatusBadgeVariant = "success" | "error" | "pending" | "warning";

export interface AdminUserSession {
  userId: string;
  email: string;
  isSuperAdmin: boolean;
  timestamp: number;
}

export interface AdminAuditLog {
  id: string;
  timestamp: number;
  adminEmail: string;
  action: string;
  targetResourceId: string;
  ipAddress: string;
  details?: Record<string, unknown>;
  status: "success" | "failure";
}

// Module 1: Overview
export interface SystemOverviewKPIs {
  totalTenants: number;
  activeWorkflows: {
    total: number;
    published: number;
    draft: number;
    paused: number;
  };
  executionVolume: {
    last24h: number;
    last30d: number;
  };
  globalFailureRate: number; // e.g. 1.42 (%)
  estimatedMRR: number; // in KSh (Kenya Shillings)
  redisQueueDepth: number; // jobs waiting in queue
  activeWorkerConcurrency: number; // e.g. 142
  maxWorkerCapacity: number; // e.g. 200
}

export interface TelemetryPoint {
  timestamp: string; // ISO or HH:MM
  throughputRunsPerMin: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
}

export interface IncidentRecord {
  id: string;
  runHash: string;
  workflowId: string;
  workflowName: string;
  tenantId: string;
  tenantEmail: string;
  category: "external_outage" | "engine_timeout" | "user_logic_error";
  errorMessage: string;
  failedStepNodeId: string;
  failedStepNodeType: string;
  inputPayload: Record<string, unknown>;
  outputPayload?: Record<string, unknown>;
  startedAt: number;
  latencyMs: number;
  retriesCount: number;
  status: "failed" | "retrying" | "resolved";
}

// Module 2: Workflows
export interface AdminWorkflowSummary {
  id: string;
  name: string;
  tenantId: string;
  ownerEmail: string;
  triggerType: "webhook" | "telegram" | "schedule" | "form" | "manual" | "chat";
  status: "active" | "draft" | "paused" | "quarantined";
  version: number;
  nodesCount: number;
  edgesCount: number;
  totalRuns24h: number;
  totalRuns30d: number;
  failureRate: number; // %
  lastEditedAt: number;
  graph: {
    nodes: unknown[];
    edges: unknown[];
    triggerId?: string;
  };
}

// Module 3: Tenants & Orgs
export interface TenantRecord {
  id: string;
  orgId: string;
  organizationName: string;
  ownerEmail: string;
  planTier: "Free" | "Team" | "Enterprise";
  createdAt: number;
  activeWorkflowsCount: number;
  runsUsedThisMonth: number;
  monthlyQuotaLimit: number;
  isSuspended: boolean;
  status: "active" | "suspended" | "over_quota";
}

// Module 4: Finance (All figures in Kenya Shillings - KSh)
export interface RevenueTelemetry {
  mrr: number; // KSh
  arr: number; // KSh
  activePaidSubscriptions: number;
  renewalChurnRate: number; // %
  paymentWebhookErrorsCount: number;
}

export interface TenantUnitEconomics {
  tenantId: string;
  organizationName: string;
  ownerEmail: string;
  planTier: "Free" | "Team" | "Enterprise";
  subscriptionRevenueMonthly: number; // KSh
  llmTokenCostMonthly: number; // KSh
  computeCostMonthly: number; // KSh
  totalCostMonthly: number; // KSh
  netMarginPercentage: number;
  isUnprofitable: boolean;
}

export interface InvoiceEvent {
  id: string;
  tenantId: string;
  organizationName: string;
  date: number;
  amountKsh: number; // KSh
  status: "paid" | "open" | "past_due" | "refunded";
  invoiceUrl: string;
}

// Module 5: Performance & DLQ
export interface DLQEntry {
  id: string;
  runHash: string;
  workflowId: string;
  workflowName: string;
  tenantId: string;
  failedAt: number;
  errorMessage: string;
  payload: Record<string, unknown>;
  attempts: number;
  canReplay: boolean;
}

export interface ConnectorKillSwitch {
  connectorId: string;
  name: string;
  isFrozen: boolean;
  reason?: string;
  updatedAt: number;
}

export interface MaintenanceBannerState {
  isActive: boolean;
  message: string;
  severity: "info" | "warning" | "critical";
  broadcastAt?: number;
}

// Module 6: AI Ops
export interface AIModelSpendBreakdown {
  provider: "google" | "anthropic" | "openai" | "deepseek" | "groq" | "mistral";
  modelName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costKsh: number; // KSh
  averageLatencyMs: number;
  errorRatePercentage: number;
}

export interface DynamicFallbackRule {
  id: string;
  primaryProvider: string;
  fallbackProvider: string;
  emergencyProvider: string;
  triggerCondition: "latency_over_5000ms" | "rate_limit_429" | "provider_error_5xx";
  isEnabled: boolean;
}

export interface IntegrationRateLimit {
  integration: string;
  maxRps: number;
  currentRps: number;
  burstAllowance: number;
  isEnforced: boolean;
}

// Module 7: Security & Abuse
export interface RunawayLoopAlert {
  id: string;
  workflowId: string;
  workflowName: string;
  tenantId: string;
  ownerEmail: string;
  cyclesPerMinute: number;
  thresholdExceeded: number;
  detectedAt: number;
  isQuarantined: boolean;
}

export interface CredentialVaultHealth {
  connectionId: string;
  tenantId: string;
  provider: string;
  kind: string;
  label: string;
  status: "healthy" | "expired" | "invalid_scopes" | "reconnect_required";
  lastVerifiedAt: number;
  expiresInDays?: number;
}

// Module 8: Templates
export interface CommunityTemplateSubmission {
  id: string;
  title: string;
  description: string;
  authorEmail: string;
  category: string;
  submittedAt: number;
  nodesCount: number;
  isApproved: boolean;
  isFeatured: boolean;
  starsCount: number;
  clonesCount: number;
}
