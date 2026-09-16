import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  GlobeIcon,
  ZapIcon,
} from "lucide-react";

import { NodeIcon } from "@/components/canvas/node-icon";
import { StatusRing } from "@/components/canvas/StatusRing";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Social Cross-Poster (X & LinkedIn) — Xuremi Flow",
  description: "Automate social publishing to X (Twitter) and LinkedIn with zero Pro gating on free accounts.",
};

const WORKFLOW_NODES = [
  {
    key: "topic_form",
    label: "Form: Topic Intake",
    category: "Trigger",
    icon: "FileText",
    status: "success" as const,
    left: 2,
    top: 130,
    details: 'Input: "AI Workflow Engine 2.0 Launch"',
  },
  {
    key: "ai_copywriter",
    label: "AI: Format Content",
    category: "AI",
    icon: "Sparkles",
    status: "success" as const,
    left: 27,
    top: 130,
    details: "Generated 280-char tweet & long-form LinkedIn commentary",
  },
  {
    key: "x_poster",
    label: "X: Post Tweet",
    category: "Action",
    icon: "Share2",
    status: "success" as const,
    left: 63,
    top: 45,
    details: "tweetId: 1835698124501234567 • @xuremi_flow",
  },
  {
    key: "linkedin_poster",
    label: "LinkedIn: Create Post",
    category: "Action",
    icon: "Share2",
    status: "success" as const,
    left: 63,
    top: 220,
    details: "urn:li:share:724128945678 • Public update",
  },
];

const EXECUTION_RUNS = [
  {
    time: "14:15:02.102",
    step: "topic_form",
    label: "Topic Intake",
    status: "success" as const,
    outcome: "topic submitted",
    duration: "18ms",
  },
  {
    time: "14:15:02.124",
    step: "ai_copywriter",
    label: "AI Adapt Copy",
    status: "success" as const,
    outcome: "copy tailored for X & LinkedIn",
    duration: "1.1s",
  },
  {
    time: "14:15:03.245",
    step: "x_poster",
    label: "X: Post Tweet",
    status: "success" as const,
    outcome: "tweetId: 1835698124501234567",
    duration: "280ms",
  },
  {
    time: "14:15:03.530",
    step: "linkedin_poster",
    label: "LinkedIn: Create Post",
    status: "success" as const,
    outcome: "urn:li:share:724128945678",
    duration: "340ms",
  },
];

export default function SocialPosterPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeftIcon className="size-3.5" /> Back to Dashboard
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Social Cross-Poster: X & LinkedIn
            </h1>
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 font-mono text-xs dark:text-emerald-400">
              Free Plan Ready • No Pro Required
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Single-source social publishing engine configured for both free-tier X (Twitter) and standard LinkedIn developer API.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/pricing"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            View Plans
          </Link>
          <Button size="sm" className="gap-1.5">
            <ZapIcon className="size-3.5" /> Run Workflow
          </Button>
        </div>
      </div>

      {/* Canvas Visualizer */}
      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="border-b border-border bg-muted/40 py-3 sm:px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CircleDotIcon className="size-3.5 text-muted-foreground" />
              <span className="text-sm font-medium">social_cross_poster_v1</span>
              <span className="font-mono text-xs text-muted-foreground">v1.0.0</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs text-emerald-600 dark:text-emerald-400">
                <StatusRing status="success" />
                Execution Successful
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="pf-grid relative flex flex-col bg-background p-4 md:block md:h-[320px] md:p-0">
            {/* SVG Connecting Wires */}
            <svg
              aria-hidden
              viewBox="0 0 100 320"
              preserveAspectRatio="none"
              className="absolute inset-0 hidden size-full md:block pointer-events-none"
            >
              <g fill="none" strokeWidth={2} strokeLinecap="round" vectorEffect="non-scaling-stroke">
                <path
                  d="M24 160 C 25.5 160, 25.5 160, 27 160"
                  stroke="var(--pf-wire)"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d="M49 160 C 56 160, 56 75, 63 75"
                  stroke="var(--pf-accent)"
                  vectorEffect="non-scaling-stroke"
                  className="pf-wire-live"
                />
                <path
                  d="M49 160 C 56 160, 56 250, 63 250"
                  stroke="var(--pf-accent)"
                  vectorEffect="non-scaling-stroke"
                  className="pf-wire-live"
                />
              </g>
            </svg>

            {/* Nodes */}
            {WORKFLOW_NODES.map((node) => (
              <div
                key={node.key}
                style={{
                  "--pf-left": `${node.left}%`,
                  "--pf-top": `${node.top}px`,
                  "--pf-width": "22%",
                } as React.CSSProperties}
                className="relative z-10 rounded-lg border border-border bg-card p-3 shadow-sm md:absolute md:top-(--pf-top) md:left-(--pf-left) md:w-(--pf-width) mb-3 md:mb-0 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <StatusRing status={node.status} />
                  <NodeIcon name={node.icon} className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-xs font-semibold">{node.label}</span>
                  <Badge variant="outline" className="ml-auto text-[0.65rem] px-1.5 py-0 shrink-0">
                    {node.category}
                  </Badge>
                </div>
                <p className="mt-1.5 truncate font-mono text-[0.7rem] text-muted-foreground">{node.key}</p>
                <p className="mt-1 text-[0.7rem] text-foreground/80 line-clamp-1 border-t border-border/50 pt-1">
                  {node.details}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Execution Ledger & Details Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Run Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2Icon className="size-4 text-emerald-500" /> Run History Ledger
            </CardTitle>
            <CardDescription>Live output of each step during durable execution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="divide-y divide-border rounded-md border border-border font-mono text-xs">
              {EXECUTION_RUNS.map((run) => (
                <div key={run.step} className="flex items-center justify-between p-2.5">
                  <div className="flex items-center gap-2">
                    <StatusRing status={run.status} />
                    <span className="font-medium text-foreground">{run.label}</span>
                    <span className="text-muted-foreground">({run.outcome})</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground text-[0.7rem]">
                    <span>{run.duration}</span>
                    <span>{run.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Free Plan Connector Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GlobeIcon className="size-4 text-primary" /> Free Account Compatibility
            </CardTitle>
            <CardDescription>Connectors and nodes configured with requiresFeature: null</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs flex items-center gap-1.5">
                  <NodeIcon name="Share2" className="size-3.5 text-primary" /> X (Twitter) Poster
                </span>
                <Badge variant="secondary" className="text-[0.65rem] font-mono">Free Tier Ready</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Supports OAuth 1.0a User Context (API Key, Secret, Access Token, Secret) and OAuth 2.0 User Access Token. Free accounts post up to 1,500 tweets/month at zero platform cost.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs flex items-center gap-1.5">
                  <NodeIcon name="Share2" className="size-3.5 text-primary" /> LinkedIn Poster
                </span>
                <Badge variant="secondary" className="text-[0.65rem] font-mono">Free Tier Ready</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Supports OAuth 2.0 Access Token with automatic Person URN profile discovery or custom organization URN sharing. Full support for articles, commentary, and public updates.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
