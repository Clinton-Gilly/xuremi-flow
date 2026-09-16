import { getCommunityTemplates } from "@/lib/admin/service";
import { TemplateCuratorGrid } from "@/components/admin/TemplateCuratorGrid";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { LayoutTemplateIcon } from "lucide-react";

export default async function AdminTemplatesPage() {
  const templates = await getCommunityTemplates();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E222B] pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <LayoutTemplateIcon className="size-5 text-amber-400" />
            <span>Community Marketplace & Template Moderation</span>
            <AdminBadge variant="neutral">{templates.length} Submissions</AdminBadge>
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Review community-submitted workflow patterns, approve public marketplace listings, and curate featured starters.
          </p>
        </div>
      </div>

      <TemplateCuratorGrid initialTemplates={templates} />
    </div>
  );
}
