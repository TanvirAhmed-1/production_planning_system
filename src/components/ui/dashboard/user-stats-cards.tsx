"use client";

import React from "react";
import { Users, ShieldAlert, UserCheck, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { UserCounts } from "./user-types";

interface UserStatsCardsProps {
  counts: UserCounts;
  selectedRole: string;
  onSelectRole?: (role: string) => void;
}

export function UserStatsCards({ counts, selectedRole, onSelectRole }: UserStatsCardsProps) {
  const cards = [
    {
      id: "ALL",
      title: "Total Users",
      count: counts.total,
      subtext: "System registered accounts",
      icon: Users,
      iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 dark:bg-blue-500/20",
      borderHover: "hover:border-blue-400/50",
      activeRing: selectedRole === "ALL" ? "ring-2 ring-blue-500/30 border-blue-400 dark:border-blue-500" : "",
      accentColor: "text-slate-900 dark:text-white"
    },
    {
      id: "SUPER_ADMIN",
      title: "Super Admins",
      count: counts.superAdmins,
      subtext: "Full control authorized",
      icon: ShieldAlert,
      iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 dark:bg-purple-500/20",
      borderHover: "hover:border-purple-400/50",
      activeRing: selectedRole === "SUPER_ADMIN" ? "ring-2 ring-purple-500/30 border-purple-400 dark:border-purple-500" : "",
      accentColor: "text-purple-600 dark:text-purple-400"
    },
    {
      id: "PLANNER",
      title: "Planners",
      count: counts.planners,
      subtext: "Planning & floor access",
      icon: UserCheck,
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20",
      borderHover: "hover:border-emerald-400/50",
      activeRing: selectedRole === "PLANNER" ? "ring-2 ring-emerald-500/30 border-emerald-400 dark:border-emerald-500" : "",
      accentColor: "text-emerald-600 dark:text-emerald-400"
    },
    {
      id: "ACTIVE_STATUS",
      title: "Active Status",
      count: counts.active,
      totalCount: counts.total,
      subtext: "Enabled logins",
      icon: CheckCircle2,
      iconBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 dark:bg-sky-500/20",
      borderHover: "hover:border-sky-400/50",
      activeRing: "",
      accentColor: "text-sky-600 dark:text-sky-400"
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const isClickable = Boolean(onSelectRole && card.id !== "ACTIVE_STATUS");

        return (
          <Card
            key={card.title}
            onClick={() => {
              if (isClickable && onSelectRole) {
                onSelectRole(selectedRole === card.id ? "ALL" : card.id);
              }
            }}
            className={`transition-all duration-200 border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs ${
              isClickable ? "cursor-pointer " + card.borderHover : ""
            } ${card.activeRing}`}
          >
            <CardContent className="p-3.5 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {card.title}
                </span>
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${card.iconBg}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-black font-mono tracking-tight ${card.accentColor}`}>
                  {card.count}
                </span>
                {card.totalCount !== undefined && (
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    / {card.totalCount}
                  </span>
                )}
              </div>

              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mt-1 truncate">
                {card.subtext}
              </span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
