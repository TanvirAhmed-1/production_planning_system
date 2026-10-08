"use client";

import { useState, useEffect, useCallback } from "react";
import { FilterState } from "@/components/ui/dashboard/global-filter-bar";
import { useBatchManagement } from "./use-batch-management";
import { useNavigationHandlers } from "./use-navigation-handlers";
import {
  initialFilters,
  buildDashboardQueryParams,
} from "./dashboard-query-helpers";
import { fetchWithCache, invalidateApiCache } from "@/lib/api-cache";

export { initialFilters };

export function useDashboardData() {
  // Navigation & Date State
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedDateForDetails, setSelectedDateForDetails] =
    useState<string>("");

  // Filters State
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [initialPlanResolved, setInitialPlanResolved] =
    useState<boolean>(false);

  // Filter Dropdown Options
  const [filterOptions, setFilterOptions] = useState<{
    clusters?: { label: string; value: string }[];
    units: { label: string; value: string; cluster?: string }[];
    lines: { label: string; value: string; unit: string; cluster?: string }[];
    buyers: { label: string; value: string }[];
    seasons: { label: string; value: string }[];
    months: { label: string; value: string }[];
    batches: {
      label: string;
      value: string;
      month?: string;
      fileName?: string;
      batchType?: string;
    }[];
    planBatches?: {
      label: string;
      value: string;
      month?: string;
      fileName?: string;
      actualCount?: number;
    }[];
    actualBatches?: {
      label: string;
      value: string;
      month?: string;
      fileName?: string;
    }[];
  }>({
    clusters: [
      { label: "All Clusters", value: "ALL" },
      { label: "B1 Cluster", value: "B1" },
      { label: "B2 Cluster", value: "B2" },
    ],
    units: [],
    lines: [],
    buyers: [],
    seasons: [],
    months: [],
    batches: [],
    planBatches: [],
    actualBatches: [],
  });

  // Data Loading State
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [allLinePerformance, setAllLinePerformance] = useState<any[]>([]);

  // History State
  const [importHistory, setImportHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Fetch Filters
  const fetchFilterOptions = useCallback(
    async (batchId?: string, unitCode?: string, forceFresh: boolean = false) => {
      try {
        const params = new URLSearchParams();
        if (batchId && batchId !== "ALL") params.append("batchId", batchId);
        if (unitCode && unitCode !== "ALL") params.append("unitCode", unitCode);
        const data = await fetchWithCache(`/api/analytics/filters?${params.toString()}`, {
          forceFresh,
        });
        if (data) {
          setFilterOptions(data);

          if (data.months && data.months.length > 0) {
            setSelectedMonth((prev) => prev || data.months[0].value);
            setSelectedDateForDetails((prev) => prev || `${data.months[0].value}-01`);
          }

          setInitialPlanResolved((resolved) => {
            if (!resolved) {
              const latestPlan =
                data.planBatches?.[0] ||
                data.batches?.find((b: any) => b.batchType !== "ACTUAL");
              if (latestPlan) {
                setFilters((prev) => {
                  if (prev.batchId === "ALL" || !prev.batchId) {
                    return {
                      ...prev,
                      batchId: latestPlan.value,
                      month: latestPlan.month || prev.month || "ALL",
                    };
                  }
                  return prev;
                });
              }
              return true;
            }
            return resolved;
          });
        }
      } catch (err) {}
    },
    []
  );

  // Fetch Dashboard Analytics Data
  const fetchDashboardData = useCallback(
    async (
      currentFilters: FilterState,
      monthVal: string,
      forceFresh: boolean = false
    ) => {
      try {
        const params = buildDashboardQueryParams(currentFilters, monthVal);
        const data = await fetchWithCache(
          `/api/analytics/dashboard?${params.toString()}`,
          { forceFresh }
        );
        if (data) {
          setDashboardData(data);
          if (
            (!currentFilters.unitCode || currentFilters.unitCode === "ALL") &&
            (!currentFilters.lineName || currentFilters.lineName === "ALL")
          ) {
            if (data.linePerformance && data.linePerformance.length > 0) {
              setAllLinePerformance(data.linePerformance);
            }
          } else if (allLinePerformance.length === 0 && data.linePerformance) {
            setAllLinePerformance(data.linePerformance);
          }
        }
      } catch (err) {
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [allLinePerformance.length]
  );

  // Fetch Import History
  const fetchImportHistory = useCallback(
    async (forceFresh: boolean = false) => {
      setLoadingHistory(true);
      try {
        const data = await fetchWithCache("/api/excel/history", { forceFresh });
        if (data) {
          const batches = Array.isArray(data) ? data : (data.batches || []);
          setImportHistory(batches);
        }
      } catch (err) {
      } finally {
        setLoadingHistory(false);
      }
    },
    []
  );

  // Batch Management Sub-Hook
  const {
    isImportModalOpen,
    setIsImportModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    deleteModalState,
    setDeleteModalState,
    promptDeleteBatch,
    confirmDeleteBatch,
  } = useBatchManagement(async (deletedBatchId) => {
    invalidateApiCache();
    if (filters.batchId === deletedBatchId) {
      setFilters((prev) => ({ ...prev, batchId: "ALL" }));
    }
    await Promise.all([
      fetchImportHistory(true),
      fetchDashboardData({ ...filters, batchId: "ALL" }, selectedMonth, true),
      fetchFilterOptions("ALL", undefined, true),
    ]);
  });

  // Navigation and Filter Action Handlers Sub-Hook
  const {
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
  } = useNavigationHandlers({
    filters,
    setFilters,
    selectedMonth,
    setActiveTab,
    setSelectedDateForDetails,
    fetchDashboardData,
    fetchFilterOptions,
    fetchImportHistory,
    setRefreshing,
  });

  // Initial Load & Listeners
  useEffect(() => {
    fetchFilterOptions();
    fetchImportHistory();
  }, [fetchFilterOptions, fetchImportHistory]);

  useEffect(() => {
    if (initialPlanResolved) {
      fetchDashboardData(filters, selectedMonth);
    }
  }, [filters, selectedMonth, fetchDashboardData, initialPlanResolved]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) setActiveTab(hash);
    };
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return {
    activeTab,
    setActiveTab,
    sidebarOpen,
    setSidebarOpen,
    selectedMonth,
    setSelectedMonth,
    selectedDateForDetails,
    filters,
    setFilters,
    filterOptions,
    loading,
    refreshing,
    dashboardData,
    allLinePerformance,
    importHistory,
    loadingHistory,
    isImportModalOpen,
    setIsImportModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    deleteModalState,
    setDeleteModalState,
    handleRefresh,
    handleResetFilters,
    handleSelectBatch,
    promptDeleteBatch,
    confirmDeleteBatch,
    handleExport,
    handleKPIClick,
    handleLineClick,
    handleUnitClick,
    handleBuyerClick,
    handleDateClick,
    handleImportSuccess,
    fetchDashboardData,
    fetchImportHistory,
  };
}
