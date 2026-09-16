import { describe, expect, it } from "vitest";
import {
  getAIOpsState,
  getFinancialAnalytics,
  getGlobalWorkflows,
  getPerformanceDiagnostics,
  getSystemOverviewMetrics,
  getTenantsDirectory,
  quarantineWorkflow,
  toggleKillSwitch,
  toggleTemplateApproval,
  toggleWorkflowStatus,
  updateRateLimitGovernor,
  updateTenantQuota,
  updateTenantTier,
} from "@/lib/admin/service";

describe("Admin Service Operations", () => {
  it("provides comprehensive system overview KPIs", async () => {
    const kpis = await getSystemOverviewMetrics();
    expect(kpis.totalTenants).toBeGreaterThan(0);
    expect(kpis.activeWorkflows.total).toBeGreaterThan(0);
    expect(kpis.globalFailureRate).toBeDefined();
    expect(kpis.estimatedMRR).toBeGreaterThan(0);
    expect(kpis.redisQueueDepth).toBeDefined();
  });

  it("filters global workflows registry by search and status", async () => {
    const all = await getGlobalWorkflows({});
    expect(all.length).toBeGreaterThan(0);

    const activeOnly = await getGlobalWorkflows({ status: "active" });
    for (const wf of activeOnly) {
      expect(wf.status).toBe("active");
    }

    const searchWord = all[0].name.split(" ")[0].toLowerCase();
    const searched = await getGlobalWorkflows({ search: searchWord });
    expect(searched.length).toBeGreaterThan(0);
    expect(searched[0].name.toLowerCase()).toContain(searchWord);
  });

  it("calculates revenue analytics and unit economics in Kenya Shillings (KSh)", async () => {
    const fin = await getFinancialAnalytics();
    expect(fin.revenue.mrr).toBeGreaterThan(0);
    expect(fin.revenue.arr).toBe(fin.revenue.mrr * 12);
    expect(fin.unitEconomics.length).toBeGreaterThan(0);
    expect(fin.unitEconomics[0].subscriptionRevenueMonthly).toBeGreaterThanOrEqual(0);
  });

  it("toggles workflow active/pause state and quarantines rogue automations", async () => {
    const workflows = await getGlobalWorkflows({});
    const target = workflows[0];

    const paused = await toggleWorkflowStatus(target.id, "paused");
    expect(paused.status).toBe("paused");

    const activated = await toggleWorkflowStatus(target.id, "active");
    expect(activated.status).toBe("active");

    const quarantined = await quarantineWorkflow(target.id);
    expect(quarantined.status).toBe("quarantined");
  });

  it("governs tenants with quota overrides and tier updates", async () => {
    const tenants = await getTenantsDirectory();
    const tenant = tenants[0];

    const updated = await updateTenantQuota(tenant.id, 99999);
    expect(updated.monthlyQuotaLimit).toBe(99999);

    const tierUpdated = await updateTenantTier(tenant.id, "Enterprise");
    expect(tierUpdated.planTier).toBe("Enterprise");
  });

  it("manages connector kill switches and rate-limit governors", async () => {
    const sw = await toggleKillSwitch("telegram", true, "High failure rate detected");
    expect(sw.isFrozen).toBe(true);

    const restored = await toggleKillSwitch("telegram", false);
    expect(restored.isFrozen).toBe(false);

    const gov = await updateRateLimitGovernor("telegram", 45);
    expect(gov.maxRps).toBe(45);
  });

  it("curates community template submissions", async () => {
    const approved = await toggleTemplateApproval("tmpl_comm_01", true);
    expect(approved.isApproved).toBe(true);
  });
});
