"use client";

import React, { useState, useMemo } from "react";
import {
  Clock,
  Users,
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  Search,
  Download,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  AlertCircle
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

interface ClockHourTabProps {
  data: any;
  exportToCSV: (rows: any[], filename: string) => void;
}

const MANPOWER_COLORS = ["#10b981", "#f43f5e", "#f59e0b", "#38bdf8", "#8b5cf6"];

export function ClockHourTab({ data, exportToCSV }: ClockHourTabProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 50;

  const clockRecords: any[] = useMemo(() => {
    return data?.tabs?.["Clock hour"]?.records || [];
  }, [data]);

  // Distinct Units
  const unitsList = useMemo(() => {
    const set = new Set<string>();
    clockRecords.forEach((r) => {
      if (r.unit) set.add(r.unit);
    });
    return Array.from(set).sort();
  }, [clockRecords]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return clockRecords.filter((r) => {
      if (selectedUnit !== "ALL" && r.unit !== selectedUnit) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchLine = (r.line || "").toLowerCase().includes(q);
        const matchDate = (r.dateString || "").toLowerCase().includes(q);
        const matchUnit = (r.unit || "").toLowerCase().includes(q);
        if (!matchLine && !matchDate && !matchUnit) return false;
      }
      return true;
    });
  }, [clockRecords, selectedUnit, searchQuery]);

  // KPIs
  const kpis = useMemo(() => {
    if (clockRecords.length === 0) {
      return { totalClk: 0, totalPresent: 0, totalAbsent: 0, totalTransfers: 0, avgAbsentRate: 0 };
    }

    let totalClk = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalTransfers = 0;
    let totalPayroll = 0;

    clockRecords.forEach((r) => {
      totalClk += Number(r.clockHour) || 0;
      totalPresent += Number(r.present) || 0;
      totalAbsent += Number(r.absentLeave) || 0;
      totalTransfers += Number(r.lineTransfer) || 0;
      totalPayroll += Number(r.payrollMo) || 0;
    });

    const avgAbsentRate = totalPayroll > 0 ? Math.round((totalAbsent / totalPayroll) * 1000) / 10 : 0;

    return {
      totalClk: Math.round(totalClk),
      totalPresent: Math.round(totalPresent),
      totalAbsent: Math.round(totalAbsent),
      totalTransfers: Math.round(totalTransfers),
      avgAbsentRate,
    };
  }, [clockRecords]);

  // Pie Chart: Attendance & Manpower Allocation
  const manpowerPieData = useMemo(() => {
    return [
      { name: "Present Operators", value: kpis.totalPresent, color: "#10b981" },
      { name: "Absent / Leave", value: kpis.totalAbsent, color: "#f43f5e" },
      { name: "Line Transfers", value: kpis.totalTransfers, color: "#38bdf8" },
    ].filter((d) => d.value > 0);
  }, [kpis]);

  // Bar Chart: Top 10 Lines by Clock Hours
  const lineClockBarData = useMemo(() => {
    const lineMap: Record<string, { clk: number; present: number; unit: string }> = {};
    clockRecords.forEach((r) => {
      const line = r.line || "Unknown";
      if (!lineMap[line]) lineMap[line] = { clk: 0, present: 0, unit: r.unit || "" };
      lineMap[line].clk += Number(r.clockHour) || 0;
      lineMap[line].present += Number(r.present) || 0;
    });

    return Object.entries(lineMap)
      .map(([line, val]) => ({
        line,
        unit: val.unit,
        clockHours: Math.round(val.clk),
        present: Math.round(val.present),
      }))
      .sort((a, b) => b.clockHours - a.clockHours)
      .slice(0, 10);
  }, [clockRecords]);

  // Bar Chart: Unit-wise Clock Hours
  const unitClockBarData = useMemo(() => {
    const unitMap: Record<string, { clk: number; count: number }> = {};
    clockRecords.forEach((r) => {
      const u = r.unit || "Other";
      if (!unitMap[u]) unitMap[u] = { clk: 0, count: 0 };
      unitMap[u].clk += Number(r.clockHour) || 0;
      unitMap[u].count += 1;
    });

    return Object.entries(unitMap)
      .map(([unit, val]) => ({
        unit,
        clockHours: Math.round(val.clk),
      }))
      .sort((a, b) => b.clockHours - a.clockHours);
  }, [clockRecords]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage]);

  const handleExportCSV = () => {
    const rows = filteredRecords.map((r) => ({
      "Date": r.dateString,
      "Line": r.line,
      "Unit": r.unit,
      "Cluster": r.cluster,
      "Payroll MO": r.payrollMo,
      "Absent / Leave": r.absentLeave,
      "MLV": r.mlv,
      "Present MO": r.present,
      "Line Transfer": r.lineTransfer,
      "MO For Clk Hrs": r.moForClkHrs,
      "Clock Hours": r.clockHour,
      "Absent Rate %": r.absentRate ? `${r.absentRate.toFixed(1)}%` : "0%",
    }));
    exportToCSV(rows, "Clock_Hours_and_Attendance_Report.csv");
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Clock Hours & Attendance Intelligence
                <Badge variant="outline" className="bg-sky-950/40 text-sky-300 border-sky-800/60 text-[10px] font-mono">
                  {clockRecords.length.toLocaleString()} Total Records
                </Badge>
              </h2>
              <p className="text-xs text-slate-400">
                Live monitoring of operator presence, absent rates, manpower transfers, and standard clock hours
              </p>
            </div>
          </div>

          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            className="h-8 text-xs border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-sky-400" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* 2. KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              Total Operator Clock Hours
            </span>
            <Badge className="bg-sky-950/60 text-sky-300 border-sky-800/60 text-[10px]">
              Actual
            </Badge>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black font-mono text-sky-400">
              {kpis.totalClk.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">hours clocked</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total productive manpower hours</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              Total Present Operators
            </span>
            <Badge className="bg-emerald-950/60 text-emerald-300 border-emerald-800/60 text-[10px]">
              Active
            </Badge>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black font-mono text-emerald-400">
              {kpis.totalPresent.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">man-days present</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across all manufacturing lines</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              Average Absent Rate
            </span>
            <Badge className="bg-rose-950/60 text-rose-300 border-rose-800/60 text-[10px]">
              Rate
            </Badge>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black font-mono text-rose-400">
              {kpis.avgAbsentRate}%
            </span>
            <span className="text-xs text-slate-500">({kpis.totalAbsent.toLocaleString()} absentees)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Leaves and unauthorized absences</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              Manpower Line Transfers
            </span>
            <Badge className="bg-purple-950/60 text-purple-300 border-purple-800/60 text-[10px]">
              Support
            </Badge>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black font-mono text-purple-300">
              {kpis.totalTransfers.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">transfers deployed</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Dynamic line balancing transfers</p>
        </div>
      </div>

      {/* 3. VISUAL CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* PIE CHART: MANPOWER ALLOCATION */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-2">
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Manpower Presence Breakdown
                </h3>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Ratio of present operators vs absent personnel vs line transfers
            </p>
          </div>

          <div className="h-60 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      const total = kpis.totalPresent + kpis.totalAbsent + kpis.totalTransfers;
                      const percent = total > 0 ? Math.round((d.value / total) * 100) : 0;
                      return (
                        <div className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 shadow-xl text-xs font-mono">
                          <p className="font-bold text-white mb-1" style={{ color: d.color }}>{d.name}</p>
                          <p className="text-slate-300">Headcount: <span className="font-black text-white">{d.value.toLocaleString()}</span></p>
                          <p className="text-slate-400">Share: <span className="font-black text-white">{percent}%</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Pie
                  data={manpowerPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {manpowerPieData.map((entry: any, index: number) => (
                    <Cell key={`clk-cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-base font-black text-white font-mono">{kpis.totalPresent.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Present</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800/80 text-[10px]">
            {manpowerPieData.map((d: any) => (
              <div key={d.name} className="flex flex-col items-center text-center p-1 rounded bg-slate-950/40">
                <span className="w-2 h-2 rounded-full mb-1" style={{ backgroundColor: d.color }} />
                <span className="text-slate-400 truncate w-full">{d.name.split(" ")[0]}</span>
                <span className="font-mono text-white font-bold">{d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* BAR CHART: TOP 10 LINES BY CLOCK HOURS */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Top 10 Lines by Clock Hours
                </h3>
              </div>
              <Badge variant="outline" className="bg-sky-950/40 text-[10px] text-sky-300 border-sky-800/60 font-mono">
                Hours
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Lines with highest cumulative operator working hours
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lineClockBarData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
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
                          <p className="font-bold text-sky-400">{d.line} ({d.unit})</p>
                          <p className="text-slate-300">Clock Hours: <span className="font-black text-white">{d.clockHours.toLocaleString()} hrs</span></p>
                          <p className="text-slate-400">Present Operators: <span className="font-bold text-emerald-400">{d.present.toLocaleString()}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="clockHours" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Highest Output Line</span>
            <span className="font-mono text-sky-400 font-bold">{lineClockBarData[0]?.line || "N/A"}</span>
          </div>
        </div>

        {/* BAR CHART: UNIT-WISE CLOCK HOURS */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Unit-Wise Total Clock Hours
                </h3>
              </div>
              <Badge variant="outline" className="bg-purple-950/40 text-[10px] text-purple-300 border-purple-800/60 font-mono">
                {unitClockBarData.length} Units
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Distribution of manufacturing hours across plant units
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unitClockBarData} margin={{ top: 10, right: 10, left: -15, bottom: 10 }}>
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
                          <p className="text-slate-300">Clock Hours: <span className="font-black text-white">{d.clockHours.toLocaleString()} hrs</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="clockHours" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Total Units Clocked</span>
            <span className="font-mono text-purple-300 font-bold">{kpis.totalClk.toLocaleString()} hrs</span>
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search line, date, unit..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/60"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Unit:</span>
            <select
              value={selectedUnit}
              onChange={(e) => {
                setSelectedUnit(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 px-2.5 py-1.5 focus:outline-none focus:border-sky-500/60"
            >
              <option value="ALL">All Units ({unitsList.length})</option>
              {unitsList.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing <span className="text-white font-bold">{filteredRecords.length.toLocaleString()}</span> records
        </span>
      </div>

      {/* 5. DATA TABLE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto max-h-[550px] custom-scrollbar">
          <table className="w-full text-xs text-left font-mono">
            <thead className="bg-[#4a235a] text-white text-[11px] uppercase sticky top-0 z-20">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Line</th>
                <th className="py-2.5 px-2">Unit</th>
                <th className="py-2.5 px-2">Cluster</th>
                <th className="py-2.5 px-3 text-right">Payroll MO</th>
                <th className="py-2.5 px-3 text-right">Absent / Lv</th>
                <th className="py-2.5 px-3 text-right">Present MO</th>
                <th className="py-2.5 px-3 text-right">Line Transfer</th>
                <th className="py-2.5 px-3 text-right">MO For Clk</th>
                <th className="py-2.5 px-3 text-right bg-purple-900 font-bold">Clock Hours</th>
                <th className="py-2.5 px-3 text-right">Absent %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {paginatedRows.map((row: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2 px-3 font-sans text-slate-200 whitespace-nowrap">{row.dateString}</td>
                  <td className="py-2 px-3 font-bold text-sky-400">{row.line}</td>
                  <td className="py-2 px-2 text-slate-400">{row.unit}</td>
                  <td className="py-2 px-2 text-slate-400">{row.cluster}</td>
                  <td className="py-2 px-3 text-right">{row.payrollMo || "-"}</td>
                  <td className="py-2 px-3 text-right text-rose-400 font-medium">{row.absentLeave || "-"}</td>
                  <td className="py-2 px-3 text-right text-emerald-400 font-bold">{row.present || "-"}</td>
                  <td className="py-2 px-3 text-right text-purple-300">{row.lineTransfer || "-"}</td>
                  <td className="py-2 px-3 text-right">{row.moForClkHrs || "-"}</td>
                  <td className="py-2 px-3 text-right font-black text-sky-300 bg-slate-950/40">{row.clockHour}</td>
                  <td className="py-2 px-3 text-right font-bold text-amber-300">
                    {row.absentRate ? `${row.absentRate.toFixed(1)}%` : "0.0%"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Page {currentPage} of {totalPages} ({filteredRecords.length.toLocaleString()} total rows)</span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-7 text-xs bg-slate-900 border-slate-800 text-slate-300"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-7 text-xs bg-slate-900 border-slate-800 text-slate-300"
            >
              Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
