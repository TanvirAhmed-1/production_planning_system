"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/shared/searchable-select";
import {
  Search,
  ArrowUpDown,
  Download,
  Eye,
  Layers,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  BarChart3,
  RotateCcw,
  Target,
  Factory,
  Radio,
  FileSpreadsheet,
  CheckCircle
} from "lucide-react";

export interface LinePerformanceRow {
  lineId: string;
  lineName: string;
  unitCode: string;
  unitName?: string;
  manpower: number;
  target: number;
  actual: number;
  gap: number;
  sah: number;
  actualSah?: number;
  machineHours?: number;
  clockHours?: number;
  plannedEfficiency?: number;
  efficiency: number;
  achievementRate: number;
  status: string;
}

interface LinePerformanceTableProps {
  lines: LinePerformanceRow[];
  onLineClick?: (lineName: string) => void;
  onExport?: () => void;
}

type SortField =
  | 'lineName'
  | 'unitCode'
  | 'manpower'
  | 'target'
  | 'actual'
  | 'gap'
  | 'sah'
  | 'actualSah'
  | 'plannedEfficiency'
  | 'efficiency'
  | 'achievementRate'
  | 'machineHours';

export function LinePerformanceTable({ lines = [], onLineClick, onExport }: LinePerformanceTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedUnit, setSelectedUnit] = React.useState("ALL");
  const [selectedLine, setSelectedLine] = React.useState("ALL");
  const [selectedFloorData, setSelectedFloorData] = React.useState("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState("ALL");
  const [sortField, setSortField] = React.useState<SortField>('efficiency');
  const [sortAsc, setSortAsc] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleRowDrilldown = (lineName: string) => {
    if (onLineClick) {
      onLineClick(lineName);
    } else {
      router.push(`/line/${encodeURIComponent(lineName)}`);
    }
  };

  // Dynamic Unit options from all available lines
  const unitOptions = React.useMemo(() => {
    const counts: Record<string, { count: number; name: string }> = {};
    lines.forEach(l => {
      const code = l.unitCode || "OTHER";
      if (!counts[code]) {
        counts[code] = { count: 0, name: l.unitName || code };
      }
      counts[code].count += 1;
    });

    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([code, meta]) => ({
        value: code,
        label: `${code} (${meta.count} Lines)`,
      }));
  }, [lines]);

  // Dynamic Line options (cascaded by selected unit)
  const lineOptions = React.useMemo(() => {
    let list = lines;
    if (selectedUnit !== "ALL") {
      list = list.filter(l => l.unitCode === selectedUnit);
    }
    return [...list]
      .sort((a, b) => a.lineName.localeCompare(b.lineName, undefined, { numeric: true }))
      .map(l => ({
        value: l.lineName,
        label: `${l.lineName} (${l.unitCode})`,
      }));
  }, [lines, selectedUnit]);

  const handleUnitChange = (val: string) => {
    setSelectedUnit(val);
    if (val !== "ALL" && selectedLine !== "ALL") {
      const belongs = lines.some(l => l.lineName === selectedLine && l.unitCode === val);
      if (!belongs) {
        setSelectedLine("ALL");
      }
    }
    setCurrentPage(1);
  };

  const handleLineChange = (val: string) => {
    setSelectedLine(val);
    if (val !== "ALL") {
      const found = lines.find(l => l.lineName === val);
      if (found && selectedUnit !== "ALL" && found.unitCode !== selectedUnit) {
        setSelectedUnit(found.unitCode);
      }
    }
    setCurrentPage(1);
  };

  const resetAllFilters = () => {
    setSearchTerm("");
    setSelectedUnit("ALL");
    setSelectedLine("ALL");
    setSelectedFloorData("ALL");
    setSelectedStatus("ALL");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm !== "" ||
    selectedUnit !== "ALL" ||
    selectedLine !== "ALL" ||
    selectedFloorData !== "ALL" ||
    selectedStatus !== "ALL";

  // Filtered & Sorted lines
  const filteredAndSortedLines = React.useMemo(() => {
    const sTerm = searchTerm.toLowerCase().trim();
    let result = lines.filter((l) => {
      const matchSearch =
        sTerm === "" ||
        l.lineName.toLowerCase().includes(sTerm) ||
        l.unitCode.toLowerCase().includes(sTerm) ||
        (l.unitName && l.unitName.toLowerCase().includes(sTerm));

      const matchUnit = selectedUnit === "ALL" || l.unitCode === selectedUnit;
      const matchLine = selectedLine === "ALL" || l.lineName === selectedLine;
      const matchStatus = selectedStatus === "ALL" || l.status === selectedStatus;

      const hasActual = l.actual > 0 || (l.actualSah && l.actualSah > 0);
      const matchFloorData =
        selectedFloorData === "ALL" ||
        (selectedFloorData === "SYNCED" && hasActual) ||
        (selectedFloorData === "PLAN_ONLY" && !hasActual);

      return matchSearch && matchUnit && matchLine && matchStatus && matchFloorData;
    });

    result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'machineHours') {
        valA = a.machineHours || a.clockHours || 0;
        valB = b.machineHours || b.clockHours || 0;
      } else if (sortField === 'actualSah') {
        valA = a.actualSah || 0;
        valB = b.actualSah || 0;
      } else if (sortField === 'plannedEfficiency') {
        valA = a.plannedEfficiency || 0;
        valB = b.plannedEfficiency || 0;
      }

      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? Number(valA || 0) - Number(valB || 0) : Number(valB || 0) - Number(valA || 0);
    });

    return result;
  }, [lines, searchTerm, selectedUnit, selectedLine, selectedFloorData, selectedStatus, sortField, sortAsc]);

  // Overall KPI Summary metrics from filtered dataset
  const summaryMetrics = React.useMemo(() => {
    const dataset = filteredAndSortedLines;
    const totalLines = dataset.length;
    const totalManpower = dataset.reduce((acc, l) => acc + (l.manpower || 0), 0);
    const totalTarget = dataset.reduce((acc, l) => acc + (l.target || 0), 0);
    const totalActual = dataset.reduce((acc, l) => acc + (l.actual || 0), 0);
    const totalPlannedSah = Number(dataset.reduce((acc, l) => acc + (l.sah || 0), 0).toFixed(1));
    const totalActualSah = Number(dataset.reduce((acc, l) => acc + (l.actualSah || 0), 0).toFixed(1));
    const totalClockHours = Number(dataset.reduce((acc, l) => acc + (l.clockHours || l.machineHours || 0), 0).toFixed(1));

    const overallAchRate = totalTarget > 0 ? Number(((totalActual / totalTarget) * 100).toFixed(1)) : 0;
    const netVariance = totalActual - totalTarget;

    const avgPlannedEff = totalClockHours > 0 && totalPlannedSah > 0
      ? Number(((totalPlannedSah / totalClockHours) * 100).toFixed(1))
      : dataset.length > 0
      ? Number((dataset.reduce((acc, l) => acc + (l.plannedEfficiency || 0), 0) / dataset.length).toFixed(1))
      : 0;

    const avgActualEff = totalClockHours > 0 && totalActualSah > 0
      ? Number(((totalActualSah / totalClockHours) * 100).toFixed(1))
      : 0;

    const syncedLinesCount = dataset.filter(l => l.actual > 0 || (l.actualSah && l.actualSah > 0)).length;
    const syncedPct = totalLines > 0 ? Number(((syncedLinesCount / totalLines) * 100).toFixed(1)) : 0;
    const uniqueUnitsCount = new Set(dataset.map(l => l.unitCode)).size;

    return {
      totalLines,
      totalManpower,
      totalTarget,
      totalActual,
      totalPlannedSah,
      totalActualSah,
      totalClockHours,
      overallAchRate,
      netVariance,
      avgPlannedEff,
      avgActualEff,
      syncedLinesCount,
      syncedPct,
      uniqueUnitsCount,
    };
  }, [filteredAndSortedLines]);

  const totalPages = Math.ceil(filteredAndSortedLines.length / pageSize) || 1;
  const paginatedLines = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedLines.slice(start, start + pageSize);
  }, [filteredAndSortedLines, currentPage, pageSize]);

  return (
    <div className="space-y-4">
      {/* Top Executive KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Total Lines */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Lines</span>
            <Factory className="h-4 w-4 text-sky-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
            {summaryMetrics.totalLines} <span className="text-xs font-normal text-slate-500">/ {lines.length}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
            <span className="font-semibold text-sky-600">{summaryMetrics.uniqueUnitsCount} Units</span> across plan
          </div>
        </div>

        {/* Metric 2: Operators / Manpower */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Operators</span>
            <Users className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
            {summaryMetrics.totalManpower.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Avg {summaryMetrics.totalLines > 0 ? Math.round(summaryMetrics.totalManpower / summaryMetrics.totalLines) : 0} ops / line
          </div>
        </div>

        {/* Metric 3: Planned vs Actual Production */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Output / Target</span>
            <Target className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {summaryMetrics.totalActual > 0 ? summaryMetrics.totalActual.toLocaleString() : "0"}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
            <span>Plan: {summaryMetrics.totalTarget.toLocaleString()}</span>
            <span className="font-bold text-emerald-600">{summaryMetrics.overallAchRate}%</span>
          </div>
        </div>

        {/* Metric 4: Planned vs Actual SAH */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Earned SAH</span>
            <Clock className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
            {summaryMetrics.totalActualSah > 0 ? summaryMetrics.totalActualSah.toLocaleString() : summaryMetrics.totalPlannedSah.toLocaleString()} <span className="text-xs font-normal">h</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {summaryMetrics.totalActualSah > 0 ? `Plan: ${summaryMetrics.totalPlannedSah.toLocaleString()}h` : "Planned SAH"}
          </div>
        </div>

        {/* Metric 5: Efficiency Benchmark */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Efficiency</span>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
            {summaryMetrics.avgActualEff > 0 ? `${summaryMetrics.avgActualEff}%` : `${summaryMetrics.avgPlannedEff}%`}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
            <span>{summaryMetrics.avgActualEff > 0 ? "Actual Floor" : "Plan Benchmark"}</span>
            <span className="text-slate-400">Plan: {summaryMetrics.avgPlannedEff}%</span>
          </div>
        </div>

        {/* Metric 6: Floor Data Synced */}
        <div
          onClick={() => router.push("/actual-production")}
          className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 shadow-xs dark:border-emerald-900/60 dark:bg-emerald-950/20 cursor-pointer hover:border-emerald-400 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider group-hover:underline flex items-center gap-1">
              Floor Synced →
            </span>
            <Radio className="h-4 w-4 text-emerald-600 animate-pulse" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-700 dark:text-emerald-300">
            {summaryMetrics.syncedLinesCount} <span className="text-xs font-normal text-emerald-600">({summaryMetrics.syncedPct}%)</span>
          </div>
          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5 font-medium flex items-center justify-between">
            <span>Live actual data connected</span>
            <span className="font-semibold text-emerald-600 group-hover:underline text-[10px]">View Details</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-sm border-slate-200/90 dark:border-slate-800">
        <CardHeader className="p-3.5 sm:p-5 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                <Layers className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
                <span>Line-wise Production Performance & Actual Tracking</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Comprehensive tracking of all {lines.length} production lines — Planned Targets vs Floor Actual Output, SAH, and Efficiency rankings
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/actual-production")}
                className="h-8 gap-1.5 text-xs font-semibold border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100/70 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300 shadow-2xs"
              >
                <Radio className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                <span>Actual Production Details</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="h-8 gap-1.5 text-xs font-semibold border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Lines</span>
              </Button>
            </div>
          </div>

          {/* Search & Filter Toolbar: Unit, Line, Floor Data, Status & Search */}
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 w-full sm:w-auto">
              {/* Search Input */}
              <div className="relative w-full sm:w-52 md:w-56">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search line (e.g. U02-01)..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-8 pl-8 text-xs w-full"
                />
              </div>

              {/* 2-Column Grid on Mobile, Flex on Desktop */}
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                {/* Dynamic Unit Filter */}
                <SearchableSelect
                  label="Unit:"
                  placeholder="All"
                  searchPlaceholder="Search unit..."
                  allOptionLabel={`All (${lines.length})`}
                  allOptionValue="ALL"
                  value={selectedUnit}
                  options={unitOptions}
                  onChange={handleUnitChange}
                  className="w-full sm:w-36"
                  triggerClassName="w-full h-8 text-xs"
                  dropdownWidth="w-56"
                />

                {/* Dynamic Cascaded Line Filter */}
                <SearchableSelect
                  label="Line:"
                  placeholder="All"
                  searchPlaceholder="Search line..."
                  allOptionLabel={`All (${lineOptions.length})`}
                  allOptionValue="ALL"
                  value={selectedLine}
                  options={lineOptions}
                  onChange={handleLineChange}
                  className="w-full sm:w-36"
                  triggerClassName="w-full h-8 text-xs"
                  dropdownWidth="w-64"
                />

                {/* Floor Data Actual Status Filter */}
                <SearchableSelect
                  label="Floor:"
                  placeholder="All"
                  searchPlaceholder="Filter actual sync..."
                  allOptionLabel={`All (${lines.length})`}
                  allOptionValue="ALL"
                  value={selectedFloorData}
                  options={[
                    { label: "Floor Synced (Live Actuals)", value: "SYNCED" },
                    { label: "Plan Only (No Actuals)", value: "PLAN_ONLY" }
                  ]}
                  onChange={(val) => {
                    setSelectedFloorData(val);
                    setCurrentPage(1);
                  }}
                  className="w-full sm:w-36"
                  triggerClassName="w-full h-8 text-xs"
                  dropdownWidth="w-56"
                />

                {/* Performance Status Filter */}
                <SearchableSelect
                  label="Status:"
                  placeholder="All"
                  searchPlaceholder="Search status..."
                  allOptionLabel="All Statuses"
                  allOptionValue="ALL"
                  value={selectedStatus}
                  options={[
                    { label: "High (≥80%)", value: "HIGH" },
                    { label: "Normal (70–79%)", value: "NORMAL" },
                    { label: "Needs Attention (60–69%)", value: "NEEDS_ATTENTION" },
                    { label: "Low (<60%)", value: "LOW" }
                  ]}
                  onChange={(val) => {
                    setSelectedStatus(val);
                    setCurrentPage(1);
                  }}
                  className="w-full sm:w-36"
                  triggerClassName="w-full h-8 text-xs"
                  dropdownWidth="w-52"
                />
              </div>

              {/* Reset Filters button */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetAllFilters}
                  className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1 font-semibold self-start sm:self-auto"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset</span>
                </Button>
              )}
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium pt-1 sm:pt-0">
              Showing <span className="font-bold text-slate-900 dark:text-slate-100">{filteredAndSortedLines.length}</span> of {lines.length} lines
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[1080px]">
              <TableHeader>
                <TableRow className="bg-slate-50/90 dark:bg-slate-900/90 text-xs">
                  <TableHead onClick={() => handleSort('lineName')} className="cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 font-semibold sticky left-0 bg-slate-50/95 dark:bg-slate-900/95 z-10 w-36">
                    <div className="flex items-center gap-1">Line <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('unitCode')} className="cursor-pointer hover:text-slate-900 font-semibold w-20">
                    <div className="flex items-center gap-1">Unit <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('manpower')} className="cursor-pointer hover:text-slate-900 text-right font-semibold w-20">
                    <div className="flex items-center justify-end gap-1">Ops <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('target')} className="cursor-pointer hover:text-slate-900 text-right font-semibold">
                    <div className="flex items-center justify-end gap-1">Plan Target <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('actual')} className="cursor-pointer hover:text-slate-900 text-right font-semibold">
                    <div className="flex items-center justify-end gap-1">Actual Output <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('gap')} className="cursor-pointer hover:text-slate-900 text-right font-semibold">
                    <div className="flex items-center justify-end gap-1">Variance / Gap <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('sah')} className="cursor-pointer hover:text-slate-900 text-right font-semibold">
                    <div className="flex items-center justify-end gap-1">Plan SAH <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('actualSah')} className="cursor-pointer hover:text-slate-900 text-right font-semibold">
                    <div className="flex items-center justify-end gap-1">Actual SAH <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('plannedEfficiency')} className="cursor-pointer hover:text-slate-900 text-right font-semibold">
                    <div className="flex items-center justify-end gap-1">Plan Eff % <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('efficiency')} className="cursor-pointer hover:text-slate-900 text-right font-semibold min-w-[130px]">
                    <div className="flex items-center justify-end gap-1">Actual Eff % <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('achievementRate')} className="cursor-pointer hover:text-slate-900 text-right font-semibold">
                    <div className="flex items-center justify-end gap-1">Achieve % <ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="font-semibold text-center w-24">Status</TableHead>
                  <TableHead className="text-right font-semibold pr-4 w-28">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-12 text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Layers className="h-8 w-8 text-slate-300" />
                        <p className="font-medium">No production lines match the selected filters.</p>
                        {hasActiveFilters && (
                          <Button variant="outline" size="sm" onClick={resetAllFilters} className="text-xs mt-1">
                            Reset Filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLines.map((line) => {
                    const hasActual = line.actual > 0 || (line.actualSah && line.actualSah > 0);
                    const gapQty = line.target - line.actual;
                    const variance = line.actual - line.target;

                    let badgeVariant: any = "secondary";
                    let statusLabel = "Normal";
                    if (line.efficiency >= 80) {
                      badgeVariant = "success";
                      statusLabel = "High";
                    } else if (line.efficiency >= 70) {
                      badgeVariant = "info";
                      statusLabel = "Normal";
                    } else if (line.efficiency >= 60) {
                      badgeVariant = "warning";
                      statusLabel = "Attention";
                    } else {
                      badgeVariant = "destructive";
                      statusLabel = "Low / Bottleneck";
                    }

                    return (
                      <TableRow
                        key={line.lineId || line.lineName}
                        className="hover:bg-sky-50/60 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer"
                        onClick={() => handleRowDrilldown(line.lineName)}
                      >
                        {/* Sticky Line Name & Floor Synced Indicator */}
                        <TableCell className="sticky left-0 bg-white/95 dark:bg-slate-900/95 font-extrabold text-sky-600 dark:text-sky-400 group-hover:text-sky-700 z-10 shadow-xs">
                          <div className="flex flex-col">
                            <Link
                              href={`/line/${encodeURIComponent(line.lineName)}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:underline flex items-center gap-1 font-mono text-xs font-bold text-sky-600 dark:text-sky-400"
                            >
                              {line.lineName}
                            </Link>
                            <div className="mt-0.5">
                              {hasActual ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Floor Synced
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[9px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                                  Plan Only
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Unit Code */}
                        <TableCell>
                          <Badge variant="outline" className="font-semibold text-slate-600 dark:text-slate-300 text-xs">
                            {line.unitCode}
                          </Badge>
                        </TableCell>

                        {/* Manpower / Operators */}
                        <TableCell className="text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                          {line.manpower}
                        </TableCell>

                        {/* Planned Target */}
                        <TableCell className="text-right font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                          {line.target > 0 ? line.target.toLocaleString() : "0"}
                        </TableCell>

                        {/* Actual Output */}
                        <TableCell className="text-right font-mono font-bold text-xs">
                          {line.actual > 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                              {line.actual.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">0</span>
                          )}
                        </TableCell>

                        {/* Variance / Gap */}
                        <TableCell className="text-right font-mono text-xs">
                          {line.actual > 0 ? (
                            variance >= 0 ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
                                +{variance.toLocaleString()}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold text-rose-700 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800">
                                -{Math.abs(variance).toLocaleString()}
                              </span>
                            )
                          ) : (
                            <span className="text-slate-400 font-medium">
                              {line.target > 0 ? `-${line.target.toLocaleString()}` : "0"}
                            </span>
                          )}
                        </TableCell>

                        {/* Planned SAH */}
                        <TableCell className="text-right font-mono text-xs font-semibold text-purple-600 dark:text-purple-400">
                          {line.sah ? Number(line.sah).toLocaleString() : "-"}
                        </TableCell>

                        {/* Actual SAH */}
                        <TableCell className="text-right font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {line.actualSah && line.actualSah > 0 ? Number(line.actualSah).toLocaleString() : "-"}
                        </TableCell>

                        {/* Planned Efficiency % */}
                        <TableCell className="text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                          {line.plannedEfficiency ? `${line.plannedEfficiency}%` : "-"}
                        </TableCell>

                        {/* Actual Efficiency % */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span
                              className={`font-bold font-mono text-xs ${
                                line.efficiency >= 80
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : line.efficiency < 60
                                  ? "text-rose-600 dark:text-rose-400 font-extrabold"
                                  : "text-slate-800 dark:text-slate-200"
                              }`}
                            >
                              {line.efficiency}%
                            </span>
                            <div className="w-12 bg-slate-200 rounded-full h-1.5 dark:bg-slate-700 hidden sm:block">
                              <div
                                className={`h-1.5 rounded-full ${
                                  line.efficiency >= 80
                                    ? "bg-emerald-500"
                                    : line.efficiency >= 70
                                    ? "bg-sky-500"
                                    : line.efficiency >= 60
                                    ? "bg-amber-500"
                                    : "bg-rose-500"
                                }`}
                                style={{ width: `${Math.min(100, line.efficiency)}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>

                        {/* Achievement Rate % */}
                        <TableCell className="text-right font-mono text-xs font-semibold">
                          <span
                            className={
                              line.achievementRate >= 100
                                ? "text-emerald-600 dark:text-emerald-400 font-bold"
                                : line.achievementRate >= 80
                                ? "text-sky-600 dark:text-sky-400"
                                : line.achievementRate > 0
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-slate-400"
                            }
                          >
                            {line.achievementRate > 0 ? `${line.achievementRate}%` : (line.actual > 0 ? "100%" : "0%")}
                          </span>
                        </TableCell>

                        {/* Status Badge */}
                        <TableCell className="text-center">
                          <Badge variant={badgeVariant} className="text-[10px] font-semibold">
                            {statusLabel}
                          </Badge>
                        </TableCell>

                        {/* Action: Drill Down to Line Details */}
                        <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                          <Link href={`/line/${encodeURIComponent(line.lineName)}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs font-bold text-sky-600 border-sky-200 hover:text-white hover:bg-sky-600 hover:border-sky-600 dark:text-sky-400 dark:border-sky-800 dark:hover:bg-sky-700 shadow-2xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              <span>Details</span>
                              <ChevronRight className="h-3 w-3 ml-0.5 opacity-60" />
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  aria-label="Rows per page"
                  className="rounded border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                >
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={lines.length}>All ({lines.length})</option>
                </select>
              </div>

              <div className="flex items-center gap-2 font-medium">
                <span>
                  Page {currentPage} of {totalPages} ({filteredAndSortedLines.length} lines)
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="h-7 w-7 p-0"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
    </div>
  );
}
