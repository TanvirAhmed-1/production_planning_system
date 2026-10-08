"use client";

import React from "react";
import { RotateCcw, CornerDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { cn } from "@/lib/utils";

export interface FilterState {
  batchId?: string;
  cluster?: string;
  month?: string;
  unitCode: string;
  lineName: string;
  buyerName: string;
  season: string;
  orderStatus: string;
  styleRef: string;
  startDate: string;
  endDate: string;
  search?: string;
}

export interface ActivePlanInfo {
  id: string;
  fileName: string;
  month?: string;
  batchType?: string;
  linkedActuals?: {
    id: string;
    fileName: string;
    importedRows?: number;
    createdAt?: string;
    summary?: any;
  }[];
}

interface GlobalFilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  filterOptions: {
    clusters?: { label: string; value: string }[];
    units: { label: string; value: string; cluster?: string }[];
    lines: { label: string; value: string; unit: string; cluster?: string }[];
    buyers: { label: string; value: string }[];
    seasons: { label: string; value: string }[];
    months?: { label: string; value: string }[];
    batches?: { label: string; value: string; month?: string; fileName?: string; batchType?: string }[];
    planBatches?: { label: string; value: string; month?: string; fileName?: string; actualCount?: number }[];
    actualBatches?: { label: string; value: string; month?: string; fileName?: string }[];
  };
  importHistory?: any[];
  activePlan?: ActivePlanInfo;
  onApply?: () => void;
  onReset?: () => void;
  onOpenUploadModal?: () => void;
}

