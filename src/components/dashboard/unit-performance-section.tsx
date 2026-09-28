"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Factory, Users, Layers, TrendingUp, Clock, ArrowRight } from "lucide-react";

interface UnitData {
  unitId: string;
  unitCode: string;
  unitName: string;
  totalLines: number;
  totalManpower: number;
  target: number;
  actual: number;
  gap: number;
  sah: number;
  actualSah?: number;
  clockHours?: number;
  plannedEfficiency?: number;
  efficiency: number;
  achievementRate: number;
}

interface UnitPerformanceSectionProps {
  units: UnitData[];
  onSelectUnit?: (unitCode: string) => void;
}

export function UnitPerformanceSection({ units, onSelectUnit }: UnitPerformanceSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Factory className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            Unit-wise Factory Capacity & Performance
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Comparative performance across manufacturing units: U02, U03, U04, and B2
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {units.map((unit) => {
          return (
            <Card
              key={unit.unitId || unit.unitCode}
              className="border-slate-200/90 hover:border-sky-400 transition-all shadow-xs hover:shadow-md dark:border-slate-800 dark:hover:border-sky-600"
            >
              <CardHeader className="pb-2 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                      Unit {unit.unitCode}
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] font-semibold">
                      {unit.unitName}
                    </Badge>
                  </div>
                </div>

                <Badge
                  variant={unit.efficiency >= 80 ? "success" : unit.efficiency >= 70 ? "info" : unit.efficiency >= 60 ? "warning" : "destructive"}
                  className="text-xs font-bold font-mono"
                >
                  {unit.efficiency}% Eff
                </Badge>
              </CardHeader>

              <CardContent className="pt-3 space-y-3">
                {/* Production Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/60">
                    <span className="text-[10px] text-slate-500 block">Planned Target</span>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 font-mono">
                      {unit.target.toLocaleString()} pcs
                    </span>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/60">
                    <span className="text-[10px] text-slate-500 block">Planned SAH</span>
                    <span className="font-extrabold text-sm text-purple-600 dark:text-purple-400 font-mono">
                      {unit.sah ? unit.sah.toLocaleString() : 0} hrs
                    </span>
                  </div>
                </div>

                {/* Capacity Details */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-sky-500" />
                      Total Lines:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{unit.totalLines} lines</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-indigo-500" />
                      Total Operators:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{unit.totalManpower.toLocaleString()} workers</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      Machine Hours:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {unit.clockHours ? unit.clockHours.toLocaleString() : "-"} hrs
                    </span>
                  </div>
                </div>

                {/* Efficiency Visual Progress */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1 font-medium">
                    <span className="text-slate-500">Planned Efficiency:</span>
                    <span className="font-bold font-mono">{unit.efficiency}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${
                        unit.efficiency >= 80
                          ? "bg-emerald-500"
                          : unit.efficiency >= 70
                          ? "bg-sky-500"
                          : unit.efficiency >= 60
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                      style={{ width: `${Math.min(100, unit.efficiency)}%` }}
                    />
                  </div>
                </div>

                {/* Drill Down Action */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectUnit?.(unit.unitCode)}
                  className="w-full h-8 text-xs font-semibold gap-1.5 border-slate-200 hover:bg-sky-50 hover:text-sky-700 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <span>Filter Unit {unit.unitCode}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
