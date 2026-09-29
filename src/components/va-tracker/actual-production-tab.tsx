"use client";

import React, { useState, useMemo } from "react";
import {
  Database,
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
  ChevronLeft,
  ChevronRight
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

interface ActualProductionTabProps {
  data: any;
  dbStats: any;
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

export function ActualProductionTab({ data, dbStats, exportToCSV }: ActualProductionTabProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [clusterFilter, setClusterFilter] = useState<string>("ALL");
  const [buyerFilter, setBuyerFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 50;

  const records: any[] = useMemo(() => {
    return data?.tabs?.["Actual"]?.records || [];
  }, [data]);

  // Distinct Buyers & Clusters
  const buyersList = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.buyer) set.add(r.buyer.trim());
    });
    return Array.from(set).sort();
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      if (clusterFilter !== "ALL" && rec.cluster !== clusterFilter) return false;
      if (buyerFilter !== "ALL" && rec.buyer !== buyerFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchUnit = (rec.unitLine || "").toLowerCase().includes(q);
        const matchBuyer = (rec.buyer || "").toLowerCase().includes(q);
        const matchStyle = (rec.style || "").toLowerCase().includes(q);
        const matchOc = (rec.oc || "").toLowerCase().includes(q);
        const matchDate = (rec.dateString || "").toLowerCase().includes(q);
        if (!matchUnit && !matchBuyer && !matchStyle && !matchOc && !matchDate) return false;
      }
      return true;
    });
  }, [records, clusterFilter, buyerFilter, searchQuery]);

  // KPIs
  const kpis = useMemo(() => {
    let totalPcs = 0;
    let totalSah = 0;
    let totalClk = 0;
    let effSum = 0;
    let effCount = 0;

    records.forEach((r) => {
      totalPcs += Number(r.actualQty) || 0;
      totalSah += Number(r.actualSah) || 0;
      totalClk += Number(r.clockHours) || 0;
      if (r.efficiency > 0) {
        effSum += r.efficiency;
        effCount++;
      }
    });

    const avgEff = effCount > 0 ? Math.round((effSum / effCount) * 10) / 10 : 0;

    return {
      totalRecords: records.length,
      totalPcs,
      totalSah: Math.round(totalSah),
      totalClk: Math.round(totalClk),
      avgEff,
    };
  }, [records]);

  // Pie Chart: Buyer Share
  const buyerPieData = useMemo(() => {
    const buyerMap: Record<string, number> = {};
    records.forEach((r) => {
      const b = r.buyer || "Other";
      buyerMap[b] = (buyerMap[b] || 0) + (Number(r.actualQty) || 0);
    });

    return Object.entries(buyerMap)
      .map(([buyer, qty], idx) => ({
        name: buyer,
        value: qty,
        color: BUYER_COLORS[idx % BUYER_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [records]);

  // Bar Chart: Cluster Output Comparison
  const clusterBarData = useMemo(() => {
    const clusterMap: Record<string, { qty: number; count: number }> = {};
    records.forEach((r) => {
      const c = r.cluster || "Other";
      if (!clusterMap[c]) clusterMap[c] = { qty: 0, count: 0 };
      clusterMap[c].qty += Number(r.actualQty) || 0;
      clusterMap[c].count += 1;
    });

    return Object.entries(clusterMap).map(([cluster, val]) => ({
      cluster,
      totalPcs: val.qty,
      recordsCount: val.count,
    })).sort((a, b) => b.totalPcs - a.totalPcs);
  }, [records]);

  // Bar Chart: Product Type Output
  const typeBarData = useMemo(() => {
    const typeMap: Record<string, number> = {};
    records.forEach((r) => {
      const t = r.categoryType || "Other";
      typeMap[t] = (typeMap[t] || 0) + (Number(r.actualQty) || 0);
    });

    return Object.entries(typeMap)
      .map(([type, qty]) => ({
        type: type.length > 12 ? `${type.slice(0, 10)}..` : type,
        fullType: type,
        qty,
      }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);
  }, [records]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage]);

  const handleExportCSV = () => {
    const csvRows = filteredRecords.map((r) => ({
      "Date": r.dateString,
      "Unit-Line": r.unitLine,
      "Buyer": r.buyer,
      "Style": r.style,
      "OC No": r.oc,
      "Type": r.categoryType,
      "SMV": r.smv,
      "Actual Qty": r.actualQty,
      "MO": r.mo,
      "Clock Hours": r.clockHours,
      "Actual SAH": r.actualSah,
      "Efficiency %": r.efficiency ? `${r.efficiency.toFixed(1)}%` : "0%",
      "FOB Price": r.fobPrice,
      "VA Price": r.vaPrice,
      "Unit": r.unitCode,
      "Cluster": r.cluster,
    }));
    exportToCSV(csvRows, "Actual_Production_Database_Export.csv");
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Database className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Actual Production Database (PostgreSQL)
                <Badge variant="outline" className="bg-purple-950/40 text-purple-300 border-purple-800/60 text-[10px] font-mono">
                  {dbStats?.recordCount || records.length.toLocaleString()} Production Records
                </Badge>
              </h2>
              <p className="text-xs text-slate-400">
                Line-level transactional database storing actual pieces, SMV, operators, clock hours, and earned SAH
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
              Total Actual Output
            </span>
            <Badge className="bg-emerald-950/60 text-emerald-300 border-emerald-800/60 text-[10px]">
              Database
            </Badge>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black font-mono text-emerald-400">
              {kpis.totalPcs.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">pcs produced</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across 190+ manufacturing lines</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Award className="w-3.5 h-3.5 text-sky-400" />
              Average Line Efficiency
            </span>
            <Badge className="bg-sky-950/60 text-sky-300 border-sky-800/60 text-[10px]">
              Mean
            </Badge>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-2xl font-black font-mono ${kpis.avgEff >= 70 ? "text-emerald-400" : "text-amber-400"}`}>
              {kpis.avgEff}%
            </span>
            <span className="text-xs text-slate-500">factory average</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Target efficiency benchmark: 70%</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              Earned Allowable Hours (SAH)
            </span>
            <Badge className="bg-purple-950/60 text-purple-300 border-purple-800/60 text-[10px]">
              SAH
            </Badge>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black font-mono text-purple-300">
              {kpis.totalSah.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">hours</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total Clock Hours: {kpis.totalClk.toLocaleString()} hrs</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              Total Logged Records
            </span>
            <Badge className="bg-amber-950/60 text-amber-300 border-amber-800/60 text-[10px]">
              Rows
            </Badge>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black font-mono text-amber-400">
              {kpis.totalRecords.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">line transactions</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Validated and synced with PostgreSQL</p>
        </div>
      </div>

      {/* 3. VISUAL CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* PIE CHART: BUYER OUTPUT DISTRIBUTION */}
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
              Proportion of actual pieces produced per fashion buyer
            </p>
          </div>

          <div className="h-60 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      const percent = kpis.totalPcs > 0 ? Math.round((d.value / kpis.totalPcs) * 100) : 0;
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
                    <Cell key={`act-pie-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-base font-black text-white font-mono">{kpis.totalPcs.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Total Pcs</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800/80 max-h-24 overflow-y-auto custom-scrollbar text-[10px]">
            {buyerPieData.map((d: any) => (
              <button
                key={d.name}
                onClick={() => setBuyerFilter(buyerFilter === d.name ? "ALL" : d.name)}
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

        {/* BAR CHART: CLUSTER PRODUCTION COMPARISON */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Cluster Production Comparison
                </h3>
              </div>
              <Badge variant="outline" className="bg-emerald-950/40 text-[10px] text-emerald-300 border-emerald-800/60 font-mono">
                Pcs
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Total volume produced across Birichina-1, Birichina-2, and Styrax
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clusterBarData} margin={{ top: 10, right: 10, left: -15, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="cluster" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 shadow-xl text-xs font-mono">
                          <p className="font-bold text-emerald-400">{d.cluster}</p>
                          <p className="text-slate-300">Total Output: <span className="font-black text-white">{d.totalPcs.toLocaleString()} pcs</span></p>
                          <p className="text-slate-400">Total Records: <span className="font-bold text-slate-200">{d.recordsCount.toLocaleString()}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="totalPcs" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Primary Cluster</span>
            <span className="font-mono text-emerald-400 font-bold">{clusterBarData[0]?.cluster || "N/A"}</span>
          </div>
        </div>

        {/* BAR CHART: GARMENT PRODUCT TYPE OUTPUT */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Garment Category Volume
                </h3>
              </div>
              <Badge variant="outline" className="bg-purple-950/40 text-[10px] text-purple-300 border-purple-800/60 font-mono">
                Categories
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Output piece volume categorized by garment product type
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeBarData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis
                  dataKey="type"
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
                          <p className="font-bold text-purple-400">{d.fullType}</p>
                          <p className="text-slate-300">Volume: <span className="font-black text-white">{d.qty.toLocaleString()} pcs</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="qty" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Dominant Garment Type</span>
            <span className="font-mono text-purple-300 font-bold">{typeBarData[0]?.fullType || "N/A"}</span>
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
              placeholder="Search line, buyer, style, OC..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/60"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Cluster:</span>
            <select
              value={clusterFilter}
              onChange={(e) => {
                setClusterFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 px-2.5 py-1.5 focus:outline-none focus:border-purple-500/60"
            >
              <option value="ALL">All Clusters</option>
              <option value="B1">Birichina-1 (B1)</option>
              <option value="B2">Birichina-2 (B2)</option>
              <option value="Styrax">Styrax Apparels</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Buyer:</span>
            <select
              value={buyerFilter}
              onChange={(e) => {
                setBuyerFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 px-2.5 py-1.5 focus:outline-none focus:border-purple-500/60"
            >
              <option value="ALL">All Buyers ({buyersList.length})</option>
              {buyersList.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing <span className="text-white font-bold">{filteredRecords.length.toLocaleString()}</span> of {records.length.toLocaleString()}
        </span>
      </div>

      {/* 5. DATA TABLE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto max-h-[550px] custom-scrollbar">
          <table className="w-full text-xs text-left font-mono">
            <thead className="bg-[#4a235a] text-white text-[11px] uppercase sticky top-0 z-20">
              <tr>
                <th className="py-2.5 px-3 sticky left-0 z-20 bg-[#4a235a]">Date</th>
                <th className="py-2.5 px-3 sticky left-24 z-20 bg-[#4a235a]">Unit-Line</th>
                <th className="py-2.5 px-3">Buyer</th>
                <th className="py-2.5 px-3">Style</th>
                <th className="py-2.5 px-2">OC No</th>
                <th className="py-2.5 px-2">Type</th>
                <th className="py-2.5 px-2 text-right">SMV</th>
                <th className="py-2.5 px-3 text-right text-emerald-300 font-bold bg-emerald-950/60">Actual Pcs</th>
                <th className="py-2.5 px-2 text-right">MO</th>
                <th className="py-2.5 px-2 text-right">Clock Hrs</th>
                <th className="py-2.5 px-2 text-right">MC SAH</th>
                <th className="py-2.5 px-2 text-right text-purple-300 font-bold bg-purple-900">Eff%</th>
                <th className="py-2.5 px-2 text-right">FOB Price</th>
                <th className="py-2.5 px-2 text-right">VA Price</th>
                <th className="py-2.5 px-2 text-center">Unit</th>
                <th className="py-2.5 px-2 text-center">Cluster</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {paginatedRows.map((rec: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-1.5 px-3 font-sans text-slate-300 whitespace-nowrap sticky left-0 z-10 bg-slate-900">
                    {rec.dateString}
                  </td>
                  <td className="py-1.5 px-3 font-sans font-bold text-sky-400 whitespace-nowrap sticky left-24 z-10 bg-slate-900">
                    {rec.unitLine}
                  </td>
                  <td className="py-1.5 px-3 font-sans truncate max-w-[140px] text-slate-200">{rec.buyer}</td>
                  <td className="py-1.5 px-3 font-sans truncate max-w-[180px] text-slate-300" title={rec.style}>{rec.style}</td>
                  <td className="py-1.5 px-2 font-mono text-[10px] text-slate-400 truncate max-w-[110px]">{rec.oc}</td>
                  <td className="py-1.5 px-2 text-center text-[10px] text-slate-400">{rec.categoryType}</td>
                  <td className="py-1.5 px-2 text-right">{rec.smv ? rec.smv.toFixed(2) : "-"}</td>
                  <td className="py-1.5 px-3 text-right font-black text-emerald-300 bg-emerald-950/30">
                    {rec.actualQty?.toLocaleString()}
                  </td>
                  <td className="py-1.5 px-2 text-right">{rec.mo ? rec.mo.toFixed(1) : "-"}</td>
                  <td className="py-1.5 px-2 text-right">{rec.clockHours ? rec.clockHours.toFixed(1) : "-"}</td>
                  <td className="py-1.5 px-2 text-right">{rec.actualSah ? rec.actualSah.toFixed(1) : "-"}</td>
                  <td className="py-1.5 px-2 text-right font-bold text-purple-300 bg-slate-950/40">
                    {rec.efficiency ? `${rec.efficiency.toFixed(1)}%` : "0.0%"}
                  </td>
                  <td className="py-1.5 px-2 text-right">${rec.fobPrice?.toFixed(2) || "0.00"}</td>
                  <td className="py-1.5 px-2 text-right">${rec.vaPrice?.toFixed(2) || "0.00"}</td>
                  <td className="py-1.5 px-2 text-center text-slate-400">{rec.unitCode}</td>
                  <td className="py-1.5 px-2 text-center font-bold text-sky-400">{rec.cluster}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