export function GlobalFilterBar({
  filters,
  setFilters,
  filterOptions,
  importHistory = [],
  activePlan,
  onApply,
  onReset,
  onOpenUploadModal
}: GlobalFilterBarProps) {
  const filteredUnits = React.useMemo(() => {
    if (!filters.cluster || filters.cluster === "ALL") {
      return filterOptions.units;
    }
    return filterOptions.units.filter(u => !u.cluster || u.cluster === filters.cluster);
  }, [filters.cluster, filterOptions.units]);

  const filteredLines = React.useMemo(() => {
    let list = filterOptions.lines;
    if (filters.cluster && filters.cluster !== "ALL") {
      list = list.filter(l => !l.cluster || l.cluster === filters.cluster);
    }
    if (filters.unitCode && filters.unitCode !== "ALL") {
      list = list.filter(l => l.unit === filters.unitCode);
    }
    return list;
  }, [filters.cluster, filters.unitCode, filterOptions.lines]);

  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (filters.batchId && filters.batchId !== "ALL") count++;
    if (filters.cluster && filters.cluster !== "ALL") count++;
    if (filters.month && filters.month !== "ALL") count++;
    if (filters.unitCode && filters.unitCode !== "ALL") count++;
    if (filters.lineName && filters.lineName !== "ALL") count++;
    if (filters.buyerName && filters.buyerName !== "ALL") count++;
    if (filters.season && filters.season !== "ALL") count++;
    if (filters.orderStatus && filters.orderStatus !== "ALL") count++;
    if (filters.styleRef) count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    return count;
  }, [filters]);

  const clearFilter = (key: keyof FilterState, defaultVal: string = "ALL") => {
    setFilters(prev => ({ ...prev, [key]: defaultVal }));
  };

  const availablePlans = React.useMemo(() => {
    if (filterOptions.planBatches && filterOptions.planBatches.length > 0) {
      return filterOptions.planBatches;
    }
    if (filterOptions.batches && filterOptions.batches.length > 0) {
      return filterOptions.batches.filter(b => b.batchType !== "ACTUAL");
    }
    return [];
  }, [filterOptions.planBatches, filterOptions.batches]);

  const handleResetAll = () => {
    const defaultPlan = availablePlans.length > 0 ? availablePlans[0] : null;
    setFilters({
      batchId: defaultPlan ? defaultPlan.value : "ALL",
      cluster: "ALL",
      month: defaultPlan?.month || "ALL",
      unitCode: "ALL",
      lineName: "ALL",
      buyerName: "ALL",
      season: "ALL",
      orderStatus: "ALL",
      styleRef: "",
      startDate: "",
      endDate: "",
      search: ""
    });
    onReset?.();
  };

  // Resolve current active production plan details & attached actual floor data
  const currentPlan = React.useMemo(() => {
    if (activePlan?.fileName) {
      return {
        fileName: activePlan.fileName,
        month: activePlan.month,
        linkedActuals: activePlan.linkedActuals || []
      };
    }

    // Lookup within importHistory for complete parent-child linking
    if (importHistory && importHistory.length > 0) {
      const selectedId = filters.batchId && filters.batchId !== "ALL" ? filters.batchId : null;
      let matched = selectedId ? importHistory.find((b: any) => b.id === selectedId) : null;
      if (!matched) {
        matched = importHistory.find((b: any) => b.batchType !== "ACTUAL") || importHistory[0];
      }

      if (matched) {
        if (matched.batchType === "ACTUAL") {
          return {
            fileName: matched.parentPlan?.fileName || "Production Plan",
            month: matched.month,
            linkedActuals: [
              {
                id: matched.id,
                fileName: matched.fileName,
                importedRows: matched.importedRows || matched._count?.actualRecords || 0
              }
            ]
          };
        } else {
          return {
            fileName: matched.fileName,
            month: matched.month,
            linkedActuals: matched.actualBatches || []
          };
        }
      }
    }

    const found = availablePlans.find(b => b.value === filters.batchId);
    if (found) {
      return {
        fileName: found.fileName || found.label,
        month: found.month,
        linkedActuals: []
      };
    }
    return null;
  }, [activePlan, importHistory, availablePlans, filters.batchId]);

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white px-3 py-2 sm:py-1.5 shadow-2xs transition-all dark:border-slate-800 dark:bg-slate-900/90">
      {/* ========================================================= */}
      {/* 1. DESKTOP VIEW (md and above) - EXACT ORIGINAL DESIGN    */}
      {/* ========================================================= */}
      <div className="hidden md:flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          {/* GLOBAL FILTERS */}
          <Badge
            variant="outline"
            className="bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800 text-[10px] font-bold px-1.5 py-0.5 uppercase shrink-0"
          >
            Global
          </Badge>

          {/* Production Plan Selector */}
          {availablePlans.length > 0 && (
            <SearchableSelect
              label="Plan:"
              placeholder="All Production Plans"
              searchPlaceholder="Search production plan..."
              allOptionLabel="All Production Plans"
              allOptionValue="ALL"
              value={filters.batchId || "ALL"}
              options={availablePlans.map(b => ({
                label: b.label,
                value: b.value,
                badge: b.month
              }))}
              onChange={(bId) => {
                const selectedPlan = availablePlans.find(b => b.value === bId);
                setFilters(prev => ({
                  ...prev,
                  batchId: bId,
                  unitCode: "ALL",
                  lineName: "ALL",
                  buyerName: "ALL",
                  season: "ALL",
                  month: selectedPlan?.month || prev.month || "ALL"
                }));
              }}
              className="w-56 sm:w-64 max-w-[280px]"
              triggerClassName="h-7 text-xs py-0"
              dropdownWidth="w-80 sm:w-96"
            />
          )}

          {/* Cluster Selector */}
          <SearchableSelect
            label="Cluster:"
            placeholder="All Clusters"
            searchPlaceholder="Search cluster..."
            allOptionLabel="All Clusters"
            allOptionValue="ALL"
            value={filters.cluster || "ALL"}
            options={filterOptions.clusters || [
              { label: "All Clusters", value: "ALL" },
              { label: "B1 Cluster", value: "B1" },
              { label: "B2 Cluster", value: "B2" }
            ]}
            onChange={(val) => {
              setFilters(prev => ({ ...prev, cluster: val, unitCode: "ALL", lineName: "ALL" }));
            }}
            className="w-32 sm:w-36"
            triggerClassName="h-7 text-xs py-0"
            dropdownWidth="w-40"
          />

          {/* Vertical Separator */}
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

          {/* INDIVIDUAL FILTERS */}
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800 text-[10px] font-bold px-1.5 py-0.5 uppercase shrink-0"
          >
            Individual
          </Badge>

          {/* Unit selector */}
          <SearchableSelect
            label="Unit:"
            placeholder="All Units"
            searchPlaceholder="Search unit..."
            allOptionLabel="All Units"
            allOptionValue="ALL"
            value={filters.unitCode || "ALL"}
            options={filteredUnits.map(u => ({
              label: u.label,
              value: u.value
            }))}
            onChange={(val) => {
              setFilters(prev => ({ ...prev, unitCode: val, lineName: "ALL" }));
            }}
            className="w-32 sm:w-36"
            triggerClassName="h-7 text-xs py-0"
            dropdownWidth="w-48"
          />

          {/* Line selector */}
          <SearchableSelect
            label="Line:"
            placeholder="All Lines"
            searchPlaceholder="Search line..."
            allOptionLabel="All Lines"
            allOptionValue="ALL"
            value={filters.lineName || "ALL"}
            options={filteredLines.map(l => ({
              label: l.label,
              value: l.value,
              unit: l.unit
            }))}
            onChange={(val) => setFilters(prev => ({ ...prev, lineName: val }))}
            className="w-32 sm:w-36"
            triggerClassName="h-7 text-xs py-0"
            dropdownWidth="w-56"
          />
        </div>

        {/* Reset button at far right */}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetAll}
            className="h-6 text-[11px] text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40 gap-1 px-1.5 font-medium shrink-0 ml-auto"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </Button>
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. MOBILE VIEW (< md) - CLEAN, NATIVE-FEELING MOBILE UI   */}
      {/* ========================================================= */}
      <div className="flex md:hidden flex-col gap-2">
        {/* Mobile Header Row: Filter Labels & Reset Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className="bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800 text-[10px] font-bold px-2 py-0.5 uppercase"
            >
              Filters
            </Badge>
            {activeFiltersCount > 0 && (
              <span className="text-[11px] text-slate-500 font-medium">
                ({activeFiltersCount} Active)
              </span>
            )}
          </div>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetAll}
              className="h-6 text-[11px] text-rose-600 hover:bg-rose-50 px-2 gap-1 font-semibold"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filters</span>
            </Button>
          )}
        </div>

        {/* Mobile Plan Selector - Full Width */}
        {availablePlans.length > 0 && (
          <div className="w-full">
            <SearchableSelect
              label="Plan:"
              placeholder="All Production Plans"
              searchPlaceholder="Search plan..."
              allOptionLabel="All Production Plans"
              allOptionValue="ALL"
              value={filters.batchId || "ALL"}
              options={availablePlans.map(b => ({
                label: b.label,
                value: b.value,
                badge: b.month
              }))}
              onChange={(bId) => {
                const selectedPlan = availablePlans.find(b => b.value === bId);
                setFilters(prev => ({
                  ...prev,
                  batchId: bId,
                  unitCode: "ALL",
                  lineName: "ALL",
                  buyerName: "ALL",
                  season: "ALL",
                  month: selectedPlan?.month || prev.month || "ALL"
                }));
              }}
              className="w-full"
              triggerClassName="h-8 text-xs py-0 w-full"
              dropdownWidth="w-full"
            />
          </div>
        )}

        {/* Mobile Grid for Cluster, Unit, Line */}
        <div className="grid grid-cols-3 gap-1.5 w-full">
          {/* Cluster Selector */}
          <SearchableSelect
            label="Clust:"
            placeholder="All"
            searchPlaceholder="Search cluster..."
            allOptionLabel="All"
            allOptionValue="ALL"
            value={filters.cluster || "ALL"}
            options={filterOptions.clusters || [
              { label: "All", value: "ALL" },
              { label: "B1", value: "B1" },
              { label: "B2", value: "B2" }
            ]}
            onChange={(val) => {
              setFilters(prev => ({ ...prev, cluster: val, unitCode: "ALL", lineName: "ALL" }));
            }}
            className="w-full"
            triggerClassName="h-8 text-xs py-0 w-full px-2"
            dropdownWidth="w-48"
          />

          {/* Unit selector */}
          <SearchableSelect
            label="Unit:"
            placeholder="All"
            searchPlaceholder="Search unit..."
            allOptionLabel="All"
            allOptionValue="ALL"
            value={filters.unitCode || "ALL"}
            options={filteredUnits.map(u => ({
              label: u.label,
              value: u.value
            }))}
            onChange={(val) => {
              setFilters(prev => ({ ...prev, unitCode: val, lineName: "ALL" }));
            }}
            className="w-full"
            triggerClassName="h-8 text-xs py-0 w-full px-2"
            dropdownWidth="w-48"
          />

          {/* Line selector */}
          <SearchableSelect
            label="Line:"
            placeholder="All"
            searchPlaceholder="Search line..."
            allOptionLabel="All"
            allOptionValue="ALL"
            value={filters.lineName || "ALL"}
            options={filteredLines.map(l => ({
              label: l.label,
              value: l.value,
              unit: l.unit
            }))}
            onChange={(val) => setFilters(prev => ({ ...prev, lineName: val }))}
            className="w-full"
            triggerClassName="h-8 text-xs py-0 w-full px-2"
            dropdownWidth="w-48"
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. ACTIVE PLAN & ATTACHED ACTUAL STRIP (RESPONSIVE)       */}
      {/* ========================================================= */}
      {currentPlan && (
        <div className="mt-2 border-t border-slate-100 dark:border-slate-800/80 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
          {/* Production Plan Name */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 shrink-0">
              Plan:
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100 truncate min-w-0" title={currentPlan.fileName}>
              {currentPlan.fileName}
            </span>
            {currentPlan.month && (
              <Badge variant="outline" className="text-[9px] py-0 px-1.5 font-bold text-indigo-700 border-indigo-300 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 shrink-0">
                {currentPlan.month}
              </Badge>
            )}
          </div>

          {/* Linked Actual Production Tracker */}
          {currentPlan.linkedActuals && currentPlan.linkedActuals.length > 0 ? (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/70 dark:border-emerald-800/60 shrink-0 self-start sm:self-auto">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 shrink-0">
                Actual:
              </span>
              <span className="font-bold text-emerald-950 dark:text-emerald-200 truncate max-w-[200px] sm:max-w-[280px]" title={currentPlan.linkedActuals[0].fileName}>
                {currentPlan.linkedActuals[0].fileName}
              </span>
              {currentPlan.linkedActuals[0].importedRows && (
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-semibold">
                  ({currentPlan.linkedActuals[0].importedRows.toLocaleString()} recs)
                </span>
              )}
              <Badge className="bg-emerald-600 text-white text-[9px] py-0 px-1 font-bold shrink-0">
                Synced
              </Badge>
            </div>
          ) : (
            <div className="text-[10px] text-slate-400 italic">
              Awaiting actual floor output sync
            </div>
          )}
        </div>
      )}
    </div>
  );
}
