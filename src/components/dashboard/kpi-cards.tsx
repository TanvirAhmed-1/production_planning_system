"use client";

import React from "react";
import {
  ShoppingBag,
  CalendarCheck,
  CheckCircle2,
  TrendingUp,
  Award,
  AlertOctagon,
  Layers,
  Users,
  Clock,
  Target,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiData {
  totalOrderQty: number;
  totalOrders: number;
  totalPlannedProduction: number;
  totalActualProduction: number;
  totalGap: number;
  averageEfficiency: number;
  plannedEfficiency?: number;
  actualEfficiency?: number;
  highestLineEfficiency: number;
  lowestLineEfficiency: number;
  totalActiveLines: number;
  totalRegisteredLines: number;
  totalManpower: number;
  totalSAH: number;
  targetSAH: number;
  totalClockHours?: number;
  targetAchievementRate: number;
  status: string;
}

interface KpiCardsProps {
  data: KpiData;
  onCardClick?: (kpiKey: string) => void;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + "k";
  }
  return num.toLocaleString();
}

export function KpiCards({ data, onCardClick }: KpiCardsProps) {
  const cards = [
    {
      id: "order-qty",
      title: "Total Order Quantity",
      value: formatNumber(data.totalOrderQty),
      rawVal: data.totalOrderQty.toLocaleString() + " pcs",
      subtitle: `${data.totalOrders.toLocaleString()} active orders`,
      icon: ShoppingBag,
      accent: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
      badgeBg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
      topBorder: "hover:border-blue-300 dark:hover:border-blue-700",
      trend: "Confirmed",
      trendPositive: true
    },
    {
      id: "planned-production",
      title: "Total Planned Target",
      value: formatNumber(data.totalPlannedProduction),
      rawVal: data.totalPlannedProduction.toLocaleString() + " pcs",
      subtitle: "Month Sign-off Plan",
      icon: CalendarCheck,
      accent: "text-indigo-600 dark:text-indigo-400",
      iconBg: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400",
      badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800",
      topBorder: "hover:border-indigo-300 dark:hover:border-indigo-700",
      trend: "October 2026",
      trendPositive: true
    },
    {
      id: "actual-production",
      title: "Actual Floor Output",
      value: formatNumber(data.totalActualProduction),
      rawVal: data.totalActualProduction.toLocaleString() + " pcs",
      subtitle: `Plan: ${formatNumber(data.totalPlannedProduction)}`,
      icon: CheckCircle2,
      accent: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
      topBorder: "hover:border-emerald-300 dark:hover:border-emerald-700",
      trend: `${data.targetAchievementRate}% achieved`,
      trendPositive: data.targetAchievementRate >= 80
    },
    {
      id: "target-achievement",
      title: "Plan Achievement Rate",
      value: `${data.targetAchievementRate}%`,
      rawVal: `${data.targetAchievementRate}%`,
      subtitle: "Actual / Target output",
      icon: Target,
      accent: data.targetAchievementRate >= 80 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400",
      iconBg: data.targetAchievementRate >= 80 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400" : "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
      badgeBg: data.targetAchievementRate >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800" : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
      topBorder: "hover:border-emerald-300 dark:hover:border-emerald-700",
      trend: data.targetAchievementRate >= 85 ? "On Track" : "In Progress",
      trendPositive: data.targetAchievementRate >= 80
    },
    {
      id: "average-efficiency",
      title: "Average Efficiency",
      value: `${data.averageEfficiency}%`,
      rawVal: `${data.averageEfficiency}%`,
      subtitle: `Target: 80% Benchmark`,
      icon: TrendingUp,
      accent: data.averageEfficiency >= 70 ? "text-teal-600 dark:text-teal-400" : "text-amber-600 dark:text-amber-400",
      iconBg: data.averageEfficiency >= 70 ? "bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400" : "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
      badgeBg: data.averageEfficiency >= 70 ? "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800" : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
      topBorder: "hover:border-teal-300 dark:hover:border-teal-700",
      trend: data.averageEfficiency >= 80 ? "On Target" : "Plan Baseline",
      trendPositive: data.averageEfficiency >= 70
    },
    {
      id: "target-sah",
      title: "Planned SAH (Hours)",
      value: formatNumber(data.targetSAH || data.totalSAH),
      rawVal: `${(data.targetSAH || data.totalSAH).toLocaleString()} SAH`,
      subtitle: `${formatNumber(data.totalClockHours || 820082)} Machine Hrs`,
      icon: Clock,
      accent: "text-purple-600 dark:text-purple-400",
      iconBg: "bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400",
      badgeBg: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
      topBorder: "hover:border-purple-300 dark:hover:border-purple-700",
      trend: "Std Allowed",
      trendPositive: true
    },
    {
      id: "highest-efficiency",
      title: "Highest Line Eff",
      value: `${data.highestLineEfficiency}%`,
      rawVal: `${data.highestLineEfficiency}%`,
      subtitle: "Top performing line",
      icon: Award,
      accent: "text-teal-600 dark:text-teal-400",
      iconBg: "bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400",
      badgeBg: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800",
      topBorder: "hover:border-teal-300 dark:hover:border-teal-700",
      trend: "Peak Output",
      trendPositive: true
    },
    {
      id: "lowest-efficiency",
      title: "Lowest Line Eff",
      value: `${data.lowestLineEfficiency}%`,
      rawVal: `${data.lowestLineEfficiency}%`,
      subtitle: "Supervision needed",
      icon: AlertOctagon,
      accent: "text-rose-600 dark:text-rose-400",
      iconBg: "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400",
      badgeBg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
      topBorder: "hover:border-rose-300 dark:hover:border-rose-700",
      trend: "Bottleneck",
      trendPositive: false
    },
    {
      id: "production-lines",
      title: "Total Active Lines",
      value: data.totalActiveLines.toString(),
      rawVal: `${data.totalActiveLines} Lines`,
      subtitle: `Of ${data.totalRegisteredLines || 200} lines`,
      icon: Layers,
      accent: "text-cyan-600 dark:text-cyan-400",
      iconBg: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400",
      badgeBg: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800",
      topBorder: "hover:border-cyan-300 dark:hover:border-cyan-700",
      trend: "Operational",
      trendPositive: true
    },
    {
      id: "total-manpower",
      title: "Total Manpower",
      value: data.totalManpower.toLocaleString(),
      rawVal: `${data.totalManpower.toLocaleString()} Operators`,
      subtitle: data.totalActiveLines > 0
        ? `Avg ${(data.totalManpower / data.totalActiveLines).toFixed(1)} / line`
        : "Floor operators",
      icon: Users,
      accent: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
      badgeBg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
      topBorder: "hover:border-blue-300 dark:hover:border-blue-700",
      trend: "Capacity",
      trendPositive: true
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.id}
            onClick={() => onCardClick?.(card.id)}
            className={cn(
              "group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200/90 bg-white p-3 sm:p-3.5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900",
              card.topBorder
            )}
          >
            <CardContent className="p-0">
              {/* Top Row: Title & Mini Icon */}
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 leading-tight">
                  {card.title}
                </span>
                <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-2xs transition-transform duration-200 group-hover:scale-105", card.iconBg)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>

              {/* Main Metric Value (Clean, Well-sized, Not oversized) */}
              <div className="mt-2.5">
                <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-50">
                  {card.value}
                </div>

                {/* Bottom Row: Subtitle & Compact Status Badge */}
                <div className="mt-2 flex items-center justify-between gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 text-[10px]">
                  <span className="text-slate-500 dark:text-slate-400 font-medium truncate" title={card.subtitle}>
                    {card.subtitle}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center font-semibold px-1.5 py-0.5 rounded border shrink-0",
                      card.badgeBg
                    )}
                  >
                    {card.trendPositive ? (
                      <ArrowUpRight className="h-2.5 w-2.5 mr-0.5" />
                    ) : (
                      <ArrowDownRight className="h-2.5 w-2.5 mr-0.5" />
                    )}
                    {card.trend}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
