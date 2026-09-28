"use client";

import React from "react";
import { LucideIcon, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  className?: string;
}

export function EmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/30",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-800 dark:ring-slate-700">
        <Icon className="h-7 w-7 text-slate-500 dark:text-slate-400" />
      </div>
      <h3 className="mt-4 text-base font-bold text-slate-800 dark:text-slate-200">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="mt-5 gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm"
        >
          {ActionIcon && <ActionIcon className="h-4 w-4" />}
          <span>{actionLabel}</span>
        </Button>
      )}
    </div>
  );
}
