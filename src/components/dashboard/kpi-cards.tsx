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
      iconBg: "bg-white/20 text-white backdrop-blur-sm shadow-inner",
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
      iconBg: "bg-white/20 text-white backdrop-blur-sm shadow-inner",
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
      iconBg: "bg-white/20 text-white backdrop-blur-sm shadow-inner",
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
      iconBg: "bg-white/20 text-white backdrop-blur-sm shadow-inner",
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
      iconBg: "bg-white/20 text-white backdrop-blur-sm shadow-inner",
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
      iconBg: "bg-white/20 text-white backdrop-blur-sm shadow-inner",
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
      iconBg: "bg-white/20 text-white backdrop-blur-sm shadow-inner",
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
      iconBg: "bg-white/20 text-white backdrop-blur-sm shadow-inner",
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
      iconBg: "bg-white/20 text-white backdrop-blur-sm shadow-inner",
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
      iconBg: "bg-white/20 text-white backdrop-blur-sm shadow-inner",
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
            className={cn(
              "relative cursor-pointer overflow-hidden border-0 transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl",
              `bg-gradient-to-br ${card.color}`
            )}
          >
            {/* Glass shine effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <CardContent className="relative p-3.5 sm:p-4 z-10 text-white">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-white/80 tracking-wide uppercase truncate max-w-[120px]">
                  {card.title}
                </span>
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm", card.iconBg || "bg-white/20 text-white backdrop-blur-md")}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-sm">
                  {card.value}
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-white/80 font-medium truncate max-w-[110px]" title={card.subtitle}>
                    {card.subtitle}
                  </span>
                  <span
                    className={cn(
                      "font-bold flex items-center text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full backdrop-blur-md border border-white/10",
                      card.trendPositive ? "text-white" : "text-rose-100"
                    )}
                  >
                    {card.trendPositive ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
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
