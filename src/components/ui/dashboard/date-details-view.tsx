"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Layers,
  Factory,
  Search,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  Building2
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DateDetailsViewProps {
  initialDate?: string;
  onBack?: () => void;
  onSelectLine?: (lineName: string) => void;
}

export function DateDetailsView({ initialDate = "2026-10-01", onBack, onSelectLine }: DateDetailsViewProps) {
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [unitFilter, setUnitFilter] = useState<string>("ALL");
  const [buyerFilter, setBuyerFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Sync selectedDate with initialDate if prop changes
  useEffect(() => {
    if (initialDate && initialDate !== selectedDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate]);

  // Fetch Date Details
  const fetchDateData = async (dateStr: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics/date-details?date=${dateStr}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load date details.");
      }
      setData(json);
    } catch (err: any) {
      setError(err.message || "Error fetching date details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchDateData(selectedDate);
    }
  }, [selectedDate]);

  // Quick Date Navigation (< Prev Day, Next Day >)
  const changeDateByDays = (delta: number) => {
    const d = new Date(`${selectedDate}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + delta);
    // Keep within October 2026 if desired or format cleanly
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const newDateStr = `${yyyy}-${mm}-${dd}`;
    setSelectedDate(newDateStr);
  };

  // Extract distinct units & buyers for filter dropdowns
  const availableUnits = useMemo(() => {
    if (!data?.lines) return [];
    const set = new Set<string>();
    data.lines.forEach((l: any) => {
      if (l.unitCode) set.add(l.unitCode);
    });
    return Array.from(set).sort();
  }, [data]);

  const availableBuyers = useMemo(() => {
    if (!data?.lines) return [];
    const set = new Set<string>();
    data.lines.forEach((l: any) => {
      if (l.buyerName && l.buyerName !== "N/A" && l.buyerName !== "SQ Group") {
        set.add(l.buyerName);
      }
    });
    return Array.from(set).sort();
  }, [data]);

  // Filtered Lines
  const filteredLines = useMemo(() => {
    if (!data?.lines) return [];
    return data.lines.filter((line: any) => {
      // Unit filter
      if (unitFilter !== "ALL" && line.unitCode !== unitFilter) return false;

      // Buyer filter
      if (buyerFilter !== "ALL" && line.buyerName !== buyerFilter) return false;

      // Status filter
      if (statusFilter === "OVER" && line.achievementRate < 100) return false;
      if (statusFilter === "ON_TRACK" && (line.achievementRate < 80 || line.achievementRate >= 100)) return false;
      if (statusFilter === "UNDER" && line.achievementRate >= 80) return false;
      if (statusFilter === "ZERO" && line.actual > 0) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchLine = line.lineName.toLowerCase().includes(q);
        const matchBuyer = (line.buyerName || "").toLowerCase().includes(q);
        const matchStyle = (line.styleRef || "").toLowerCase().includes(q);
        const matchOc = (line.oc || "").toLowerCase().includes(q);
        if (!matchLine && !matchBuyer && !matchStyle && !matchOc) return false;
      }

      return true;
    });
  }, [data, unitFilter, buyerFilter, statusFilter, searchQuery]);

  // Recalculate summary metrics for filtered view
  const filteredSummary = useMemo(() => {
    const target = filteredLines.reduce((acc: number, l: any) => acc + l.target, 0);
    const actual = filteredLines.reduce((acc: number, l: any) => acc + l.actual, 0);
    const gap = target - actual;
    const targetSah = filteredLines.reduce((acc: number, l: any) => acc + (l.targetSah || 0), 0);
    const actualSah = filteredLines.reduce((acc: number, l: any) => acc + (l.actualSah || 0), 0);
    const clockHours = filteredLines.reduce((acc: number, l: any) => acc + (l.clockHours || 0), 0);
    const manpower = filteredLines.reduce((acc: number, l: any) => acc + (l.manpower || 0), 0);
    const efficiency = clockHours > 0 && actualSah > 0 ? Number(((actualSah / clockHours) * 100).toFixed(1)) : 0;
    const plannedEfficiency = clockHours > 0 && targetSah > 0 ? Number(((targetSah / clockHours) * 100).toFixed(1)) : 0;
    const achievementRate = target > 0 ? Number(((actual / target) * 100).toFixed(1)) : (actual > 0 ? 100 : 0);

    return {
      target,
      actual,
      gap,
      efficiency,
      plannedEfficiency,
      achievementRate,
      manpower,
      clockHours,
      activeLines: filteredLines.length
    };
  }, [filteredLines]);

  // Export Table as CSV
  const handleExportCSV = () => {
    if (!filteredLines || filteredLines.length === 0) return;
    const headers = [
      "Date",
      "Unit",
      "Line",
      "Buyer",
      "Style",
      "OC",
      "SMV",
      "Manpower",
      "Target Qty",
      "Actual Qty",
      "Gap",
      "Achievement Rate (%)",
      "Efficiency (%)",
      "Actual SAH",
      "Clock Hours"
    ];

    const csvRows = [headers.join(",")];
    filteredLines.forEach((l: any) => {
      const row = [
        selectedDate,
        `"${l.unitCode}"`,
        `"${l.lineName}"`,
        `"${l.buyerName || ''}"`,
        `"${l.styleRef || ''}"`,
        `"${l.oc || ''}"`,
        l.smv || 0,
        l.manpower || 0,
        l.target,
        l.actual,
        l.gap,
        l.achievementRate,
        l.efficiency,
        l.actualSah,
        l.clockHours
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Production_Report_${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formattedDisplayDate = useMemo(() => {
    try {
      const d = new Date(`${selectedDate}T00:00:00Z`);
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC"
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Mobile Top Row: Back button & Date badge */}
        <div className="flex md:hidden items-center justify-between w-full">
          {onBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="h-8 px-2.5 gap-1.5 text-xs text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-100 font-semibold"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </Button>
          )}
          <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200 font-mono font-bold px-2 py-0.5 ml-auto">
            {selectedDate}
          </Badge>
        </div>

        {/* Title & Subtitle */}
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="hidden md:inline-flex h-9 px-3 gap-1.5 text-slate-700 hover:text-slate-900 border-slate-300 hover:bg-slate-100 font-semibold shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <h1 className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Daily Production Details
              </h1>
              <Badge variant="outline" className="hidden md:inline-flex text-xs bg-indigo-50 text-indigo-700 border-indigo-200 font-mono font-bold">
                {selectedDate}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {formattedDisplayDate} • Unit & Line-wise Planned vs Floor Actual Output
            </p>
          </div>
        </div>

        {/* Date Selector & Controls */}
        <div className="flex items-center justify-between sm:justify-start gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 w-full sm:w-auto">
          {/* Quick Prev / Next Date Buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
            <button
              onClick={() => changeDateByDays(-1)}
              title="Previous Day"
              className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Date Input */}
            <div className="relative px-1.5 flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
                className="bg-transparent border-none text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[115px]"
              />
            </div>

            <button
              onClick={() => changeDateByDays(1)}
              title="Next Day"
              className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <Button
            size="sm"
            onClick={handleExportCSV}
            className="h-8.5 gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs shrink-0 ml-auto sm:ml-0"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Export CSV</span>
            <span className="xs:hidden">CSV</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[350px] flex-col items-center justify-center space-y-3 bg-white rounded-2xl border border-slate-200 p-8">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-600">
            Loading production data for {selectedDate}...
          </p>
        </div>
      ) : error ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center space-y-3 bg-rose-50/50 rounded-2xl border border-rose-200 p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-rose-600" />
          <h3 className="text-base font-bold text-rose-900">Error Loading Date Breakdown</h3>
          <p className="text-xs text-rose-700 max-w-md">{error}</p>
          <Button size="sm" onClick={() => fetchDateData(selectedDate)} className="mt-2 bg-rose-600 hover:bg-rose-700 text-white">
            Retry Loading
          </Button>
        </div>
      ) : (
        <>
          {/* Top 5 KPI Summary Cards for Selected Date */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Planned Target */}
            <Card className="border-slate-200 bg-white shadow-xs p-4 rounded-xl">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Planned Target</span>
                <span className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
                  <Clock className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {filteredSummary.target.toLocaleString()} <span className="text-xs font-medium text-slate-500 font-sans">Pcs</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Plan Eff: <strong className="text-indigo-600 font-mono">{filteredSummary.plannedEfficiency}%</strong>
              </div>
            </Card>

            {/* Floor Actual Output */}
            <Card className="border-emerald-200 bg-emerald-50/40 shadow-xs p-4 rounded-xl">
              <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
                <span>Floor Actual</span>
                <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                  <Factory className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-black text-emerald-900 tracking-tight">
                {filteredSummary.actual.toLocaleString()} <span className="text-xs font-medium text-emerald-700 font-sans">Pcs</span>
              </div>
              <div className="mt-1 text-[11px] text-emerald-700 font-semibold">
                {filteredSummary.achievementRate}% Target Achieved
              </div>
            </Card>

            {/* Gap / Variance */}
            <Card className={`border shadow-xs p-4 rounded-xl ${
              filteredSummary.gap <= 0
                ? "border-emerald-200 bg-emerald-50/20"
                : "border-rose-200 bg-rose-50/20"
            }`}>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className={filteredSummary.gap <= 0 ? "text-emerald-700" : "text-rose-700"}>
                  Daily Variance
                </span>
                <span className={`p-1.5 rounded-lg ${
                  filteredSummary.gap <= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                }`}>
                  {filteredSummary.gap <= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                </span>
              </div>
              <div className={`mt-2 text-xl sm:text-2xl font-black tracking-tight ${
                filteredSummary.gap <= 0 ? "text-emerald-700" : "text-rose-700"
              }`}>
                {filteredSummary.gap <= 0 ? `+${Math.abs(filteredSummary.gap).toLocaleString()}` : `-${filteredSummary.gap.toLocaleString()}`}{" "}
                <span className="text-xs font-medium font-sans">Pcs</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                {filteredSummary.gap <= 0 ? "🎉 Surplus Output" : "⚠️ Shortfall to Target"}
              </div>
            </Card>

            {/* Actual Efficiency */}
            <Card className="border-indigo-200 bg-indigo-50/30 shadow-xs p-4 rounded-xl">
              <div className="flex items-center justify-between text-indigo-700 text-xs font-semibold">
                <span>Actual Efficiency</span>
                <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                  <TrendingUp className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-black text-indigo-900 tracking-tight">
                {filteredSummary.efficiency}%
              </div>
              <div className="mt-1 text-[11px] text-indigo-700 font-medium">
                Benchmark: <strong className="font-mono">{filteredSummary.plannedEfficiency}%</strong> Plan
              </div>
            </Card>

            {/* Active Lines & Manpower */}
            <Card className="border-slate-200 bg-white shadow-xs p-4 rounded-xl col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Capacity & Staff</span>
                <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                  <Users className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {filteredSummary.activeLines} <span className="text-xs font-medium text-slate-500 font-sans">Lines</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                <strong className="text-slate-800 font-mono">{filteredSummary.manpower.toLocaleString()}</strong> Manpower Deployed
              </div>
            </Card>
          </div>

          {/* Unit Comparison Cards (Interactive breakdown) */}
          {data?.unitBreakdown && data.unitBreakdown.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Unit-Wise Performance Comparison ({selectedDate})</span>
                </h3>
                <span className="text-[11px] text-slate-400">Click a unit card to isolate</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {data.unitBreakdown.map((unit: any) => {
                  const isSelected = unitFilter === unit.unitCode;
                  const ach = unit.target > 0 ? Math.round((unit.actual / unit.target) * 100) : 0;
                  return (
                    <div
                      key={unit.unitCode}
                      onClick={() => setUnitFilter(isSelected ? "ALL" : unit.unitCode)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400"
                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-900 shadow-2xs"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-black ${isSelected ? "text-white" : "text-slate-900"}`}>
                          {unit.unitCode}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1 py-0 ${
                            isSelected
                              ? "bg-white/20 text-white border-white/40"
                              : "bg-indigo-50 text-indigo-700 border-indigo-200"
                          }`}
                        >
                          {unit.efficiency}% Eff
                        </Badge>
                      </div>

                      <div className="mt-2 space-y-0.5 text-[11px]">
                        <div className="flex justify-between">
                          <span className={isSelected ? "text-indigo-200" : "text-slate-500"}>Actual:</span>
                          <span className="font-bold font-mono">{(unit.actual / 1000).toFixed(1)}k</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={isSelected ? "text-indigo-200" : "text-slate-500"}>Target:</span>
                          <span className="font-mono">{(unit.target / 1000).toFixed(1)}k</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className={`mt-2 h-1.5 w-full rounded-full overflow-hidden ${isSelected ? "bg-indigo-900/50" : "bg-slate-100"}`}>
                        <div
                          className={`h-full rounded-full ${
                            ach >= 100 ? (isSelected ? "bg-emerald-300" : "bg-emerald-500") : (isSelected ? "bg-amber-300" : "bg-indigo-500")
                          }`}
                          style={{ width: `${Math.min(100, ach)}%` }}
                        />
                      </div>
                      <div className="mt-1 text-[9px] text-right font-mono font-semibold">
                        {ach}% Achieved
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interactive Filter Bar */}
          <Card className="border-slate-200 bg-white shadow-xs p-3 sm:p-4 rounded-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3">
              {/* Search Box */}
              <div className="relative w-full lg:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search Line, Style, Buyer, or OC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-slate-50 border-slate-200 focus:bg-white w-full"
                />
              </div>

              {/* Filter Controls */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:items-center gap-2 text-xs w-full lg:w-auto">
                {/* Unit Filter */}
                <div className="flex items-center gap-1.5 w-full">
                  <select
                    value={unitFilter}
                    onChange={(e) => setUnitFilter(e.target.value)}
                    aria-label="Filter by Unit"
                    className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-800 font-medium focus:bg-white focus:outline-none"
                  >
                    <option value="ALL">All Units ({availableUnits.length})</option>
                    {availableUnits.map((u) => (
                      <option key={u} value={u}>Unit: {u}</option>
                    ))}
                  </select>
                </div>

                {/* Buyer Filter */}
                {availableBuyers.length > 0 && (
                  <div className="flex items-center gap-1.5 w-full">
                    <select
                      value={buyerFilter}
                      onChange={(e) => setBuyerFilter(e.target.value)}
                      aria-label="Filter by Buyer"
                      className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-800 font-medium focus:bg-white focus:outline-none"
                    >
                      <option value="ALL">All Buyers ({availableBuyers.length})</option>
                      {availableBuyers.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Status Filter */}
                <div className="flex items-center gap-1.5 w-full">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    aria-label="Filter by Status"
                    className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-800 font-medium focus:bg-white focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="OVER">Over (≥100%)</option>
                    <option value="ON_TRACK">On Track (80-99%)</option>
                    <option value="UNDER">Under (&lt;80%)</option>
                    <option value="ZERO">Zero (0 Pcs)</option>
                  </select>
                </div>

                {/* Reset Filters */}
                {(unitFilter !== "ALL" || buyerFilter !== "ALL" || statusFilter !== "ALL" || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUnitFilter("ALL");
                      setBuyerFilter("ALL");
                      setStatusFilter("ALL");
                      setSearchQuery("");
                    }}
                    className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 col-span-2 sm:col-span-1 lg:w-auto"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Line-by-Line Comprehensive Production Matrix Table */}
          <Card className="border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md rounded-2xl overflow-hidden ring-1 ring-slate-100 dark:ring-slate-800">
            <CardHeader className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-900/50 flex flex-row items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5 tracking-tight">
                  <div className="h-8 w-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                    <Layers className="h-4 w-4" />
                  </div>
                  <span>Line-Level Breakdown</span>
                  <Badge className="bg-indigo-500/20 text-indigo-200 border-indigo-400/30 font-mono text-xs px-2 py-0.5">
                    {filteredLines.length} Lines
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-indigo-200/80 mt-1 flex items-center gap-1.5">
                  <span>Comparison of Planned Target vs Actual Floor Output on</span>
                  <span className="font-mono font-semibold text-white bg-white/10 px-1.5 py-0.5 rounded text-[11px]">{selectedDate}</span>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-indigo-200 font-mono bg-indigo-900/60 border border-indigo-700/50 px-3 py-1 rounded-lg">
                  Showing: <strong className="text-white">{filteredLines.length}</strong> / {data?.lines?.length || 0}
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[650px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-20 bg-slate-900 text-slate-200 text-[11px] uppercase tracking-wider font-bold shadow-sm">
                    <tr className="border-b border-slate-700 divide-x divide-slate-800">
                      <th className="py-3 px-3.5 text-center w-16 bg-slate-900">Unit</th>
                      <th className="py-3 px-4 min-w-[130px] bg-slate-900">Line Name</th>
                      <th className="py-3 px-4 min-w-[180px] bg-slate-900">Buyer & Style</th>
                      <th className="py-3 px-3 text-center min-w-[100px] bg-slate-900">OC / PO</th>
                      <th className="py-3 px-3 text-center w-16 bg-slate-900">SMV</th>
                      <th className="py-3 px-3 text-center w-14 bg-slate-900">MO</th>
                      <th className="py-3 px-4 text-right min-w-[105px] bg-slate-900 text-indigo-200">Plan Target</th>
                      <th className="py-3 px-4 text-right min-w-[110px] bg-slate-900 text-emerald-300">Actual Output</th>
                      <th className="py-3 px-3 text-right min-w-[95px] bg-slate-900">Variance</th>
                      <th className="py-3 px-3 text-center min-w-[100px] bg-slate-900">Achieved</th>
                      <th className="py-3 px-3 text-center min-w-[90px] bg-slate-900">Efficiency</th>
                      <th className="py-3 px-3 text-center min-w-[100px] bg-slate-900">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                    {filteredLines.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="py-16 text-center text-slate-400 bg-slate-50/50">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Layers className="h-8 w-8 text-slate-300" />
                            <p className="text-sm font-semibold">No production lines match the selected filters for {selectedDate}.</p>
                            <p className="text-xs text-slate-400">Try changing unit, buyer, or status filters above.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredLines.map((line: any, idx: number) => {
                        const isSurplus = line.gap <= 0;
                        const ach = line.achievementRate;
                        const isHigh = ach >= 100;
                        const isGood = ach >= 80 && ach < 100;
                        const isZero = line.actual === 0;

                        return (
                          <tr
                            key={`${line.unitCode}-${line.lineName}-${idx}`}
                            onClick={() => onSelectLine?.(line.lineName)}
                            className={`group transition-colors cursor-pointer border-b border-slate-100 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30 ${
                              idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-900/50"
                            }`}
                          >
                            {/* Unit */}
                            <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800/80">
                              <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-mono font-bold">
                                {line.unitCode}
                              </span>
                            </td>

                            {/* Line Name */}
                            <td className="py-3 px-4 border-r border-slate-100 dark:border-slate-800/80">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 text-xs">
                                  {line.lineName}
                                </span>
                                <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500 shrink-0" />
                              </div>
                            </td>

                            {/* Buyer & Style */}
                            <td className="py-3 px-4 border-r border-slate-100 dark:border-slate-800/80">
                              <div className="font-bold text-slate-900 dark:text-slate-100 text-[11px] truncate max-w-[170px]" title={line.styleRef}>
                                {line.styleRef || "—"}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[170px] mt-0.5" title={line.buyerName}>
                                {line.buyerName || "—"}
                              </div>
                            </td>

                            {/* OC / PO */}
                            <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800/80">
                              <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 truncate max-w-[90px] inline-block" title={line.oc}>
                                {line.oc || "—"}
                              </span>
                            </td>

                            {/* SMV */}
                            <td className="py-3 px-3 text-center font-mono text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800/80">
                              {line.smv ? Number(line.smv).toFixed(2) : "—"}
                            </td>

                            {/* Manpower */}
                            <td className="py-3 px-3 text-center font-mono text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800/80">
                              {line.manpower || 25}
                            </td>

                            {/* Plan Target */}
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/30">
                              {line.target ? line.target.toLocaleString() : "—"}
                            </td>

                            {/* Actual Output */}
                            <td className="py-3 px-4 text-right font-mono font-bold border-r border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/30">
                              {line.actual > 0 ? (
                                <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold">
                                  {line.actual.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-600 font-medium">0</span>
                              )}
                            </td>

                            {/* Variance Gap */}
                            <td className="py-3 px-3 text-right font-mono font-bold border-r border-slate-100 dark:border-slate-800/80">
                              {line.target === 0 && line.actual === 0 ? (
                                <span className="text-slate-400">—</span>
                              ) : isSurplus ? (
                                <span className="text-emerald-600 dark:text-emerald-400 text-[11px] bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                                  +{Math.abs(line.gap).toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-rose-600 dark:text-rose-400 text-[11px] bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded">
                                  -{line.gap.toLocaleString()}
                                </span>
                              )}
                            </td>

                            {/* Achieved % */}
                            <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800/80">
                              <div className="flex flex-col items-center gap-1">
                                <span className={`font-mono font-bold text-xs ${
                                  isHigh ? "text-emerald-700 dark:text-emerald-400" : isGood ? "text-indigo-700 dark:text-indigo-400" : "text-amber-700 dark:text-amber-400"
                                }`}>
                                  {ach}%
                                </span>
                                <div className="w-14 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      isHigh ? "bg-emerald-500" : isGood ? "bg-indigo-500" : "bg-amber-500"
                                    }`}
                                    style={{ width: `${Math.min(100, ach)}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Efficiency % */}
                            <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800/80">
                              <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[11px] border ${
                                line.efficiency >= 70
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                                  : line.efficiency >= 55
                                  ? "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800"
                                  : line.efficiency > 0
                                  ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                                  : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                              }`}>
                                {line.efficiency > 0 ? `${line.efficiency}%` : "—"}
                              </span>
                            </td>

                            {/* Status Badge */}
                            <td className="py-3 px-3 text-center">
                              {isHigh ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Exceeded
                                </span>
                              ) : isGood ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 px-2 py-0.5 rounded-full">
                                  On Track
                                </span>
                              ) : isZero ? (
                                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                  No Run
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 px-2 py-0.5 rounded-full">
                                  <AlertTriangle className="h-3 w-3" />
                                  Low Output
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
