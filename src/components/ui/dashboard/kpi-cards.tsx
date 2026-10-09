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
  totalPlannedLines?: number;
  totalActualLines?: number;
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
      gradient: "from-blue-500/10 via-sky-500/5 to-white dark:from-blue-950/40 dark:via-sky-950/20 dark:to-slate-900 border-blue-200/80 hover:border-blue-400",
      accent: "text-blue-600 dark:text-blue-400",
    },
    {
      id: "planned-production",
      title: "Total Planned Target",
      value: formatNumber(data.totalPlannedProduction),
      rawVal: data.totalPlannedProduction.toLocaleString() + " pcs",
      gradient: "from-indigo-500/10 via-purple-500/5 to-white dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900 border-indigo-200/80 hover:border-indigo-400",
      accent: "text-indigo-600 dark:text-indigo-400",
    },
    {
      id: "actual-production",
      title: "Actual Floor Output",
      value: formatNumber(data.totalActualProduction),
      rawVal: data.totalActualProduction.toLocaleString() + " pcs",
      gradient: "from-emerald-500/10 via-teal-500/5 to-white dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-slate-900 border-emerald-200/80 hover:border-emerald-400",
      accent: "text-emerald-600 dark:text-emerald-400",
    },
    {
      id: "target-achievement",
      title: "Plan Achievement Rate",
      value: `${data.targetAchievementRate}%`,
      rawVal: `${data.targetAchievementRate}%`,
      gradient: "from-amber-500/10 via-orange-500/5 to-white dark:from-amber-950/40 dark:via-orange-950/20 dark:to-slate-900 border-amber-200/80 hover:border-amber-400",
      accent: "text-amber-600 dark:text-amber-400",
    },
    {
      id: "average-efficiency",
      title: "Average Efficiency",
      value: `${data.averageEfficiency}%`,
      rawVal: `${data.averageEfficiency}%`,
      gradient: "from-teal-500/10 via-cyan-500/5 to-white dark:from-teal-950/40 dark:via-cyan-950/20 dark:to-slate-900 border-teal-200/80 hover:border-teal-400",
      accent: "text-teal-600 dark:text-teal-400",
    },
    {
      id: "target-sah",
      title: "Planned SAH (Hours)",
      value: formatNumber(data.targetSAH || data.totalSAH),
      rawVal: `${(data.targetSAH || data.totalSAH).toLocaleString()} SAH`,
      gradient: "from-purple-500/10 via-violet-500/5 to-white dark:from-purple-950/40 dark:via-violet-950/20 dark:to-slate-900 border-purple-200/80 hover:border-purple-400",
      accent: "text-purple-600 dark:text-purple-400",
    },
    {
      id: "highest-efficiency",
      title: "Highest Line Eff",
      value: `${data.highestLineEfficiency}%`,
      rawVal: `${data.highestLineEfficiency}%`,
      gradient: "from-teal-500/10 via-emerald-500/5 to-white dark:from-teal-950/40 dark:via-emerald-950/20 dark:to-slate-900 border-teal-200/80 hover:border-teal-400",
      accent: "text-teal-600 dark:text-teal-400",
    },
    {
      id: "lowest-efficiency",
      title: "Lowest Line Eff",
      value: `${data.lowestLineEfficiency}%`,
      rawVal: `${data.lowestLineEfficiency}%`,
      gradient: "from-rose-500/10 via-red-500/5 to-white dark:from-rose-950/40 dark:via-red-950/20 dark:to-slate-900 border-rose-200/80 hover:border-rose-400",
      accent: "text-rose-600 dark:text-rose-400",
    },
    {
      id: "production-lines",
      title: "Total Active Lines",
      value: data.totalActiveLines.toString(),
      rawVal: `${data.totalActiveLines} Lines`,
      gradient: "from-cyan-500/10 via-sky-500/5 to-white dark:from-cyan-950/40 dark:via-sky-950/20 dark:to-slate-900 border-cyan-200/80 hover:border-cyan-400",
      accent: "text-cyan-600 dark:text-cyan-400",
    },
    {
      id: "plan-lines",
      title: "Production Plan Lines",
      value: (data.totalPlannedLines !== undefined ? data.totalPlannedLines : data.totalActiveLines).toString(),
      rawVal: `${data.totalPlannedLines !== undefined ? data.totalPlannedLines : data.totalActiveLines} Lines Planned`,
      gradient: "from-indigo-500/10 via-blue-500/5 to-white dark:from-indigo-950/40 dark:via-blue-950/20 dark:to-slate-900 border-indigo-200/80 hover:border-indigo-400",
      accent: "text-indigo-600 dark:text-indigo-400",
    },
    {
      id: "actual-lines",
      title: "Actual Production Lines",
      value: (data.totalActualLines !== undefined ? data.totalActualLines : 0).toString(),
      rawVal: `${data.totalActualLines !== undefined ? data.totalActualLines : 0} Floor Lines`,
      gradient: "from-emerald-500/10 via-green-500/5 to-white dark:from-emerald-950/40 dark:via-green-950/20 dark:to-slate-900 border-emerald-200/80 hover:border-emerald-400",
      accent: "text-emerald-600 dark:text-emerald-400",
    },
    {
      id: "total-manpower",
      title: "Total Manpower",
      value: data.totalManpower.toLocaleString(),
      rawVal: `${data.totalManpower.toLocaleString()} Operators`,
      gradient: "from-blue-500/10 via-indigo-500/5 to-white dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-slate-900 border-blue-200/80 hover:border-blue-400",
      accent: "text-blue-600 dark:text-blue-400",
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
      {cards.map((card) => {
        return (
          <Card
            key={card.id}
            onClick={() => onCardClick?.(card.id)}
            className={cn(
              "group relative cursor-pointer overflow-hidden rounded-lg border bg-gradient-to-br p-2 sm:px-2.5 sm:py-2 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm",
              card.gradient
            )}
          >
            <CardContent className="p-0 sm:p-2 flex flex-col justify-between h-full">
              {/* Top Row: Title (Full 2 lines) */}
              <div className="flex items-start w-full min-h-[28px]">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 leading-tight line-clamp-2">
                  {card.title}
                </span>
              </div>

              {/* Main Metric Value */}
              <div className="mt-1">
                <div className={cn("text-lg sm:text-xl font-bold font-mono tracking-tight leading-none text-slate-900 dark:text-slate-50")}>
                  {card.value}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
