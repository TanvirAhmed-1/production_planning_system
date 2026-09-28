"use client";

import React from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingSpinnerProps {
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({
  label = "Loading data...",
  className,
  size = "md",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div
      className={cn(
        "flex min-h-[300px] w-full flex-col items-center justify-center space-y-3 p-6",
        className
      )}
    >
      <RefreshCw
        className={cn("animate-spin text-sky-600 dark:text-sky-400", sizeClasses[size])}
      />
      {label && (
        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
}
