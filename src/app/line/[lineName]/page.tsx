"use client";

import React, { useState, useEffect, useMemo, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Layers,
  Users,
  Clock,
  Target,
  TrendingUp,
  Download,
  Search,
  ChevronRight,
  AlertOctagon,
  Sparkles,
  BarChart3,
  FileSpreadsheet,
  Shirt,
  ChevronDown,
  Gauge,
  Percent,
  CheckCircle2
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/shared/searchable-select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Area
} from "recharts";

interface LineDetailsData {
  line: {
    id: string;
    name: string;
    unitCode: string;
    unitName: string;
    cluster?: string;
    manpower: number;
    workingHours: number;
    status: string;
  };
  kpis: {
    totalPlannedProduction: number;
    totalActualProduction: number;
    totalOrderQty: number;
    totalTargetSah: number;
    totalActualSah: number;
    totalClockHours: number;
    totalMachineHours: number;
    totalGap: number;
    achievementRate: number;
    overallEfficiency: number;
    overallActualEfficiency: number;
    plannedEfficiency: number;
    actualEfficiency: number;
    effiPlanD?: number;
    minEfficiency?: number;
    maxEfficiency?: number;
    avgEfficiency?: number;
    avgActualEfficiency?: number;
    actualProduction: number;
    manpower: number;
    ordersCount: number;
    workingDaysCount: number;
    averageDailyPlan: number;
    averageDailyActual?: number;
    status: string;
  };
  dailyBreakdown: {
    date: string;
    dayOfWeek: string;
    targetQty: number;
    actualQty: number;
    gap: number;
    achievementRate: number;
    targetSah: number;
    actualSah: number;
    clockHours: number;
    machineHours: number;
    plannedEfficiency: number;
    actualEfficiency: number;
    efficiency: number;
    stylesCount: number;
    runningStyles: {
      styleRef: string;
      buyer: string;
      color: string | null;
      poNo: string | null;
      planQty: number;
      smv: number;
    }[];
    floorActualRecords?: {
      style: string | null;
      buyer: string | null;
      oc: string | null;
      actualPcs: number;
      effPercent: number | null;
      smv: number | null;
      actualSah: number | null;
      clockHours: number | null;
      manpower: number | null;
    }[];
  }[];
  actualFloorRecords?: {
    id: string;
    dateString: string;
    buyerName: string | null;
    style: string | null;
    oc: string | null;
    actualPcs: number;
    manpower: number | null;
    clockHours: number | null;
    actualSah: number | null;
    effPercent: number | null;
    remarks: string | null;
  }[];
  orders: {
    id: string;
    orderCode: string;
    buyer: string;
    styleRef: string;
    article: string | null;
    season: string | null;
    poNo: string | null;
    color: string | null;
    orderQty: number;
    planQty: number;
    actualQty?: number;
    smv: number;
    mainCategory: string | null;
    subCategory: string | null;
    productType: string | null;
    orderStatus: string;
    ott: string | null;
    pcd: string | null;
    psd: string | null;
    pfd: string | null;
    exFactory: string | null;
    fobPrice: number | null;
    salesValue: number | null;
    workingDays: number | null;
    dailyPlan: Record<string, number>;
  }[];
  dateColumns: string[];
  allLines: { name: string; unitCode: string }[];
  summaryJson?: any;
}

