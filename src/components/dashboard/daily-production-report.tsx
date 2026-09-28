"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableFooter,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/shared/searchable-select";
import {
  Calendar,
  Download,
  Eye,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Factory,
  Layers,
  Clock,
  Gauge,
  X,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export interface DailyProductionRow {
  date: string;
  shortDate: string;
  target: number;
  actual: number;
  gap: number;
  targetSah: number;
  actualSah: number;
  efficiency: number;
  achievementRate: number;
}

interface DailyProductionReportProps {
  data: DailyProductionRow[];
  onDateClick?: (dateStr: string) => void;
  onExport?: () => void;
}

export function DailyProductionReport({ data, onDateClick, onExport }: DailyProductionReportProps) {
  // Filter States
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedSingleDate, setSelectedSingleDate] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activePreset, setActivePreset] = useState<string>("ALL");

  // Date Drilldown Modal State
  const [drilldownDate, setDrilldownDate] = useState<string | null>(null);
  const [drilldownData, setDrilldownData] = useState<any>(null);
  const [loadingDrilldown, setLoadingDrilldown] = useState<boolean>(false);
  const [drilldownLineSearch, setDrilldownLineSearch] = useState<string>("");

  // All distinct dates available in data
  const availableDates = useMemo(() => {
    return data.map((d) => d.date).sort();
  }, [data]);

  // Options for SearchableSelect
  const dateOptions = useMemo(() => {
    return availableDates.map((d) => {
      const dateObj = new Date(`${d}T00:00:00Z`);
      const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
      const row = data.find((r) => r.date === d);
      return {
        label: d,
        value: d,
        badge: dayName,
        sublabel: row
          ? `Target: ${row.target.toLocaleString()} • Act: ${row.actual.toLocaleString()} • ${row.efficiency}% Eff`
          : undefined,
      };
    });
  }, [availableDates, data]);

  const statusOptions = useMemo(
    () => [
      { label: "High Output / Peak (≥80%)", value: "HIGH", badge: "Peak" },
      { label: "Normal Operating (70%-80%)", value: "NORMAL", badge: "On Plan" },
      { label: "Needs Attention (<70%)", value: "BELOW", badge: "Low" },
    ],
    []
  );

  // Apply Quick Date Presets
  const applyDatePreset = (presetKey: string) => {
    setActivePreset(presetKey);
    setSelectedSingleDate("ALL");

    if (presetKey === "ALL") {
      setStartDate("");
      setEndDate("");
    } else if (presetKey === "WEEK_1") {
      setStartDate("2026-10-01");
      setEndDate("2026-10-07");
    } else if (presetKey === "WEEK_2") {
      setStartDate("2026-10-08");
      setEndDate("2026-10-14");
    } else if (presetKey === "WEEK_3") {
      setStartDate("2026-10-15");
      setEndDate("2026-10-21");
    } else if (presetKey === "WEEK_4") {
      setStartDate("2026-10-22");
      setEndDate("2026-10-31");
    } else if (presetKey === "HALF_1") {
      setStartDate("2026-10-01");
      setEndDate("2026-10-15");
    } else if (presetKey === "HALF_2") {
      setStartDate("2026-10-16");
      setEndDate("2026-10-31");
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedSingleDate("ALL");
    setStatusFilter("ALL");
    setSearchQuery("");
    setActivePreset("ALL");
  };

  // Filtered Rows Calculation
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // 1. Single Date Match
      if (selectedSingleDate !== "ALL" && row.date !== selectedSingleDate) {
        return false;
      }

      // 2. Date Range Match
      if (startDate && row.date < startDate) {
        return false;
      }
      if (endDate && row.date > endDate) {
        return false;
      }

      // 3. Search Query
      if (searchQuery.trim() && !row.date.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // 4. Status Filter
      if (statusFilter !== "ALL") {
        if (statusFilter === "HIGH" && row.achievementRate < 95 && row.efficiency < 80) return false;
        if (statusFilter === "NORMAL" && (row.efficiency < 70 || row.efficiency >= 80)) return false;
        if (statusFilter === "BELOW" && (row.achievementRate >= 80 && row.efficiency >= 70)) return false;
      }

      return true;
    });
  }, [data, selectedSingleDate, startDate, endDate, searchQuery, statusFilter]);

  // Totals for filtered rows
  const totals = useMemo(() => {
    const totalTarget = filteredData.reduce((acc, r) => acc + r.target, 0);
    const totalActual = filteredData.reduce((acc, r) => acc + r.actual, 0);
    const totalGap = filteredData.reduce((acc, r) => acc + r.gap, 0);
    const totalTargetSah = filteredData.reduce((acc, r) => acc + r.targetSah, 0);
    const totalActualSah = filteredData.reduce((acc, r) => acc + r.actualSah, 0);
    const avgEff =
      filteredData.length > 0
        ? Number((filteredData.reduce((acc, r) => acc + r.efficiency, 0) / filteredData.length).toFixed(1))
        : 0;
    const avgAch = totalTarget > 0 ? Number(((totalActual / totalTarget) * 100).toFixed(1)) : 0;

    return {
      totalTarget,
      totalActual,
      totalGap,
      totalTargetSah,
      totalActualSah,
      avgEff,
      avgAch,
      daysCount: filteredData.length,
    };
  }, [filteredData]);

  const hasActiveFilters =
    startDate !== "" ||
    endDate !== "" ||
    selectedSingleDate !== "ALL" ||
    statusFilter !== "ALL" ||
    searchQuery !== "" ||
    activePreset !== "ALL";

  // Fetch drilldown for specific date
  const openDateDrilldown = useCallback(async (dateStr: string) => {
    setDrilldownDate(dateStr);
    setLoadingDrilldown(true);
    setDrilldownData(null);
    try {
      const res = await fetch(`/api/analytics/date-details?date=${dateStr}`);
      if (res.ok) {
        const json = await res.json();
        setDrilldownData(json);
      }
    } catch (err) {
      console.error("Failed to load date details:", err);
    } finally {
      setLoadingDrilldown(false);
    }
  }, []);

  // Filter drilldown lines by search term
  const filteredDrilldownLines = useMemo(() => {
    if (!drilldownData?.lines) return [];
    if (!drilldownLineSearch.trim()) return drilldownData.lines;
    const q = drilldownLineSearch.toLowerCase();
    return drilldownData.lines.filter(
      (l: any) =>
        l.lineName.toLowerCase().includes(q) ||
        l.unitCode.toLowerCase().includes(q) ||
        l.styles.some((s: any) => s.styleRef.toLowerCase().includes(q) || s.buyer.toLowerCase().includes(q))
    );
  }, [drilldownData, drilldownLineSearch]);

  return (
    <Card className="shadow-sm border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      {/* Header Bar */}
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                Daily Production Report (October 2026)
              </CardTitle>
              <Badge className="bg-sky-600 text-white text-[10px] py-0 font-semibold">
                {totals.daysCount} of {data.length} Days Active
              </Badge>
            </div>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Filter day-by-day production volume, SAH outputs, line performance, and target achievements
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="h-8 gap-1 text-xs border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              <span>Export Daily Report</span>
            </Button>
          </div>
        </div>

        {/* Date Filter Toolbar */}
        <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 space-y-3">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="h-3 w-3 text-sky-600" />
              <span>Date Filter:</span>
            </span>

            {[
              { id: "ALL", label: "Full Month (1-31 Oct)" },
              { id: "WEEK_1", label: "Week 1 (Oct 01-07)" },
              { id: "WEEK_2", label: "Week 2 (Oct 08-14)" },
              { id: "WEEK_3", label: "Week 3 (Oct 15-21)" },
              { id: "WEEK_4", label: "Week 4 (Oct 22-31)" },
              { id: "HALF_1", label: "1st Half (Oct 01-15)" },
              { id: "HALF_2", label: "2nd Half (Oct 16-31)" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => applyDatePreset(p.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  activePreset === p.id && !startDate && !endDate && selectedSingleDate === "ALL"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750"
                }`}
              >
                {p.label}
              </button>
            ))}

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-7 px-2 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1 ml-auto"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Filters</span>
              </Button>
            )}
          </div>

          {/* Custom Date Pickers & Filter Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {/* 1. Single Date Dropdown */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Specific Date:
              </label>
              <SearchableSelect
                className="w-full"
                triggerClassName="w-full h-8 text-xs bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                dropdownWidth="w-80"
                placeholder="All Dates"
                searchPlaceholder="Search date or day (e.g. Oct 05, Mon)..."
                options={dateOptions}
                value={selectedSingleDate}
                onChange={(val) => {
                  setSelectedSingleDate(val);
                  if (val !== "ALL") {
                    setActivePreset("CUSTOM");
                  }
                }}
                allOptionLabel={`All Available Dates (${availableDates.length} Days)`}
                allOptionValue="ALL"
              />
            </div>

            {/* 2. From Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                From Date:
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setSelectedSingleDate("ALL");
                  setActivePreset("CUSTOM");
                }}
                className="h-8 text-xs bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
              />
            </div>

            {/* 3. To Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                To Date:
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setSelectedSingleDate("ALL");
                  setActivePreset("CUSTOM");
                }}
                className="h-8 text-xs bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
              />
            </div>

            {/* 4. Efficiency Status Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Efficiency Rating:
              </label>
              <SearchableSelect
                className="w-full"
                triggerClassName="w-full h-8 text-xs bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                dropdownWidth="w-72"
                placeholder="All Statuses"
                searchPlaceholder="Search efficiency..."
                options={statusOptions}
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                allOptionLabel="All Statuses"
                allOptionValue="ALL"
              />
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Filter Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs font-mono">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Filtered Target:</span>
          <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
            {totals.totalTarget.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">PCS</span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Filtered SAH:</span>
          <span className="text-sm font-extrabold text-purple-700 dark:text-purple-300">
            {totals.totalTargetSah.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">SAH</span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-slate-400">Average Efficiency:</span>
          <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
            {totals.avgEff}%
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-slate-400">Filtered Days Count:</span>
          <span className="text-sm font-extrabold text-sky-600 dark:text-sky-400">
            {totals.daysCount} Days
          </span>
        </div>
      </div>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100/90 dark:bg-slate-850/90 text-xs font-bold text-slate-700 dark:text-slate-200">
                <TableHead className="font-bold">Date</TableHead>
                <TableHead className="text-right font-bold">Planned Target (Pcs)</TableHead>
                <TableHead className="text-right font-bold">Actual Output (Pcs)</TableHead>
                <TableHead className="text-right font-bold">Gap Variance</TableHead>
                <TableHead className="text-right font-bold">Target SAH</TableHead>
                <TableHead className="text-right font-bold">Actual SAH</TableHead>
                <TableHead className="text-right font-bold">Efficiency %</TableHead>
                <TableHead className="text-right font-bold">Achievement %</TableHead>
                <TableHead className="text-center font-bold">Status</TableHead>
                <TableHead className="text-right font-bold pr-4">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-slate-400">
                    No production days match your date filter. Try selecting &quot;Full Month&quot; or resetting filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((row) => {
                  let badgeVariant: any = "secondary";
                  let status = "On Track";
                  if (row.efficiency >= 80) {
                    badgeVariant = "default";
                    status = "High Output";
                  } else if (row.efficiency >= 70) {
                    badgeVariant = "secondary";
                    status = "Normal";
                  } else {
                    badgeVariant = "destructive";
                    status = "Below Plan";
                  }

                  const dateObj = new Date(`${row.date}T00:00:00Z`);
                  const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });

                  return (
                    <TableRow
                      key={row.date}
                      className="hover:bg-sky-50/50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                      onClick={() => openDateDrilldown(row.date)}
                    >
                      <TableCell className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-sky-500" />
                        <span className="font-mono">{row.date}</span>
                        <Badge variant="outline" className="text-[10px] py-0 px-1 font-semibold text-slate-500">
                          {dayName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-extrabold text-slate-900 dark:text-slate-100">
                        {row.target.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {row.actual.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold">
                        <span className={row.gap > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600"}>
                          {row.gap > 0 ? `-${row.gap.toLocaleString()}` : `+${Math.abs(row.gap).toLocaleString()}`}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-purple-700 dark:text-purple-300 font-semibold">
                        {row.targetSah.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {row.actualSah.toLocaleString()}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono font-extrabold text-xs ${
                          row.efficiency >= 80
                            ? "text-emerald-600 dark:text-emerald-400"
                            : row.efficiency >= 70
                            ? "text-sky-600 dark:text-sky-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {row.efficiency}%
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs">
                        {row.achievementRate}%
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={`text-[10px] font-bold ${
                            row.efficiency >= 80
                              ? "bg-emerald-600 text-white"
                              : row.efficiency >= 70
                              ? "bg-sky-600 text-white"
                              : "bg-amber-600 text-white"
                          }`}
                        >
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDateDrilldown(row.date)}
                          className="h-7 px-2 text-xs font-bold text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950/50"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          <span>View Lines</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-slate-100 dark:bg-slate-850 font-extrabold text-xs">
                <TableCell>Filtered Date Range Total ({totals.daysCount} Days)</TableCell>
                <TableCell className="text-right font-mono text-sky-900 dark:text-sky-100">
                  {totals.totalTarget.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono text-emerald-600 dark:text-emerald-400">
                  {totals.totalActual.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono text-rose-600">
                  -{totals.totalGap.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono text-purple-800 dark:text-purple-200">
                  {totals.totalTargetSah.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {totals.totalActualSah.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono text-indigo-700 dark:text-indigo-300">
                  {totals.avgEff}% (Avg)
                </TableCell>
                <TableCell className="text-right font-mono">{totals.avgAch}%</TableCell>
                <TableCell colSpan={2} className="text-center font-semibold text-slate-500">
                  Sign-off Summary
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>

      {/* MODAL: SINGLE DATE LINE-WISE & UNIT BREAKDOWN */}
      {drilldownDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-up">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-sky-700 via-indigo-700 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur border border-white/20 shadow-inner">
                  <Calendar className="h-5 w-5 text-sky-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base">
                      Line Production Breakdown for {drilldownDate}
                    </h3>
                    <Badge className="bg-sky-500/30 text-sky-200 border border-sky-400/40 text-[10px] font-bold">
                      {drilldownData?.dayOfWeek || "Date View"}
                    </Badge>
                  </div>
                  <p className="text-xs text-sky-100/80">
                    Showing all manufacturing lines, running styles, and efficiency ratings on this day
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDrilldownDate(null)}
                className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {loadingDrilldown ? (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
                  <div className="h-8 w-8 rounded-full border-4 border-sky-200 border-t-sky-600 animate-spin" />
                  <span>Loading lines running on {drilldownDate}...</span>
                </div>
              ) : drilldownData ? (
                <>
                  {/* Top KPI Cards for Date */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50/50 dark:bg-sky-950/40">
                      <span className="text-[10px] font-bold uppercase text-sky-700 dark:text-sky-300">
                        Planned Target
                      </span>
                      <div className="text-lg font-extrabold font-mono text-sky-950 dark:text-sky-100">
                        {drilldownData.summary?.totalTarget?.toLocaleString()} pcs
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Across {drilldownData.summary?.totalActiveLines} active lines
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/40">
                      <span className="text-[10px] font-bold uppercase text-purple-700 dark:text-purple-300">
                        Target SAH Output
                      </span>
                      <div className="text-lg font-extrabold font-mono text-purple-950 dark:text-purple-100">
                        {drilldownData.summary?.totalTargetSah?.toLocaleString()} SAH
                      </div>
                      <p className="text-[10px] text-slate-500">Standard Allowed Hours</p>
                    </div>

                    <div className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/40">
                      <span className="text-[10px] font-bold uppercase text-indigo-700 dark:text-indigo-300">
                        Total Machine Capacity
                      </span>
                      <div className="text-lg font-extrabold font-mono text-indigo-950 dark:text-indigo-100">
                        {drilldownData.summary?.totalClockHours?.toLocaleString()} Hrs
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {drilldownData.summary?.totalManpower} operators deployed
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/40">
                      <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">
                        Day Planned Efficiency
                      </span>
                      <div className="text-lg font-extrabold font-mono text-emerald-700 dark:text-emerald-300">
                        {drilldownData.summary?.overallPlannedEfficiency}%
                      </div>
                      <p className="text-[10px] text-slate-500">Benchmark Planned Rating</p>
                    </div>
                  </div>

                  {/* Unit Breakdown on this date */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-2">
                      Unit Output Distribution ({drilldownDate})
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {drilldownData.unitBreakdown?.map((u: any) => (
                        <div
                          key={u.unitCode}
                          className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                        >
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-sky-600">{u.unitCode}</span>
                            <Badge variant="outline" className="text-[10px] py-0">
                              {u.linesCount} Lines
                            </Badge>
                          </div>
                          <div className="mt-1 text-base font-extrabold font-mono">
                            {u.target.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">pcs</span>
                          </div>
                          <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                            {u.efficiency}% Efficiency
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Line Search & Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Layers className="h-4 w-4 text-sky-600" />
                        <span>All Production Lines Output ({filteredDrilldownLines.length} Lines)</span>
                      </h4>

                      <div className="relative w-56">
                        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                        <Input
                          placeholder="Search line (e.g. U02-01)..."
                          value={drilldownLineSearch}
                          onChange={(e) => setDrilldownLineSearch(e.target.value)}
                          className="h-7 text-xs pl-8"
                        />
                      </div>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200">
                          <tr>
                            <th className="px-3 py-2">Line Name</th>
                            <th className="px-3 py-2">Unit</th>
                            <th className="px-3 py-2">Running Styles</th>
                            <th className="px-3 py-2 text-right">Target (Pcs)</th>
                            <th className="px-3 py-2 text-right">Target SAH</th>
                            <th className="px-3 py-2 text-right">Machine Hrs</th>
                            <th className="px-3 py-2 text-right">Efficiency %</th>
                            <th className="px-3 py-2 text-right pr-4">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {filteredDrilldownLines.map((l: any) => (
                            <tr key={l.lineName} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                              <td className="px-3 py-2 font-bold font-mono text-sky-600 dark:text-sky-400">
                                {l.lineName}
                              </td>
                              <td className="px-3 py-2">
                                <Badge variant="outline" className="text-[10px] py-0 px-1 font-semibold">
                                  {l.unitCode}
                                </Badge>
                              </td>
                              <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                                {l.styles.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {l.styles.map((s: any, sIdx: number) => (
                                      <span
                                        key={sIdx}
                                        className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono"
                                        title={`${s.buyer} - ${s.styleRef} (${s.targetQty} pcs)`}
                                      >
                                        {s.buyer}: {s.styleRef} ({s.targetQty})
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">-</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                                {l.target.toLocaleString()}
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-purple-700 dark:text-purple-300">
                                {l.targetSah.toFixed(1)}
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-slate-500">
                                {l.clockHours.toFixed(0)}
                              </td>
                              <td
                                className={`px-3 py-2 text-right font-mono font-extrabold ${
                                  l.efficiency >= 80
                                    ? "text-emerald-600"
                                    : l.efficiency >= 70
                                    ? "text-sky-600"
                                    : "text-amber-600"
                                }`}
                              >
                                {l.efficiency}%
                              </td>
                              <td className="px-3 py-2 text-right pr-4">
                                <Link
                                  href={`/line/${encodeURIComponent(l.lineName)}`}
                                  className="text-[11px] font-bold text-sky-600 hover:underline"
                                >
                                  View Line →
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 dark:bg-slate-950 px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Data generated from Production ERP Sign-off Planning Engine
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDrilldownDate(null)}
                className="text-xs"
              >
                Close View
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
