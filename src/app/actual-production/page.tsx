"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  ChevronLeft,
  Eye,
  Radio,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  RotateCcw,
  Factory,
  Briefcase,
  Shirt,
  DollarSign,
  Filter,
  ArrowUpDown,
  FileText,
  Trophy,
  Award,
  Sparkles,
  BarChart3,
  Activity
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

export default function ActualProductionDetailsPage() {
  const router = useRouter();

  // API Data state
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<string>("ALL");
  const [selectedLine, setSelectedLine] = useState<string>("ALL");
  const [selectedDate, setSelectedDate] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Sub-tabs
  const [viewTab, setViewTab] = useState<"unit-lines" | "daily" | "buyers" | "raw-records">("unit-lines");

  // Sorting
  const [lineSortField, setLineSortField] = useState<string>("totalPcs");
  const [lineSortAsc, setLineSortAsc] = useState<boolean>(false);

  // Raw records pagination
  const [rawPage, setRawPage] = useState<number>(1);
  const [rawPageSize, setRawPageSize] = useState<number>(25);

  // Fetch Actual Data
  const fetchData = useCallback(async (batchId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (batchId && batchId !== "ALL") params.append("batchId", batchId);
      if (selectedUnit && selectedUnit !== "ALL") params.append("unitCode", selectedUnit);
      if (selectedLine && selectedLine !== "ALL") params.append("lineName", selectedLine);
      if (selectedDate && selectedDate !== "ALL") params.append("date", selectedDate);
      if (searchTerm) params.append("search", searchTerm);

      const res = await fetch(`/api/analytics/actual-production?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load actual production data");
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to load actual data");

      setData(json);
      if (!selectedBatchId && json.activeBatch?.id) {
        setSelectedBatchId(json.activeBatch.id);
      }
    } catch (err: any) {
      setError(err.message || "Error fetching actual production data");
    } finally {
      setLoading(false);
    }
  }, [selectedUnit, selectedLine, selectedDate, searchTerm, selectedBatchId]);

  useEffect(() => {
    fetchData(selectedBatchId);
  }, [selectedBatchId, selectedUnit, selectedLine, selectedDate, searchTerm, fetchData]);

  const handleBatchChange = (newBatchId: string) => {
    setSelectedBatchId(newBatchId);
    setSelectedUnit("ALL");
    setSelectedLine("ALL");
    setSelectedDate("ALL");
    setSearchTerm("");
    setRawPage(1);
  };

  const handleUnitChange = (unit: string) => {
    setSelectedUnit(unit);
    // Reset line if not in unit
    if (unit !== "ALL" && selectedLine !== "ALL") {
      const exists = data?.filterOptions?.lines?.some(
        (l: any) => l.value === selectedLine && l.unitCode === unit
      );
      if (!exists) setSelectedLine("ALL");
    }
    setRawPage(1);
  };

  const resetFilters = () => {
    setSelectedUnit("ALL");
    setSelectedLine("ALL");
    setSelectedDate("ALL");
    setSearchTerm("");
    setRawPage(1);
  };

  const hasActiveFilters =
    selectedUnit !== "ALL" ||
    selectedLine !== "ALL" ||
    selectedDate !== "ALL" ||
    searchTerm !== "";

  // Available Cascaded Lines
  const cascadedLines = useMemo(() => {
    if (!data?.filterOptions?.lines) return [];
    if (selectedUnit === "ALL") return data.filterOptions.lines;
    return data.filterOptions.lines.filter((l: any) => l.unitCode === selectedUnit);
  }, [data?.filterOptions?.lines, selectedUnit]);

  // Line Breakdown Sorted
  const sortedLines = useMemo(() => {
    if (!data?.lineBreakdown) return [];
    return [...data.lineBreakdown].sort((a: any, b: any) => {
      let valA = a[lineSortField] ?? 0;
      let valB = b[lineSortField] ?? 0;
      if (typeof valA === "string") {
        return lineSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return lineSortAsc ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    });
  }, [data?.lineBreakdown, lineSortField, lineSortAsc]);

  const handleLineSort = (field: string) => {
    if (lineSortField === field) {
      setLineSortAsc(!lineSortAsc);
    } else {
      setLineSortField(field);
      setLineSortAsc(false);
    }
  };

  // Paginated Raw Records
  const paginatedRawRecords = useMemo(() => {
    if (!data?.records) return [];
    const start = (rawPage - 1) * rawPageSize;
    return data.records.slice(start, start + rawPageSize);
  }, [data?.records, rawPage, rawPageSize]);

  const totalRawPages = Math.ceil((data?.records?.length || 0) / rawPageSize) || 1;

  // Export current records to CSV
  const handleExportCSV = () => {
    if (!data?.records || data.records.length === 0) return;
    const headers = ["Date", "Unit", "Line", "Buyer", "Style", "OC", "Product Type", "SMV", "Actual Pcs", "Manpower", "Clock Hours", "Actual SAH", "Eff %", "FOB", "VA"];
    const rows = data.records.map((r: any) => [
      r.dateString,
      r.unitCode,
      r.lineName,
      `"${(r.buyerName || '').replace(/"/g, '""')}"`,
      `"${(r.style || '').replace(/"/g, '""')}"`,
      `"${(r.oc || '').replace(/"/g, '""')}"`,
      `"${(r.productType || '').replace(/"/g, '""')}"`,
      r.smv || 0,
      r.actualPcs || 0,
      r.manpower || 0,
      r.clockHours || 0,
      r.actualSah || 0,
      r.effPercent || 0,
      r.ttlFob || 0,
      r.ttlVa || 0
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any[]) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Actual_Production_Report_${data.activeBatch?.month || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 shadow-xs dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/?tab=line-performance")}
                className="h-8 gap-1.5 text-xs font-semibold"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Line Performance</span>
              </Button>
              <span className="font-semibold text-sky-600 dark:text-sky-400 text-sm">Actual Production Details</span>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="h-14 w-14 rounded-full border-4 border-emerald-500/20 border-t-emerald-600 animate-spin" />
            <Radio className="absolute h-6 w-6 text-emerald-600 animate-pulse" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Loading Actual Production Floor Data...
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Fetching active batches, unit & line performance matrices...
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 shadow-xs dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-7xl mx-auto w-full">
          {/* Left: Navigation and Title */}
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
              <Link href="/" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                Overview
              </Link>
              <ChevronRight className="h-3 w-3 text-slate-400" />
              <Link href="/?tab=line-performance" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                Line Performance
              </Link>
              <ChevronRight className="h-3 w-3 text-slate-400" />
              <span className="font-semibold text-sky-600 dark:text-sky-400">Actual Production Details</span>
            </div>
          </div>

          {/* Right: Refresh & Export */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => fetchData(selectedBatchId)}
              className="h-8 gap-1.5 text-xs font-semibold border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
              <span>{loading ? "Refreshing..." : "Refresh"}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-8 gap-1.5 text-xs font-semibold border-emerald-200 bg-emerald-50/40 text-emerald-700 hover:bg-emerald-100/60 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-3 sm:p-5 lg:p-6 space-y-3.5 relative">
        {/* Subtle loading overlay if refreshing with existing data */}
        {loading && data && (
          <div className="absolute inset-0 bg-white/40 dark:bg-slate-950/40 backdrop-blur-[1px] z-20 flex items-start justify-center pt-20">
            <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
              <span>Updating floor metrics...</span>
            </div>
          </div>
        )}
        {/* Compact Executive Active Actual Production Strip / Banner */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200/90 bg-gradient-to-r from-emerald-50/60 via-white to-sky-50/30 p-3 sm:p-3.5 shadow-xs dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/95 dark:to-emerald-950/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            {/* Title & Status Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold shadow-xs">
                <Radio className="h-4 w-4 animate-pulse" />
              </span>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Actual Production Floor Tracker
              </h1>
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px] px-2 py-0.5">
                ● LIVE FLOOR DATA
              </Badge>
              {data?.activeBatch?.month && (
                <Badge variant="outline" className="font-semibold text-[10px] px-2 py-0.5">
                  {data.activeBatch.month}
                </Badge>
              )}
              {data?.activeBatch?.importedRows && (
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-mono">
                  {data.activeBatch.importedRows} records
                </Badge>
              )}
            </div>

            {/* Right: Batch Switcher */}
            {data?.allActualBatches && data.allActualBatches.length > 1 && (
              <div className="flex items-center gap-1.5 shrink-0 bg-white dark:bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Batch:</span>
                <select
                  value={selectedBatchId}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  className="h-6 bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none max-w-xs truncate cursor-pointer"
                >
                  {data.allActualBatches.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.fileName} ({b.month}) — {b.importedRows} rows
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Connected File & Plan Details Strip */}
          <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2 text-slate-600 dark:text-slate-400">
              <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase">ACTIVE FILE:</span>
              <span className="font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px] truncate max-w-md">
                {data?.activeBatch?.fileName || "Loading..."}
              </span>
              {data?.activeBatch?.parentPlan && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase">PLAN:</span>
                  <span className="font-mono text-sky-600 dark:text-sky-400 font-semibold text-[11px] truncate max-w-sm">
                    {data.activeBatch.parentPlan.fileName}
                  </span>
                </>
              )}
            </div>

            {data?.kpis && (
              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                <span>Units: <strong className="text-slate-900 dark:text-slate-100">{data.kpis.uniqueUnitsCount}</strong></span>
                <span>Lines: <strong className="text-slate-900 dark:text-slate-100">{data.kpis.uniqueLinesCount}</strong></span>
                <span>Output: <strong className="text-emerald-600 dark:text-emerald-400">{data.kpis.totalActualPcs.toLocaleString()}</strong></span>
                <span>Eff: <strong className="text-amber-600 dark:text-amber-400">{data.kpis.overallEfficiency}%</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* 6 Executive KPI Cards */}
        {data?.kpis && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
            {/* Card 1: Total Actual Output */}
            <Card className="border-t-2 border-t-emerald-500 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all">
              <CardContent className="p-3 sm:p-3.5">
                <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-tight">Actual Output</span>
                  <div className="h-6 w-6 rounded-md bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  </div>
                </div>
                <div className="text-lg sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {data.kpis.totalActualPcs.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">
                  Garments produced
                </span>
              </CardContent>
            </Card>

            {/* Card 2: Earned SAH */}
            <Card className="border-t-2 border-t-purple-500 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all">
              <CardContent className="p-3 sm:p-3.5">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 mb-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-tight">Earned SAH</span>
                  <div className="h-6 w-6 rounded-md bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center">
                    <Clock className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl font-black font-mono text-purple-600 dark:text-purple-400">
                  {data.kpis.totalActualSah.toLocaleString()} <span className="text-xs font-normal">h</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                  Std allowed hours
                </span>
              </CardContent>
            </Card>

            {/* Card 3: Clock Hours */}
            <Card className="border-t-2 border-t-amber-500 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all">
              <CardContent className="p-3 sm:p-3.5">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 mb-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-tight">Clock Hours</span>
                  <div className="h-6 w-6 rounded-md bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center">
                    <Users className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl font-black font-mono text-amber-600 dark:text-amber-400">
                  {data.kpis.totalClockHours.toLocaleString()} <span className="text-xs font-normal">h</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                  Floor work hours
                </span>
              </CardContent>
            </Card>

            {/* Card 4: Floor Efficiency */}
            <Card className="border-t-2 border-t-sky-500 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all">
              <CardContent className="p-3 sm:p-3.5">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 mb-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-tight">Floor Efficiency</span>
                  <div className="h-6 w-6 rounded-md bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center">
                    <Target className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl font-black font-mono text-sky-600 dark:text-sky-400">
                  {data.kpis.overallEfficiency}%
                </div>
                {/* Mini efficiency bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      data.kpis.overallEfficiency >= 80 ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${Math.min(100, data.kpis.overallEfficiency)}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Card 5: Active Units & Lines */}
            <Card className="border-t-2 border-t-indigo-500 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all">
              <CardContent className="p-3 sm:p-3.5">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 mb-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-tight">Lines & Units</span>
                  <div className="h-6 w-6 rounded-md bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center">
                    <Factory className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                  {data.kpis.uniqueLinesCount} <span className="text-xs font-normal text-slate-500">lines</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                  Across {data.kpis.uniqueUnitsCount} Units
                </span>
              </CardContent>
            </Card>

            {/* Card 6: Styles & Buyers */}
            <Card className="border-t-2 border-t-teal-500 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all">
              <CardContent className="p-3 sm:p-3.5">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 mb-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-tight">Styles & Buyers</span>
                  <div className="h-6 w-6 rounded-md bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center">
                    <Shirt className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl font-black font-mono text-teal-600 dark:text-teal-400">
                  {data.kpis.uniqueStylesCount} <span className="text-xs font-normal text-slate-500">styles</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                  {data.kpis.uniqueBuyersCount} Brands running
                </span>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search & Filter Toolbar: Unit, Line, Date & Text Search */}
        <Card className="shadow-xs border-slate-200/90 dark:border-slate-800">
          <CardContent className="p-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 w-full sm:w-auto">
                {/* Search Input */}
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search style, OC, line, buyer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8 pl-8 text-xs w-full"
                  />
                </div>

                {/* 2-Column Grid on Mobile, Flex on Desktop */}
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                  {/* Unit Filter */}
                  <SearchableSelect
                    label="Unit:"
                    placeholder="All"
                    searchPlaceholder="Search unit..."
                    allOptionLabel="All Units"
                    allOptionValue="ALL"
                    value={selectedUnit}
                    options={data?.filterOptions?.units || []}
                    onChange={handleUnitChange}
                    className="w-full sm:w-36"
                    triggerClassName="w-full h-8 text-xs"
                    dropdownWidth="w-56"
                  />

                  {/* Cascaded Line Filter */}
                  <SearchableSelect
                    label="Line:"
                    placeholder="All"
                    searchPlaceholder="Search line..."
                    allOptionLabel={`All (${cascadedLines.length})`}
                    allOptionValue="ALL"
                    value={selectedLine}
                    options={cascadedLines}
                    onChange={(val) => setSelectedLine(val)}
                    className="w-full sm:w-36"
                    triggerClassName="w-full h-8 text-xs"
                    dropdownWidth="w-64"
                  />

                  {/* Date Filter */}
                  {data?.filterOptions?.dates && data.filterOptions.dates.length > 0 && (
                    <SearchableSelect
                      label="Date:"
                      placeholder="All"
                      searchPlaceholder="Search date..."
                      allOptionLabel="All Dates"
                      allOptionValue="ALL"
                      value={selectedDate}
                      options={data.filterOptions.dates.map((d: string) => ({ label: d, value: d }))}
                      onChange={(val) => setSelectedDate(val)}
                      className="w-full sm:w-36"
                      triggerClassName="w-full h-8 text-xs"
                      dropdownWidth="w-48"
                    />
                  )}
                </div>

                {/* Reset Filters Button */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1 font-semibold self-start sm:self-auto"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset</span>
                  </Button>
                )}
              </div>

              <div className="text-xs text-slate-500 font-medium pt-1 sm:pt-0">
                Matching Lines: <strong className="text-slate-900 dark:text-slate-100">{data?.lineBreakdown?.length || 0}</strong> | Records: <strong className="text-slate-900 dark:text-slate-100">{data?.records?.length || 0}</strong>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* View Tabs Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl gap-1 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs">
            <button
              onClick={() => setViewTab("unit-lines")}
              className={`rounded-lg py-1.5 px-3 text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewTab === "unit-lines"
                  ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Unit & Line Matrix ({data?.lineBreakdown?.length || 0})</span>
            </button>

            <button
              onClick={() => setViewTab("daily")}
              className={`rounded-lg py-1.5 px-3 text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewTab === "daily"
                  ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Daily Output Timeline ({data?.dateBreakdown?.length || 0} Days)</span>
            </button>

            <button
              onClick={() => setViewTab("buyers")}
              className={`rounded-lg py-1.5 px-3 text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewTab === "buyers"
                  ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>Buyer & Style Breakdown ({data?.buyerBreakdown?.length || 0})</span>
            </button>

            <button
              onClick={() => setViewTab("raw-records")}
              className={`rounded-lg py-1.5 px-3 text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewTab === "raw-records"
                  ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Raw Floor Audit Log ({data?.records?.length || 0})</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Floor Records: <strong className="text-slate-900 dark:text-slate-100">{data?.records?.length || 0}</strong></span>
            <span>•</span>
            <span>Batch Lines: <strong className="text-slate-900 dark:text-slate-100">{data?.lineBreakdown?.length || 0}</strong></span>
          </div>
        </div>

        {/* TAB 1: UNIT & LINE MATRIX */}
        {viewTab === "unit-lines" && (
          <div className="space-y-3.5">
            {/* Unit Summary Cards */}
            {data?.unitBreakdown && data.unitBreakdown.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Factory className="h-3.5 w-3.5 text-sky-600" />
                    Unit-wise Performance (Click unit to filter)
                  </h3>
                  {selectedUnit !== "ALL" && (
                    <button
                      onClick={() => handleUnitChange("ALL")}
                      className="text-xs text-sky-600 hover:underline font-semibold"
                    >
                      Show All Units
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {data.unitBreakdown.map((u: any) => {
                    const sharePct = ((u.totalPcs / (data?.kpis?.totalActualPcs || 1)) * 100).toFixed(1);
                    const isSelected = selectedUnit === u.unitCode;
                    return (
                      <div
                        key={u.unitCode}
                        onClick={() => handleUnitChange(isSelected ? "ALL" : u.unitCode)}
                        className={`cursor-pointer rounded-xl border p-2.5 sm:p-3 transition-all shadow-xs relative overflow-hidden group ${
                          isSelected
                            ? "border-sky-500 bg-sky-50/80 dark:bg-sky-950/40 ring-2 ring-sky-500/30"
                            : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                            Unit {u.unitCode}
                            {isSelected && <CheckCircle2 className="h-3 w-3 text-sky-600 dark:text-sky-400" />}
                          </span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-medium">
                            {u.cluster}
                          </Badge>
                        </div>
                        <div className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 leading-tight">
                          {u.totalPcs.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">pcs</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                          {sharePct}% factory share
                        </div>
                        {/* Mini Efficiency bar */}
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              u.efficiency >= 80 ? "bg-emerald-500" : u.efficiency >= 70 ? "bg-sky-500" : "bg-amber-500"
                            }`}
                            style={{ width: `${Math.min(100, u.efficiency)}%` }}
                          />
                        </div>
                        <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 font-medium">{u.linesCount} lines</span>
                          <span
                            className={`font-bold font-mono ${
                              u.efficiency >= 80
                                ? "text-emerald-600 dark:text-emerald-400"
                                : u.efficiency >= 70
                                ? "text-sky-600 dark:text-sky-400"
                                : "text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {u.efficiency}% Eff
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Line Breakdown Table */}
            <Card className="shadow-xs border-slate-200/90 dark:border-slate-800">
              <CardHeader className="p-3 sm:p-4 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                      <Layers className="h-4 w-4 text-sky-600" />
                      Line-by-Line Floor Actual Production Ranking
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Detailed line outputs, earned SAH, clock hours, and live floor efficiency rankings
                    </CardDescription>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Showing <strong className="text-slate-900 dark:text-slate-100">{sortedLines.length}</strong> lines
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="w-full min-w-[980px]">
                    <TableHeader>
                      <TableRow className="bg-slate-50/90 dark:bg-slate-900/90 text-xs">
                        <TableHead className="font-semibold text-center w-12">#</TableHead>
                        <TableHead onClick={() => handleLineSort("lineName")} className="cursor-pointer font-semibold sticky left-0 bg-slate-50/95 dark:bg-slate-900/95 z-10 w-32">
                          <div className="flex items-center gap-1">Line <ArrowUpDown className="h-3 w-3" /></div>
                        </TableHead>
                        <TableHead onClick={() => handleLineSort("unitCode")} className="cursor-pointer font-semibold w-16">
                          <div className="flex items-center gap-1">Unit <ArrowUpDown className="h-3 w-3" /></div>
                        </TableHead>
                        <TableHead onClick={() => handleLineSort("totalPcs")} className="cursor-pointer text-right font-semibold w-28">
                          <div className="flex items-center justify-end gap-1">Output (Pcs) <ArrowUpDown className="h-3 w-3" /></div>
                        </TableHead>
                        <TableHead onClick={() => handleLineSort("totalSah")} className="cursor-pointer text-right font-semibold w-24">
                          <div className="flex items-center justify-end gap-1">SAH <ArrowUpDown className="h-3 w-3" /></div>
                        </TableHead>
                        <TableHead onClick={() => handleLineSort("totalClockHours")} className="cursor-pointer text-right font-semibold w-24">
                          <div className="flex items-center justify-end gap-1">Clock Hrs <ArrowUpDown className="h-3 w-3" /></div>
                        </TableHead>
                        <TableHead onClick={() => handleLineSort("efficiency")} className="cursor-pointer text-right font-semibold min-w-[120px]">
                          <div className="flex items-center justify-end gap-1">Floor Eff % <ArrowUpDown className="h-3 w-3" /></div>
                        </TableHead>
                        <TableHead onClick={() => handleLineSort("manpower")} className="cursor-pointer text-right font-semibold w-16">
                          <div className="flex items-center justify-end gap-1">MO <ArrowUpDown className="h-3 w-3" /></div>
                        </TableHead>
                        <TableHead className="font-semibold">Styles Running</TableHead>
                        <TableHead className="text-right font-semibold pr-3 w-24">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedLines.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-10 text-slate-400">
                            No production lines match current filter criteria.
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedLines.map((line: any, index: number) => {
                          const eff = line.efficiency || 0;
                          return (
                            <TableRow
                              key={`${line.unitCode}-${line.lineName}`}
                              className="hover:bg-sky-50/60 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer text-xs"
                              onClick={() => router.push(`/line/${encodeURIComponent(line.lineName)}`)}
                            >
                              {/* Rank */}
                              <TableCell className="text-center py-2">
                                {index === 0 ? (
                                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] ring-1 ring-amber-400">
                                    <Trophy className="h-3 w-3 text-amber-600" />
                                  </span>
                                ) : index === 1 ? (
                                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] ring-1 ring-slate-300">
                                    2
                                  </span>
                                ) : index === 2 ? (
                                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-orange-100 text-orange-900 font-bold text-[10px] ring-1 ring-orange-300">
                                    3
                                  </span>
                                ) : (
                                  <span className="font-mono text-slate-400 text-[10px]">#{index + 1}</span>
                                )}
                              </TableCell>

                              {/* Sticky Line Name */}
                              <TableCell className="sticky left-0 bg-white/95 dark:bg-slate-900/95 font-extrabold text-sky-600 dark:text-sky-400 group-hover:text-sky-700 z-10 shadow-xs py-2">
                                <Link
                                  href={`/line/${encodeURIComponent(line.lineName)}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="hover:underline flex items-center gap-1 font-mono text-xs font-bold"
                                >
                                  {line.lineName}
                                </Link>
                              </TableCell>

                              {/* Unit Code */}
                              <TableCell className="py-2">
                                <Badge variant="outline" className="font-semibold text-slate-600 dark:text-slate-300 text-[10px]">
                                  {line.unitCode}
                                </Badge>
                              </TableCell>

                              {/* Actual Output */}
                              <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 py-2">
                                {line.totalPcs.toLocaleString()}
                              </TableCell>

                              {/* Earned SAH */}
                              <TableCell className="text-right font-mono font-semibold text-purple-600 dark:text-purple-400 py-2">
                                {line.totalSah.toLocaleString()} h
                              </TableCell>

                              {/* Clock Hours */}
                              <TableCell className="text-right font-mono text-amber-600 dark:text-amber-400 py-2">
                                {line.totalClockHours.toLocaleString()} h
                              </TableCell>

                              {/* Floor Efficiency % with progress bar */}
                              <TableCell className="text-right py-2">
                                <div className="flex items-center justify-end gap-2">
                                  <span
                                    className={`font-bold font-mono ${
                                      eff >= 80
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : eff < 60
                                        ? "text-rose-600 dark:text-rose-400"
                                        : "text-slate-800 dark:text-slate-200"
                                    }`}
                                  >
                                    {eff}%
                                  </span>
                                  <div className="w-12 bg-slate-200 rounded-full h-1.5 dark:bg-slate-700 hidden sm:block">
                                    <div
                                      className={`h-1.5 rounded-full ${
                                        eff >= 80
                                          ? "bg-emerald-500"
                                          : eff >= 70
                                          ? "bg-sky-500"
                                          : eff >= 60
                                          ? "bg-amber-500"
                                          : "bg-rose-500"
                                      }`}
                                      style={{ width: `${Math.min(100, eff)}%` }}
                                    />
                                  </div>
                                </div>
                              </TableCell>

                              {/* Manpower / MO */}
                              <TableCell className="text-right font-mono text-slate-600 dark:text-slate-300 py-2">
                                {line.manpower}
                              </TableCell>

                              {/* Styles Running */}
                              <TableCell className="text-slate-600 dark:text-slate-400 max-w-xs truncate py-2">
                                {line.stylesList && line.stylesList.length > 0 ? (
                                  <span title={line.stylesList.join(", ")}>
                                    {line.stylesList[0]} {line.stylesList.length > 1 && `(+${line.stylesList.length - 1} more)`}
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </TableCell>

                              {/* Action Link */}
                              <TableCell className="text-right pr-3 py-2" onClick={(e) => e.stopPropagation()}>
                                <Link href={`/line/${encodeURIComponent(line.lineName)}`}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6.5 px-2 text-[11px] font-bold text-sky-600 border-sky-200 hover:text-white hover:bg-sky-600 dark:text-sky-400 dark:border-sky-800 shadow-2xs gap-0.5"
                                  >
                                    <Eye className="h-3 w-3" />
                                    <span>Details</span>
                                    <ChevronRight className="h-3 w-3 opacity-60" />
                                  </Button>
                                </Link>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: DAILY OUTPUT TIMELINE */}
        {viewTab === "daily" && (
          <div className="space-y-3.5">
            {/* 3 Daily Overview Cards */}
            {data?.dateBreakdown && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {data.dateBreakdown.map((d: any) => {
                  const maxDayPcs = Math.max(...data.dateBreakdown.map((x: any) => x.totalPcs));
                  const isPeak = d.totalPcs === maxDayPcs;
                  const sharePct = ((d.totalPcs / (data?.kpis?.totalActualPcs || 1)) * 100).toFixed(1);
                  return (
                    <Card
                      key={d.dateString}
                      className={`shadow-xs transition-all ${
                        isPeak
                          ? "border-emerald-300/90 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/20 ring-1 ring-emerald-500/20"
                          : "border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900"
                      }`}
                    >
                      <CardContent className="p-3 sm:p-3.5">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                            <Calendar className="h-3.5 w-3.5 text-sky-600" />
                            {d.dateString}
                          </div>
                          {isPeak ? (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[9px] font-bold">
                              🔥 Peak Production
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] font-medium">
                              Active Day
                            </Badge>
                          )}
                        </div>
                        <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                          {d.totalPcs.toLocaleString()} <span className="text-xs font-normal text-slate-400">pcs</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                          {sharePct}% of total monthly volume
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono">
                          <span className="text-purple-600 dark:text-purple-400 font-semibold">{d.totalSah.toLocaleString()}h SAH</span>
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">{d.totalClockHours.toLocaleString()}h Clock</span>
                          <span className="font-bold text-sky-600 dark:text-sky-400">{d.efficiency}% Eff</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Date Details Table */}
            <Card className="shadow-xs border-slate-200/90 dark:border-slate-800">
              <CardHeader className="p-3 sm:p-4 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-sky-600" />
                  Date-wise Floor Actual Production Timeline
                </CardTitle>
                <CardDescription className="text-xs">
                  Calendar progression of floor production output, SAH, and efficiency
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="w-full min-w-[700px]">
                    <TableHeader>
                      <TableRow className="bg-slate-50/90 dark:bg-slate-900/90 text-xs">
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="text-right font-semibold">Actual Output (Pcs)</TableHead>
                        <TableHead className="font-semibold w-36">Volume Share</TableHead>
                        <TableHead className="text-right font-semibold">Earned SAH (Hrs)</TableHead>
                        <TableHead className="text-right font-semibold">Clock Hours</TableHead>
                        <TableHead className="text-right font-semibold">Floor Eff %</TableHead>
                        <TableHead className="text-right font-semibold pr-4">Active Lines</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.dateBreakdown?.map((d: any) => {
                        const sharePct = ((d.totalPcs / (data?.kpis?.totalActualPcs || 1)) * 100).toFixed(1);
                        return (
                          <TableRow key={d.dateString} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 text-xs">
                            <TableCell className="font-mono font-bold text-sky-600 dark:text-sky-400">
                              {d.dateString}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {d.totalPcs.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-emerald-500 h-full rounded-full"
                                    style={{ width: `${sharePct}%` }}
                                  />
                                </div>
                                <span className="font-mono text-[10px] text-slate-500 w-9 text-right font-medium">{sharePct}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold text-purple-600 dark:text-purple-400">
                              {d.totalSah.toLocaleString()} h
                            </TableCell>
                            <TableCell className="text-right font-mono text-amber-600 dark:text-amber-400">
                              {d.totalClockHours.toLocaleString()} h
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold">
                              <span className={d.efficiency >= 80 ? "text-emerald-600" : d.efficiency > 0 ? "text-sky-600" : "text-slate-400"}>
                                {d.efficiency}%
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium text-slate-700 dark:text-slate-300 pr-4">
                              {d.activeLinesCount} lines
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 3: BUYER & STYLE BREAKDOWN */}
        {viewTab === "buyers" && (
          <div className="space-y-3.5">
            {/* Top 3 Buyer Feature Cards */}
            {data?.buyerBreakdown && data.buyerBreakdown.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {data.buyerBreakdown.slice(0, 3).map((b: any, idx: number) => {
                  const sharePct = ((b.totalPcs / (data?.kpis?.totalActualPcs || 1)) * 100).toFixed(1);
                  return (
                    <Card
                      key={b.buyerName}
                      className="border-t-2 border-t-sky-500 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
                    >
                      <CardContent className="p-3 sm:p-3.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate max-w-[180px]">
                            {b.buyerName}
                          </span>
                          <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 text-[9px] font-bold">
                            #{idx + 1} Buyer
                          </Badge>
                        </div>
                        <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                          {b.totalPcs.toLocaleString()} <span className="text-xs font-normal text-slate-400">pcs</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                          {sharePct}% of factory production
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                          <span className="text-purple-600 dark:text-purple-400 font-mono font-semibold">{b.totalSah.toLocaleString()}h SAH</span>
                          <span className="text-slate-600 dark:text-slate-300">{b.stylesCount} styles</span>
                          <span className="text-sky-600 dark:text-sky-400 font-medium">{b.linesCount} lines</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Buyer Table with Progress Bars */}
            <Card className="shadow-xs border-slate-200/90 dark:border-slate-800">
              <CardHeader className="p-3 sm:p-4 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-sky-600" />
                  Buyer & Brand Actual Production Contribution
                </CardTitle>
                <CardDescription className="text-xs">
                  Actual production volume, SAH, running styles, and lines per buyer
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="w-full min-w-[750px]">
                    <TableHeader>
                      <TableRow className="bg-slate-50/90 dark:bg-slate-900/90 text-xs">
                        <TableHead className="font-semibold">Buyer / Brand</TableHead>
                        <TableHead className="text-right font-semibold">Actual Output (Pcs)</TableHead>
                        <TableHead className="font-semibold w-48">Output Share %</TableHead>
                        <TableHead className="text-right font-semibold">Earned SAH (Hrs)</TableHead>
                        <TableHead className="text-right font-semibold">Styles Running</TableHead>
                        <TableHead className="text-right font-semibold pr-4">Lines Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.buyerBreakdown?.map((b: any, idx: number) => {
                        const sharePct = ((b.totalPcs / (data?.kpis?.totalActualPcs || 1)) * 100).toFixed(1);
                        return (
                          <TableRow key={b.buyerName} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 text-xs">
                            <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                              <div className="flex items-center gap-2">
                                <span className="h-6 w-6 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                                  {b.buyerName.substring(0, 2).toUpperCase()}
                                </span>
                                <span>{b.buyerName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {b.totalPcs.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-sky-500 h-full rounded-full"
                                    style={{ width: `${sharePct}%` }}
                                  />
                                </div>
                                <span className="font-mono text-[10px] text-slate-500 w-9 text-right font-semibold">{sharePct}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold text-purple-600 dark:text-purple-400">
                              {b.totalSah.toLocaleString()} h
                            </TableCell>
                            <TableCell className="text-right font-mono text-slate-700 dark:text-slate-300">
                              {b.stylesCount} styles
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium text-sky-600 dark:text-sky-400 pr-4">
                              {b.linesCount} lines
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 4: RAW FLOOR RECORDS AUDIT LOG */}
        {viewTab === "raw-records" && (
          <Card className="shadow-xs border-slate-200/90 dark:border-slate-800">
            <CardHeader className="p-3 sm:p-4 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-sky-600" />
                    Raw Floor Actual Records Audit Log
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Comprehensive ledger of ingested records from the floor production tracker
                  </CardDescription>
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Showing page <strong className="text-slate-900 dark:text-slate-100">{rawPage}</strong> of {totalRawPages} ({data?.records?.length || 0} records)
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="w-full min-w-[1100px]">
                  <TableHeader>
                    <TableRow className="bg-slate-50/90 dark:bg-slate-900/90 text-xs">
                      <TableHead className="font-semibold w-24">Date</TableHead>
                      <TableHead className="font-semibold w-16">Unit</TableHead>
                      <TableHead className="font-semibold w-28">Line</TableHead>
                      <TableHead className="font-semibold">Buyer</TableHead>
                      <TableHead className="font-semibold">Style</TableHead>
                      <TableHead className="font-semibold w-24">OC</TableHead>
                      <TableHead className="text-right font-semibold w-16">SMV</TableHead>
                      <TableHead className="text-right font-semibold w-24">Actual Pcs</TableHead>
                      <TableHead className="text-right font-semibold w-16">MO</TableHead>
                      <TableHead className="text-right font-semibold w-20">Clock Hrs</TableHead>
                      <TableHead className="text-right font-semibold w-20">SAH</TableHead>
                      <TableHead className="text-right font-semibold pr-4 w-20">Eff %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRawRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center py-10 text-slate-400">
                          No records match criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedRawRecords.map((r: any) => (
                        <TableRow key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 text-xs">
                          <TableCell className="font-mono text-slate-600 dark:text-slate-400">{r.dateString}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{r.unitCode}</Badge></TableCell>
                          <TableCell className="font-mono font-bold text-sky-600">{r.lineName}</TableCell>
                          <TableCell className="font-medium truncate max-w-[140px]" title={r.buyerName}>{r.buyerName}</TableCell>
                          <TableCell className="truncate max-w-[180px]" title={r.style}>{r.style}</TableCell>
                          <TableCell className="font-mono text-[11px] text-slate-500 truncate max-w-[100px]" title={r.oc}>{r.oc || "—"}</TableCell>
                          <TableCell className="text-right font-mono">{r.smv || "0"}</TableCell>
                          <TableCell className="text-right font-mono font-bold text-emerald-600">{r.actualPcs?.toLocaleString() || 0}</TableCell>
                          <TableCell className="text-right font-mono text-slate-600">{r.manpower || 0}</TableCell>
                          <TableCell className="text-right font-mono text-amber-600">{r.clockHours || 0}</TableCell>
                          <TableCell className="text-right font-mono text-purple-600">{r.actualSah || 0}</TableCell>
                          <TableCell className="text-right font-mono font-bold pr-4">{r.effPercent || 0}%</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {totalRawPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 dark:border-slate-800 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span>Rows per page:</span>
                    <select
                      value={rawPageSize}
                      onChange={(e) => {
                        setRawPageSize(Number(e.target.value));
                        setRawPage(1);
                      }}
                      className="rounded border border-slate-200 bg-white px-2 py-1 text-xs outline-none dark:border-slate-800 dark:bg-slate-900"
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 font-medium">
                    <span>Page {rawPage} of {totalRawPages}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={rawPage === 1}
                        onClick={() => setRawPage((p) => Math.max(1, p - 1))}
                        className="h-7 w-7 p-0"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={rawPage === totalRawPages}
                        onClick={() => setRawPage((p) => Math.min(totalRawPages, p + 1))}
                        className="h-7 w-7 p-0"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
