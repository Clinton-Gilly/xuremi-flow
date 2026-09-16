"use client";

import { useState } from "react";
import { CommunityTemplateSubmission } from "@/types/admin";
import {
  toggleTemplateApprovalAction,
  toggleTemplateFeaturedAction,
} from "@/app/admin/actions";
import { AdminBadge } from "./AdminBadge";
import {
  CheckCircle2Icon,
  CopyIcon,
  DownloadIcon,
  EyeIcon,
  LayoutTemplateIcon,
  SearchIcon,
  SparklesIcon,
  StarIcon,
  XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";

interface TemplateCuratorGridProps {
  initialTemplates: CommunityTemplateSubmission[];
}

export function TemplateCuratorGrid({ initialTemplates }: TemplateCuratorGridProps) {
  const [templates, setTemplates] = useState<CommunityTemplateSubmission[]>(initialTemplates);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const handleToggleApproval = async (tmpl: CommunityTemplateSubmission) => {
    const targetApproval = !tmpl.isApproved;
    try {
      await toggleTemplateApprovalAction(tmpl.id, targetApproval);
      toast.success(
        targetApproval
          ? `Template "${tmpl.title}" approved and published to the marketplace`
          : `Template "${tmpl.title}" removed from the marketplace`,
      );
      setTemplates((prev) =>
        prev.map((t) => (t.id === tmpl.id ? { ...t, isApproved: targetApproval } : t)),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle template approval");
    }
  };

  const handleToggleFeatured = async (tmpl: CommunityTemplateSubmission) => {
    const targetFeatured = !tmpl.isFeatured;
    try {
      await toggleTemplateFeaturedAction(tmpl.id, targetFeatured);
      toast.success(
        targetFeatured
          ? `Template "${tmpl.title}" featured in the starter carousel`
          : `Template "${tmpl.title}" unfeatured`,
      );
      setTemplates((prev) =>
        prev.map((t) => (t.id === tmpl.id ? { ...t, isFeatured: targetFeatured } : t)),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle featured status");
    }
  };

  const filtered = templates.filter((tmpl) => {
    const matchesSearch =
      !search ||
      tmpl.title.toLowerCase().includes(search.toLowerCase()) ||
      tmpl.description.toLowerCase().includes(search.toLowerCase()) ||
      tmpl.authorEmail.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "approved" && tmpl.isApproved) ||
      (filter === "pending" && !tmpl.isApproved) ||
      (filter === "featured" && tmpl.isFeatured);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1E222B] bg-[#14161B] p-4">
        <div className="flex flex-1 items-center gap-2 max-w-md rounded-lg border border-[#1E222B] bg-[#090A0C] px-3 py-1.5 text-xs text-white">
          <SearchIcon className="size-3.5 text-[#64748B]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search community templates by title, author, or keyword..."
            className="w-full bg-transparent placeholder:text-[#64748B] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-[#1E222B] bg-[#090A0C] px-3 py-1.5 text-xs font-medium text-[#94A3B8] focus:outline-none"
          >
            <option value="all">All Submissions</option>
            <option value="approved">Approved & Published</option>
            <option value="pending">Pending Moderation</option>
            <option value="featured">Featured in Spotlight</option>
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((tmpl) => (
          <div
            key={tmpl.id}
            className="flex flex-col justify-between rounded-xl border border-[#1E222B] bg-[#14161B] p-5 shadow-sm space-y-4 hover:border-[#2E3440] transition-colors"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                  {tmpl.category}
                </span>

                <div className="flex items-center gap-1.5">
                  {tmpl.isFeatured && (
                    <AdminBadge variant="brand" dot>
                      FEATURED
                    </AdminBadge>
                  )}
                  {tmpl.isApproved ? (
                    <AdminBadge variant="success">APPROVED</AdminBadge>
                  ) : (
                    <AdminBadge variant="warning">PENDING</AdminBadge>
                  )}
                </div>
              </div>

              <h3 className="font-semibold text-white text-sm tracking-tight">{tmpl.title}</h3>
              <p className="text-xs text-[#94A3B8] line-clamp-2">{tmpl.description}</p>
            </div>

            <div className="space-y-3 pt-2 border-t border-[#1E222B]">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#64748B]">
                <span>Author: {tmpl.authorEmail}</span>
                <span>{tmpl.nodesCount} nodes</span>
              </div>

              <div className="flex items-center justify-between text-xs text-[#94A3B8] font-mono">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <StarIcon className="size-3 text-amber-400 fill-amber-400" />
                    <span>{tmpl.starsCount}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <DownloadIcon className="size-3 text-sky-400" />
                    <span>{tmpl.clonesCount} clones</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleFeatured(tmpl)}
                    title={tmpl.isFeatured ? "Unfeature" : "Feature on Spotlight"}
                    className={`rounded border p-1.5 transition-colors ${
                      tmpl.isFeatured
                        ? "border-purple-500 bg-purple-500/10 text-purple-400"
                        : "border-[#1E222B] bg-[#090A0C] text-[#64748B] hover:text-white"
                    }`}
                  >
                    <SparklesIcon className="size-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleApproval(tmpl)}
                    className={`rounded px-2.5 py-1 text-xs font-medium font-mono transition-colors ${
                      tmpl.isApproved
                        ? "border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                        : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    }`}
                  >
                    {tmpl.isApproved ? "Revoke" : "Approve"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
