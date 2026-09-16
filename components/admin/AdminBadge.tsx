import { cn } from "@/lib/utils";

export interface AdminBadgeProps {
  variant?: "success" | "error" | "pending" | "warning" | "neutral" | "brand";
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export function AdminBadge({ variant = "neutral", children, className, dot = false }: AdminBadgeProps) {
  const variantStyles = {
    success: "text-[#10B981] bg-[rgba(16,185,129,0.1)] border-[rgba(16,185,129,0.2)]",
    error: "text-[#EF4444] bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.2)]",
    pending: "text-[#94A3B8] bg-[rgba(148,163,184,0.1)] border-[rgba(148,163,184,0.2)]",
    warning: "text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]",
    neutral: "text-[#94A3B8] bg-[#14161B] border-[#1E222B]",
    brand: "text-purple-400 bg-[rgba(168,85,247,0.1)] border-[rgba(168,85,247,0.25)]",
  };

  const dotColors = {
    success: "bg-[#10B981]",
    error: "bg-[#EF4444]",
    pending: "bg-[#94A3B8]",
    warning: "bg-[#F59E0B]",
    neutral: "bg-[#64748B]",
    brand: "bg-purple-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border font-mono tracking-tight",
        variantStyles[variant],
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full animate-pulse", dotColors[variant])} />}
      {children}
    </span>
  );
}
