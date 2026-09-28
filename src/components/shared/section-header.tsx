"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  badge,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1",
        className
      )}
    >
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          {badge && (
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-semibold">
              {badge}
            </Badge>
          )}
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>

      {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
    </div>
  );
}
