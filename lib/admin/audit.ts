import { AdminAuditLog, SUPERADMIN_EMAIL } from "@/types/admin";

/**
 * Immutable in-memory audit log store with timestamp, action type, target resource ID,
 * admin email, and IP address.
 */
class AuditLogStore {
  private logs: AdminAuditLog[] = [];

  constructor() {
    this.seedInitialLogs();
  }

  private seedInitialLogs() {
    const now = Date.now();
    const seeds: Omit<AdminAuditLog, "id">[] = [
      {
        timestamp: now - 3600000 * 5,
        adminEmail: SUPERADMIN_EMAIL,
        action: "admin_session_start",
        targetResourceId: "session_01HK98ZPA8",
        ipAddress: "197.232.84.112",
        status: "success",
        details: { userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0", source: "direct" },
      },
      {
        timestamp: now - 3600000 * 3,
        adminEmail: SUPERADMIN_EMAIL,
        action: "override_tenant_quota",
        targetResourceId: "org_2N8yB9W19ZkL",
        ipAddress: "197.232.84.112",
        status: "success",
        details: { previousQuota: 50000, newQuota: 100000, reason: "Enterprise trial expansion" },
      },
      {
        timestamp: now - 3600000 * 2,
        adminEmail: SUPERADMIN_EMAIL,
        action: "dlq_replay_execution",
        targetResourceId: "exec_77XyA091bM",
        ipAddress: "197.232.84.112",
        status: "success",
        details: { runHash: "0x89ab...71ef", connector: "telegram" },
      },
      {
        timestamp: now - 1800000,
        adminEmail: SUPERADMIN_EMAIL,
        action: "quarantine_runaway_workflow",
        targetResourceId: "wf_99PQ771Ka",
        ipAddress: "197.232.84.112",
        status: "success",
        details: { trigger: "webhook.loop", cyclesPerMin: 140 },
      },
      {
        timestamp: now - 600000,
        adminEmail: SUPERADMIN_EMAIL,
        action: "admin_session_start",
        targetResourceId: "session_01HK9B4F11",
        ipAddress: "197.232.84.112",
        status: "success",
        details: { userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/130.0", source: "dashboard_switch" },
      },
    ];

    for (let i = 0; i < seeds.length; i++) {
      this.logs.unshift({
        id: `audit_log_${Date.now()}_${i}`,
        ...seeds[i],
      });
    }
  }

  public record(params: {
    action: string;
    targetResourceId: string;
    ipAddress?: string;
    adminEmail?: string;
    details?: Record<string, unknown>;
    status?: "success" | "failure";
  }): AdminAuditLog {
    const entry: AdminAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: Date.now(),
      adminEmail: params.adminEmail || SUPERADMIN_EMAIL,
      action: params.action,
      targetResourceId: params.targetResourceId,
      ipAddress: params.ipAddress || "127.0.0.1",
      details: params.details,
      status: params.status || "success",
    };

    // Immutable append
    this.logs.unshift(entry);

    // Keep reasonable buffer in memory
    if (this.logs.length > 500) {
      this.logs = this.logs.slice(0, 500);
    }

    return entry;
  }

  public list(options: { search?: string; action?: string; limit?: number; offset?: number } = {}): {
    items: AdminAuditLog[];
    total: number;
  } {
    const { search, action, limit = 50, offset = 0 } = options;
    let filtered = [...this.logs];

    if (action && action !== "all") {
      filtered = filtered.filter((l) => l.action.toLowerCase() === action.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          l.targetResourceId.toLowerCase().includes(q) ||
          l.adminEmail.toLowerCase().includes(q) ||
          l.ipAddress.toLowerCase().includes(q),
      );
    }

    const total = filtered.length;
    const items = filtered.slice(offset, offset + limit);

    return { items, total };
  }
}

// Global singleton to preserve across server actions within node process
declare global {
  // eslint-disable-next-line no-var
  var __xuremi_audit_store: AuditLogStore | undefined;
}

export const auditStore: AuditLogStore =
  globalThis.__xuremi_audit_store ?? (globalThis.__xuremi_audit_store = new AuditLogStore());

export function recordAdminAuditLog(params: {
  action: string;
  targetResourceId: string;
  ipAddress?: string;
  adminEmail?: string;
  details?: Record<string, unknown>;
  status?: "success" | "failure";
}): AdminAuditLog {
  return auditStore.record(params);
}

export function getAdminAuditLogs(options?: { search?: string; action?: string; limit?: number; offset?: number }) {
  return auditStore.list(options);
}
