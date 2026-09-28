"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusType = "active" | "completed" | "warning" | "critical" | "pending" | "info";

export interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  dot?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  label,
  dot = true,
  className,
}: StatusBadgeProps) {
  const normStatus = status.toLowerCase();

  const getStatusConfig = () => {
    switch (normStatus) {
      case "active":
      case "success":
      case "completed":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
          dotBg: "bg-emerald-500",
          text: label || "Active",
        };
      case "warning":
      case "attention":
      case "delayed":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
          dotBg: "bg-amber-500",
          text: label || "Attention",
        };
      case "critical":
      case "danger":
      case "failed":
      case "lagging":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
          dotBg: "bg-rose-500 animate-pulse",
          text: label || "Critical",
        };
      case "pending":
      case "draft":
        return {
          bg: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
          dotBg: "bg-slate-400",
          text: label || "Pending",
        };
      case "info":
      case "in-progress":
      default:
        return {
          bg: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
          dotBg: "bg-sky-500",
          text: label || status,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shadow-2xs transition-colors",
        config.bg,
        className
      )}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dotBg)} />}
      <span>{config.text}</span>
    </span>
  );
}
