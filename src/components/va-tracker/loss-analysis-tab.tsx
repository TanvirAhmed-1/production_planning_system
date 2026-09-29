"use client";

import React, { useState, useMemo } from "react";
import {
  AlertTriangle,
  Clock,
  PieChart as PieIcon,
  BarChart3,
  TrendingDown,
  Layers,
  Search,
  Download,
  Filter,
  CheckCircle2,
  Calendar,
  Activity,
  ArrowDownRight
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

interface LossAnalysisTabProps {
  data: any;
  exportToCSV: (rows: any[], filename: string) => void;
}

const DEPARTMENT_COLORS = [
  "#f43f5e", // Rose (Sewing/Production)
  "#8b5cf6", // Purple (Technical)
  "#38bdf8", // Sky (SCM)
  "#f59e0b", // Amber (Cutting)
  "#10b981", // Emerald (Quality)
  "#ec4899", // Pink (Maintenance)
  "#6366f1", // Indigo (HR/Admin)
  "#14b8a6", // Teal
  "#eab308", // Yellow
  "#94a3b8", // Slate
];

export function LossAnalysisTab({ data, exportToCSV }: LossAnalysisTabProps) {
  const [selectedSubTab, setSelectedSubTab] = useState<string>("B1 - Loss Time");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");

  const subTabs = [
    { id: "B1 - Loss Time", label: "B1 Loss Time (Daily)", group: "Birichina-1" },
    { id: "B2 - Loss Time", label: "B2 Loss Time (Daily)", group: "Birichina-2" },
    { id: "Styrax- Loss Time", label: "Styrax Loss Time (Daily)", group: "Styrax" },
    { id: "B1 - Loss Hr. Analysis", label: "B1 Unit Hr Analysis", group: "Birichina-1" },
    { id: "B2 - Loss Hr. Analysis", label: "B2 Unit Hr Analysis", group: "Birichina-2" },
    { id: "Styrax - Loss Hr. Analysis", label: "Styrax Hr Analysis", group: "Styrax" },
  ];

  const currentTabData = useMemo(() => {
    return data?.tabs?.[selectedSubTab] || {};
  }, [data, selectedSubTab]);

  const isDailyLossTime = selectedSubTab.includes("Loss Time");

  // Rows for Loss Time view
  const lossRows: any[] = useMemo(() => {
    if (!isDailyLossTime) return [];
    return currentTabData.rows || [];
  }, [currentTabData, isDailyLossTime]);

  const lossDays: any[] = useMemo(() => {
    if (!isDailyLossTime) return [];
    return currentTabData.days || [];
  }, [currentTabData, isDailyLossTime]);

  // Distinct Departments
  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    lossRows.forEach((r) => {
      if (r.department) set.add(r.department.trim());
    });
    return Array.from(set).sort();
  }, [lossRows]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return lossRows.filter((r) => {
      if (selectedDept !== "ALL" && r.department !== selectedDept) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDept = (r.department || "").toLowerCase().includes(q);
        const matchCode = (r.code || "").toLowerCase().includes(q);
        if (!matchDept && !matchCode) return false;
      }
      return true;
    });
  }, [lossRows, selectedDept, searchQuery]);

  // Calculate KPIs for Loss Time
  const kpis = useMemo(() => {
    if (!isDailyLossTime || lossRows.length === 0) {
      return { totalLossSah: 0, topDept: "N/A", topDeptLoss: 0, avgDailyLoss: 0, highestDay: { label: "N/A", value: 0 } };
    }

    const totalLossSah = lossRows.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
    const sortedDepts = [...lossRows].sort((a, b) => (Number(b.total) || 0) - (Number(a.total) || 0));
    const topDept = sortedDepts[0]?.department || "N/A";
    const topDeptLoss = Number(sortedDepts[0]?.total) || 0;

    // Daily totals
    let highestDay = { label: "N/A", value: 0 };
    let dailySum = 0;
    let dayCount = lossDays.length || 1;

    lossDays.forEach((d, idx) => {
      let dayTotal = 0;
      lossRows.forEach((r) => {
        dayTotal += Number(r.dayValues?.[idx]) || 0;
      });
      dailySum += dayTotal;
      if (dayTotal > highestDay.value) {
        highestDay = { label: d.label, value: Math.round(dayTotal * 10) / 10 };
      }
    });

    const avgDailyLoss = dayCount > 0 ? Math.round((totalLossSah / dayCount) * 10) / 10 : 0;

    return {
      totalLossSah: Math.round(totalLossSah * 10) / 10,
      topDept,
      topDeptLoss: Math.round(topDeptLoss * 10) / 10,
      avgDailyLoss,
      highestDay,
    };
  }, [lossRows, lossDays, isDailyLossTime]);

  // Pie Chart Data: Department Loss Share
  const departmentPieData = useMemo(() => {
    if (!isDailyLossTime || lossRows.length === 0) return [];
    return lossRows
      .filter((r) => Number(r.total) > 0)
      .map((r, idx) => ({
        name: r.department,
        code: r.code,
        value: Math.round(Number(r.total) * 10) / 10,
        percentage: Number(r.percentage) || 0,
        color: DEPARTMENT_COLORS[idx % DEPARTMENT_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [lossRows, isDailyLossTime]);

  // Bar Chart Data: Department Lost Hours Ranking
  const departmentBarData = useMemo(() => {
    return departmentPieData.slice(0, 10).map((d) => ({
      department: d.name.length > 14 ? `${d.name.slice(0, 12)}..` : d.name,
      fullName: d.name,
      lostHours: d.value,
      percentage: d.percentage,
      fill: d.color,
    }));
  }, [departmentPieData]);

  // Area Chart Data: 30-Day Daily Loss SAH Trend
  const dailyLossTrendData = useMemo(() => {
    if (!isDailyLossTime || lossDays.length === 0) return [];
    return lossDays.map((d, idx) => {
      let total = 0;
      lossRows.forEach((r) => {
        total += Number(r.dayValues?.[idx]) || 0;
      });
      return {
        date: d.label,
        lostSah: Math.round(total * 10) / 10,
      };
    });
  }, [lossDays, lossRows, isDailyLossTime]);

  // Export to CSV
  const handleExportCSV = () => {
    if (isDailyLossTime) {
      const rows = filteredRows.map((r) => {
        const rowObj: any = {
          "Department": r.department,
          "Loss Code": r.code,
        };
        lossDays.forEach((d, dIdx) => {
          rowObj[d.label] = r.dayValues?.[dIdx] || 0;
        });
        rowObj["Total Lost SAH"] = r.total;
        rowObj["Share %"] = r.percentage ? `${r.percentage.toFixed(1)}%` : "0%";
        return rowObj;
      });
      exportToCSV(rows, `${selectedSubTab.replace(/\s+/g, "_")}.csv`);
    } else {
      const allRows: any[] = [];
      (currentTabData.tables || []).forEach((tbl: any) => {
        (tbl.rows || []).forEach((r: any) => {
          allRows.push({ "Table": tbl.title, ...r });
        });
      });
      exportToCSV(allRows, `${selectedSubTab.replace(/\s+/g, "_")}.csv`);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER & SUBTAB SWITCHER */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Garments Loss Time & Root Cause Analytics
                <Badge variant="outline" className="bg-rose-950/40 text-rose-300 border-rose-800/60 text-[10px] font-mono">
                  {isDailyLossTime ? `${lossRows.length} Loss Categories` : "Unit Breakdown Analysis"}
                </Badge>
              </h2>
              <p className="text-xs text-slate-400">
                Continuous breakdown of Lost SAH by department, defect category, and daily spike timeline
              </p>
            </div>
          </div>

          {/* Subtab Selection */}
          <div className="flex flex-wrap items-center gap-2">
            {subTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedSubTab(tab.id);
                  setSelectedDept("ALL");
                  setSearchQuery("");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  selectedSubTab === tab.id
                    ? "bg-gradient-to-r from-rose-700 to-purple-700 text-white shadow-md shadow-rose-900/30 border border-rose-400/40"
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
              <Download className="w-3.5 h-3.5 mr-1.5 text-rose-400" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {isDailyLossTime ? (
        <>
          {/* 2. LOSS TIME KPIS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-rose-400" />
                  Total Lost SAH (Hours)
                </span>
                <Badge className="bg-rose-950/60 text-rose-300 border-rose-800/60 text-[10px]">
                  Full Month
                </Badge>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-black font-mono text-rose-400">
                  {kpis.totalLossSah.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500">hours wasted</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Across all departments and lines</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Primary Loss Department
                </span>
                <Badge className="bg-amber-950/60 text-amber-300 border-amber-800/60 text-[10px]">
                  Top Cause
                </Badge>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-base font-bold text-amber-300 truncate max-w-[170px]" title={kpis.topDept}>
                  {kpis.topDept}
                </span>
                <span className="text-lg font-black text-amber-400 font-mono">
                  {kpis.topDeptLoss} hrs
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Responsible for majority downtime</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <TrendingDown className="w-3.5 h-3.5 text-sky-400" />
                  Average Daily Loss
                </span>
                <Badge className="bg-sky-950/60 text-sky-300 border-sky-800/60 text-[10px]">
                  Daily Pace
                </Badge>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-black font-mono text-sky-300">
                  {kpis.avgDailyLoss}
                </span>
                <span className="text-xs text-slate-500">hrs / day</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Across {lossDays.length} working days</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <Activity className="w-3.5 h-3.5 text-purple-400" />
                  Peak Loss Day
                </span>
                <Badge className="bg-purple-950/60 text-purple-300 border-purple-800/60 text-[10px]">
                  Spike
                </Badge>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-base font-bold text-purple-300 font-mono">
                  {kpis.highestDay.label}
                </span>
                <span className="text-xl font-black text-purple-400 font-mono">
                  {kpis.highestDay.value} hrs
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Highest cumulative lost hours</p>
            </div>
          </div>

          {/* 3. VISUAL CHARTS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* PIE CHART: DEPARTMENT LOSS SHARE */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-2">
                  <div className="flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-rose-400" />
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Department Loss Share (%)
                    </h3>
                  </div>
                  <Badge variant="outline" className="bg-slate-800 text-[10px] text-slate-400 border-slate-700 font-mono">
                    {departmentPieData.length} Depts
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">
                  Proportion of total lost standard allowable hours by department
                </p>
              </div>

              <div className="h-60 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 shadow-xl text-xs font-mono">
                              <p className="font-bold text-white mb-1" style={{ color: d.color }}>{d.name}</p>
                              <p className="text-slate-300">Lost SAH: <span className="font-black text-white">{d.value} hrs</span></p>
                              <p className="text-slate-400">Share: <span className="font-black text-white">{d.percentage?.toFixed(1)}%</span></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Pie
                      data={departmentPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {departmentPieData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-lg font-black text-white font-mono">{kpis.totalLossSah.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Total Lost SAH</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800/80 max-h-24 overflow-y-auto custom-scrollbar">
                {departmentPieData.map((d: any) => (
                  <button
                    key={d.name}
                    onClick={() => setSelectedDept(selectedDept === d.name ? "ALL" : d.name)}
                    className="flex items-center justify-between p-1 rounded hover:bg-slate-800/50 text-[10px] cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-slate-300 truncate">{d.name}</span>
                    </div>
                    <span className="font-mono text-white font-bold">{d.percentage?.toFixed(1)}%</span>
                  </button>
                ))}
              </div>
            </div>

            {/* BAR CHART: DEPARTMENT LOST HOURS RANKING */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Department Lost Hours Ranking
                    </h3>
                  </div>
                  <Badge variant="outline" className="bg-amber-950/40 text-[10px] text-amber-300 border-amber-800/60 font-mono">
                    SAH (Hrs)
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">
                  Ranked comparison of downtime generated across operational teams
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentBarData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis
                      dataKey="department"
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
                              <p className="font-bold text-white mb-1">{d.fullName}</p>
                              <p className="text-slate-300">Lost SAH: <span className="font-black text-rose-400">{d.lostHours} hrs</span></p>
                              <p className="text-slate-400">Share %: <span className="font-black text-amber-300">{d.percentage?.toFixed(1)}%</span></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="lostHours" radius={[4, 4, 0, 0]}>
                      {departmentBarData.map((entry, index) => (
                        <Cell key={`loss-bar-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                <span>Top Loss: <strong className="text-white">{kpis.topDept}</strong></span>
                <span className="font-mono text-rose-400 font-bold">{kpis.topDeptLoss} hrs</span>
              </div>
            </div>

            {/* AREA CHART: 30-DAY DAILY LOST SAH TREND */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-rose-400" />
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Daily Lost SAH Progression
                    </h3>
                  </div>
                  <Badge variant="outline" className="bg-rose-950/40 text-[10px] text-rose-300 border-rose-800/60 font-mono">
                    30-Day Wave
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">
                  Day-by-day fluctuation of total hours lost throughout the month
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyLossTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <defs>
                      <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
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
                              <p className="font-bold text-rose-400">{d.date}</p>
                              <p className="text-slate-200">Daily Lost SAH: <span className="font-black text-white">{d.lostSah} hrs</span></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="lostSah" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#lossGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                <span>Highest Spike: <strong className="text-white">{kpis.highestDay.label}</strong></span>
                <span className="font-mono text-rose-400 font-bold">{kpis.highestDay.value} hrs</span>
              </div>
            </div>
          </div>

          {/* 4. FILTER CONTROLS & SEARCH */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search department, defect code..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/60"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>Department:</span>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 px-2.5 py-1.5 focus:outline-none focus:border-rose-500/60"
                >
                  <option value="ALL">All Departments ({departmentsList.length})</option>
                  {departmentsList.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            <span className="text-xs text-slate-400 font-mono">
              Showing <span className="text-white font-bold">{filteredRows.length}</span> categories
            </span>
          </div>

          {/* 5. DATA TABLE */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
              <table className="w-full text-xs text-left font-mono">
                <thead className="bg-[#4a235a] text-white text-[11px] uppercase sticky top-0 z-20">
                  <tr>
                    <th className="py-2.5 px-3 sticky left-0 z-20 bg-[#4a235a]">Department</th>
                    <th className="py-2.5 px-2 sticky left-40 z-20 bg-[#4a235a]">Code</th>
                    {lossDays.map((d: any, idx: number) => (
                      <th key={idx} className="py-2.5 px-2 text-center whitespace-nowrap">{d.label}</th>
                    ))}
                    <th className="py-2.5 px-3 text-right bg-purple-900 font-bold sticky right-20 z-20">Total SAH</th>
                    <th className="py-2.5 px-2 text-right bg-purple-900 font-bold sticky right-0 z-20">Share %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredRows.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-3 font-sans font-bold text-slate-200 sticky left-0 z-10 bg-slate-900 whitespace-nowrap">
                        {row.department}
                      </td>
                      <td className="py-2 px-2 text-slate-400 sticky left-40 z-10 bg-slate-900">
                        {row.code}
                      </td>
                      {(row.dayValues || []).map((v: number, dIdx: number) => (
                        <td
                          key={dIdx}
                          className={`py-2 px-2 text-center font-mono ${
                            v > 50 ? "bg-rose-950/40 text-rose-300 font-bold" : v > 0 ? "text-slate-200" : "text-slate-600"
                          }`}
                        >
                          {v > 0 ? v : "-"}
                        </td>
                      ))}
                      <td className="py-2 px-3 text-right font-bold text-rose-400 bg-slate-950/60 sticky right-20 z-10 font-mono">
                        {row.total}
                      </td>
                      <td className="py-2 px-2 text-right font-bold text-purple-300 bg-slate-950/60 sticky right-0 z-10 font-mono">
                        {row.percentage ? `${row.percentage.toFixed(1)}%` : "0.0%"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* LOSS HR ANALYSIS MULTI-TABLE VIEW */
        <div className="space-y-6">
          {(currentTabData.tables || []).map((tbl: any, idx: number) => (
            <div key={idx} className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="bg-[#4a235a] text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between">
                <span>{tbl.title}</span>
                <Badge variant="outline" className="bg-purple-900/50 text-white border-purple-400/40 text-[10px]">
                  {tbl.rows?.length || 0} Records
                </Badge>
              </div>
              <div className="overflow-x-auto max-h-[450px] custom-scrollbar">
                <table className="w-full text-xs text-left font-mono">
                  <thead className="bg-slate-950 text-slate-300 border-b border-slate-800 text-[10px] uppercase sticky top-0 z-10">
                    <tr>
                      {tbl.headers?.map((h: string, hIdx: number) => (
                        <th key={hIdx} className="py-2 px-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {tbl.rows?.map((r: any, rIdx: number) => (
                      <tr key={rIdx} className={r.isTotal ? "bg-purple-950/50 font-black text-white" : "hover:bg-slate-800/40"}>
                        {tbl.headers?.map((h: string, hIdx: number) => {
                          const val = r[h];
                          const isNumber = typeof val === "number";
                          return (
                            <td key={hIdx} className={`py-1.5 px-3 ${isNumber ? "text-right" : ""}`}>
                              {isNumber ? val.toLocaleString() : (val || "-")}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
