import type { Metadata } from "next";
import { verifySuperAdmin } from "@/lib/admin/auth";
import { recordAdminAuditLog } from "@/lib/admin/audit";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SuperAdmin • Xuremi Flow",
  description: "Enterprise Operations & SuperAdmin Suite for Xuremi Flow",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Multi-layer Enforcement: verify active session email === sungurclinton@gmail.com
  const auth = await verifySuperAdmin({ redirectIfUnauthorized: true });

  // Immutable Audit Logging on session entry
  recordAdminAuditLog({
    action: "admin_session_start",
    targetResourceId: `session_${auth.userId}`,
    adminEmail: auth.email,
    details: { timestamp: Date.now(), authType: "clerk_session" },
  });

  return (
    <div className="flex min-h-screen flex-col bg-[#0B0C0E] text-white selection:bg-emerald-500/30 selection:text-emerald-300">
      <AdminHeader />
      <AdminNav />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
