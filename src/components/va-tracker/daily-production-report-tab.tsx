"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Search,
  Download,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Award,
  DollarSign
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
} from "recharts";

interface DailyProductionReportTabProps {
  data: any;
  exportToCSV: (rows: any[], filename: string) => void;
}

const BUYER_COLORS = [
  "#38bdf8", // Sky
  "#10b981", // Emerald
  "#a855f7", // Purple
  "#f59e0b", // Amber
  "#f43f5e", // Rose
  "#ec4899", // Pink
  "#6366f1", // Indigo
  "#14b8a6", // Teal
  "#eab308", // Yellow
];

export function DailyProductionReportTab({ data, exportToCSV }: DailyProductionReportTabProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedBuyer, setSelectedBuyer] = useState<string>("ALL");
  const [hideSubtotals, setHideSubtotals] = useState<boolean>(true);

  const reportData = useMemo(() => {
    return data?.tabs?.["Report"] || { rows: [], dateStr: "26-Sep-26" };
  }, [data]);

  const rows: any[] = useMemo(() => {
    return reportData.rows || [];
  }, [reportData]);

  // Distinct Buyers
  const buyersList = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.buyer && !r.isSubtotal) set.add(r.buyer.trim());
    });
    return Array.from(set).sort();
  }, [rows]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (hideSubtotals && r.isSubtotal) return false;
      if (selectedBuyer !== "ALL" && r.buyer !== selectedBuyer) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchLine = (r.unitLine || "").toLowerCase().includes(q);
        const matchBuyer = (r.buyer || "").toLowerCase().includes(q);
        const matchStyle = (r.style || "").toLowerCase().includes(q);
        if (!matchLine && !matchBuyer && !matchStyle) return false;
      }
      return true;
    });
  }, [rows, hideSubtotals, selectedBuyer, searchQuery]);

  // KPIs
  const kpis = useMemo(() => {
    const lineOnlyRows = rows.filter((r) => !r.isSubtotal);
    let dayPlanPcs = 0;
    let dayActualPcs = 0;
    let mtdPlanPcs = 0;
    let mtdActualPcs = 0;
    let daySah = 0;

    lineOnlyRows.forEach((r) => {
      dayPlanPcs += Number(r.dayPlan?.pcs) || 0;
      dayActualPcs += Number(r.dayActual?.pcs) || 0;
      mtdPlanPcs += Number(r.planMtd?.pcs) || 0;
      mtdActualPcs += Number(r.actMtd?.pcs) || 0;
      daySah += Number(r.dayActual?.sah) || 0;
    });

    const dayAchievement = dayPlanPcs > 0 ? Math.round((dayActualPcs / dayPlanPcs) * 1000) / 10 : 0;
    const mtdAchievement = mtdPlanPcs > 0 ? Math.round((mtdActualPcs / mtdPlanPcs) * 1000) / 10 : 0;

    return {
      dayPlanPcs,
      dayActualPcs,
      mtdPlanPcs,
      mtdActualPcs,
      daySah: Math.round(daySah),
      dayAchievement,
      mtdAchievement,
      totalLines: lineOnlyRows.length,
    };
  }, [rows]);

  // Pie Chart: Buyer Output Share
  const buyerPieData = useMemo(() => {
    const buyerMap: Record<string, number> = {};
    rows.filter((r) => !r.isSubtotal).forEach((r) => {
      const b = r.buyer || "Other";
      buyerMap[b] = (buyerMap[b] || 0) + (Number(r.dayActual?.pcs) || 0);
    });

    return Object.entries(buyerMap)
      .map(([buyer, pcs], idx) => ({
        name: buyer,
        value: pcs,
        color: BUYER_COLORS[idx % BUYER_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [rows]);

  // Bar Chart: Top 10 Lines by Day Output Pcs
  const lineBarData = useMemo(() => {
    return rows
      .filter((r) => !r.isSubtotal)
      .sort((a, b) => (b.dayActual?.pcs || 0) - (a.dayActual?.pcs || 0))
      .slice(0, 10)
      .map((l) => ({
        line: l.unitLine,
        buyer: l.buyer,
        planPcs: l.dayPlan?.pcs || 0,
        actualPcs: l.dayActual?.pcs || 0,
      }));
  }, [rows]);

  // Bar Chart: Unit Breakdown (Day Actual Pcs)
  const unitBarData = useMemo(() => {
    const unitMap: Record<string, { plan: number; actual: number }> = {};
    rows.filter((r) => !r.isSubtotal).forEach((r) => {
      const u = r.unitLine.includes("-") ? r.unitLine.split("-")[0] : "Other";
      if (!unitMap[u]) unitMap[u] = { plan: 0, actual: 0 };
      unitMap[u].plan += Number(r.dayPlan?.pcs) || 0;
      unitMap[u].actual += Number(r.dayActual?.pcs) || 0;
    });

    return Object.entries(unitMap)
      .map(([unit, val]) => ({
        unit,
        planPcs: val.plan,
        actualPcs: val.actual,
      }))
      .sort((a, b) => b.actualPcs - a.actualPcs);
  }, [rows]);

  const handleExportCSV = () => {
    const csvRows = filteredRows.map((r) => ({
      "Unit-Line": r.unitLine,
      "Buyer": r.buyer,
      "Style": r.style,
      "Type": r.type,
      "SMV": r.smv,
      "Day Plan Pcs": r.dayPlan?.pcs,
      "Day Actual Pcs": r.dayActual?.pcs,
      "Day Plan Eff %": r.dayPlan?.eff,
      "Day Actual Eff %": r.dayActual?.eff,
      "MTD Plan Pcs": r.planMtd?.pcs,
      "MTD Actual Pcs": r.actMtd?.pcs,
      "MTD Plan Eff %": r.planMtd?.eff,
      "MTD Actual Eff %": r.actMtd?.eff,
    }));
    exportToCSV(csvRows, `Daily_Production_Report_${reportData.dateStr}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <TrendingUp className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Daily Garments Production Intelligence
                <Badge variant="outline" className="bg-purple-950/40 text-purple-300 border-purple-800/60 text-[10px] font-mono">
                  {reportData.dateStr}
                </Badge>
              </h2>
              <p className="text-xs text-slate-400">
                Detailed day-wise and month-to-date (MTD) garment output, target vs actual variance, and line-level analytics
              </p>
            </div>
          </div>

          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            className="h-8 text-xs border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* 2. KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Day Actual Output
            </span>
            <Badge className="bg-emerald-950/60 text-emerald-300 border-emerald-800/60 text-[10px]">
              Daily Output
            </Badge>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black font-mono text-emerald-400">
              {kpis.dayActualPcs.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">pcs</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Plan: {kpis.dayPlanPcs.toLocaleString()} pcs ({kpis.dayAchievement}%)</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Award className="w-3.5 h-3.5 text-sky-400" />
              Day Target Achievement
            </span>
            <Badge className="bg-sky-950/60 text-sky-300 border-sky-800/60 text-[10px]">
              Rate
            </Badge>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-2xl font-black font-mono ${kpis.dayAchievement >= 90 ? "text-emerald-400" : "text-amber-400"}`}>
              {kpis.dayAchievement}%
            </span>
            <span className="text-xs text-slate-500">of daily quota</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total SAH: {kpis.daySah.toLocaleString()} hrs</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              Month-to-Date (MTD) Output
            </span>
            <Badge className="bg-purple-950/60 text-purple-300 border-purple-800/60 text-[10px]">
              MTD Total
            </Badge>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black font-mono text-purple-300">
              {kpis.mtdActualPcs.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">pcs</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">MTD Plan: {kpis.mtdPlanPcs.toLocaleString()} pcs ({kpis.mtdAchievement}%)</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Active Sewing Lines
            </span>
            <Badge className="bg-amber-950/60 text-amber-300 border-amber-800/60 text-[10px]">
              Lines
            </Badge>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black font-mono text-amber-400">
              {kpis.totalLines}
            </span>
            <span className="text-xs text-slate-500">producing lines</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Serving {buyersList.length} global fashion brands</p>
        </div>
      </div>

      {/* 3. VISUAL CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* PIE CHART: BUYER OUTPUT SHARE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-2">
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Buyer Output Share
                </h3>
              </div>
              <Badge variant="outline" className="bg-slate-800 text-[10px] text-slate-400 border-slate-700 font-mono">
                {buyerPieData.length} Buyers
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Daily output piece distribution across apparel buyers
            </p>
          </div>

          <div className="h-60 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      const percent = kpis.dayActualPcs > 0 ? Math.round((d.value / kpis.dayActualPcs) * 100) : 0;
                      return (
                        <div className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 shadow-xl text-xs font-mono">
                          <p className="font-bold text-white mb-1" style={{ color: d.color }}>{d.name}</p>
                          <p className="text-slate-300">Pieces: <span className="font-black text-white">{d.value.toLocaleString()} pcs</span></p>
                          <p className="text-slate-400">Share: <span className="font-black text-white">{percent}%</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Pie
                  data={buyerPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {buyerPieData.map((entry: any, index: number) => (
                    <Cell key={`rep-pie-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-base font-black text-white font-mono">{kpis.dayActualPcs.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Day Pcs</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800/80 max-h-24 overflow-y-auto custom-scrollbar text-[10px]">
            {buyerPieData.map((d: any) => (
              <button
                key={d.name}
                onClick={() => setSelectedBuyer(selectedBuyer === d.name ? "ALL" : d.name)}
                className="flex items-center justify-between p-1 rounded hover:bg-slate-800/50 text-[10px] cursor-pointer"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-300 truncate">{d.name}</span>
                </div>
                <span className="font-mono text-white font-bold">{d.value.toLocaleString()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* BAR CHART: TOP 10 PRODUCING LINES */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Top 10 Producing Lines (Day Pcs)
                </h3>
              </div>
              <Badge variant="outline" className="bg-sky-950/40 text-[10px] text-sky-300 border-sky-800/60 font-mono">
                Pcs
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Plan vs Actual piece output on selected production day
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lineBarData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis
                  dataKey="line"
                  tick={{ fill: "#94a3b8", fontSize: 9 }}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 shadow-xl text-xs font-mono">
                          <p className="font-bold text-white">{d.line} ({d.buyer})</p>
                          <p className="text-sky-300">Plan Pcs: <span className="font-black text-white">{d.planPcs.toLocaleString()}</span></p>
                          <p className="text-emerald-400">Actual Pcs: <span className="font-black text-white">{d.actualPcs.toLocaleString()}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "10px", paddingTop: "5px" }} />
                <Bar dataKey="planPcs" name="Plan Pcs" fill="#38bdf8" radius={[3, 3, 0, 0]} />
                <Bar dataKey="actualPcs" name="Actual Pcs" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Peak Line</span>
            <span className="font-mono text-emerald-400 font-bold">{lineBarData[0]?.line || "N/A"}</span>
          </div>
        </div>

        {/* BAR CHART: UNIT-WISE PRODUCTION */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Unit Output Comparison (Pcs)
                </h3>
              </div>
              <Badge variant="outline" className="bg-purple-950/40 text-[10px] text-purple-300 border-purple-800/60 font-mono">
                {unitBarData.length} Units
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Comparison of Plan vs Actual pieces produced per manufacturing unit
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unitBarData} margin={{ top: 10, right: 10, left: -15, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="unit" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 shadow-xl text-xs font-mono">
                          <p className="font-bold text-purple-400">{d.unit}</p>
                          <p className="text-sky-300">Plan Pcs: <span className="font-black text-white">{d.planPcs.toLocaleString()}</span></p>
                          <p className="text-emerald-400">Actual Pcs: <span className="font-black text-white">{d.actualPcs.toLocaleString()}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "10px", paddingTop: "5px" }} />
                <Bar dataKey="planPcs" name="Plan" fill="#38bdf8" radius={[3, 3, 0, 0]} />
                <Bar dataKey="actualPcs" name="Actual" fill="#a855f7" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Total Units Output</span>
            <span className="font-mono text-purple-300 font-bold">{kpis.dayActualPcs.toLocaleString()} pcs</span>
          </div>
        </div>
      </div>

      {/* 4. FILTER CONTROLS */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search line, buyer, style..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/60"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Buyer:</span>
            <select
              value={selectedBuyer}
              onChange={(e) => setSelectedBuyer(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 px-2.5 py-1.5 focus:outline-none focus:border-purple-500/60"
            >
              <option value="ALL">All Buyers ({buyersList.length})</option>
              {buyersList.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={hideSubtotals}
              onChange={(e) => setHideSubtotals(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-purple-600 focus:ring-0"
            />
            <span>Hide Subtotal Rows</span>
          </label>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing <span className="text-white font-bold">{filteredRows.length}</span> lines
        </span>
      </div>

      {/* 5. DATA TABLE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
          <table className="w-full text-xs text-left font-mono">
            <thead className="bg-[#4a235a] text-white text-[11px] uppercase sticky top-0 z-20">
              <tr>
                <th className="py-2.5 px-3">Unit-Line</th>
                <th className="py-2.5 px-3">Buyer</th>
                <th className="py-2.5 px-3">Style</th>
                <th className="py-2.5 px-2">Type</th>
                <th className="py-2.5 px-2 text-right">SMV</th>
                <th className="py-2.5 px-3 text-right bg-sky-950/60">Day Plan Pcs</th>
                <th className="py-2.5 px-3 text-right bg-emerald-950/60 font-bold">Day Act Pcs</th>
                <th className="py-2.5 px-3 text-right">Day Act Eff %</th>
                <th className="py-2.5 px-3 text-right bg-sky-950/60">MTD Plan Pcs</th>
                <th className="py-2.5 px-3 text-right bg-purple-900 font-bold">MTD Act Pcs</th>
                <th className="py-2.5 px-3 text-right">MTD Act Eff %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredRows.map((row: any, idx: number) => {
                const isSub = row.isSubtotal;
                return (
                  <tr key={idx} className={isSub ? "bg-purple-950/40 font-bold text-purple-200" : "hover:bg-slate-800/40 transition-colors"}>
                    <td className="py-2 px-3 font-bold text-sky-400 whitespace-nowrap">{row.unitLine}</td>
                    <td className="py-2 px-3 text-slate-200 font-sans">{row.buyer || "-"}</td>
                    <td className="py-2 px-3 text-slate-300 font-sans truncate max-w-[180px]" title={row.style}>{row.style || "-"}</td>
                    <td className="py-2 px-2 text-slate-400">{row.type || "-"}</td>
                    <td className="py-2 px-2 text-right">{row.smv ? Number(row.smv).toFixed(2) : "-"}</td>
                    <td className="py-2 px-3 text-right bg-sky-950/20">{row.dayPlan?.pcs?.toLocaleString() || "-"}</td>
                    <td className="py-2 px-3 text-right font-black text-emerald-300 bg-emerald-950/30">
                      {row.dayActual?.pcs?.toLocaleString() || "-"}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-amber-300">
                      {row.dayActual?.eff ? `${row.dayActual.eff.toFixed(1)}%` : "-"}
                    </td>
                    <td className="py-2 px-3 text-right bg-sky-950/20">{row.planMtd?.pcs?.toLocaleString() || "-"}</td>
                    <td className="py-2 px-3 text-right font-black text-purple-300 bg-purple-950/40">
                      {row.actMtd?.pcs?.toLocaleString() || "-"}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-purple-200">
                      {row.actMtd?.eff ? `${row.actMtd.eff.toFixed(1)}%` : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
