"use client";

import Link from "next/link";
import { AlertCircleIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

export default function WorkflowError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <div className="rounded-full bg-destructive/10 p-3 text-destructive">
        <AlertCircleIcon className="size-8" />
      </div>
      <h1 className="text-xl font-semibold tracking-tight">Workflow Not Available</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        This workflow could not be found, may have been deleted, or does not exist in this database.
      </p>
      <div className="flex items-center gap-3">
        <Link href="/w" className={buttonVariants({ variant: "default" })}>
          Back to Workflows
        </Link>
        <button
          type="button"
          onClick={() => reset()}
          className={buttonVariants({ variant: "outline" })}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
