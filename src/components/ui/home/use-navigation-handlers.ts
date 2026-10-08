"use client";

import { useRouter } from "next/navigation";
import { FilterState } from "@/components/ui/dashboard/global-filter-bar";
import { initialFilters } from "./dashboard-query-helpers";
import { buildDashboardQueryParams } from "./dashboard-query-helpers";
import { invalidateApiCache } from "@/lib/api-cache";

interface UseNavigationHandlersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  selectedMonth: string;
  setActiveTab: (tab: string) => void;
  setSelectedDateForDetails: (date: string) => void;
  fetchDashboardData: (
    filters: FilterState,
    monthVal: string,
    forceFresh?: boolean
  ) => void;
  fetchFilterOptions: (
    batchId?: string,
    unitCode?: string,
    forceFresh?: boolean
  ) => void;
  fetchImportHistory: (forceFresh?: boolean) => void;
  setRefreshing: (val: boolean) => void;
}

export function useNavigationHandlers({
  filters,
  setFilters,
  selectedMonth,
  setActiveTab,
  setSelectedDateForDetails,
  fetchDashboardData,
  fetchFilterOptions,
  fetchImportHistory,
  setRefreshing,
}: UseNavigationHandlersProps) {
  const router = useRouter();

  const handleRefresh = () => {
    setRefreshing(true);
    invalidateApiCache();
    fetchDashboardData(filters, selectedMonth, true);
    fetchFilterOptions(filters.batchId, filters.unitCode, true);
    fetchImportHistory(true);
  };

  const handleResetFilters = () => {
    setFilters({
      ...initialFilters,
      batchId: filters.batchId,
      month: selectedMonth,
    });
  };

  const handleSelectBatch = (batchId: string, month?: string) => {
    setFilters((prev) => ({
      ...prev,
      batchId,
      unitCode: "ALL",
      lineName: "ALL",
      buyerName: "ALL",
      season: "ALL",
      month: month || prev.month || "ALL",
    }));
    setActiveTab("overview");
  };

  const handleExport = (type: string = "filtered") => {
    const params = buildDashboardQueryParams(filters, selectedMonth);
    params.append("type", type);
    window.open(`/api/excel/export?${params.toString()}`, "_blank");
  };

  const handleKPIClick = (kpiKey: string) => {
    if (kpiKey === "running-lines") {
      setActiveTab("line-performance");
    } else if (kpiKey === "total-buyers") {
      setActiveTab("buyer-performance");
    } else if (kpiKey === "total-orders") {
      setActiveTab("all-orders");
    } else if (kpiKey === "actual-production") {
      router.push("/actual-production");
    } else if (
      kpiKey === "planned-production" ||
      kpiKey === "target-achievement"
    ) {
      setActiveTab("target-vs-actual");
    }
  };

  const handleLineClick = (lineName: string) => {
    router.push(`/line/${encodeURIComponent(lineName)}`);
  };

  const handleUnitClick = (unitCode: string) => {
    setFilters((prev) => ({ ...prev, unitCode, lineName: "ALL" }));
  };

  const handleBuyerClick = (buyerName: string) => {
    setFilters((prev) => ({ ...prev, buyerName }));
  };

  const handleDateClick = (dateStr: string) => {
    setSelectedDateForDetails(dateStr);
    setActiveTab("date-details");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleImportSuccess = (result: any) => {
    invalidateApiCache();
    const newBatchId = result?.planBatchId || result?.batchId;
    const newMonth = result?.verification?.month;
    if (newBatchId) {
      setFilters((prev) => ({
        ...prev,
        batchId: newBatchId,
        unitCode: "ALL",
        lineName: "ALL",
        buyerName: "ALL",
        season: "ALL",
        month: newMonth || prev.month || "ALL",
      }));
      fetchFilterOptions(newBatchId, undefined, true);
    } else {
      fetchFilterOptions(filters.batchId, filters.unitCode, true);
    }
    fetchDashboardData(filters, selectedMonth, true);
    fetchImportHistory(true);
  };

  return {
    handleRefresh,
    handleResetFilters,
    handleSelectBatch,
    handleExport,
    handleKPIClick,
    handleLineClick,
    handleUnitClick,
    handleBuyerClick,
    handleDateClick,
    handleImportSuccess,
  };
}
