"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Award,
  AlertTriangle,
  Search,
  Filter,
  Layers,
  BarChart3,
  PieChart as PieIcon,
  ChevronDown,
  Sparkles,
  Download,
  Eye,
  CheckCircle2,
  Calendar,
  Grid,
  List
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts";

interface LineEfficiencyTabProps {
  data: any;
  exportToCSV: (rows: any[], filename: string) => void;
}

export function LineEfficiencyTab({ data, exportToCSV }: LineEfficiencyTabProps) {
  const [selectedCluster, setSelectedCluster] = useState<string>("B-1 Line Efficiency");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<string>("ALL");
  const [selectedTier, setSelectedTier] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"avg-desc" | "avg-asc" | "name" | "peak">("avg-desc");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [selectedLineModal, setSelectedLineModal] = useState<any | null>(null);

  const clusterTabs = [
    { id: "B-1 Line Efficiency", label: "Birichina-1 (81 Lines)", clusterName: "Birichina-1" },
    { id: "B-2 Line Efficiency", label: "Birichina-2 (68 Lines)", clusterName: "Birichina-2" },
    { id: "Styrax Line Efficiency", label: "Styrax Apparels (41 Lines)", clusterName: "Styrax Apparels" },
  ];

  const currentClusterData = useMemo(() => {
    return data?.tabs?.[selectedCluster] || {
      linesSummary: [],
      factoryAvgEff: 0,
      totalLines: 0,
      bands: [],
      dailyTrend: [],
    };
  }, [data, selectedCluster]);

  const linesList: any[] = useMemo(() => {
    return currentClusterData.linesSummary || [];
  }, [currentClusterData]);

  // Distinct units in current cluster
  const availableUnits = useMemo(() => {
    const set = new Set<string>();
    linesList.forEach((l) => {
      if (l.unit) set.add(l.unit);
    });
    return Array.from(set).sort();
  }, [linesList]);

  // Filtered & Sorted Lines
  const filteredLines = useMemo(() => {
    return linesList
      .filter((line) => {
        if (selectedUnit !== "ALL" && line.unit !== selectedUnit) return false;
        if (selectedTier !== "ALL") {
          if (selectedTier === "ELITE" && line.avgEff < 80) return false;
          if (selectedTier === "TARGET" && (line.avgEff < 70 || line.avgEff >= 80)) return false;
          if (selectedTier === "DEVELOPING" && (line.avgEff < 60 || line.avgEff >= 70)) return false;
          if (selectedTier === "CRITICAL" && line.avgEff >= 60) return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = line.lineName.toLowerCase().includes(q);
          const matchStyle = (line.dominantStyle || "").toLowerCase().includes(q);
          const matchType = (line.dominantType || "").toLowerCase().includes(q);
          const matchUnit = (line.unit || "").toLowerCase().includes(q);
          if (!matchName && !matchStyle && !matchType && !matchUnit) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "avg-desc") return b.avgEff - a.avgEff;
        if (sortBy === "avg-asc") return a.avgEff - b.avgEff;
        if (sortBy === "peak") return b.maxEff - a.maxEff;
        if (sortBy === "name") return a.lineName.localeCompare(b.lineName);
        return 0;
      });
  }, [linesList, selectedUnit, selectedTier, searchQuery, sortBy]);

  // Overall KPI metrics
  const kpis = useMemo(() => {
    const active = linesList.filter((l) => l.avgEff > 0);
    const avg = active.length > 0 ? Math.round((active.reduce((acc, l) => acc + l.avgEff, 0) / active.length) * 10) / 10 : 0;
    const sortedByAvg = [...active].sort((a, b) => b.avgEff - a.avgEff);
    const topPerformer = sortedByAvg[0] || null;
    const lowestPerformer = sortedByAvg[sortedByAvg.length - 1] || null;
    const eliteCount = active.filter((l) => l.avgEff >= 80).length;
    const criticalCount = active.filter((l) => l.avgEff < 60).length;

    return {
      avgEff: avg,
      totalLines: linesList.length,
      activeLines: active.length,
      topPerformer,
      lowestPerformer,
      eliteCount,
      criticalCount,
    };
  }, [linesList]);

  // Pie chart data for Efficiency Bands
  const pieData = useMemo(() => {
    const bands = currentClusterData.bands || [];
    if (bands.length > 0) return bands;
    // Fallback calculation if not precomputed
    return [
      { name: "Elite (≥80%)", count: linesList.filter((l) => l.avgEff >= 80).length, color: "#10b981" },
      { name: "Target (70-79%)", count: linesList.filter((l) => l.avgEff >= 70 && l.avgEff < 80).length, color: "#38bdf8" },
      { name: "Developing (60-69%)", count: linesList.filter((l) => l.avgEff >= 60 && l.avgEff < 70).length, color: "#f59e0b" },
      { name: "Critical (<60%)", count: linesList.filter((l) => l.avgEff < 60 && l.avgEff > 0).length, color: "#f43f5e" },
    ];
  }, [currentClusterData, linesList]);

  // Top 10 Best vs Lowest Bar Chart Data
  const top10BarData = useMemo(() => {
    const active = linesList.filter((l) => l.avgEff > 0).sort((a, b) => b.avgEff - a.avgEff);
    const top5 = active.slice(0, 6).map((l) => ({
      line: l.lineName,
      efficiency: l.avgEff,
      unit: l.unit,
      type: "Top",
      fill: "#10b981",
    }));
    const bottom5 = active.slice(-6).reverse().map((l) => ({
      line: l.lineName,
      efficiency: l.avgEff,
      unit: l.unit,
      type: "Low",
      fill: "#f43f5e",
    }));
    return [...top5, ...bottom5];
  }, [linesList]);

  // Unit Averages Bar Chart
  const unitComparisonData = useMemo(() => {
    const groups: Record<string, { total: number; count: number; lines: string[] }> = {};
    linesList.forEach((l) => {
      if (!l.avgEff) return;
      const u = l.unit || "Other";
      if (!groups[u]) groups[u] = { total: 0, count: 0, lines: [] };
      groups[u].total += l.avgEff;
      groups[u].count += 1;
      groups[u].lines.push(l.lineName);
    });

    return Object.entries(groups).map(([unitName, g]) => ({
      unit: unitName,
      avgEff: Math.round((g.total / g.count) * 10) / 10,
      linesCount: g.count,
    })).sort((a, b) => b.avgEff - a.avgEff);
  }, [linesList]);

  // 30-Day Daily Trend for Area Chart
  const dailyTrendData = useMemo(() => {
    return currentClusterData.dailyTrend || [];
  }, [currentClusterData]);

  // Export line efficiency summary to CSV
  const handleExportSummary = () => {
    const rows = filteredLines.map((l) => ({
      "Line Name": l.lineName,
      "Unit": l.unit,
      "Cluster": l.clusterName,
      "Average Efficiency (%)": l.avgEff,
      "Peak Efficiency (%)": l.maxEff,
      "Latest Day Efficiency (%)": l.latestEff,
      "Dominant Style": l.dominantStyle,
      "Garment Type": l.dominantType,
      "Active Monitored Days": l.activeDays,
      "Total Tracked Days": l.totalTrackedDays,
    }));
    exportToCSV(rows, `${selectedCluster.replace(/\s+/g, "_")}_Line_Efficiency_Report.csv`);
  };

  const getTierColor = (eff: number) => {
    if (eff >= 80) return "emerald";
    if (eff >= 70) return "sky";
    if (eff >= 60) return "amber";
    return "rose";
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & FACTORY CLUSTER SWITCHER */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Line-Wise Efficiency Intelligence
                <Badge variant="outline" className="bg-purple-950/40 text-purple-300 border-purple-800/60 text-[10px] font-mono">
                  {kpis.totalLines} Active Lines Monitored
                </Badge>
              </h2>
              <p className="text-xs text-slate-400">
                Visual efficiency tracking, multi-tier distribution charts, and 30-day continuous performance wave
              </p>
            </div>
          </div>

          {/* Cluster Switcher Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {clusterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedCluster(tab.id);
                  setSelectedUnit("ALL");
                  setSelectedTier("ALL");
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  selectedCluster === tab.id
                    ? "bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-md shadow-purple-900/30 border border-purple-400/40"
                    : "bg-slate-950/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}

            <Button
              onClick={handleExportSummary}
              variant="outline"
              size="sm"
              className="h-8 text-xs border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* 2. HIGH-LEVEL KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Factory Average */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              Factory Average Efficiency
            </span>
            <Badge className="bg-purple-950/60 text-purple-300 border-purple-800/60 text-[10px]">
              Target: 70.0%
            </Badge>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-2xl font-black font-mono ${
              kpis.avgEff >= 70 ? "text-emerald-400" : kpis.avgEff >= 60 ? "text-amber-400" : "text-rose-400"
            }`}>
              {kpis.avgEff > 0 ? `${kpis.avgEff.toFixed(1)}%` : "-"}
            </span>
            <span className="text-xs text-slate-500">across {kpis.activeLines} sewing lines</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                kpis.avgEff >= 70 ? "bg-emerald-500" : kpis.avgEff >= 60 ? "bg-amber-500" : "bg-rose-500"
              }`}
              style={{ width: `${Math.min(100, (kpis.avgEff / 100) * 100)}%` }}
            />
          </div>
        </div>

        {/* Top Performer Line */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              Peak Performance Line
            </span>
            <Badge className="bg-emerald-950/60 text-emerald-300 border-emerald-800/60 text-[10px]">
              Top 1
            </Badge>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div>
              <span className="text-lg font-bold text-emerald-300 font-mono">
                {kpis.topPerformer?.lineName || "N/A"}
              </span>
              <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
                {kpis.topPerformer?.dominantStyle || "N/A"}
              </p>
            </div>
            <span className="text-xl font-black text-emerald-400 font-mono">
              {kpis.topPerformer ? `${kpis.topPerformer.avgEff.toFixed(1)}%` : "-"}
            </span>
          </div>
        </div>

        {/* Elite Performers (>=80%) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-sky-500/30 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
              Elite Lines (≥80%)
            </span>
            <Badge className="bg-sky-950/60 text-sky-300 border-sky-800/60 text-[10px]">
              High Output
            </Badge>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-sky-300 font-mono">
              {kpis.eliteCount}
            </span>
            <span className="text-xs text-slate-500">
              lines ({kpis.activeLines > 0 ? Math.round((kpis.eliteCount / kpis.activeLines) * 100) : 0}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Exceeding standard efficiency benchmarks</p>
        </div>

        {/* Critical Attention (<60%) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              Critical Attention (&lt;60%)
            </span>
            <Badge className="bg-rose-950/60 text-rose-300 border-rose-800/60 text-[10px]">
              Need Intervention
            </Badge>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-rose-400 font-mono">
              {kpis.criticalCount}
            </span>
            <span className="text-xs text-slate-500">
              lines ({kpis.activeLines > 0 ? Math.round((kpis.criticalCount / kpis.activeLines) * 100) : 0}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Require line balancing & loss reduction</p>
        </div>
      </div>

      {/* 3. VISUAL CHARTS ROW: PIE CHART + TOP/BOTTOM BAR CHART + DAILY TREND AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* CHART 1: EFFICIENCY TIER DISTRIBUTION (DONUT / PIE CHART) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-2">
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Efficiency Tier Distribution
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                {kpis.activeLines} Lines
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Categorization of production lines based on month-average efficiency
            </p>
          </div>

          <div className="h-60 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      const percent = kpis.activeLines > 0 ? Math.round((d.count / kpis.activeLines) * 100) : 0;
                      return (
                        <div className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 shadow-xl text-xs font-mono">
                          <p className="font-bold text-white mb-1" style={{ color: d.color }}>{d.name}</p>
                          <p className="text-slate-300">Lines Count: <span className="font-black text-white">{d.count}</span></p>
                          <p className="text-slate-400">Share: <span className="font-black text-white">{percent}%</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {pieData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Summary Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-white font-mono">{kpis.activeLines}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Total Lines</span>
            </div>
          </div>

          {/* Custom Legend */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
            {pieData.map((tier: any) => (
              <button
                key={tier.name}
                onClick={() => {
                  if (tier.name.includes("≥80%")) setSelectedTier(selectedTier === "ELITE" ? "ALL" : "ELITE");
                  else if (tier.name.includes("70-79%")) setSelectedTier(selectedTier === "TARGET" ? "ALL" : "TARGET");
                  else if (tier.name.includes("60-69%")) setSelectedTier(selectedTier === "DEVELOPING" ? "ALL" : "DEVELOPING");
                  else if (tier.name.includes("<60%")) setSelectedTier(selectedTier === "CRITICAL" ? "ALL" : "CRITICAL");
                }}
                className="flex items-center justify-between p-1.5 rounded-md hover:bg-slate-800/50 transition-all text-[11px] cursor-pointer"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tier.color }} />
                  <span className="text-slate-300 truncate">{tier.name.split(" ")[0]}</span>
                </div>
                <span className="font-bold font-mono text-white ml-1">{tier.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* CHART 2: TOP & BOTTOM LINES EFFICIENCY BAR CHART */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Top Best vs Lowest Performing Lines
                </h3>
              </div>
              <Badge variant="outline" className="bg-slate-800 text-[10px] text-slate-400 border-slate-700 font-mono">
                Target: 70%
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Comparison of highest producing lines against lines needing attention
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10BarData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis
                  dataKey="line"
                  tick={{ fill: "#94a3b8", fontSize: 9 }}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  domain={[0, 100]}
                  unit="%"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 shadow-xl text-xs font-mono">
                          <p className="font-bold text-white">{d.line} ({d.unit})</p>
                          <p className="text-slate-400">Category: <span className={d.type === "Top" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>{d.type === "Top" ? "Top Performer" : "Low Efficiency"}</span></p>
                          <p className="text-slate-300">Avg Efficiency: <span className="font-black text-amber-300">{d.efficiency.toFixed(1)}%</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Target 70%", fill: "#f59e0b", fontSize: 10, position: "top" }} />
                <Bar dataKey="efficiency" radius={[4, 4, 0, 0]}>
                  {top10BarData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Top Performers</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500" /> Lowest Performers</span>
          </div>
        </div>

        {/* CHART 3: UNIT AVERAGES & 30-DAY CLUSTER WAVE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Unit Breakdown & Trend
                </h3>
              </div>
              <Badge variant="outline" className="bg-sky-950/50 text-[10px] text-sky-300 border-sky-800/60 font-mono">
                {unitComparisonData.length} Units
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Average efficiency performance across each manufacturing unit
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unitComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="unit" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} domain={[0, 100]} unit="%" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 shadow-xl text-xs font-mono">
                          <p className="font-bold text-sky-400">{d.unit}</p>
                          <p className="text-slate-300">Avg Efficiency: <span className="font-black text-white">{d.avgEff.toFixed(1)}%</span></p>
                          <p className="text-slate-400">Total Lines: <span className="font-bold text-slate-200">{d.linesCount}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="avgEff" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Overall Unit Performance</span>
            <span className="font-mono text-white font-bold">{kpis.avgEff.toFixed(1)}% Average</span>
          </div>
        </div>
      </div>

      {/* 4. FILTER & SEARCH CONTROLS BAR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Live Search */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search line, style, type..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/60"
              />
            </div>

            {/* Unit Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-[11px]">Unit:</span>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 px-2.5 py-1.5 focus:outline-none focus:border-purple-500/60"
              >
                <option value="ALL">All Units ({linesList.length})</option>
                {availableUnits.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            {/* Efficiency Tier Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-[11px]">Tier:</span>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 px-2.5 py-1.5 focus:outline-none focus:border-purple-500/60"
              >
                <option value="ALL">All Tiers</option>
                <option value="ELITE">Elite (≥80%)</option>
                <option value="TARGET">Target (70-79%)</option>
                <option value="DEVELOPING">Developing (60-69%)</option>
                <option value="CRITICAL">Critical (&lt;60%)</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-[11px]">Sort:</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 px-2.5 py-1.5 focus:outline-none focus:border-purple-500/60"
              >
                <option value="avg-desc">Highest Efficiency</option>
                <option value="avg-asc">Lowest Efficiency</option>
                <option value="peak">Peak Efficiency</option>
                <option value="name">Line Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* View Mode & Count */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <span className="text-xs text-slate-400 font-mono">
              Showing <span className="text-white font-bold">{filteredLines.length}</span> of {linesList.length}
            </span>
            <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === "grid" ? "bg-purple-900/60 text-purple-300" : "text-slate-400 hover:text-white"
                }`}
                title="Grid View with Sparklines"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === "table" ? "bg-purple-900/60 text-purple-300" : "text-slate-400 hover:text-white"
                }`}
                title="Tabular Comparison View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. DATA VIEW: INTERACTIVE CARDS GRID WITH EMBEDDED SPARKLINES */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredLines.map((line) => {
            const tierColor = getTierColor(line.avgEff);
            const validPoints = line.points.filter((p: any) => p.efficiency > 0);
            const sparklineData = line.points.map((p: any, idx: number) => ({
              day: idx + 1,
              dateStr: p.dateStr,
              efficiency: p.efficiency > 0 ? p.efficiency : null,
            }));

            const colorHex =
              tierColor === "emerald"
                ? "#10b981"
                : tierColor === "sky"
                ? "#38bdf8"
                : tierColor === "amber"
                ? "#f59e0b"
                : "#f43f5e";

            return (
              <div
                key={line.lineName}
                className="bg-slate-900/90 border border-slate-800/90 hover:border-purple-500/40 rounded-xl p-3.5 shadow-md transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header: Line Name + Unit + Average Efficiency Badge */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-sky-400 font-mono tracking-wide">
                        {line.lineName}
                      </span>
                      <Badge variant="outline" className="bg-slate-950 text-[10px] text-slate-400 border-slate-800 font-mono">
                        {line.unit}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Badge
                        className={`text-xs font-black font-mono px-2 py-0.5 ${
                          tierColor === "emerald"
                            ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/60"
                            : tierColor === "sky"
                            ? "bg-sky-950/80 text-sky-300 border-sky-700/60"
                            : tierColor === "amber"
                            ? "bg-amber-950/80 text-amber-300 border-amber-700/60"
                            : "bg-rose-950/80 text-rose-300 border-rose-700/60"
                        }`}
                      >
                        {line.avgEff > 0 ? `${line.avgEff.toFixed(1)}%` : "0.0%"}
                      </Badge>
                    </div>
                  </div>

                  {/* Garment Style & Type Metadata */}
                  <div className="mt-2.5 space-y-1 text-xs">
                    <p className="text-slate-300 truncate" title={line.dominantStyle}>
                      <span className="text-slate-500 font-medium">Style: </span>
                      <span className="font-mono text-slate-200">{line.dominantStyle || "N/A"}</span>
                    </p>
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span className="truncate">
                        <span className="text-slate-500">Type: </span>
                        <span className="text-slate-300 font-mono">{line.dominantType || "N/A"}</span>
                      </span>
                      <span className="font-mono shrink-0">
                        Peak: <span className="text-emerald-400 font-bold">{line.maxEff.toFixed(1)}%</span>
                      </span>
                    </div>
                  </div>

                  {/* Embedded Interactive 30-Day Efficiency Sparkline Wave */}
                  <div className="mt-3 bg-slate-950/60 border border-slate-800/60 rounded-lg p-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-mono">
                      <span>30-Day Efficiency Curve</span>
                      <span>Latest: <strong className="text-white">{line.latestEff > 0 ? `${line.latestEff.toFixed(1)}%` : "-"}</strong></span>
                    </div>
                    <div className="h-20 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparklineData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id={`grad-${line.lineName}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={colorHex} stopOpacity={0.4} />
                              <stop offset="95%" stopColor={colorHex} stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                if (d.efficiency === null) return null;
                                return (
                                  <div className="bg-slate-950 border border-slate-700 rounded px-2 py-1 shadow-lg text-[10px] font-mono">
                                    <span className="text-slate-400">{d.dateStr}: </span>
                                    <span className="font-bold text-white">{d.efficiency.toFixed(1)}%</span>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <ReferenceLine y={70} stroke="#475569" strokeDasharray="2 2" />
                          <Area
                            type="monotone"
                            dataKey="efficiency"
                            stroke={colorHex}
                            strokeWidth={2}
                            fillOpacity={1}
                            fill={`url(#grad-${line.lineName})`}
                            connectNulls
                            dot={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Active Monitored Days & Details Button */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono">
                    Tracked: <strong className="text-slate-200">{line.activeDays}</strong> / {line.totalTrackedDays} days
                  </span>
                  <button
                    onClick={() => setSelectedLineModal(line)}
                    className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3 h-3" /> View 30-Day Matrix
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto max-h-[650px] custom-scrollbar">
            <table className="w-full text-xs text-left font-mono">
              <thead className="bg-[#4a235a] text-white text-[11px] uppercase sticky top-0 z-20">
                <tr>
                  <th className="py-2.5 px-3">Line Name</th>
                  <th className="py-2.5 px-2">Unit</th>
                  <th className="py-2.5 px-3">Style</th>
                  <th className="py-2.5 px-2">Type</th>
                  <th className="py-2.5 px-3 text-right">Avg Eff %</th>
                  <th className="py-2.5 px-3 text-right">Peak Eff %</th>
                  <th className="py-2.5 px-3 text-right">Latest Eff %</th>
                  <th className="py-2.5 px-2 text-center">Active Days</th>
                  <th className="py-2.5 px-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredLines.map((line, idx) => {
                  const tierColor = getTierColor(line.avgEff);
                  return (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-3 font-bold text-sky-400">{line.lineName}</td>
                      <td className="py-2 px-2 text-slate-400">{line.unit}</td>
                      <td className="py-2 px-3 text-slate-200 font-sans truncate max-w-[200px]" title={line.dominantStyle}>
                        {line.dominantStyle || "-"}
                      </td>
                      <td className="py-2 px-2 text-slate-400">{line.dominantType || "-"}</td>
                      <td className="py-2 px-3 text-right font-bold">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${
                          tierColor === "emerald" ? "bg-emerald-950 text-emerald-300" :
                          tierColor === "sky" ? "bg-sky-950 text-sky-300" :
                          tierColor === "amber" ? "bg-amber-950 text-amber-300" : "bg-rose-950 text-rose-300"
                        }`}>
                          {line.avgEff.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-400">{line.maxEff.toFixed(1)}%</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-300">{line.latestEff > 0 ? `${line.latestEff.toFixed(1)}%` : "-"}</td>
                      <td className="py-2 px-2 text-center text-slate-400">{line.activeDays} / {line.totalTrackedDays}</td>
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => setSelectedLineModal(line)}
                          className="p-1 rounded hover:bg-slate-800 text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                          title="View 30-day breakdown"
                        >
                          <Eye className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. MODAL: 30-DAY DETAIL MATRIX FOR SELECTED LINE */}
      {selectedLineModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 bg-[#4a235a] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <span>{selectedLineModal.lineName}</span>
                  <Badge variant="outline" className="bg-purple-900/60 text-white border-purple-400/40 text-xs">
                    {selectedLineModal.unit} - {selectedLineModal.clusterName}
                  </Badge>
                </h3>
                <p className="text-xs text-purple-200 mt-0.5">
                  Dominant Style: {selectedLineModal.dominantStyle} | Type: {selectedLineModal.dominantType}
                </p>
              </div>
              <button
                onClick={() => setSelectedLineModal(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar">
              {/* Line KPI Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Average Efficiency</span>
                  <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                    {selectedLineModal.avgEff.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Peak Day Efficiency</span>
                  <p className="text-xl font-black text-sky-400 font-mono mt-0.5">
                    {selectedLineModal.maxEff.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Active Days</span>
                  <p className="text-xl font-black text-purple-300 font-mono mt-0.5">
                    {selectedLineModal.activeDays} / {selectedLineModal.totalTrackedDays}
                  </p>
                </div>
              </div>

              {/* High-res Line Chart */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  30-Day Efficiency Progression
                </h4>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedLineModal.points}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                      <XAxis dataKey="dateStr" tick={{ fill: "#94a3b8", fontSize: 9 }} angle={-45} textAnchor="end" />
                      <YAxis domain={[0, 100]} unit="%" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 shadow-xl text-xs font-mono">
                                <p className="font-bold text-purple-400">{d.dateStr}</p>
                                <p className="text-slate-300">Efficiency: <span className="font-black text-emerald-400">{d.efficiency > 0 ? `${d.efficiency.toFixed(1)}%` : "0% (Off-day)"}</span></p>
                                {d.style && <p className="text-slate-400 text-[11px]">Style: {d.style}</p>}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Target 70%", fill: "#f59e0b", fontSize: 10 }} />
                      <Line type="monotone" dataKey="efficiency" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 3, fill: "#a855f7" }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Day-by-Day Grid */}
              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-xs font-mono text-left">
                  <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-1.5 px-3">Date</th>
                      <th className="py-1.5 px-3">Efficiency %</th>
                      <th className="py-1.5 px-3">Garment Type</th>
                      <th className="py-1.5 px-3">Style Name</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {selectedLineModal.points.map((p: any, idx: number) => (
                      <tr key={idx} className={p.efficiency > 0 ? "hover:bg-slate-800/40" : "bg-slate-950/40 text-slate-600"}>
                        <td className="py-1.5 px-3 font-medium">{p.dateStr}</td>
                        <td className="py-1.5 px-3 font-bold">
                          {p.efficiency > 0 ? (
                            <span className={p.efficiency >= 70 ? "text-emerald-400" : p.efficiency >= 60 ? "text-amber-400" : "text-rose-400"}>
                              {p.efficiency.toFixed(1)}%
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="py-1.5 px-3">{p.type || "-"}</td>
                        <td className="py-1.5 px-3 truncate max-w-[280px]" title={p.style}>{p.style || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
              <Button
                onClick={() => setSelectedLineModal(null)}
                variant="outline"
                size="sm"
                className="bg-slate-800 border-slate-700 text-slate-200"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
