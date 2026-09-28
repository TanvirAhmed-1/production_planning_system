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
      color: "from-blue-500 to-sky-600",
      iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
      trend: "Confirmed Orders",
      trendPositive: true
    },
    {
      id: "planned-production",
      title: "Total Planned Production",
      value: formatNumber(data.totalPlannedProduction),
      rawVal: data.totalPlannedProduction.toLocaleString() + " pcs",
      subtitle: "Month Sign-off Plan",
      icon: CalendarCheck,
      color: "from-indigo-500 to-purple-600",
      iconBg: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400",
      trend: "October 2026",
      trendPositive: true
    },
    {
      id: "target-sah",
      title: "Planned SAH (Hours)",
      value: formatNumber(data.targetSAH || data.totalSAH),
      rawVal: `${(data.targetSAH || data.totalSAH).toLocaleString()} SAH`,
      subtitle: `${formatNumber(data.totalClockHours || 820082)} Machine Hrs`,
      icon: Clock,
      color: "from-fuchsia-500 to-pink-600",
      iconBg: "bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950/60 dark:text-fuchsia-400",
      trend: "Std Allowed Hours",
      trendPositive: true
    },
    {
      id: "average-efficiency",
      title: "Average Efficiency",
      value: `${data.averageEfficiency}%`,
      rawVal: `${data.averageEfficiency}%`,
      subtitle: "Factory target benchmark: 80%",
      icon: TrendingUp,
      color: "from-amber-500 to-orange-600",
      iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
      trend: data.averageEfficiency >= 80 ? "On Target" : "Plan Baseline",
      trendPositive: data.averageEfficiency >= 70
    },
    {
      id: "highest-efficiency",
      title: "Highest Line Efficiency",
      value: `${data.highestLineEfficiency}%`,
      rawVal: `${data.highestLineEfficiency}%`,
      subtitle: "Top performing line",
      icon: Award,
      color: "from-teal-500 to-emerald-600",
      iconBg: "bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400",
      trend: "Peak Performance",
      trendPositive: true
    },
    {
      id: "lowest-efficiency",
      title: "Lowest Line Efficiency",
      value: `${data.lowestLineEfficiency}%`,
      rawVal: `${data.lowestLineEfficiency}%`,
      subtitle: "Bottleneck supervision needed",
      icon: AlertOctagon,
      color: "from-rose-500 to-red-600",
      iconBg: "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400",
      trend: "Bottleneck Alert",
      trendPositive: false
    },
    {
      id: "production-lines",
      title: "Total Production Lines",
      value: data.totalActiveLines.toString(),
      rawVal: `${data.totalActiveLines} Lines`,
      subtitle: "Across U02, U03, U04, B2",
      icon: Layers,
      color: "from-cyan-500 to-blue-600",
      iconBg: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400",
      trend: "100% Operational",
      trendPositive: true
    },
    {
      id: "total-manpower",
      title: "Total Manpower",
      value: data.totalManpower.toLocaleString(),
      rawVal: `${data.totalManpower.toLocaleString()} Operators`,
      subtitle: data.totalActiveLines > 0 
        ? `Avg ${(data.totalManpower / data.totalActiveLines).toFixed(1)} workers / line`
        : "Active operators",
      icon: Users,
      color: "from-violet-500 to-indigo-600",
      iconBg: "bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400",
      trend: "10 hrs/day capacity",
      trendPositive: true
    },
    {
      id: "actual-production",
      title: "Actual Output",
      value: formatNumber(data.totalActualProduction),
      rawVal: data.totalActualProduction.toLocaleString() + " pcs",
      subtitle: `Plan Target: ${formatNumber(data.totalPlannedProduction)}`,
      icon: CheckCircle2,
      color: "from-emerald-500 to-teal-600",
      iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
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
      color: "from-emerald-500 to-green-600",
      iconBg: "bg-green-50 text-green-600 dark:bg-green-950/60 dark:text-green-400",
      trend: data.targetAchievementRate >= 90 ? "Excellent" : "In Progress",
      trendPositive: data.targetAchievementRate >= 85
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.id}
            onClick={() => onCardClick?.(card.id)}
            className="cursor-pointer border border-slate-200/90 hover:border-sky-400 hover:shadow-md transition-all group dark:border-slate-800 dark:hover:border-sky-600"
          >
            <CardContent className="p-3.5 sm:p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                  {card.title}
                </span>
                <div className={cn("flex h-7 w-7 items-center justify-center rounded-md transition-transform group-hover:scale-110", card.iconBg)}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-2">
                <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  {card.value}
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400 truncate max-w-[110px]" title={card.subtitle}>
                    {card.subtitle}
                  </span>
                  <span
                    className={cn(
                      "font-semibold flex items-center text-[10px]",
                      card.trendPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {card.trendPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
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
