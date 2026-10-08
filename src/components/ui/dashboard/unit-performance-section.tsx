"use client";

import { Button } from "@/components/ui/button";
import {
  Factory,
  Users,
  Layers,
  TrendingUp,
  Clock,
  ArrowRight,
  Activity,
  CheckCircle2,
} from "lucide-react";

export interface UnitData {
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

// Unit theme palettes for distinct factory identity
const UNIT_THEMES: Record<string, {
  accentGradient: string;
  iconBg: string;
  glowColor: string;
}> = {
  U02: {
    accentGradient: "from-sky-500 via-blue-600 to-indigo-600",
    iconBg: "from-sky-500 to-blue-600",
    glowColor: "hover:shadow-sky-500/10 hover:border-sky-400/80",
  },
  U03: {
    accentGradient: "from-emerald-500 via-teal-600 to-cyan-600",
    iconBg: "from-emerald-500 to-teal-600",
    glowColor: "hover:shadow-emerald-500/10 hover:border-emerald-400/80",
  },
  U04: {
    accentGradient: "from-purple-500 via-indigo-600 to-violet-600",
    iconBg: "from-purple-500 to-indigo-600",
    glowColor: "hover:shadow-purple-500/10 hover:border-purple-400/80",
  },
  B2: {
    accentGradient: "from-amber-500 via-orange-600 to-rose-600",
    iconBg: "from-amber-500 to-orange-600",
    glowColor: "hover:shadow-amber-500/10 hover:border-amber-400/80",
  },
};

const getUnitTheme = (code: string) => {
  if (UNIT_THEMES[code]) return UNIT_THEMES[code];
  if (code.startsWith("B2")) return UNIT_THEMES.B2;
  return {
    accentGradient: "from-indigo-500 via-blue-600 to-cyan-600",
    iconBg: "from-indigo-500 to-blue-600",
    glowColor: "hover:shadow-indigo-500/10 hover:border-indigo-400/80",
  };
};

const getEfficiencyStatus = (eff: number) => {
  if (eff >= 80) {
    return {
      label: "Optimal Tier",
      badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
      dotClass: "bg-emerald-500",
      progressClass: "from-emerald-500 to-teal-500",
    };
  }
  if (eff >= 70) {
    return {
      label: "On Target",
      badgeClass: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
      dotClass: "bg-sky-500",
      progressClass: "from-sky-500 to-blue-500",
    };
  }
  if (eff >= 60) {
    return {
      label: "Moderate",
      badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
      dotClass: "bg-amber-500",
      progressClass: "from-amber-500 to-orange-500",
    };
  }
  return {
    label: "Supervision",
    badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    dotClass: "bg-rose-500",
    progressClass: "from-rose-500 to-red-500",
  };
};

export function UnitPerformanceSection({ units, onSelectUnit }: UnitPerformanceSectionProps) {
  if (!units || units.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center text-sm text-slate-500">
        No manufacturing unit performance data available for current selection.
      </div>
    );
  }

  return (
    <div>
      {/* Grid of Redesigned Unit Cards (3 columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {units.map((unit) => {
          const theme = getUnitTheme(unit.unitCode);
          const status = getEfficiencyStatus(unit.efficiency);
          const hasActual = (unit.actual || 0) > 0;
          const achievement = unit.achievementRate || (unit.target > 0 ? Number(((unit.actual / unit.target) * 100).toFixed(1)) : 0);

          return (
            <div
              key={unit.unitId || unit.unitCode}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${theme.glowColor}`}
            >
              {/* Top Accent Gradient Bar */}
              <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${theme.accentGradient}`} />

              <div className="space-y-4">
                {/* Header: Unit Code, Name & Status Badge */}
                <div className="flex items-start justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr ${theme.iconBg} text-white shadow-md shadow-slate-900/10`}>
                      <Factory className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                          Unit {unit.unitCode}
                        </h4>
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[130px]">
                        {unit.unitName || `Manufacturing Unit ${unit.unitCode}`}
                      </p>
                    </div>
                  </div>

                  {/* Efficiency Pill */}
                  <div className="flex flex-col items-end gap-1">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold font-mono border ${status.badgeClass}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass} animate-pulse`} />
                      {unit.efficiency}%
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                      {status.label}
                    </span>
                  </div>
                </div>

                {/* Primary Stats: Planned Target & Planned SAH */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="relative overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-850/60 p-3 transition-colors group-hover:bg-sky-50/40 dark:group-hover:bg-slate-800/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Target Output
                    </span>
                    <div className="text-sm font-black font-mono text-slate-900 dark:text-slate-100 tracking-tight">
                      {unit.target >= 1_000_000
                        ? `${(unit.target / 1_000_000).toFixed(2)}M pcs`
                        : `${unit.target.toLocaleString()} pcs`}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Exact:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                        {unit.target.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-850/60 p-3 transition-colors group-hover:bg-purple-50/40 dark:group-hover:bg-slate-800/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Planned SAH
                    </span>
                    <div className="text-sm font-black font-mono text-purple-700 dark:text-purple-400 tracking-tight">
                      {unit.sah ? unit.sah.toLocaleString() : 0} hrs
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Machine:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                        {unit.clockHours ? `${unit.clockHours.toLocaleString()}h` : "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Capacity Badges Row */}
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50/60 dark:bg-slate-850/40 p-2.5 border border-slate-100 dark:border-slate-800/60 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-slate-400 mb-0.5">
                      <Layers className="h-3 w-3 text-sky-500" />
                      <span>Lines</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {unit.totalLines}
                    </span>
                  </div>

                  <div className="border-x border-slate-200/80 dark:border-slate-750">
                    <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-slate-400 mb-0.5">
                      <Users className="h-3 w-3 text-indigo-500" />
                      <span>Workers</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {unit.totalManpower.toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-slate-400 mb-0.5">
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                      <span>Achieve</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {hasActual ? `${achievement}%` : "100% Plan"}
                    </span>
                  </div>
                </div>

                {/* Progress Bar & Benchmark */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <Activity className="h-3 w-3 text-sky-500" />
                      <span>Operating Efficiency</span>
                    </span>
                    <span className="font-extrabold font-mono text-slate-900 dark:text-slate-100">
                      {unit.efficiency}% <span className="text-[10px] font-normal text-slate-400">(Bench: 80%)</span>
                    </span>
                  </div>

                  <div className="relative w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5">
                    {/* 80% Benchmark Marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-400/80 dark:bg-slate-500 z-10"
                      style={{ left: "80%" }}
                      title="80% Standard Target Benchmark"
                    />
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${status.progressClass} transition-all duration-500 shadow-xs`}
                      style={{ width: `${Math.min(100, Math.max(5, unit.efficiency))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectUnit?.(unit.unitCode)}
                  className="w-full h-8 text-xs font-semibold gap-1.5 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-900 hover:text-white dark:hover:bg-sky-600 dark:hover:text-white dark:hover:border-sky-600 transition-all group-hover:border-sky-400/60 shadow-xs cursor-pointer"
                >
                  <span>Filter Unit {unit.unitCode} Performance</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
