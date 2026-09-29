"use client";

import React, { useState, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Search,
  Download,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Award
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

interface VaTrackerTabProps {
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

export function VaTrackerTab({ data, exportToCSV }: VaTrackerTabProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedBuyer, setSelectedBuyer] = useState<string>("ALL");

  const vaData = useMemo(() => {
    return data?.tabs?.["VA Tracker"] || { lines: [], dateStr: "26-Sep-26", month: "September" };
  }, [data]);

  const lines: any[] = useMemo(() => {
    return vaData.lines || [];
  }, [vaData]);

  // Distinct Buyers
  const buyersList = useMemo(() => {
    const set = new Set<string>();
    lines.forEach((l) => {
      if (l.buyer) set.add(l.buyer.trim());
    });
    return Array.from(set).sort();
  }, [lines]);

  // Filtered Lines
  const filteredLines = useMemo(() => {
    return lines.filter((l) => {
      if (selectedBuyer !== "ALL" && l.buyer !== selectedBuyer) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchLine = (l.line || "").toLowerCase().includes(q);
        const matchBuyer = (l.buyer || "").toLowerCase().includes(q);
        if (!matchLine && !matchBuyer) return false;
      }
      return true;
    });
  }, [lines, selectedBuyer, searchQuery]);

  // KPIs
  const kpis = useMemo(() => {
    let totalPlanPcs = 0;
    let totalActualPcs = 0;
    let totalPlanSah = 0;
    let totalActualSah = 0;
    let totalPlanVa = 0;

    lines.forEach((l) => {
      totalPlanPcs += Number(l.cumPlan?.pcs) || 0;
      totalActualPcs += Number(l.cumActual?.pcs) || 0;
      totalPlanSah += Number(l.cumPlan?.sah) || 0;
      totalActualSah += Number(l.cumActual?.sah) || 0;
      totalPlanVa += Number(l.planVa) || 0;
    });

    const achievementRate = totalPlanPcs > 0 ? Math.round((totalActualPcs / totalPlanPcs) * 1000) / 10 : 0;
    const variancePcs = totalActualPcs - totalPlanPcs;

    return {
      totalPlanPcs,
      totalActualPcs,
      totalPlanSah: Math.round(totalPlanSah),
      totalActualSah: Math.round(totalActualSah),
      totalPlanVa: Math.round(totalPlanVa),
      achievementRate,
      variancePcs,
    };
  }, [lines]);

  // Pie Chart: Buyer Share
  const buyerPieData = useMemo(() => {
    const buyerMap: Record<string, number> = {};
    lines.forEach((l) => {
      const b = l.buyer || "Other";
      buyerMap[b] = (buyerMap[b] || 0) + (Number(l.cumActual?.pcs) || 0);
    });

    return Object.entries(buyerMap)
      .map(([buyer, pcs], idx) => ({
        name: buyer,
        value: pcs,
        color: BUYER_COLORS[idx % BUYER_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [lines]);

  // Bar Chart: Top 10 Lines (Plan vs Actual Output Pcs)
  const topLinesBarData = useMemo(() => {
    return [...lines]
      .sort((a, b) => (b.cumActual?.pcs || 0) - (a.cumActual?.pcs || 0))
      .slice(0, 10)
      .map((l) => ({
        line: l.line,
        buyer: l.buyer,
        planPcs: l.cumPlan?.pcs || 0,
        actualPcs: l.cumActual?.pcs || 0,
      }));
  }, [lines]);

  // Bar Chart: Top 8 Lines by SAH
  const sahBarData = useMemo(() => {
    return [...lines]
      .sort((a, b) => (b.cumActual?.sah || 0) - (a.cumActual?.sah || 0))
      .slice(0, 8)
      .map((l) => ({
        line: l.line,
        planSah: Math.round(l.cumPlan?.sah || 0),
        actualSah: Math.round(l.cumActual?.sah || 0),
      }));
  }, [lines]);

  const handleExportCSV = () => {
    const rows = filteredLines.map((l) => ({
      "Line": l.line,
      "Buyer": l.buyer,
      "Full Month Plan Pcs": l.fullMonthPcs,
      "Plan VA ($)": l.planVa,
      "Day Plan Pcs": l.dayPlan?.pcs,
      "Day Plan SAH": l.dayPlan?.sah,
      "Day Actual Pcs": l.dayActual?.pcs,
      "Day Actual SAH": l.dayActual?.sah,
      "Day Variance Pcs": l.dayVar?.pcs,
      "Cum Plan Pcs": l.cumPlan?.pcs,
      "Cum Plan SAH": l.cumPlan?.sah,
      "Cum Actual Pcs": l.cumActual?.pcs,
      "Cum Actual SAH": l.cumActual?.sah,
      "Cum Variance Pcs": l.cumVar?.pcs,
    }));
    exportToCSV(rows, "VA_Tracker_Production_Report.csv");
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <DollarSign className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Value Addition (VA) & Production Tracker
                <Badge variant="outline" className="bg-emerald-950/40 text-emerald-300 border-emerald-800/60 text-[10px] font-mono">
                  {vaData.dateStr}
                </Badge>
              </h2>
              <p className="text-xs text-slate-400">
                Tracking Plan vs Actual Garment Output, Standard Allowable Hours (SAH), and Value Addition Generation
              </p>
            </div>
          </div>

          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            className="h-8 text-xs border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
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
              Actual Production Output
            </span>
            <Badge className="bg-emerald-950/60 text-emerald-300 border-emerald-800/60 text-[10px]">
              Cumulative
            </Badge>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black font-mono text-emerald-400">
              {kpis.totalActualPcs.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">pcs</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Target: {kpis.totalPlanPcs.toLocaleString()} pcs ({kpis.achievementRate}%)</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Award className="w-3.5 h-3.5 text-sky-400" />
              Target Achievement Rate
            </span>
            <Badge className="bg-sky-950/60 text-sky-300 border-sky-800/60 text-[10px]">
              Pace
            </Badge>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-2xl font-black font-mono ${kpis.achievementRate >= 95 ? "text-emerald-400" : "text-amber-400"}`}>
              {kpis.achievementRate}%
            </span>
            <span className="text-xs text-slate-500">of planned quota</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Variance: {kpis.variancePcs > 0 ? `+${kpis.variancePcs.toLocaleString()}` : kpis.variancePcs.toLocaleString()} pcs</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <DollarSign className="w-3.5 h-3.5 text-purple-400" />
              Cumulative SAH Earned
            </span>
            <Badge className="bg-purple-950/60 text-purple-300 border-purple-800/60 text-[10px]">
              SAH
            </Badge>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black font-mono text-purple-300">
              {kpis.totalActualSah.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">hours</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Plan SAH: {kpis.totalPlanSah.toLocaleString()} hrs</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Active Monitored Lines
            </span>
            <Badge className="bg-amber-950/60 text-amber-300 border-amber-800/60 text-[10px]">
              Lines
            </Badge>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black font-mono text-amber-400">
              {lines.length}
            </span>
            <span className="text-xs text-slate-500">lines active</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Serving {buyersList.length} global fashion buyers</p>
        </div>
      </div>

      {/* 3. VISUAL CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* PIE CHART: BUYER PRODUCTION SHARE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-2">
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Buyer Output Distribution
                </h3>
              </div>
              <Badge variant="outline" className="bg-slate-800 text-[10px] text-slate-400 border-slate-700 font-mono">
                {buyerPieData.length} Buyers
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Garment output share allocated across global buyers
            </p>
          </div>

          <div className="h-60 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      const percent = kpis.totalActualPcs > 0 ? Math.round((d.value / kpis.totalActualPcs) * 100) : 0;
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
                    <Cell key={`va-pie-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-base font-black text-white font-mono">{kpis.totalActualPcs.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Total Pcs</span>
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

        {/* BAR CHART: TOP 10 LINES OUTPUT (PLAN VS ACTUAL) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Top 10 Producing Lines (Pcs)
                </h3>
              </div>
              <Badge variant="outline" className="bg-emerald-950/40 text-[10px] text-emerald-300 border-emerald-800/60 font-mono">
                Pcs
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Plan vs Actual piece output across top performing lines
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topLinesBarData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
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
            <span>Peak Output Line</span>
            <span className="font-mono text-emerald-400 font-bold">{topLinesBarData[0]?.line || "N/A"}</span>
          </div>
        </div>

        {/* BAR CHART: SAH GENERATION */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Top Lines by Earned SAH (Hrs)
                </h3>
              </div>
              <Badge variant="outline" className="bg-purple-950/40 text-[10px] text-purple-300 border-purple-800/60 font-mono">
                SAH (Hrs)
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Standard allowable hours earned by line
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sahBarData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
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
                          <p className="font-bold text-purple-400">{d.line}</p>
                          <p className="text-slate-300">Plan SAH: <span className="font-black text-white">{d.planSah.toLocaleString()} hrs</span></p>
                          <p className="text-emerald-400">Actual SAH: <span className="font-black text-white">{d.actualSah.toLocaleString()} hrs</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="actualSah" name="Actual SAH" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Total Actual SAH</span>
            <span className="font-mono text-purple-300 font-bold">{kpis.totalActualSah.toLocaleString()} hrs</span>
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
              placeholder="Search line, buyer..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Buyer:</span>
            <select
              value={selectedBuyer}
              onChange={(e) => setSelectedBuyer(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 px-2.5 py-1.5 focus:outline-none focus:border-emerald-500/60"
            >
              <option value="ALL">All Buyers ({buyersList.length})</option>
              {buyersList.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing <span className="text-white font-bold">{filteredLines.length}</span> lines
        </span>
      </div>

      {/* 5. DATA TABLE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
          <table className="w-full text-xs text-left font-mono">
            <thead className="bg-[#4a235a] text-white text-[11px] uppercase sticky top-0 z-20">
              <tr>
                <th className="py-2.5 px-3">Line</th>
                <th className="py-2.5 px-3">Buyer</th>
                <th className="py-2.5 px-3 text-right">Day Plan Pcs</th>
                <th className="py-2.5 px-3 text-right">Day Act Pcs</th>
                <th className="py-2.5 px-3 text-right">Day Var</th>
                <th className="py-2.5 px-3 text-right bg-sky-950/60">Cum Plan Pcs</th>
                <th className="py-2.5 px-3 text-right bg-emerald-950/60 font-bold">Cum Act Pcs</th>
                <th className="py-2.5 px-3 text-right">Cum Var</th>
                <th className="py-2.5 px-3 text-right bg-purple-900 font-bold">Cum Act SAH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredLines.map((row: any, idx: number) => {
                const dayVar = Number(row.dayVar?.pcs) || 0;
                const cumVar = Number(row.cumVar?.pcs) || 0;
                return (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-3 font-bold text-sky-400">{row.line}</td>
                    <td className="py-2 px-3 text-slate-200 font-sans">{row.buyer || "-"}</td>
                    <td className="py-2 px-3 text-right">{row.dayPlan?.pcs?.toLocaleString() || "-"}</td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-300">{row.dayActual?.pcs?.toLocaleString() || "-"}</td>
                    <td className={`py-2 px-3 text-right font-medium ${dayVar >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {dayVar > 0 ? `+${dayVar.toLocaleString()}` : dayVar.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right bg-sky-950/20">{row.cumPlan?.pcs?.toLocaleString() || "-"}</td>
                    <td className="py-2 px-3 text-right font-black text-emerald-300 bg-emerald-950/30">
                      {row.cumActual?.pcs?.toLocaleString() || "-"}
                    </td>
                    <td className={`py-2 px-3 text-right font-medium ${cumVar >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {cumVar > 0 ? `+${cumVar.toLocaleString()}` : cumVar.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-purple-300 bg-slate-950/40">
                      {row.cumActual?.sah?.toLocaleString() || "-"}
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
