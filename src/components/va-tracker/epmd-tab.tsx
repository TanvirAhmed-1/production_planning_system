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
  Activity,
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
  AreaChart,
  Area,
  ReferenceLine,
} from "recharts";

interface EpmdTabProps {
  data: any;
  exportToCSV: (rows: any[], filename: string) => void;
}

export function EpmdTab({ data, exportToCSV }: EpmdTabProps) {
  const [selectedSubTab, setSelectedSubTab] = useState<string>("B1 EPMD");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const subTabs = [
    { id: "B1 EPMD", label: "Birichina-1 EPMD", cluster: "Birichina-1" },
    { id: "B2 EPMD", label: "Birichina-2 EPMD", cluster: "Birichina-2" },
    { id: "Styrax EPMD", label: "Styrax EPMD", cluster: "Styrax Apparels" },
  ];

  const currentTabData = useMemo(() => {
    return data?.tabs?.[selectedSubTab] || { rows: [], clusterName: "Birichina-1" };
  }, [data, selectedSubTab]);

  const rows: any[] = useMemo(() => {
    return currentTabData.rows || [];
  }, [currentTabData]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDate = (r.dateStr || "").toLowerCase().includes(q);
        if (!matchDate) return false;
      }
      return true;
    });
  }, [rows, searchQuery]);

  // KPIs
  const kpis = useMemo(() => {
    const validRows = rows.filter((r) => r.epmd?.actual > 0);
    const avgPlanEpmd = validRows.length > 0 ? validRows.reduce((sum, r) => sum + (r.epmd?.plan || 0), 0) / validRows.length : 0;
    const avgRevisedEpmd = validRows.length > 0 ? validRows.reduce((sum, r) => sum + (r.epmd?.revised || 0), 0) / validRows.length : 0;
    const avgActualEpmd = validRows.length > 0 ? validRows.reduce((sum, r) => sum + (r.epmd?.actual || 0), 0) / validRows.length : 0;
    const totalActualVa = rows.reduce((sum, r) => sum + (r.actual?.totalVa || 0), 0);
    const variance = avgActualEpmd - avgPlanEpmd;

    return {
      avgPlanEpmd: Math.round(avgPlanEpmd * 100) / 100,
      avgRevisedEpmd: Math.round(avgRevisedEpmd * 100) / 100,
      avgActualEpmd: Math.round(avgActualEpmd * 100) / 100,
      totalActualVa: Math.round(totalActualVa),
      variance: Math.round(variance * 100) / 100,
      validDaysCount: validRows.length,
    };
  }, [rows]);

  // Bar Chart: Daily Plan vs Revised vs Actual EPMD
  const epmdBarData = useMemo(() => {
    return rows.slice(0, 15).map((r) => ({
      date: r.dateStr,
      plan: r.epmd?.plan || 0,
      revised: r.epmd?.revised || 0,
      actual: r.epmd?.actual || 0,
    }));
  }, [rows]);

  // Pie Chart: EPMD Achievement Tier
  const epmdPieData = useMemo(() => {
    let exceeding = 0;
    let onTarget = 0;
    let below = 0;

    rows.forEach((r) => {
      const actual = r.epmd?.actual || 0;
      const plan = r.epmd?.plan || 0;
      if (actual === 0 || plan === 0) return;
      const ratio = actual / plan;
      if (ratio >= 1.0) exceeding++;
      else if (ratio >= 0.85) onTarget++;
      else below++;
    });

    return [
      { name: "Exceeding Target (≥100%)", value: exceeding, color: "#10b981" },
      { name: "Near Target (85-99%)", value: onTarget, color: "#38bdf8" },
      { name: "Below Target (<85%)", value: below, color: "#f43f5e" },
    ].filter((d) => d.value > 0);
  }, [rows]);

  // Area Chart: Daily Actual VA Generation ($)
  const vaTrendData = useMemo(() => {
    return rows.map((r) => ({
      date: r.dateStr,
      planVa: Math.round(r.signOffPlan?.totalVa || 0),
      actualVa: Math.round(r.actual?.totalVa || 0),
    }));
  }, [rows]);

  const handleExportCSV = () => {
    const csvRows = filteredRows.map((r) => ({
      "Date": r.dateStr,
      "Sign-Off Plan Total VA ($)": r.signOffPlan?.totalVa,
      "Revised Plan Total VA ($)": r.revisedPlan?.totalVa,
      "Actual Total VA ($)": r.actual?.totalVa,
      "Plan EPMD ($)": r.epmd?.plan,
      "Revised EPMD ($)": r.epmd?.revised,
      "Actual EPMD ($)": r.epmd?.actual,
    }));
    exportToCSV(csvRows, `${selectedSubTab.replace(/\s+/g, "_")}_Report.csv`);
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER & SUBTAB SWITCHER */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <DollarSign className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Earning Per Man Day (EPMD) Intelligence
                <Badge variant="outline" className="bg-purple-950/40 text-purple-300 border-purple-800/60 text-[10px] font-mono">
                  {currentTabData.clusterName}
                </Badge>
              </h2>
              <p className="text-xs text-slate-400">
                Earning metrics per operator man-day, value addition generation, and planned vs actual revenue comparisons
              </p>
            </div>
          </div>

          {/* Subtab Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {subTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedSubTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  selectedSubTab === tab.id
                    ? "bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-md shadow-purple-900/30 border border-purple-400/40"
                    : "bg-slate-950/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}

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
      </div>

      {/* 2. KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Actual Average EPMD
            </span>
            <Badge className="bg-emerald-950/60 text-emerald-300 border-emerald-800/60 text-[10px]">
              Actual
            </Badge>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black font-mono text-emerald-400">
              ${kpis.avgActualEpmd}
            </span>
            <span className="text-xs text-slate-500">/ person-day</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Plan Target: ${kpis.avgPlanEpmd}</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
              EPMD Variance
            </span>
            <Badge className="bg-sky-950/60 text-sky-300 border-sky-800/60 text-[10px]">
              Delta
            </Badge>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-2xl font-black font-mono ${kpis.variance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {kpis.variance >= 0 ? `+$${kpis.variance}` : `-$${Math.abs(kpis.variance)}`}
            </span>
            <span className="text-xs text-slate-500">vs Sign-Off Plan</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Revised Plan EPMD: ${kpis.avgRevisedEpmd}</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Award className="w-3.5 h-3.5 text-purple-400" />
              Total Actual Value Addition
            </span>
            <Badge className="bg-purple-950/60 text-purple-300 border-purple-800/60 text-[10px]">
              Cumulative
            </Badge>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black font-mono text-purple-300">
              ${kpis.totalActualVa.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total revenue generated by cluster</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Monitored Production Days
            </span>
            <Badge className="bg-amber-950/60 text-amber-300 border-amber-800/60 text-[10px]">
              Days
            </Badge>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black font-mono text-amber-400">
              {kpis.validDaysCount}
            </span>
            <span className="text-xs text-slate-500">active days</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Continuous EPMD logging</p>
        </div>
      </div>

      {/* 3. VISUAL CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* PIE CHART: EPMD PERFORMANCE TIER */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-2">
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  EPMD Target Achievement
                </h3>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Breakdown of days meeting vs missing EPMD revenue benchmark
            </p>
          </div>

          <div className="h-60 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      const percent = kpis.validDaysCount > 0 ? Math.round((d.value / kpis.validDaysCount) * 100) : 0;
                      return (
                        <div className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 shadow-xl text-xs font-mono">
                          <p className="font-bold text-white mb-1" style={{ color: d.color }}>{d.name}</p>
                          <p className="text-slate-300">Days: <span className="font-black text-white">{d.value} days</span></p>
                          <p className="text-slate-400">Share: <span className="font-black text-white">{percent}%</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Pie
                  data={epmdPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {epmdPieData.map((entry: any, index: number) => (
                    <Cell key={`epmd-pie-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-base font-black text-white font-mono">${kpis.avgActualEpmd}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Avg EPMD</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800/80 text-[10px]">
            {epmdPieData.map((d: any) => (
              <div key={d.name} className="flex flex-col items-center text-center p-1 rounded bg-slate-950/40">
                <span className="w-2 h-2 rounded-full mb-1" style={{ backgroundColor: d.color }} />
                <span className="text-slate-400 truncate w-full">{d.name.split(" ")[0]}</span>
                <span className="font-mono text-white font-bold">{d.value} days</span>
              </div>
            ))}
          </div>
        </div>

        {/* BAR CHART: DAILY EPMD COMPARISON */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Plan vs Actual EPMD ($)
                </h3>
              </div>
              <Badge variant="outline" className="bg-emerald-950/40 text-[10px] text-emerald-300 border-emerald-800/60 font-mono">
                $/Person-Day
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Daily earning comparison across active working days
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={epmdBarData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis
                  dataKey="date"
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
                          <p className="font-bold text-white mb-1">{d.date}</p>
                          <p className="text-sky-300">Plan: <span className="font-black text-white">${d.plan?.toFixed(2)}</span></p>
                          <p className="text-emerald-400">Actual: <span className="font-black text-white">${d.actual?.toFixed(2)}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "10px", paddingTop: "5px" }} />
                <Bar dataKey="plan" name="Plan EPMD" fill="#38bdf8" radius={[3, 3, 0, 0]} />
                <Bar dataKey="actual" name="Actual EPMD" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Average Plan EPMD</span>
            <span className="font-mono text-emerald-400 font-bold">${kpis.avgActualEpmd}</span>
          </div>
        </div>

        {/* AREA CHART: DAILY VALUE ADDITION ($) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Daily VA Revenue Wave ($)
                </h3>
              </div>
              <Badge variant="outline" className="bg-purple-950/40 text-[10px] text-purple-300 border-purple-800/60 font-mono">
                USD ($)
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Progression of actual value addition generated across the month
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={vaTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <defs>
                  <linearGradient id="vaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#94a3b8", fontSize: 9 }}
                  angle={-45}
                  textAnchor="end"
                  interval={2}
                />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 shadow-xl text-xs font-mono">
                          <p className="font-bold text-purple-400">{d.date}</p>
                          <p className="text-slate-200">Actual VA: <span className="font-black text-white">${d.actualVa?.toLocaleString()}</span></p>
                          <p className="text-slate-400">Plan VA: <span className="text-sky-300">${d.planVa?.toLocaleString()}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="actualVa" stroke="#a855f7" strokeWidth={2.5} fillOpacity={1} fill="url(#vaGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Total Actual VA</span>
            <span className="font-mono text-purple-300 font-bold">${kpis.totalActualVa.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 4. FILTER CONTROLS */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search date..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/60"
          />
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing <span className="text-white font-bold">{filteredRows.length}</span> days
        </span>
      </div>

      {/* 5. DATA TABLE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
          <table className="w-full text-xs text-left font-mono">
            <thead className="bg-[#4a235a] text-white text-[11px] uppercase sticky top-0 z-20">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Plan Total VA ($)</th>
                <th className="py-2.5 px-3 text-right">Revised Total VA ($)</th>
                <th className="py-2.5 px-3 text-right bg-emerald-950/60 font-bold">Actual Total VA ($)</th>
                <th className="py-2.5 px-3 text-right text-purple-300">Plan EPMD ($)</th>
                <th className="py-2.5 px-3 text-right text-sky-300">Revised EPMD ($)</th>
                <th className="py-2.5 px-3 text-right font-black text-amber-300 bg-purple-900">Actual EPMD ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredRows.map((row: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2 px-3 font-sans text-slate-200 whitespace-nowrap">{row.dateStr}</td>
                  <td className="py-2 px-3 text-right">${row.signOffPlan?.totalVa?.toFixed(2) || "-"}</td>
                  <td className="py-2 px-3 text-right">${row.revisedPlan?.totalVa?.toFixed(2) || "-"}</td>
                  <td className="py-2 px-3 text-right font-bold text-emerald-300 bg-emerald-950/20">
                    ${row.actual?.totalVa?.toFixed(2) || "-"}
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-purple-300">${row.epmd?.plan?.toFixed(2) || "-"}</td>
                  <td className="py-2 px-3 text-right font-bold text-sky-300">${row.epmd?.revised?.toFixed(2) || "-"}</td>
                  <td className="py-2 px-3 text-right font-black text-amber-300 bg-slate-950/40">
                    ${row.epmd?.actual?.toFixed(2) || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
