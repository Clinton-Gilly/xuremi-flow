import { describe, expect, it, vi } from "vitest";
import {
  extractUserEmails,
  isSuperAdminEmail,
  SUPERADMIN_EMAIL,
  verifySuperAdmin,
} from "@/lib/admin/auth";
import { getAdminAuditLogs, recordAdminAuditLog } from "@/lib/admin/audit";

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: vi.fn(),
}));

import { currentUser } from "@clerk/nextjs/server";

describe("SuperAdmin Auth Gate", () => {
  it("only allows sungurclinton@gmail.com as superadmin", () => {
    expect(SUPERADMIN_EMAIL).toBe("sungurclinton@gmail.com");
    expect(isSuperAdminEmail("sungurclinton@gmail.com")).toBe(true);
    expect(isSuperAdminEmail("SUNGURCLINTON@GMAIL.COM")).toBe(true);
    expect(isSuperAdminEmail("  sungurclinton@gmail.com  ")).toBe(true);

    expect(isSuperAdminEmail("attacker@evil.com")).toBe(false);
    expect(isSuperAdminEmail("admin@xuremi.com")).toBe(false);
    expect(isSuperAdminEmail("")).toBe(false);
    expect(isSuperAdminEmail(null)).toBe(false);
    expect(isSuperAdminEmail(undefined)).toBe(false);
  });

  it("extracts all emails from a Clerk user object", () => {
    const mockUser = {
      primaryEmailAddress: { emailAddress: "sungurclinton@gmail.com" },
      emailAddresses: [
        { emailAddress: "sungurclinton@gmail.com" },
        { emailAddress: "secondary@xuremi.com" },
      ],
    } as any;

    const emails = extractUserEmails(mockUser);
    expect(emails).toEqual(["sungurclinton@gmail.com", "secondary@xuremi.com"]);
  });

  it("authorizes sungurclinton@gmail.com successfully", async () => {
    vi.mocked(currentUser).mockResolvedValueOnce({
      id: "user_superadmin_01",
      primaryEmailAddress: { emailAddress: "sungurclinton@gmail.com" },
      emailAddresses: [{ emailAddress: "sungurclinton@gmail.com" }],
    } as any);

    const result = await verifySuperAdmin({ redirectIfUnauthorized: false });
    expect(result.authorized).toBe(true);
    expect(result.email).toBe("sungurclinton@gmail.com");
  });

  it("rejects unauthorized users with authorized: false", async () => {
    vi.mocked(currentUser).mockResolvedValueOnce({
      id: "user_normal_02",
      primaryEmailAddress: { emailAddress: "normaluser@company.com" },
      emailAddresses: [{ emailAddress: "normaluser@company.com" }],
    } as any);

    const result = await verifySuperAdmin({ redirectIfUnauthorized: false });
    expect(result.authorized).toBe(false);
  });

  it("rejects unauthenticated requests", async () => {
    vi.mocked(currentUser).mockResolvedValueOnce(null);

    const result = await verifySuperAdmin({ redirectIfUnauthorized: false });
    expect(result.authorized).toBe(false);
  });
});

describe("Admin Audit Logging", () => {
  it("records immutable audit log entries with IP and targetResourceId", () => {
    const entry = recordAdminAuditLog({
      action: "test_high_privilege_action",
      targetResourceId: "res_9981",
      ipAddress: "192.168.1.100",
      details: { foo: "bar" },
    });

    expect(entry.id).toBeDefined();
    expect(entry.action).toBe("test_high_privilege_action");
    expect(entry.targetResourceId).toBe("res_9981");
    expect(entry.ipAddress).toBe("192.168.1.100");
    expect(entry.adminEmail).toBe(SUPERADMIN_EMAIL);

    const logs = getAdminAuditLogs({ action: "test_high_privilege_action" });
    expect(logs.items.length).toBeGreaterThanOrEqual(1);
    expect(logs.items[0].action).toBe("test_high_privilege_action");
  });
});
