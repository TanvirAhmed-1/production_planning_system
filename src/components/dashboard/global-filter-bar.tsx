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
  activePlan?: ActivePlanInfo;
  onApply?: () => void;
  onReset?: () => void;
  onOpenUploadModal?: () => void;
}

export function GlobalFilterBar({
  filters,
  setFilters,
  filterOptions,
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

  // Resolve current active production plan details
  const currentPlan = React.useMemo(() => {
    if (activePlan?.fileName) {
      return {
        fileName: activePlan.fileName,
        month: activePlan.month,
        linkedActuals: activePlan.linkedActuals || []
      };
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
  }, [activePlan, availablePlans, filters.batchId]);

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 shadow-2xs transition-all dark:border-slate-800 dark:bg-slate-900/90">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
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
              { label: "B2 Cluster", value: "B2" },
              { label: "Styrax Cluster", value: "Styrax" }
            ]}
            onChange={(val) => {
              setFilters(prev => ({ ...prev, cluster: val, unitCode: "ALL", lineName: "ALL" }));
            }}
            className="w-32 sm:w-36"
            triggerClassName="h-7 text-xs py-0"
            dropdownWidth="w-40"
          />

          {/* Vertical Separator */}
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 shrink-0 hidden sm:block" />

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

      {/* Active Production Plan & Linked Floor Actual Tracker Strip (Single Row) */}
      {currentPlan && (
        <div className="mt-1.5 border-t border-slate-100 dark:border-slate-800/80 pt-1.5 flex flex-wrap items-center gap-2 text-xs">
          {/* Production Plan Name */}
          <div className="flex items-center gap-1.5 min-w-0 max-w-full sm:max-w-[48%]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0">
              Plan:
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate min-w-0" title={currentPlan.fileName}>
              {currentPlan.fileName}
            </span>
            {currentPlan.month && (
              <Badge variant="outline" className="text-[9px] py-0 px-1 font-semibold text-sky-700 border-sky-300 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-300 shrink-0">
                {currentPlan.month}
              </Badge>
            )}
          </div>

          {/* Linked Actual Production Tracker (on the same row) */}
          {currentPlan.linkedActuals && currentPlan.linkedActuals.length > 0 && (
            <div className="flex items-center gap-1.5 min-w-0 max-w-full sm:max-w-[50%] text-[11px] text-slate-600 dark:text-slate-400">
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline shrink-0">|</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 shrink-0">
                Actual:
              </span>
              <span className="font-medium text-emerald-700 dark:text-emerald-300 truncate min-w-0" title={currentPlan.linkedActuals[0].fileName}>
                {currentPlan.linkedActuals[0].fileName}
              </span>
              {currentPlan.linkedActuals[0].importedRows && (
                <span className="text-[10px] text-slate-400 shrink-0">
                  ({currentPlan.linkedActuals[0].importedRows.toLocaleString()} records)
                </span>
              )}
              <Badge variant="outline" className="text-[9px] py-0 px-1 font-medium text-emerald-700 border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 shrink-0">
                Floor Synced
              </Badge>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
