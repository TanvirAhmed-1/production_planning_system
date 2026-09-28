"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number | string;
    isPositive?: boolean;
    label?: string;
  };
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "purple";
  badgeText?: string;
  onClick?: () => void;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  badgeText,
  onClick,
  className,
}: StatCardProps) {
  const variantStyles = {
    default: {
      border: "border-slate-200 dark:border-slate-800",
      iconBg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      accent: "text-slate-900 dark:text-slate-100",
    },
    primary: {
      border: "border-sky-200 dark:border-sky-900/60 bg-gradient-to-br from-sky-50/50 to-transparent",
      iconBg: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
      accent: "text-sky-900 dark:text-sky-100",
    },
    success: {
      border: "border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-50/50 to-transparent",
      iconBg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
      accent: "text-emerald-900 dark:text-emerald-100",
    },
    warning: {
      border: "border-amber-200 dark:border-amber-900/60 bg-gradient-to-br from-amber-50/50 to-transparent",
      iconBg: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
      accent: "text-amber-900 dark:text-amber-100",
    },
    danger: {
      border: "border-rose-200 dark:border-rose-900/60 bg-gradient-to-br from-rose-50/50 to-transparent",
      iconBg: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
      accent: "text-rose-900 dark:text-rose-100",
    },
    purple: {
      border: "border-purple-200 dark:border-purple-900/60 bg-gradient-to-br from-purple-50/50 to-transparent",
      iconBg: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
      accent: "text-purple-900 dark:text-purple-100",
    },
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <Card
      onClick={onClick}
      className={cn(
        "relative overflow-hidden transition-all duration-200 shadow-xs",
        style.border,
        onClick && "cursor-pointer hover:shadow-md hover:-translate-y-0.5",
        className
      )}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase truncate">
            {title}
          </p>
          {badgeText && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">
              {badgeText}
            </Badge>
          )}
        </div>

        <div className="mt-2.5 flex items-baseline justify-between gap-3">
          <div>
            <h3 className={cn("text-2xl sm:text-3xl font-extrabold tracking-tight", style.accent)}>
              {value}
            </h3>
            {subtitle && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                {subtitle}
              </p>
            )}
          </div>

          {Icon && (
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-xs", style.iconBg)}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>

        {trend && (
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            {trend.isPositive === true ? (
              <span className="flex items-center gap-0.5 font-bold text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-3.5 w-3.5" />
                +{trend.value}%
              </span>
            ) : trend.isPositive === false ? (
              <span className="flex items-center gap-0.5 font-bold text-rose-600 dark:text-rose-400">
                <TrendingDown className="h-3.5 w-3.5" />
                {trend.value}%
              </span>
            ) : (
              <span className="flex items-center gap-0.5 font-medium text-slate-500">
                <Minus className="h-3.5 w-3.5" />
                {trend.value}
              </span>
            )}
            {trend.label && (
              <span className="text-slate-500 dark:text-slate-400">
                {trend.label}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
