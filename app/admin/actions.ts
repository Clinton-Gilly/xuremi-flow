"use server";

import { revalidatePath } from "next/cache";
import { verifySuperAdmin } from "@/lib/admin/auth";
import {
  quarantineWorkflow,
  replayAllDLQ,
  replayDLQEntry,
  retryIncident,
  toggleKillSwitch,
  toggleTemplateApproval,
  toggleTemplateFeatured,
  toggleTenantSuspension,
  toggleWorkflowStatus,
  updateMaintenanceBanner,
  updateRateLimitGovernor,
  updateTenantQuota,
  updateTenantTier,
} from "@/lib/admin/service";
import { MaintenanceBannerState } from "@/types/admin";

/**
 * Asserts superadmin identity for server actions.
 */
async function assertSuperAdmin() {
  const auth = await verifySuperAdmin({ redirectIfUnauthorized: false });
  if (!auth.authorized) {
    throw new Error("Access Denied: Superadmin privileges required.");
  }
  return auth;
}

export async function forcePauseWorkflowAction(workflowId: string) {
  await assertSuperAdmin();
  const wf = await toggleWorkflowStatus(workflowId, "paused");
  revalidatePath("/admin");
  revalidatePath("/admin/workflows");
  return { success: true, workflow: wf };
}

export async function forceActivateWorkflowAction(workflowId: string) {
  await assertSuperAdmin();
  const wf = await toggleWorkflowStatus(workflowId, "active");
  revalidatePath("/admin");
  revalidatePath("/admin/workflows");
  return { success: true, workflow: wf };
}

export async function quarantineWorkflowAction(workflowId: string) {
  await assertSuperAdmin();
  const wf = await quarantineWorkflow(workflowId);
  revalidatePath("/admin");
  revalidatePath("/admin/workflows");
  revalidatePath("/admin/security");
  return { success: true, workflow: wf };
}

export async function retryIncidentAction(incidentId: string) {
  await assertSuperAdmin();
  const inc = await retryIncident(incidentId);
  revalidatePath("/admin");
  return { success: true, incident: inc };
}

export async function overrideTenantQuotaAction(tenantId: string, newQuota: number) {
  await assertSuperAdmin();
  const tenant = await updateTenantQuota(tenantId, newQuota);
  revalidatePath("/admin/users");
  return { success: true, tenant };
}

export async function changeTenantTierAction(tenantId: string, tier: "Free" | "Team" | "Enterprise") {
  await assertSuperAdmin();
  const tenant = await updateTenantTier(tenantId, tier);
  revalidatePath("/admin/users");
  revalidatePath("/admin/finance");
  return { success: true, tenant };
}

export async function toggleTenantSuspensionAction(tenantId: string, suspend: boolean) {
  await assertSuperAdmin();
  const tenant = await toggleTenantSuspension(tenantId, suspend);
  revalidatePath("/admin/users");
  return { success: true, tenant };
}

export async function toggleKillSwitchAction(connectorId: string, isFrozen: boolean, reason?: string) {
  await assertSuperAdmin();
  const sw = await toggleKillSwitch(connectorId, isFrozen, reason);
  revalidatePath("/admin/performance");
  return { success: true, killSwitch: sw };
}

export async function updateMaintenanceBannerAction(banner: MaintenanceBannerState) {
  await assertSuperAdmin();
  const res = await updateMaintenanceBanner(banner);
  revalidatePath("/admin/performance");
  return { success: true, banner: res };
}

export async function replayDLQAction(dlqId: string) {
  await assertSuperAdmin();
  const item = await replayDLQEntry(dlqId);
  revalidatePath("/admin/performance");
  return { success: true, item };
}

export async function replayAllDLQAction() {
  await assertSuperAdmin();
  const res = await replayAllDLQ();
  revalidatePath("/admin/performance");
  return { success: true, count: res.replayedCount };
}

export async function updateRateLimitGovernorAction(integration: string, maxRps: number) {
  await assertSuperAdmin();
  const res = await updateRateLimitGovernor(integration, maxRps);
  revalidatePath("/admin/ai-ops");
  return { success: true, governor: res };
}

export async function toggleTemplateApprovalAction(templateId: string, approved: boolean) {
  await assertSuperAdmin();
  const res = await toggleTemplateApproval(templateId, approved);
  revalidatePath("/admin/templates");
  return { success: true, template: res };
}

export async function toggleTemplateFeaturedAction(templateId: string, featured: boolean) {
  await assertSuperAdmin();
  const res = await toggleTemplateFeatured(templateId, featured);
  revalidatePath("/admin/templates");
  return { success: true, template: res };
}
