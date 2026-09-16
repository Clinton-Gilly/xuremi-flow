import { NextRequest, NextResponse } from "next/server";
import { assertSuperAdminApi } from "@/lib/admin/auth";
import { getAdminAuditLogs } from "@/lib/admin/audit";
import {
  getAIOpsState,
  getCommunityTemplates,
  getFinancialAnalytics,
  getGlobalWorkflows,
  getIncidentFeed,
  getPerformanceDiagnostics,
  getSecurityAbuseState,
  getSystemOverviewMetrics,
  getTelemetrySeries,
  getTenantsDirectory,
} from "@/lib/admin/service";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string[] }> },
) {
  try {
    await assertSuperAdminApi();
  } catch {
    return NextResponse.json(
      { error: "Access Denied: Superadmin privileges required." },
      { status: 403 },
    );
  }

  const { slug } = await context.params;
  const endpoint = slug.join("/");

  const searchParams = request.nextUrl.searchParams;

  switch (endpoint) {
    case "kpis": {
      const data = await getSystemOverviewMetrics();
      return NextResponse.json(data);
    }
    case "telemetry": {
      const range = searchParams.get("range") || "24h";
      const data = await getTelemetrySeries(range);
      return NextResponse.json(data);
    }
    case "incidents": {
      const data = await getIncidentFeed();
      return NextResponse.json(data);
    }
    case "workflows": {
      const search = searchParams.get("search") || undefined;
      const status = searchParams.get("status") || undefined;
      const trigger = searchParams.get("trigger") || undefined;
      const data = await getGlobalWorkflows({ search, status, trigger });
      return NextResponse.json(data);
    }
    case "tenants": {
      const search = searchParams.get("search") || undefined;
      const plan = searchParams.get("plan") || undefined;
      const data = await getTenantsDirectory({ search, plan });
      return NextResponse.json(data);
    }
    case "finance": {
      const data = await getFinancialAnalytics();
      return NextResponse.json(data);
    }
    case "performance": {
      const data = await getPerformanceDiagnostics();
      return NextResponse.json(data);
    }
    case "ai-ops": {
      const data = await getAIOpsState();
      return NextResponse.json(data);
    }
    case "security": {
      const data = await getSecurityAbuseState();
      return NextResponse.json(data);
    }
    case "audit-logs": {
      const search = searchParams.get("search") || undefined;
      const action = searchParams.get("action") || undefined;
      const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50;
      const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0;
      const data = getAdminAuditLogs({ search, action, limit, offset });
      return NextResponse.json(data);
    }
    case "templates": {
      const data = await getCommunityTemplates();
      return NextResponse.json(data);
    }
    default:
      return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
  }
}
