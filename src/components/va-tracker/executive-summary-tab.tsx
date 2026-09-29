"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Download,
  Factory,
  BarChart3,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
  Award,
  Zap,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  LabelList,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";

interface ExecutiveSummaryTabProps {
  summarySheet: any;
  exportToCSV: (rows: any[], filename: string) => void;
}

// Helper for formatting numeric cells with variance colors
function formatSummaryValue(val: number | null | undefined, isPercent = false, isVariance = false) {
  if (val === undefined || val === null || isNaN(val)) return "-";
  if (val === 0 && !isVariance) return "0";

  const absVal = Math.abs(val);
  const formattedNum = isPercent
    ? `${(absVal <= 1.5 && val !== 0 ? absVal * (absVal <= 1.5 && val <= 1.5 ? 1 : 1) : absVal).toFixed(1)}%`
    : absVal >= 100
    ? Math.round(absVal).toLocaleString()
    : absVal.toFixed(2);

  if (val < 0) {
    const text = isPercent
      ? `-${(absVal <= 1.5 && val !== 0 ? absVal : absVal).toFixed(1)}%`
      : `(${absVal >= 100 ? Math.round(absVal).toLocaleString() : absVal.toFixed(2)})`;
    return <span className="text-rose-400 font-semibold">{text}</span>;
  }

  if (isVariance && val > 0) {
    return <span className="text-emerald-400 font-semibold">+{formattedNum}</span>;
  }

  return formattedNum;
}

