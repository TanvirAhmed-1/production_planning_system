"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, CheckCircle2, AlertTriangle, ArrowRight, Clock } from "lucide-react";

interface DailyEntry {
  date: string;
  shortDate: string;
  target: number;
  actual: number;
  gap: number;
  plannedEfficiency?: number;
  actualEfficiency?: number;
  efficiency: number;
  achievementRate: number;
}

interface ProductionCalendarProps {
  days: DailyEntry[];
  onSelectDate?: (dateStr: string) => void;
}

export function ProductionCalendar({ days, onSelectDate }: ProductionCalendarProps) {
  return (
    <Card className="shadow-sm border-slate-200/90 dark:border-slate-800">
      <CardHeader className="p-3.5 sm:p-5 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>Monthly Production Calendar (October 2026)</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Daily operational output grid with Planned (Production) vs Actual Floor Efficiency
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" /> ≥85%</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-500 ring-2 ring-sky-200" /> 75–84%</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500 ring-2 ring-amber-200" /> &lt;75%</span>
            <span className="flex items-center gap-1 text-slate-400"><span className="h-2 w-2 rounded-full bg-slate-300" /> Plan</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {days.map((day) => {
            const hasActual = day.actual > 0;
            const isHigh = hasActual && day.achievementRate >= 85;
            const isMedium = hasActual && day.achievementRate >= 75 && day.achievementRate < 85;
            const isLow = hasActual && day.achievementRate < 75;
            const dayNumber = parseInt(day.date.split('-')[2], 10);
            const actEff = day.actualEfficiency || (hasActual ? day.efficiency : 0);
            const planEff = day.plannedEfficiency || (hasActual ? 0 : day.efficiency);

            return (
              <div
                key={day.date}
                onClick={() => onSelectDate?.(day.date)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer hover:shadow-md hover:scale-[1.02] flex flex-col justify-between ${
                  isHigh
                    ? "bg-emerald-50/80 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800 shadow-2xs"
                    : isMedium
                    ? "bg-sky-50/80 border-sky-300 dark:bg-sky-950/30 dark:border-sky-800"
                    : isLow
                    ? "bg-amber-50/80 border-amber-300 dark:bg-amber-950/30 dark:border-amber-800"
                    : "bg-slate-50/60 border-slate-200/90 dark:bg-slate-900/40 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                      Oct {dayNumber}
                      {hasActual && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                        hasActual
                          ? isHigh
                            ? "bg-emerald-600 text-white"
                            : isMedium
                            ? "bg-sky-600 text-white"
                            : "bg-amber-600 text-white"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {hasActual ? `${actEff}% Eff` : `${planEff}% Plan`}
                    </span>
                  </div>

                  {/* Quantities (Actual vs Target) */}
                  <div className="mt-2 space-y-1 text-[11px]">
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                      <span>Actual:</span>
                      <span className={`font-bold font-mono ${hasActual ? "text-slate-900 dark:text-slate-100 text-xs" : "text-slate-400"}`}>
                        {hasActual ? `${(day.actual / 1000).toFixed(1)}k` : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-500">
                      <span>Target:</span>
                      <span className="font-mono font-medium">{(day.target / 1000).toFixed(1)}k</span>
                    </div>

                    {/* Both Efficiencies Comparison */}
                    <div className="pt-1.5 mt-1 border-t border-slate-200/60 dark:border-slate-800 space-y-0.5 text-[10px]">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Actual Eff:</span>
                        <span className={`font-bold font-mono ${hasActual ? "text-emerald-700 dark:text-emerald-400" : "text-slate-400"}`}>
                          {hasActual ? `${actEff}%` : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Plan Eff:</span>
                        <span className="font-medium font-mono text-indigo-700 dark:text-indigo-300">
                          {planEff > 0 ? `${planEff}%` : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`mt-2 pt-1.5 border-t flex items-center justify-between text-[10px] font-bold ${
                  isHigh
                    ? "border-emerald-200 text-emerald-700 dark:text-emerald-400"
                    : isMedium
                    ? "border-sky-200 text-sky-700 dark:text-sky-400"
                    : isLow
                    ? "border-amber-200 text-amber-700 dark:text-amber-400"
                    : "border-slate-200 text-slate-400 dark:text-slate-500"
                }`}>
                  <span>{hasActual ? `${day.achievementRate}% Achieved` : "Planned Target"}</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