export default function LineDetailPage({ params }: { params: Promise<{ lineName: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const rawLineName = resolvedParams?.lineName || "";
  const lineName = decodeURIComponent(rawLineName);

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<LineDetailsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"daily" | "styles" | "analysis" | "floor-logs">("daily");
  
  // Style table filters
  const [styleSearch, setStyleSearch] = useState<string>("");
  const [selectedBuyer, setSelectedBuyer] = useState<string>("ALL");
  
  // Quick Line Switcher
  const [isSwitcherOpen, setIsSwitcherOpen] = useState<boolean>(false);
  const [switcherSearch, setSwitcherSearch] = useState<string>("");

  useEffect(() => {
    if (!lineName) return;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/analytics/line/${encodeURIComponent(lineName)}`);
        if (!res.ok) {
          throw new Error(`Failed to load line details for ${lineName}`);
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        console.error("Error fetching line details:", err);
        setError(err.message || "Failed to load line details");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [lineName]);

  // Unique buyers on this line
  const buyersList = useMemo(() => {
    if (!data?.orders) return [];
    const set = new Set<string>();
    data.orders.forEach(o => {
      if (o.buyer) set.add(o.buyer);
    });
    return Array.from(set).sort();
  }, [data?.orders]);

  const buyerOptions = useMemo(() => {
    return buyersList.map((b) => ({
      label: b,
      value: b,
      badge: `${data?.orders?.filter((o) => o.buyer === b).length || 0} Styles`,
    }));
  }, [buyersList, data?.orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    if (!data?.orders) return [];
    return data.orders.filter(o => {
      const matchBuyer = selectedBuyer === "ALL" || o.buyer === selectedBuyer;
      const matchSearch =
        o.styleRef.toLowerCase().includes(styleSearch.toLowerCase()) ||
        o.buyer.toLowerCase().includes(styleSearch.toLowerCase()) ||
        (o.poNo && o.poNo.toLowerCase().includes(styleSearch.toLowerCase())) ||
        (o.color && o.color.toLowerCase().includes(styleSearch.toLowerCase())) ||
        (o.article && o.article.toLowerCase().includes(styleSearch.toLowerCase()));
      return matchBuyer && matchSearch;
    });
  }, [data?.orders, styleSearch, selectedBuyer]);

  // Filtered line switcher options
  const filteredLineOptions = useMemo(() => {
    if (!data?.allLines) return [];
    if (!switcherSearch) return data.allLines;
    return data.allLines.filter(l =>
      l.name.toLowerCase().includes(switcherSearch.toLowerCase()) ||
      l.unitCode.toLowerCase().includes(switcherSearch.toLowerCase())
    );
  }, [data?.allLines, switcherSearch]);

  const handleExportLine = () => {
    window.open(`/api/excel/export?lineName=${encodeURIComponent(lineName)}&type=line_detail`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="flex flex-col items-center space-y-4 max-w-md text-center">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-sky-100 border-t-sky-600 animate-spin dark:border-slate-800 dark:border-t-sky-500" />
            <Layers className="h-7 w-7 text-sky-600 dark:text-sky-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Loading Details for Line {lineName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Fetching 31-day date metrics, machine hours, EFFI. PLAN/D, and assigned styles...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex flex-col items-center justify-center">
        <Card className="max-w-md w-full border-rose-200 dark:border-rose-900/50 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 mb-2">
              <AlertOctagon className="h-6 w-6" />
            </div>
            <CardTitle className="text-rose-700 dark:text-rose-400">Line Not Found</CardTitle>
            <CardDescription>{error || `Line "${lineName}" does not exist in the active plan.`}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => router.push("/?tab=line-performance")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Line Performance
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { line, kpis, dailyBreakdown, dateColumns, summaryJson } = data;

  // Efficiency color helper
  const getEfficiencyBadgeColor = (eff: number) => {
    if (eff >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
    if (eff >= 70) return "bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800";
    if (eff >= 60) return "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
    return "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";
  };

  const getEfficiencyColorHex = (eff: number) => {
    if (eff >= 80) return "#10b981";
    if (eff >= 70) return "#0284c7";
    if (eff >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const effiPlanDValue = kpis.effiPlanD ?? kpis.overallEfficiency;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 shadow-xs dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-7xl mx-auto w-full">
          {/* Left: Back Link & Breadcrumbs */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/?tab=line-performance")}
              className="h-8 gap-1.5 text-xs font-semibold border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 shadow-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
              <span>Back to Line Performance</span>
            </Button>

            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Link href="/?tab=line-performance" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                Line Performance
              </Link>
              <ChevronRight className="h-3 w-3 text-slate-400" />
              <span className="font-semibold text-sky-600 dark:text-sky-400">Line Detail: {line.name}</span>
            </div>
          </div>

          {/* Right: Quick Line Switcher & Export */}
          <div className="flex items-center gap-2">
            {/* Line Switcher Dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                className="h-8 gap-2 text-xs font-bold border-sky-200 bg-sky-50/50 text-sky-700 hover:bg-sky-100/70 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300"
              >
                <Layers className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                <span>Switch Line: {line.name}</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>

              {isSwitcherOpen && (
                <div className="absolute right-0 mt-1 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50 dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95">
                  <div className="p-1 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <Input
                      placeholder="Search line (e.g. U03-01)..."
                      value={switcherSearch}
                      onChange={(e) => setSwitcherSearch(e.target.value)}
                      className="h-7 text-xs"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto pt-1 space-y-0.5 custom-scrollbar">
                    {filteredLineOptions.map((l) => (
                      <button
                        key={l.name}
                        onClick={() => {
                          setIsSwitcherOpen(false);
                          router.push(`/line/${encodeURIComponent(l.name)}`);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                          l.name === line.name
                            ? "bg-sky-600 text-white font-bold"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span className="font-mono font-medium">{l.name}</span>
                        <Badge variant="outline" className={`text-[10px] py-0 px-1 ${l.name === line.name ? "border-white text-white" : ""}`}>
                          {l.unitCode}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link
              href={`/?tab=unit-editor&lineName=${encodeURIComponent(line.name)}&unitCode=${encodeURIComponent(line.unitCode)}`}
              className="inline-flex items-center h-8 gap-1.5 px-3 rounded-lg text-xs font-bold border border-amber-300 bg-amber-50/70 text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 transition-colors shadow-xs"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span>Edit / Fix Line Data</span>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportLine}
              className="h-8 gap-1.5 text-xs font-semibold border-emerald-200 bg-emerald-50/40 text-emerald-700 hover:bg-emerald-100/60 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              <span>Export Excel</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Line Identity Hero Card */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/80 to-emerald-50/20 p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/90 dark:to-emerald-950/20">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            {/* Left Info */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20">
                  <Layers className="h-5 w-5" />
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Line {line.name}
                </h1>
                <Badge className="bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800 font-bold text-xs px-2.5 py-0.5">
                  Unit {line.unitCode} ({line.unitName})
                </Badge>
                {line.cluster && (
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800 font-bold text-xs px-2.5 py-0.5">
                    Cluster: {line.cluster}
                  </Badge>
                )}
                <Badge variant="outline" className={`font-bold text-xs px-2.5 py-0.5 ${getEfficiencyBadgeColor(kpis.overallActualEfficiency || kpis.plannedEfficiency)}`}>
                  {(kpis.overallActualEfficiency || kpis.plannedEfficiency) >= 80 ? "High Efficiency" : (kpis.overallActualEfficiency || kpis.plannedEfficiency) >= 70 ? "Normal Performance" : "Under Benchmark"}
                </Badge>
              </div>

              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                Comprehensive 31-day production performance tracking for <strong className="text-slate-800 dark:text-slate-200">October 2026</strong>. 
                Allocated manpower of <strong className="text-slate-800 dark:text-slate-200">{line.manpower} operators</strong> at <strong className="text-slate-800 dark:text-slate-200">{line.workingHours} working hours/day</strong>.
              </p>
            </div>

            {/* Right Dual Efficiency Gauges */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Actual Floor Efficiency */}
              <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl p-3 border border-emerald-200 dark:border-emerald-800/60 shadow-xs ring-1 ring-emerald-500/20 text-right min-w-[130px]">
                <div className="flex items-center justify-end gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  <TrendingUp className="h-3 w-3" />
                  <span>ACTUAL EFF</span>
                </div>
                <span className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  {kpis.overallActualEfficiency > 0 ? `${kpis.overallActualEfficiency}%` : "—"}
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">Floor Actual</span>
              </div>

              {/* Planned (Prod) Efficiency */}
              <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl p-3 border border-indigo-200 dark:border-indigo-800/60 shadow-xs text-right min-w-[130px]">
                <div className="flex items-center justify-end gap-1 text-[10px] font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                  <Percent className="h-3 w-3" />
                  <span>PLAN EFF</span>
                </div>
                <span className="text-2xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                  {kpis.plannedEfficiency}%
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">Target: 80%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 6 Key Performance Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Card 1: Actual Production Output */}
          <Card className="border-emerald-300/90 bg-gradient-to-br from-emerald-50/50 via-white to-white dark:border-emerald-900/60 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 shadow-xs ring-1 ring-emerald-500/20">
            <CardContent className="p-3.5 sm:p-4">
              <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-tight truncate">Actual Output</span>
                <TrendingUp className="h-4 w-4 text-emerald-600 shrink-0" />
              </div>
              <div className="text-lg sm:text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                {kpis.totalActualProduction > 0 ? kpis.totalActualProduction.toLocaleString() : "—"}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">
                {kpis.totalActualProduction > 0 ? `${kpis.achievementRate}% of Plan` : "Awaiting floor data"}
              </span>
            </CardContent>
          </Card>

          {/* Card 2: Total Planned Output */}
          <Card className="border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-sky-300 dark:hover:border-sky-800 transition-all">
            <CardContent className="p-3.5 sm:p-4">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
                <span className="text-[11px] font-semibold truncate">Planned Target</span>
                <Target className="h-4 w-4 text-sky-600 shrink-0" />
              </div>
              <div className="text-lg sm:text-xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                {kpis.totalPlannedProduction.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                Total Month Target
              </span>
            </CardContent>
          </Card>

          {/* Card 3: Gap / Variance */}
          <Card className="border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-rose-300 dark:hover:border-rose-800 transition-all">
            <CardContent className="p-3.5 sm:p-4">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
                <span className="text-[11px] font-semibold truncate">Gap Variance</span>
                <AlertOctagon className="h-4 w-4 text-rose-500 shrink-0" />
              </div>
              <div className={`text-lg sm:text-xl font-extrabold font-mono ${kpis.totalGap > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600"}`}>
                {kpis.totalActualProduction > 0
                  ? kpis.totalGap > 0
                    ? `-${kpis.totalGap.toLocaleString()}`
                    : `+${Math.abs(kpis.totalGap).toLocaleString()}`
                  : `-${kpis.totalPlannedProduction.toLocaleString()}`}
              </div>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                {kpis.totalGap > 0 ? "Production Deficit" : "Target Achieved"}
              </span>
            </CardContent>
          </Card>

          {/* Card 4: Standard Allowed Hours (SAH) */}
          <Card className="border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800 transition-all">
            <CardContent className="p-3.5 sm:p-4">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
                <span className="text-[11px] font-semibold truncate">Earned SAH</span>
                <Clock className="h-4 w-4 text-indigo-600 shrink-0" />
              </div>
              <div className="text-lg sm:text-xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                {kpis.totalActualSah > 0 ? kpis.totalActualSah.toLocaleString() : kpis.totalTargetSah.toLocaleString()} <span className="text-xs font-normal">hrs</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                {kpis.totalActualSah > 0 ? `Plan: ${kpis.totalTargetSah.toLocaleString()} hrs` : "Planned SAH"}
              </span>
            </CardContent>
          </Card>

          {/* Card 5: Machine / Clock Hours */}
          <Card className="border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-amber-300 dark:hover:border-amber-800 transition-all">
            <CardContent className="p-3.5 sm:p-4">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
                <span className="text-[11px] font-semibold truncate">Machine Hours</span>
                <BarChart3 className="h-4 w-4 text-amber-600 shrink-0" />
              </div>
              <div className="text-lg sm:text-xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
                {kpis.totalClockHours.toLocaleString()} <span className="text-xs font-normal">hrs</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                Capacity ({kpis.manpower} ops × 10h)
              </span>
            </CardContent>
          </Card>

          {/* Card 6: Average Daily Output */}
          <Card className="border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-teal-300 dark:hover:border-teal-800 transition-all">
            <CardContent className="p-3.5 sm:p-4">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
                <span className="text-[11px] font-semibold truncate">Avg Daily Output</span>
                <Gauge className="h-4 w-4 text-teal-600 shrink-0" />
              </div>
              <div className="text-lg sm:text-xl font-extrabold font-mono text-teal-600 dark:text-teal-400">
                {kpis.totalActualProduction > 0 && kpis.averageDailyActual
                  ? kpis.averageDailyActual.toLocaleString()
                  : kpis.averageDailyPlan.toLocaleString()}{" "}
                <span className="text-xs font-normal">pcs</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                {kpis.workingDaysCount} Working Days
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Master Comparison Banner (Plan vs Actual) */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Planned Target vs Actual Floor Output Specification
              </span>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono py-0 text-slate-500">
              Line: {line.name} • Unit {line.unitCode}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* 1. Production Output */}
            <div className="rounded-lg bg-sky-50/70 p-2.5 border border-sky-200 dark:bg-sky-950/40 dark:border-sky-800/60">
              <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider block">
                1. PRODUCTION PCS
              </span>
              <div className="text-base font-extrabold font-mono text-slate-900 dark:text-slate-100 mt-0.5 flex items-baseline gap-1.5">
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  {kpis.totalActualProduction > 0 ? kpis.totalActualProduction.toLocaleString() : "0"} Act
                </span>
                <span className="text-xs text-slate-400">/ {kpis.totalPlannedProduction.toLocaleString()} Plan</span>
              </div>
              <span className="text-[10px] text-sky-600/80 dark:text-sky-400 block mt-0.5">
                {kpis.achievementRate}% Target Achieved
              </span>
            </div>

            {/* 2. SAH */}
            <div className="rounded-lg bg-purple-50/70 p-2.5 border border-purple-200 dark:bg-purple-950/40 dark:border-purple-800/60">
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider block">
                2. SAH (HOURS)
              </span>
              <div className="text-base font-extrabold font-mono text-purple-900 dark:text-purple-100 mt-0.5 flex items-baseline gap-1.5">
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  {kpis.totalActualSah > 0 ? kpis.totalActualSah.toLocaleString() : "0"} Act
                </span>
                <span className="text-xs text-slate-400">/ {kpis.totalTargetSah.toLocaleString()} Plan</span>
              </div>
              <span className="text-[10px] text-purple-600/80 dark:text-purple-400 block mt-0.5">
                Earned Standard Allowed Hours
              </span>
            </div>

            {/* 3. MACHINE HR */}
            <div className="rounded-lg bg-amber-50/70 p-2.5 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/60">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider block">
                3. MACHINE CAPACITY
              </span>
              <div className="text-base font-extrabold font-mono text-amber-900 dark:text-amber-100 mt-0.5">
                {kpis.totalClockHours.toLocaleString()} <span className="text-xs font-normal">hrs</span>
              </div>
              <span className="text-[10px] text-amber-600/80 dark:text-amber-400 block mt-0.5">
                Capacity: {line.manpower * line.workingHours} hrs/day
              </span>
            </div>

            {/* 4. EFFICIENCY */}
            <div className="rounded-lg bg-emerald-50/80 p-2.5 border border-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-700 ring-1 ring-emerald-500/20">
              <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                4. EFFICIENCY RATING
              </span>
              <div className="text-base font-extrabold font-mono mt-0.5 flex items-baseline gap-1.5">
                <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                  {kpis.overallActualEfficiency > 0 ? `${kpis.overallActualEfficiency}% Act` : "—"}
                </span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400">/ {kpis.plannedEfficiency}% Plan</span>
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
                Target: 80.0% • {kpis.overallActualEfficiency >= 80 ? "Passed" : "Under Benchmark"}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab("daily")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${
              activeTab === "daily"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Daily Planned vs Actual Matrix & Trends</span>
          </button>

          <button
            onClick={() => setActiveTab("floor-logs")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${
              activeTab === "floor-logs"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            }`}
          >
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span>Floor Actual Tracker Logs ({data.actualFloorRecords?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("styles")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${
              activeTab === "styles"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Allocated Styles & Orders Matrix ({filteredOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("analysis")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${
              activeTab === "analysis"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Capacity & Efficiency Breakdown</span>
          </button>
        </div>

        {/* TAB 1: DAILY 31-DAY PERFORMANCE MATRIX & CHARTS */}
        {activeTab === "daily" && (
          <div className="space-y-6">
            {/* Visual Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Daily Target vs Actual */}
              <Card className="border-slate-200/90 dark:border-slate-800 shadow-xs">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-sky-600" />
                        Target vs Actual Daily Output (October 2026)
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Daily planned pieces vs actual garments produced on Line {line.name}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={dailyBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(val) => val.substring(8)}
                          tick={{ fontSize: 10 }}
                          stroke="#94a3b8"
                        />
                        <YAxis stroke="#0284c7" tick={{ fontSize: 10 }} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="rounded-lg border border-slate-200 bg-white/95 p-2.5 shadow-lg backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900 text-xs">
                                  <div className="font-bold text-slate-900 dark:text-slate-100">{d.date} ({d.dayOfWeek})</div>
                                  <div className="mt-1 space-y-1 font-mono">
                                    <div className="text-sky-600">Plan Target: {d.targetQty.toLocaleString()} pcs</div>
                                    <div className="text-emerald-600 font-bold">Actual Output: {d.actualQty > 0 ? d.actualQty.toLocaleString() : "0"} pcs</div>
                                    <div className="text-purple-600">Actual SAH: {d.actualSah} hrs</div>
                                    <div className="text-slate-600">Actual Eff: {d.actualEfficiency || 0}%</div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                        <Bar dataKey="targetQty" name="Plan Target (Pcs)" fill="#38bdf8" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="actualQty" name="Actual Output (Pcs)" fill="#10b981" radius={[3, 3, 0, 0]} />
                        <Line type="monotone" dataKey="actualSah" name="Actual SAH" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 2 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Chart 2: Planned vs Actual Efficiency Curve */}
              <Card className="border-slate-200/90 dark:border-slate-800 shadow-xs">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                        Daily Planned vs Actual Efficiency (%)
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Actual floor efficiency curve vs planned efficiency trajectory
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={dailyBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(val) => val.substring(8)}
                          tick={{ fontSize: 10 }}
                          stroke="#94a3b8"
                        />
                        <YAxis domain={[0, 110]} stroke="#10b981" tick={{ fontSize: 10 }} unit="%" />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="rounded-lg border border-slate-200 bg-white/95 p-2.5 shadow-lg backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900 text-xs">
                                  <div className="font-bold text-slate-900 dark:text-slate-100">{d.date} ({d.dayOfWeek})</div>
                                  <div className="mt-1 space-y-1 font-mono">
                                    <div className="text-emerald-600 font-bold">Actual Eff: {d.actualEfficiency || 0}%</div>
                                    <div className="text-indigo-600">Plan Eff: {d.plannedEfficiency || 0}%</div>
                                    <div className="text-purple-600">Actual SAH: {d.actualSah} hrs</div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <ReferenceLine y={80} stroke="#10b981" strokeDasharray="4 4" label={{ value: "80% Target", fill: "#10b981", fontSize: 10, position: "top" }} />
                        <Area type="monotone" dataKey="actualEfficiency" name="Actual Floor Eff %" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2.5} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="plannedEfficiency" name="Plan Eff %" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 2 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Daily Breakdown Master Table */}
            <Card className="border-slate-200/90 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-sky-600" />
                      Daily Target vs Actual Breakdown (1st – 31st Oct 2026)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Day-by-day record of planned quantity, actual floor output, variance, SAH hours, and efficiencies
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <span>Active: <strong className="text-slate-800 dark:text-slate-200">{kpis.workingDaysCount} Days</strong></span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80 dark:bg-slate-900/80 text-xs font-bold">
                        <TableHead className="w-28">Date</TableHead>
                        <TableHead className="w-16">Day</TableHead>
                        <TableHead className="text-right">Planned Target</TableHead>
                        <TableHead className="text-right text-emerald-700 dark:text-emerald-400 font-extrabold">Actual Output</TableHead>
                        <TableHead className="text-right">Gap Variance</TableHead>
                        <TableHead className="text-right">Target SAH</TableHead>
                        <TableHead className="text-right">Actual SAH</TableHead>
                        <TableHead className="text-right text-indigo-700 dark:text-indigo-300">Plan Eff %</TableHead>
                        <TableHead className="text-right text-emerald-700 dark:text-emerald-300 font-extrabold">Actual Eff %</TableHead>
                        <TableHead className="text-right">Achieved %</TableHead>
                        <TableHead className="min-w-[200px]">Running Styles & Floor Output</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyBreakdown.map((day) => {
                        const isOffDay = day.targetQty === 0 && day.actualQty === 0 && day.clockHours === 0;
                        const hasActual = day.actualQty > 0;
                        return (
                          <TableRow
                            key={day.date}
                            className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 text-xs transition-colors ${
                              isOffDay ? "bg-slate-50/40 dark:bg-slate-900/30 opacity-70" : ""
                            }`}
                          >
                            <TableCell className="font-mono font-bold text-slate-900 dark:text-slate-100">
                              {day.date}
                            </TableCell>
                            <TableCell className="font-medium text-slate-500">
                              {day.dayOfWeek}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                              {day.targetQty > 0 ? day.targetQty.toLocaleString() : "-"}
                            </TableCell>
                            <TableCell className="text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                              {hasActual ? day.actualQty.toLocaleString() : "—"}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold">
                              {hasActual ? (
                                <span className={day.gap > 0 ? "text-rose-600" : "text-emerald-600"}>
                                  {day.gap > 0 ? `-${day.gap.toLocaleString()}` : `+${Math.abs(day.gap).toLocaleString()}`}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold text-purple-600 dark:text-purple-400">
                              {day.targetSah > 0 ? day.targetSah.toFixed(2) : "-"}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                              {hasActual && day.actualSah > 0 ? day.actualSah.toFixed(2) : "-"}
                            </TableCell>
                            <TableCell className="text-right font-mono text-indigo-600 dark:text-indigo-400 font-medium">
                              {day.plannedEfficiency > 0 ? `${Math.round(day.plannedEfficiency)}%` : "-"}
                            </TableCell>
                            <TableCell className="text-right font-mono font-extrabold">
                              {hasActual && (day.actualEfficiency || 0) > 0 ? (
                                <span style={{ color: getEfficiencyColorHex(day.actualEfficiency || 0) }}>
                                  {day.actualEfficiency}%
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold">
                              {hasActual ? `${day.achievementRate}%` : "—"}
                            </TableCell>
                            <TableCell>
                              {hasActual && day.floorActualRecords && day.floorActualRecords.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {day.floorActualRecords.map((ar, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 text-[10px] font-mono text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                      title={`${ar.buyer || ""} - ${ar.style || ""} (${ar.actualPcs} pcs, ${ar.effPercent || 0}% eff)`}
                                    >
                                      <strong>{ar.buyer || "Actual"}</strong>: {ar.style || "Style"} (<strong>{ar.actualPcs.toLocaleString()}</strong> pcs)
                                    </span>
                                  ))}
                                </div>
                              ) : day.runningStyles.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {day.runningStyles.map((s, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                      title={`${s.buyer} - ${s.styleRef} (${s.planQty.toLocaleString()} pcs, SMV: ${s.smv})`}
                                    >
                                      <strong>{s.buyer}</strong>: {s.styleRef} ({s.planQty.toLocaleString()})
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">No production recorded</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}

                      {/* STICKY / BOTTOM MONTH TOTAL SUMMARY ROW */}
                      <TableRow className="bg-slate-100 dark:bg-slate-900 border-t-2 border-slate-400 text-xs font-bold">
                        <TableCell className="font-mono font-extrabold text-slate-900 dark:text-slate-100">
                          MONTH TOTAL
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400 font-semibold">
                          {kpis.workingDaysCount} Days
                        </TableCell>
                        <TableCell className="text-right font-mono font-extrabold text-sky-800 dark:text-sky-300 text-sm">
                          {kpis.totalPlannedProduction.toLocaleString()} pcs
                        </TableCell>
                        <TableCell className="text-right font-mono font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">
                          {kpis.totalActualProduction > 0 ? `${kpis.totalActualProduction.toLocaleString()} pcs` : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono font-extrabold text-rose-600">
                          {kpis.totalActualProduction > 0 ? `-${kpis.totalGap.toLocaleString()}` : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono font-extrabold text-purple-800 dark:text-purple-300">
                          {kpis.totalTargetSah.toLocaleString()} hrs
                        </TableCell>
                        <TableCell className="text-right font-mono font-extrabold text-slate-900 dark:text-slate-100">
                          {kpis.totalActualSah > 0 ? `${kpis.totalActualSah.toLocaleString()} hrs` : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono font-extrabold text-indigo-700 dark:text-indigo-300">
                          {kpis.plannedEfficiency}%
                        </TableCell>
                        <TableCell className="text-right font-mono font-extrabold text-emerald-700 dark:text-emerald-300 text-sm bg-emerald-100/60 dark:bg-emerald-950/80">
                          {kpis.overallActualEfficiency > 0 ? `${kpis.overallActualEfficiency}%` : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          {kpis.totalActualProduction > 0 ? `${kpis.achievementRate}%` : "—"}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400 text-[11px] font-medium">
                          {kpis.ordersCount} Allocated Styles ({buyersList.join(", ") || "Active"})
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB: FLOOR ACTUAL TRACKER LOGS */}
        {activeTab === "floor-logs" && (
          <div className="space-y-4">
            <Card className="border-slate-200/90 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      Daily Floor Actual Production Tracker Logs (Line {line.name})
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Raw floor actual logs ingested from actual production tracker sheets
                    </CardDescription>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-bold text-xs">
                    {data.actualFloorRecords?.length || 0} Floor Logs Recorded
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {(!data.actualFloorRecords || data.actualFloorRecords.length === 0) ? (
                  <div className="py-16 text-center text-sm text-slate-400">
                    No floor actual tracker logs recorded for Line {line.name} yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/80 dark:bg-slate-900/80 text-xs font-bold">
                          <TableHead>Date</TableHead>
                          <TableHead>Buyer</TableHead>
                          <TableHead>Style Ref</TableHead>
                          <TableHead>OC #</TableHead>
                          <TableHead className="text-right text-emerald-700 dark:text-emerald-300 font-extrabold">Actual Output (Pcs)</TableHead>
                          <TableHead className="text-right">Manpower (MO)</TableHead>
                          <TableHead className="text-right">Clock Hrs</TableHead>
                          <TableHead className="text-right">MC SAH</TableHead>
                          <TableHead className="text-right">Floor Efficiency %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.actualFloorRecords.map((rec: any, idx: number) => (
                          <TableRow key={idx} className="hover:bg-emerald-50/20 text-xs">
                            <TableCell className="font-mono font-bold text-slate-900 dark:text-slate-100">
                              {rec.dateString}
                            </TableCell>
                            <TableCell className="font-semibold text-slate-700 dark:text-slate-300">
                              {rec.buyerName || "—"}
                            </TableCell>
                            <TableCell className="font-mono font-bold text-indigo-700 dark:text-indigo-300">
                              {rec.style || "—"}
                            </TableCell>
                            <TableCell className="font-mono text-slate-600 dark:text-slate-400">
                              {rec.oc || "—"}
                            </TableCell>
                            <TableCell className="text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                              {rec.actualPcs?.toLocaleString() || 0}
                            </TableCell>
                            <TableCell className="text-right font-mono text-slate-600">
                              {rec.manpower || "—"}
                            </TableCell>
                            <TableCell className="text-right font-mono text-slate-600">
                              {rec.clockHours || "—"}
                            </TableCell>
                            <TableCell className="text-right font-mono text-purple-700 dark:text-purple-300 font-semibold">
                              {rec.actualSah || "—"}
                            </TableCell>
                            <TableCell className="text-right font-mono font-extrabold">
                              {rec.effPercent ? (
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-bold">
                                  {rec.effPercent}%
                                </Badge>
                              ) : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: ALLOCATED STYLES & ORDERS BREAKDOWN */}
        {activeTab === "styles" && (
          <div className="space-y-6">
            {/* Search & Buyer Filter Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative w-64 sm:w-80">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search Style, Buyer, PO, Color, Article..."
                    value={styleSearch}
                    onChange={(e) => setStyleSearch(e.target.value)}
                    className="h-8 pl-8 text-xs"
                  />
                </div>

                <SearchableSelect
                  label="Buyer:"
                  triggerClassName="h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  dropdownWidth="w-64"
                  placeholder="All Buyers"
                  searchPlaceholder="Search buyer..."
                  options={buyerOptions}
                  value={selectedBuyer}
                  onChange={(val) => setSelectedBuyer(val)}
                  allOptionLabel={`All Buyers (${buyersList.length})`}
                  allOptionValue="ALL"
                />
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Showing <strong className="text-slate-800 dark:text-slate-200">{filteredOrders.length}</strong> styles
              </div>
            </div>

            {/* Styles Matrix Table */}
            <Card className="border-slate-200/90 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Shirt className="h-4 w-4 text-sky-600" />
                      Styles & Orders Running on Line {line.name} (31-Day Date Matrix)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Specification matrix showing order quantities, SMV, critical milestones, and day-by-day plan pieces
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="whitespace-nowrap">
                    <TableHeader>
                      <TableRow className="bg-slate-50/90 dark:bg-slate-900/90 text-xs font-bold">
                        <TableHead className="sticky left-0 bg-slate-50/95 dark:bg-slate-900/95 z-10 shadow-xs">Buyer</TableHead>
                        <TableHead className="sticky left-20 bg-slate-50/95 dark:bg-slate-900/95 z-10 shadow-xs">Style Ref</TableHead>
                        <TableHead>PO NO</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead className="text-right">Order Qty</TableHead>
                        <TableHead className="text-right">Plan Qty</TableHead>
                        <TableHead className="text-right">SMV</TableHead>
                        <TableHead>Season</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>PSD / PCD</TableHead>
                        <TableHead>Ex-Factory</TableHead>
                        {/* 31 Date Columns */}
                        {dateColumns.map((d) => (
                          <TableHead key={d} className="text-center font-mono text-[10px] w-12 px-1">
                            {d.substring(8)}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={11 + dateColumns.length} className="text-center py-8 text-slate-400 text-xs">
                            No styles match your search criteria.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOrders.map((ord) => (
                          <TableRow key={ord.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 text-xs">
                            <TableCell className="sticky left-0 bg-white/95 dark:bg-slate-900/95 font-bold z-10 shadow-xs">
                              {ord.buyer}
                            </TableCell>
                            <TableCell className="sticky left-20 bg-white/95 dark:bg-slate-900/95 font-mono font-bold text-sky-600 dark:text-sky-400 z-10 shadow-xs" title={ord.article || ""}>
                              {ord.styleRef}
                            </TableCell>
                            <TableCell className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                              {ord.poNo || "-"}
                            </TableCell>
                            <TableCell className="text-slate-700 dark:text-slate-300 max-w-[130px] truncate" title={ord.color || ""}>
                              {ord.color || "-"}
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              {ord.orderQty.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {ord.planQty.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono text-purple-600 dark:text-purple-400 font-semibold">
                              {ord.smv}
                            </TableCell>
                            <TableCell className="text-slate-500 font-medium text-[11px]">
                              {ord.season || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] py-0">
                                {ord.orderStatus}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-[10px] text-slate-500">
                              {ord.pcd || ord.psd || "-"}
                            </TableCell>
                            <TableCell className="font-mono text-[10px] text-slate-500">
                              {ord.exFactory || "-"}
                            </TableCell>
                            {/* Daily Plan Cells */}
                            {dateColumns.map((d) => {
                              const qty = ord.dailyPlan[d];
                              return (
                                <TableCell
                                  key={d}
                                  className={`text-center font-mono text-[11px] px-1 py-1.5 ${
                                    qty && qty > 0 ? "bg-sky-50 font-bold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300" : "text-slate-300 dark:text-slate-700"
                                  }`}
                                >
                                  {qty && qty > 0 ? qty.toLocaleString() : ""}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))
                      )}

                      {/* 4 LINE SUMMARY ROWS (PLAN/DAY, SAH, MACHINE HR, EFFI. PLAN/D) */}
                      {/* Row 1: PLAN/DAY */}
                      <tr className="bg-sky-50/70 dark:bg-sky-950/50 border-t-2 border-sky-300 dark:border-sky-800 font-bold whitespace-nowrap">
                        <td className="sticky left-0 bg-sky-100/90 dark:bg-sky-950 font-bold text-sky-700 z-10 shadow-xs">
                          {line.unitCode}
                        </td>
                        <td className="sticky left-20 bg-sky-100/90 dark:bg-sky-950 font-extrabold text-sky-800 dark:text-sky-300 z-10 shadow-xs">
                          PLAN / DAY
                        </td>
                        <td colSpan={2}></td>
                        <td className="text-right font-mono text-slate-400">-</td>
                        <td className="text-right font-mono font-extrabold text-sky-800 dark:text-sky-200 bg-sky-100/60 dark:bg-sky-900/60">
                          {kpis.totalPlannedProduction.toLocaleString()}
                        </td>
                        <td colSpan={2}></td>
                        <td>
                          <Badge variant="outline" className="text-[9px] py-0 border-sky-300 text-sky-700 bg-white dark:bg-slate-900">
                            Daily Target
                          </Badge>
                        </td>
                        <td colSpan={2}></td>
                        {dateColumns.map((d) => {
                          const dayObj = dailyBreakdown.find((x) => x.date === d);
                          const val = dayObj?.targetQty || summaryJson?.PLAN?.daily?.[d];
                          return (
                            <td
                              key={d}
                              className="text-center font-mono text-[11px] font-bold text-sky-800 dark:text-sky-300 bg-sky-50/50 dark:bg-sky-950/40"
                            >
                              {val && val > 0 ? Number(val).toLocaleString() : ""}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Row 2: SAH */}
                      <tr className="bg-purple-50/60 dark:bg-purple-950/40 border-t border-purple-200 dark:border-purple-800 font-bold whitespace-nowrap">
                        <td className="sticky left-0 bg-purple-100/90 dark:bg-purple-950 font-bold text-purple-700 z-10 shadow-xs">
                          {line.unitCode}
                        </td>
                        <td className="sticky left-20 bg-purple-100/90 dark:bg-purple-950 font-extrabold text-purple-800 dark:text-purple-300 z-10 shadow-xs">
                          SAH (HOURS)
                        </td>
                        <td colSpan={2}></td>
                        <td className="text-right font-mono text-slate-400">-</td>
                        <td className="text-right font-mono font-extrabold text-purple-800 dark:text-purple-200 bg-purple-100/60 dark:bg-purple-900/60">
                          {kpis.totalTargetSah.toLocaleString()} hrs
                        </td>
                        <td colSpan={2}></td>
                        <td>
                          <Badge variant="outline" className="text-[9px] py-0 border-purple-300 text-purple-700 bg-white dark:bg-slate-900">
                            Std. Hours
                          </Badge>
                        </td>
                        <td colSpan={2}></td>
                        {dateColumns.map((d) => {
                          const dayObj = dailyBreakdown.find((x) => x.date === d);
                          const val = dayObj?.targetSah || summaryJson?.SAH?.daily?.[d];
                          return (
                            <td
                              key={d}
                              className="text-center font-mono text-[11px] font-bold text-purple-800 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-950/40"
                            >
                              {val && val > 0 ? Number(val).toFixed(1) : ""}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Row 3: MACHINE HR */}
                      <tr className="bg-amber-50/60 dark:bg-amber-950/40 border-t border-amber-200 dark:border-amber-800 font-bold whitespace-nowrap">
                        <td className="sticky left-0 bg-amber-100/90 dark:bg-amber-950 font-bold text-amber-700 z-10 shadow-xs">
                          {line.unitCode}
                        </td>
                        <td className="sticky left-20 bg-amber-100/90 dark:bg-amber-950 font-extrabold text-amber-800 dark:text-amber-300 z-10 shadow-xs">
                          MACHINE HR (CLK)
                        </td>
                        <td colSpan={2}></td>
                        <td className="text-right font-mono text-slate-400">-</td>
                        <td className="text-right font-mono font-extrabold text-amber-800 dark:text-amber-200 bg-amber-100/60 dark:bg-amber-900/60">
                          {kpis.totalClockHours.toLocaleString()} hrs
                        </td>
                        <td colSpan={2}></td>
                        <td>
                          <Badge variant="outline" className="text-[9px] py-0 border-amber-300 text-amber-700 bg-white dark:bg-slate-900">
                            Capacity
                          </Badge>
                        </td>
                        <td colSpan={2}></td>
                        {dateColumns.map((d) => {
                          const dayObj = dailyBreakdown.find((x) => x.date === d);
                          const val = dayObj?.machineHours || summaryJson?.MACHINE?.daily?.[d];
                          return (
                            <td
                              key={d}
                              className="text-center font-mono text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/40"
                            >
                              {val && val > 0 ? Number(val).toFixed(0) : ""}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Row 4: EFFI. PLAN/D */}
                      <tr className="bg-emerald-50/70 dark:bg-emerald-950/50 border-t border-emerald-200 dark:border-emerald-800 border-b-2 border-slate-400 font-bold whitespace-nowrap">
                        <td className="sticky left-0 bg-emerald-100/90 dark:bg-emerald-950 font-bold text-emerald-700 z-10 shadow-xs">
                          {line.unitCode}
                        </td>
                        <td className="sticky left-20 bg-emerald-100/90 dark:bg-emerald-950 font-extrabold text-emerald-800 dark:text-emerald-300 z-10 shadow-xs">
                          EFFI. PLAN / D
                        </td>
                        <td colSpan={2}></td>
                        <td className="text-right font-mono text-slate-400">-</td>
                        <td className="text-right font-mono font-extrabold text-emerald-800 dark:text-emerald-200 bg-emerald-100/60 dark:bg-emerald-900/60">
                          {Math.round(Number(effiPlanDValue))}%
                        </td>
                        <td colSpan={2}></td>
                        <td>
                          <Badge className="bg-emerald-600 text-white text-[9px] py-0 font-bold">
                            {Math.round(Number(effiPlanDValue))}% Eff
                          </Badge>
                        </td>
                        <td colSpan={2}></td>
                        {dateColumns.map((d) => {
                          const dayObj = dailyBreakdown.find((x) => x.date === d);
                          let val = dayObj?.plannedEfficiency || summaryJson?.EFFI?.daily?.[d];
                          if (val && typeof val === "number" && val <= 1.0) val = Number((val * 100).toFixed(1));
                          return (
                            <td
                              key={d}
                              className="text-center font-mono text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/40"
                            >
                              {val && val > 0 ? Math.round(Number(val)) + "%" : ""}
                            </td>
                          );
                        })}
                      </tr>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 3: CAPACITY & EFFICIENCY ANALYSIS */}
        {activeTab === "analysis" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Manpower */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-600" />
                    Manpower & Labor Productivity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Operators Assigned:</span>
                    <span className="font-bold font-mono">{line.manpower} Workers</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Daily Working Hours:</span>
                    <span className="font-bold font-mono">{line.workingHours} Hours/Day</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Daily Machine Capacity:</span>
                    <span className="font-bold font-mono text-purple-600">{line.manpower * line.workingHours} Machine Hrs</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Total Planned SAH:</span>
                    <span className="font-bold font-mono text-indigo-600">{kpis.totalTargetSah.toLocaleString()} hrs</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Avg SAH per Operator:</span>
                    <span className="font-bold font-mono text-emerald-600">{(kpis.totalTargetSah / line.manpower).toFixed(1)} hrs</span>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: EFFI. PLAN/D Calculation */}
              <Card className="border-emerald-200 dark:border-emerald-900/60 shadow-xs ring-1 ring-emerald-500/10">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <Percent className="h-4 w-4 text-emerald-600" />
                    EFFI. PLAN / D Diagnostic Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Sign-off EFFI. PLAN / D:</span>
                    <span className="font-extrabold font-mono text-emerald-600 text-sm">{effiPlanDValue}%</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Earned SAH:</span>
                    <span className="font-bold font-mono">{kpis.totalTargetSah.toLocaleString()} hrs</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Machine Clock Hours:</span>
                    <span className="font-bold font-mono">{kpis.totalClockHours.toLocaleString()} hrs</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Active Working Days:</span>
                    <span className="font-bold font-mono">{kpis.workingDaysCount} Days</span>
                  </div>
                  <div className="rounded-lg bg-emerald-50/80 p-2 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 font-mono">
                    Formula: (SAH ÷ Machine HR) × 100 = ({kpis.totalTargetSah} ÷ {kpis.totalClockHours}) × 100 = <strong>{effiPlanDValue}%</strong>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: AI Line Recommendations */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-600" />
                    AI Line Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                  {effiPlanDValue < 60 ? (
                    <div className="rounded-lg bg-rose-50 p-2.5 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 text-rose-700 dark:text-rose-300">
                      <strong>Bottleneck Notice:</strong> Planned efficiency ({effiPlanDValue}%) is below the 60% minimum threshold. Review SMV allocation ({filteredOrders[0]?.smv || "N/A"}) and consider balancing styles.
                    </div>
                  ) : effiPlanDValue >= 80 ? (
                    <div className="rounded-lg bg-emerald-50 p-2.5 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                      <strong>High Performing Line:</strong> Line {line.name} has a strong sign-off efficiency target of <strong>{effiPlanDValue}%</strong> with balanced order loading.
                    </div>
                  ) : (
                    <div className="rounded-lg bg-amber-50 p-2.5 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                      <strong>Standard Performance:</strong> Efficiency ({effiPlanDValue}%) is in the normal operational range. Track daily changeovers closely.
                    </div>
                  )}

                  <div className="pt-2 text-slate-500">
                    • <strong>Styles running:</strong> {kpis.ordersCount} styles allocated across {buyersList.join(", ") || "various buyers"}.
                    <br />
                    • <strong>Daily Output Goal:</strong> {kpis.averageDailyPlan.toLocaleString()} pcs/day needed to hit monthly sign-off.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