// Custom Tooltip for Recharts
function CustomChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const value = payload[0].value;
    return (
      <div className="bg-slate-950/95 border border-slate-700/80 rounded-lg p-3 shadow-xl backdrop-blur-md text-xs font-sans min-w-[170px] z-50">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-2">
          <span className="font-bold text-slate-200">{label || dataPoint.dateStr}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-purple-500/40 text-purple-300">
            Efficiency
          </Badge>
        </div>
        <div className="space-y-1 font-mono">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">{payload[0].name || "Efficiency"}:</span>
            <span className="font-bold text-emerald-400 text-sm">
              {value !== null && value !== undefined ? `${Number(value).toFixed(1)}%` : "N/A"}
            </span>
          </div>
          {dataPoint.isoDate && (
            <div className="text-[10px] text-slate-400 font-sans pt-1">
              Date: {dataPoint.isoDate}
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}

// Customized Bar Top Label
function RenderBarLabel(props: any) {
  const { x, y, width, value } = props;
  if (value === null || value === undefined || value === 0 || isNaN(value)) return null;
  const displayVal = `${Math.round(value)}%`;
  return (
    <text
      x={x + width / 2}
      y={y - 5}
      fill="#e2e8f0"
      textAnchor="middle"
      fontSize={10}
      fontFamily="monospace"
      fontWeight="bold"
    >
      {displayVal}
    </text>
  );
}

// Reusable Table Block Card Component
function TableBlockCard({
  block,
  badgeText,
  isMajor = false,
}: {
  block: any;
  badgeText?: string;
  isMajor?: boolean;
}) {
  if (!block || !block.rows) return null;

  const actualRow = block.rows.find((r: any) => r.label.toLowerCase() === "actual");
  const varianceRow = block.rows.find((r: any) => r.label.toLowerCase().includes("variance"));
  const actualDayEff = actualRow?.day?.eff;
  const actualMtdEff = actualRow?.mtd?.eff;
  const dayEffVar = varianceRow?.day?.eff;

  return (
    <div
      className={`border rounded-xl overflow-hidden bg-slate-900/90 shadow-lg transition-all duration-200 hover:border-slate-700 ${
        isMajor
          ? "border-slate-700/80 bg-gradient-to-b from-slate-900 to-slate-950"
          : "border-slate-800/80"
      }`}
    >
      {/* SQ Branded Table Header Bar */}
      <div className="bg-gradient-to-r from-[#3d1849] via-[#4a235a] to-[#2c1337] text-white px-3.5 py-2 border-b border-purple-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Factory className={`w-4 h-4 ${isMajor ? "text-purple-300" : "text-slate-400"}`} />
          <span className="font-extrabold text-sm tracking-wide text-white font-sans">
            {block.groupName}
          </span>
          {badgeText && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 border-purple-400/40 text-purple-200 bg-purple-950/40"
            >
              {badgeText}
            </Badge>
          )}
        </div>

        {/* Quick KPI pills on right */}
        <div className="flex items-center gap-2 font-mono text-[11px]">
          {actualDayEff !== undefined && actualDayEff > 0 && (
            <div className="bg-slate-950/60 px-2 py-0.5 rounded border border-purple-800/40 text-slate-200 flex items-center gap-1">
              <span className="text-slate-400 text-[10px]">Day:</span>
              <span className="font-bold text-amber-300">{Number(actualDayEff).toFixed(1)}%</span>
            </div>
          )}
          {actualMtdEff !== undefined && actualMtdEff > 0 && (
            <div className="bg-slate-950/60 px-2 py-0.5 rounded border border-purple-800/40 text-slate-200 flex items-center gap-1">
              <span className="text-slate-400 text-[10px]">MTD:</span>
              <span className="font-bold text-emerald-400">{Number(actualMtdEff).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Table Structure */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-xs text-center font-mono border-collapse">
          {/* Grouped Headers */}
          <thead>
            <tr className="bg-slate-950/90 text-[11px] font-bold text-slate-300 border-b border-slate-800">
              <th className="py-1.5 px-3 text-left font-sans text-slate-400 w-[180px]">
                Performance Metric
              </th>
              {/* Day Header - 6 Columns */}
              <th
                colSpan={6}
                className="py-1 px-2 border-l border-r border-slate-800 bg-purple-950/30 text-purple-200 font-semibold text-center"
              >
                Day ({block.dateStr || "26-Sep"})
              </th>
              {/* MTD Header - 6 Columns */}
              <th
                colSpan={6}
                className="py-1 px-2 bg-slate-900/80 text-sky-200 font-semibold text-center"
              >
                Month To Date (MTD)
              </th>
            </tr>
            {/* Sub-column Headers */}
            <tr className="bg-slate-950 text-[10.5px] font-semibold text-slate-400 border-b border-slate-800/80">
              <th className="py-1 px-3 text-left font-sans">Row Type</th>
              {/* Day Sub-cols */}
              <th className="py-1 px-1.5 border-l border-slate-800">MDs</th>
              <th className="py-1 px-1.5">Clk Hrs</th>
              <th className="py-1 px-1.5">Pcs</th>
              <th className="py-1 px-1.5">SAH</th>
              <th className="py-1 px-1.5 font-bold text-slate-300">Eff.</th>
              <th className="py-1 px-1.5 border-r border-slate-800">EPMD</th>
              {/* MTD Sub-cols */}
              <th className="py-1 px-1.5">MDs</th>
              <th className="py-1 px-1.5">Clk Hrs</th>
              <th className="py-1 px-1.5">Pcs</th>
              <th className="py-1 px-1.5">SAH</th>
              <th className="py-1 px-1.5 font-bold text-slate-300">Eff.</th>
              <th className="py-1 px-1.5">EPMD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-[11.5px]">
            {block.rows?.map((row: any, rIdx: number) => {
              const isVariance = row.label.toLowerCase().includes("variance");
              const isActual = row.label.toLowerCase() === "actual";
              const isPlan = row.label.toLowerCase().includes("sign off");

              let rowClass = "hover:bg-slate-800/40 transition-colors";
              if (isVariance) {
                rowClass = "bg-purple-950/20 font-bold border-t border-purple-900/40";
              } else if (isActual) {
                rowClass = "bg-slate-800/50 font-bold text-white";
              } else if (isPlan) {
                rowClass = "text-slate-300 hover:bg-slate-800/30";
              }

              return (
                <tr key={rIdx} className={rowClass}>
                  {/* Row Label */}
                  <td className="py-1.5 px-3 text-left font-sans text-slate-300 font-medium truncate max-w-[180px]">
                    {row.label}
                  </td>
                  {/* Day Values */}
                  <td className="py-1.5 px-1.5 border-l border-slate-800/80">
                    {formatSummaryValue(row.day?.mds, false, isVariance)}
                  </td>
                  <td className="py-1.5 px-1.5">
                    {formatSummaryValue(row.day?.clkHrs, false, isVariance)}
                  </td>
                  <td className="py-1.5 px-1.5 font-medium">
                    {formatSummaryValue(row.day?.pcs, false, isVariance)}
                  </td>
                  <td className="py-1.5 px-1.5">
                    {formatSummaryValue(row.day?.sah, false, isVariance)}
                  </td>
                  <td className="py-1.5 px-1.5 font-bold text-amber-300">
                    {formatSummaryValue(row.day?.eff, true, isVariance)}
                  </td>
                  <td className="py-1.5 px-1.5 border-r border-slate-800/80 text-slate-300">
                    {formatSummaryValue(row.day?.epmd, false, isVariance)}
                  </td>
                  {/* MTD Values */}
                  <td className="py-1.5 px-1.5">
                    {formatSummaryValue(row.mtd?.mds, false, isVariance)}
                  </td>
                  <td className="py-1.5 px-1.5">
                    {formatSummaryValue(row.mtd?.clkHrs, false, isVariance)}
                  </td>
                  <td className="py-1.5 px-1.5 font-medium">
                    {formatSummaryValue(row.mtd?.pcs, false, isVariance)}
                  </td>
                  <td className="py-1.5 px-1.5">
                    {formatSummaryValue(row.mtd?.sah, false, isVariance)}
                  </td>
                  <td className="py-1.5 px-1.5 font-bold text-emerald-400">
                    {formatSummaryValue(row.mtd?.eff, true, isVariance)}
                  </td>
                  <td className="py-1.5 px-1.5 text-slate-300">
                    {formatSummaryValue(row.mtd?.epmd, false, isVariance)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Reusable Bar Chart Component matching Excel
function ExecutiveBarChart({
  title,
  subtitle,
  dataKey,
  chartData,
  barColor = "#be123c",
  targetEff = 70,
  stats,
}: {
  title: string;
  subtitle?: string;
  dataKey: string;
  chartData: any[];
  barColor?: string;
  targetEff?: number;
  stats?: any;
}) {
  return (
    <div className="border border-slate-800 rounded-xl bg-slate-900/90 p-4 shadow-lg flex flex-col justify-between">
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-2 border-b border-slate-800">
        <div>
          <h4 className="font-bold text-sm text-white flex items-center gap-2 tracking-tight">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            {title}
          </h4>
          {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
        </div>

        {/* Quick KPI stats pill */}
        {stats && stats.avg > 0 && (
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <div className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
              Avg: <span className="text-emerald-400 font-bold">{stats.avg}%</span>
            </div>
            <div className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
              Peak: <span className="text-amber-300 font-bold">{stats.max}%</span>
            </div>
            {stats.latest > 0 && (
              <div className="bg-slate-950 px-2 py-0.5 rounded border border-purple-900/50 text-purple-200">
                Latest: <span className="font-bold">{stats.latest}%</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recharts Bar Chart */}
      <div className="w-full h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 22, right: 10, left: -20, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
            <XAxis
              dataKey="dateStr"
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#475569" }}
              angle={-45}
              textAnchor="end"
              interval={0}
              height={45}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#475569" }}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomChartTooltip />} />
            {targetEff && (
              <ReferenceLine
                y={targetEff}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{
                  value: `Target ${targetEff}%`,
                  fill: "#f59e0b",
                  fontSize: 10,
                  position: "insideTopRight",
                }}
              />
            )}
            <Bar
              dataKey={dataKey}
              name="Efficiency %"
              fill={barColor}
              radius={[3, 3, 0, 0]}
              maxBarSize={30}
            >
              <LabelList dataKey={dataKey} content={<RenderBarLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ExecutiveSummaryTab({ summarySheet, exportToCSV }: ExecutiveSummaryTabProps) {
  const [viewFilter, setViewFilter] = useState<"ALL" | "MAJOR" | "UNITS" | "CHARTS" | "MATRIX">("ALL");
  const [unitSearch, setUnitSearch] = useState<string>("");
  const [chartMode, setChartMode] = useState<"GRID" | "COMPARISON">("GRID");

  // Extract blocks safely
  const mainBlocks = summarySheet?.mainBlocks || [];
  const unitBlocks = summarySheet?.unitBlocks || {};
  const birichina01Units = unitBlocks.birichina01 || [];
  const birichina02Units = unitBlocks.birichina02 || [];
  const styraxUnits = unitBlocks.styrax || [];
  const trendDays = summarySheet?.trendDays || [];
  const trendStats = summarySheet?.trendStats || {};

  // All unit blocks combined for search
  const allUnitBlocks = useMemo(() => {
    return [
      ...birichina01Units.map((u: any) => ({ ...u, cluster: "Birichina 01" })),
      ...birichina02Units.map((u: any) => ({ ...u, cluster: "Birichina 02" })),
      ...styraxUnits.map((u: any) => ({ ...u, cluster: "Styrax" })),
    ];
  }, [birichina01Units, birichina02Units, styraxUnits]);

  // Filtered unit blocks based on search
  const filteredUnits = useMemo(() => {
    if (!unitSearch.trim()) return allUnitBlocks;
    const q = unitSearch.toLowerCase().trim();
    return allUnitBlocks.filter(
      (u: any) =>
        u.groupName.toLowerCase().includes(q) || u.cluster.toLowerCase().includes(q)
    );
  }, [allUnitBlocks, unitSearch]);

  // Key Top Executive KPIs
  const birichinaMain = mainBlocks.find((b: any) => b.groupName.toLowerCase() === "birichina");
  const styraxMain = mainBlocks.find((b: any) => b.groupName.toLowerCase() === "styrax");

  const birichinaActual = birichinaMain?.rows?.find((r: any) => r.label.toLowerCase() === "actual");
  const birichinaPlan = birichinaMain?.rows?.find((r: any) => r.label.toLowerCase().includes("sign off"));
  const birichinaVar = birichinaMain?.rows?.find((r: any) => r.label.toLowerCase().includes("variance"));

  const styraxActual = styraxMain?.rows?.find((r: any) => r.label.toLowerCase() === "actual");
  const styraxPlan = styraxMain?.rows?.find((r: any) => r.label.toLowerCase().includes("sign off"));

  return (
    <div className="space-y-6">
      {/* 1. Header & Navigation Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#4a235a] text-purple-200 border border-purple-700/50">
              {summarySheet?.company || "SQ Birichina Ltd."}
            </span>
            <Badge variant="outline" className="text-slate-400 border-slate-700 text-xs">
              <Calendar className="w-3 h-3 mr-1 text-purple-400" />
              {summarySheet?.dateStr || "26-Sep-26"}
            </Badge>
          </div>
          <h2 className="text-lg font-black text-white tracking-tight mt-1">
            {summarySheet?.title || "Snap Shot of Unitwise Performance & Efficiency Trend"}
          </h2>
        </div>

        {/* View Toggle Tabs & Export Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center gap-1 text-xs">
            <button
              onClick={() => setViewFilter("ALL")}
              className={`px-3 py-1 rounded font-medium transition-all ${
                viewFilter === "ALL"
                  ? "bg-[#4a235a] text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All Sections
            </button>
            <button
              onClick={() => setViewFilter("MAJOR")}
              className={`px-3 py-1 rounded font-medium transition-all ${
                viewFilter === "MAJOR"
                  ? "bg-[#4a235a] text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Factory Overview
            </button>
            <button
              onClick={() => setViewFilter("UNITS")}
              className={`px-3 py-1 rounded font-medium transition-all ${
                viewFilter === "UNITS"
                  ? "bg-[#4a235a] text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Unit Breakdown ({allUnitBlocks.length})
            </button>
            <button
              onClick={() => setViewFilter("CHARTS")}
              className={`px-3 py-1 rounded font-medium transition-all ${
                viewFilter === "CHARTS"
                  ? "bg-[#4a235a] text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Trend Charts
            </button>
            <button
              onClick={() => setViewFilter("MATRIX")}
              className={`px-3 py-1 rounded font-medium transition-all ${
                viewFilter === "MATRIX"
                  ? "bg-[#4a235a] text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              30-Day Matrix
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV(trendDays, "Executive_Efficiency_Trends")}
            className="border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-200 text-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" />
            Export Data
          </Button>
        </div>
      </div>

      {/* 2. Top Executive Highlight Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Card 1: SQ Birichina Day Efficiency */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium">Birichina Day Efficiency</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">
              {birichinaActual?.day?.eff ? `${birichinaActual.day.eff.toFixed(1)}%` : "-"}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Plan: {birichinaPlan?.day?.eff ? `${birichinaPlan.day.eff.toFixed(1)}%` : "-"}
            </span>
          </div>
          <div className="mt-2 text-[11px] flex items-center gap-1 font-mono">
            {birichinaVar?.day?.eff !== undefined && (
              <span
                className={`font-bold ${
                  birichinaVar.day.eff >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {birichinaVar.day.eff >= 0 ? "+" : ""}
                {birichinaVar.day.eff.toFixed(1)}% Var
              </span>
            )}
            <span className="text-slate-500">• Day Actual</span>
          </div>
        </div>

        {/* Card 2: SQ Birichina MTD Efficiency */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium">Birichina MTD Efficiency</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {birichinaActual?.mtd?.eff ? `${birichinaActual.mtd.eff.toFixed(1)}%` : "-"}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Plan: {birichinaPlan?.mtd?.eff ? `${birichinaPlan.mtd.eff.toFixed(1)}%` : "-"}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            MTD Pcs:{" "}
            <span className="font-bold text-white">
              {birichinaActual?.mtd?.pcs?.toLocaleString() || "-"}
            </span>
          </div>
        </div>

        {/* Card 3: SQ Styrax Day Efficiency */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium">Styrax Day Efficiency</span>
            <Zap className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-sky-300 font-mono">
              {styraxActual?.day?.eff ? `${styraxActual.day.eff.toFixed(1)}%` : "-"}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Plan: {styraxPlan?.day?.eff ? `${styraxPlan.day.eff.toFixed(1)}%` : "-"}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            Day Pcs:{" "}
            <span className="font-bold text-white">
              {styraxActual?.day?.pcs?.toLocaleString() || "-"}
            </span>
          </div>
        </div>

        {/* Card 4: SQ Styrax MTD Efficiency */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium">Styrax MTD Efficiency</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-300 font-mono">
              {styraxActual?.mtd?.eff ? `${styraxActual.mtd.eff.toFixed(1)}%` : "-"}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Plan: {styraxPlan?.mtd?.eff ? `${styraxPlan.mtd.eff.toFixed(1)}%` : "-"}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            MTD Pcs:{" "}
            <span className="font-bold text-white">
              {styraxActual?.mtd?.pcs?.toLocaleString() || "-"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Major Factory Performance Snapshot Tables (4 Major Blocks) */}
      {(viewFilter === "ALL" || viewFilter === "MAJOR") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white tracking-wide uppercase flex items-center gap-2">
                <Factory className="w-4 h-4 text-purple-400" />
                Factory Summary Snapshots (Major Units & Entities)
              </h3>
              <Badge variant="outline" className="text-purple-300 border-purple-500/30 text-[10px]">
                {mainBlocks.length} Summary Tables
              </Badge>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Sign Off Plan vs Rev. Plan vs Actuals vs Variance
            </span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {mainBlocks.map((block: any, idx: number) => (
              <TableBlockCard
                key={idx}
                block={block}
                isMajor={true}
                badgeText={
                  block.groupName.includes("1")
                    ? "Birichina Cluster 1"
                    : block.groupName.includes("2")
                    ? "Birichina Cluster 2"
                    : block.groupName.toLowerCase().includes("styrax")
                    ? "Styrax Plant"
                    : "Total Factory"
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* 4. Unit-wise Performance Section (Detailed Breakdown by Unit) */}
      {(viewFilter === "ALL" || viewFilter === "UNITS") && (
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-white tracking-wide uppercase flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                Unit-wise Performance Breakdown
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Detailed metrics for all production units across Birichina 01, Birichina 02 & Styrax
              </p>
            </div>

            {/* Search filter for units */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={unitSearch}
                onChange={(e) => setUnitSearch(e.target.value)}
                placeholder="Filter by unit (e.g. B1U2, S1U1)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Group 1: Birichina 01 Units */}
          {(!unitSearch || filteredUnits.some((u) => u.cluster === "Birichina 01")) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-[#4a235a] text-white font-bold text-xs px-2.5 py-0.5">
                  Birichina 01 Units
                </Badge>
                <span className="text-xs text-slate-400">
                  (B1U2, B1U3, B1U4)
                </span>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {birichina01Units
                  .filter((b: any) =>
                    !unitSearch || b.groupName.toLowerCase().includes(unitSearch.toLowerCase())
                  )
                  .map((block: any, idx: number) => (
                    <TableBlockCard
                      key={`b1-${idx}`}
                      block={block}
                      badgeText="Birichina 01"
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Group 2: Birichina 02 Units */}
          {(!unitSearch || filteredUnits.some((u) => u.cluster === "Birichina 02")) && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-sky-950 text-sky-200 border border-sky-800 font-bold text-xs px-2.5 py-0.5">
                  Birichina 02 Units
                </Badge>
                <span className="text-xs text-slate-400">
                  (B2U2, B2U3)
                </span>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {birichina02Units
                  .filter((b: any) =>
                    !unitSearch || b.groupName.toLowerCase().includes(unitSearch.toLowerCase())
                  )
                  .map((block: any, idx: number) => (
                    <TableBlockCard
                      key={`b2-${idx}`}
                      block={block}
                      badgeText="Birichina 02"
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Group 3: Styrax Units */}
          {(!unitSearch || filteredUnits.some((u) => u.cluster === "Styrax")) && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-indigo-950 text-indigo-200 border border-indigo-800 font-bold text-xs px-2.5 py-0.5">
                  Styrax Units
                </Badge>
                <span className="text-xs text-slate-400">
                  (S1U1, S1U2, S1U3, S1U4)
                </span>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {styraxUnits
                  .filter((b: any) =>
                    !unitSearch || b.groupName.toLowerCase().includes(unitSearch.toLowerCase())
                  )
                  .map((block: any, idx: number) => (
                    <TableBlockCard
                      key={`styrax-${idx}`}
                      block={block}
                      badgeText="Styrax Plant"
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Visual Efficiency Trend Bar Charts (Requested by User) */}
      {(viewFilter === "ALL" || viewFilter === "CHARTS") && (
        <div className="space-y-5 pt-4 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-white tracking-wide uppercase flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                Factory & Unit Efficiency Trends (Visual Bar Charts)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Daily progression across all working days of the month with data labels and targets
              </p>
            </div>

            {/* Chart Mode Switcher */}
            <div className="flex items-center gap-2">
              <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center gap-1 text-xs">
                <button
                  onClick={() => setChartMode("GRID")}
                  className={`px-2.5 py-1 rounded font-medium transition-all ${
                    chartMode === "GRID"
                      ? "bg-purple-900/60 text-purple-200 border border-purple-700/50"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  4 Bar Charts Grid
                </button>
                <button
                  onClick={() => setChartMode("COMPARISON")}
                  className={`px-2.5 py-1 rounded font-medium transition-all ${
                    chartMode === "COMPARISON"
                      ? "bg-purple-900/60 text-purple-200 border border-purple-700/50"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Comparison Overlay
                </button>
              </div>
            </div>
          </div>

          {/* Mode 1: 4 Visual Bar Charts Grid matching Excel */}
          {chartMode === "GRID" ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {/* Chart 1: Factory Efficiency Trend - Birichina */}
              <ExecutiveBarChart
                title="Factory Efficiency Trend - Birichina"
                subtitle="Daily overall efficiency for SQ Birichina Ltd. over the month"
                dataKey="birichina"
                chartData={trendDays}
                barColor="#c0504d"
                targetEff={70}
                stats={trendStats.birichina}
              />

              {/* Chart 2: Birichina 01 Efficiency Trend */}
              <ExecutiveBarChart
                title="Birichina 01 Efficiency Trend"
                subtitle="Daily efficiency trend for Birichina Cluster 1 (B1U2, B1U3, B1U4)"
                dataKey="b1"
                chartData={trendDays}
                barColor="#38bdf8"
                targetEff={65}
                stats={trendStats.b1}
              />

              {/* Chart 3: Birichina 02 Efficiency Trend */}
              <ExecutiveBarChart
                title="Birichina 02 Efficiency Trend"
                subtitle="Daily efficiency trend for Birichina Cluster 2 (B2U2, B2U3)"
                dataKey="b2"
                chartData={trendDays}
                barColor="#2dd4bf"
                targetEff={80}
                stats={trendStats.b2}
              />

              {/* Chart 4: Styrax Efficiency Trend */}
              <ExecutiveBarChart
                title="Styrax Efficiency Trend"
                subtitle="Daily efficiency trend for Styrax Plant (S1U1, S1U2, S1U3, S1U4)"
                dataKey="styrax"
                chartData={trendDays}
                barColor="#818cf8"
                targetEff={70}
                stats={trendStats.styrax}
              />
            </div>
          ) : (
            /* Mode 2: Comparison Multi-Line / Area Overlay */
            <div className="border border-slate-800 rounded-xl bg-slate-900/90 p-4 shadow-lg">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400" />
                    Comparative Factory & Cluster Efficiency Multi-Trend
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Compare Birichina Factory, Birichina 01, Birichina 02 & Styrax daily progression
                  </p>
                </div>
              </div>

              <div className="w-full h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendDays}
                    margin={{ top: 15, right: 20, left: -20, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
                    <XAxis
                      dataKey="dateStr"
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      axisLine={{ stroke: "#475569" }}
                      angle={-45}
                      textAnchor="end"
                      height={45}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      axisLine={{ stroke: "#475569" }}
                      domain={[40, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="birichina"
                      name="Birichina Total"
                      stroke="#c0504d"
                      strokeWidth={3}
                      dot={{ r: 3, fill: "#c0504d" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="b1"
                      name="Birichina 01"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="b2"
                      name="Birichina 02"
                      stroke="#2dd4bf"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="styrax"
                      name="Styrax"
                      stroke="#818cf8"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. 30-Day Daily Efficiency Progression Matrix */}
      {(viewFilter === "ALL" || viewFilter === "MATRIX") && (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/90 shadow-lg mt-6">
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                Unitwise Daily Efficiency Trend Matrix (%)
              </h3>
              <p className="text-[11px] text-slate-400">
                Full month progression for all individual units and aggregated clusters
              </p>
            </div>
            <Badge variant="outline" className="text-purple-300 border-purple-800 text-xs">
              {trendDays.length} Working Days
            </Badge>
          </div>

          <div className="overflow-x-auto custom-scrollbar max-h-[500px]">
            <table className="w-full text-xs text-left font-mono">
              <thead className="bg-[#4a235a] text-white text-[11px] uppercase sticky top-0 z-10 shadow">
                <tr>
                  <th className="py-2.5 px-3 whitespace-nowrap font-sans">Date</th>
                  <th className="py-2.5 px-2 text-center">B1U2</th>
                  <th className="py-2.5 px-2 text-center">B1U3</th>
                  <th className="py-2.5 px-2 text-center">B1U4</th>
                  <th className="py-2.5 px-2 text-center">B2U1</th>
                  <th className="py-2.5 px-2 text-center">B2U2</th>
                  <th className="py-2.5 px-2 text-center">B2U3</th>
                  <th className="py-2.5 px-2 text-center bg-purple-900/70 font-bold">B1 Avg</th>
                  <th className="py-2.5 px-2 text-center bg-purple-900/70 font-bold">B2 Avg</th>
                  <th className="py-2.5 px-2 text-center bg-purple-950 font-black text-purple-200">
                    Birichina
                  </th>
                  <th className="py-2.5 px-2 text-center">S1U1</th>
                  <th className="py-2.5 px-2 text-center">S1U2</th>
                  <th className="py-2.5 px-2 text-center">S1U3</th>
                  <th className="py-2.5 px-2 text-center">S1U4</th>
                  <th className="py-2.5 px-2 text-center bg-indigo-900/70 font-black text-indigo-200">
                    Styrax
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {trendDays.map((d: any, idx: number) => {
                  const hasData = d.birichina !== null || d.styrax !== null;
                  return (
                    <tr
                      key={idx}
                      className={hasData ? "hover:bg-slate-800/40" : "bg-slate-950/40 text-slate-600"}
                    >
                      <td className="py-1.5 px-3 font-sans text-slate-300 font-semibold whitespace-nowrap">
                        {d.dateStr}
                      </td>
                      <td className="py-1.5 px-2 text-center">{formatSummaryValue(d.b1u2, true)}</td>
                      <td className="py-1.5 px-2 text-center">{formatSummaryValue(d.b1u3, true)}</td>
                      <td className="py-1.5 px-2 text-center">{formatSummaryValue(d.b1u4, true)}</td>
                      <td className="py-1.5 px-2 text-center">{formatSummaryValue(d.b2u1, true)}</td>
                      <td className="py-1.5 px-2 text-center">{formatSummaryValue(d.b2u2, true)}</td>
                      <td className="py-1.5 px-2 text-center">{formatSummaryValue(d.b2u3, true)}</td>
                      <td className="py-1.5 px-2 text-center bg-slate-900/90 font-bold text-sky-400">
                        {formatSummaryValue(d.b1, true)}
                      </td>
                      <td className="py-1.5 px-2 text-center bg-slate-900/90 font-bold text-sky-400">
                        {formatSummaryValue(d.b2, true)}
                      </td>
                      <td className="py-1.5 px-2 text-center bg-purple-950/40 font-black text-purple-300">
                        {formatSummaryValue(d.birichina, true)}
                      </td>
                      <td className="py-1.5 px-2 text-center">{formatSummaryValue(d.s1u1, true)}</td>
                      <td className="py-1.5 px-2 text-center">{formatSummaryValue(d.s1u2, true)}</td>
                      <td className="py-1.5 px-2 text-center">{formatSummaryValue(d.s1u3, true)}</td>
                      <td className="py-1.5 px-2 text-center">{formatSummaryValue(d.s1u4, true)}</td>
                      <td className="py-1.5 px-2 text-center bg-indigo-950/40 font-black text-indigo-300">
                        {formatSummaryValue(d.styrax, true)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
