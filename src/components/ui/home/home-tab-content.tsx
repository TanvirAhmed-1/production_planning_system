"use client";

import { OverviewTab } from "@/components/ui/home/overview-tab";
import { ProductionTabs } from "@/components/ui/home/production-tabs";
import { BusinessTabs } from "@/components/ui/home/business-tabs";
import { ExcelManagementTab } from "@/components/ui/home/excel-management-tab";
import { SystemSettingsTab } from "@/components/ui/home/system-settings-tab";
import { UserManagement } from "@/components/ui/dashboard/user-management";

interface HomeTabContentProps {
  activeTab: string;
  dashboardData: any;
  allLinePerformance: any[];
  filters: any;
  selectedMonth: string;
  importHistory: any[];
  loadingHistory: boolean;
  onKPIClick: (kpiKey: string) => void;
  onLineClick: (lineName: string) => void;
  onUnitClick: (unitCode: string) => void;
  onBuyerClick: (buyerName: string) => void;
  onDateClick: (dateStr: string) => void;
  onNavigateTab: (tab: string) => void;
  onOpenSettingsModal: () => void;
  onOpenImportModal: () => void;
  onExport: (type: string) => void;
  onRefreshDashboard: () => void;
  onRefreshHistory: () => void;
  onSelectBatch: (batchId: string, month?: string) => void;
  onPromptDeleteBatch: (
    batchId: string,
    fileName: string,
    batchType?: string,
    childCount?: number,
    parentPlanName?: string
  ) => void;
}

export function HomeTabContent({
  activeTab,
  dashboardData,
  allLinePerformance,
  filters,
  selectedMonth,
  importHistory,
  loadingHistory,
  onKPIClick,
  onLineClick,
  onUnitClick,
  onBuyerClick,
  onDateClick,
  onNavigateTab,
  onOpenSettingsModal,
  onOpenImportModal,
  onExport,
  onRefreshDashboard,
  onRefreshHistory,
  onSelectBatch,
  onPromptDeleteBatch,
}: HomeTabContentProps) {
  if (!dashboardData) return null;

  // Overview Tab
  if (activeTab === "overview") {
    return (
      <OverviewTab
        dashboardData={dashboardData}
        allLinePerformance={allLinePerformance}
        filters={filters}
        onKPIClick={onKPIClick}
        onLineClick={onLineClick}
        onUnitClick={onUnitClick}
        onBuyerClick={onBuyerClick}
        onDateClick={onDateClick}
        onNavigateTab={onNavigateTab}
        onOpenSettings={onOpenSettingsModal}
        onExport={onExport}
      />
    );
  }

  // Production-focused Tabs
  const productionTabKeys = [
    "unit-editor",
    "data-editor",
    "excel-master",
    "daily-report",
    "target-vs-actual",
    "production-plan",
    "production-calendar",
    "line-performance",
    "efficiency-analysis",
    "run-lines",
  ];
  if (productionTabKeys.includes(activeTab)) {
    return (
      <ProductionTabs
        activeTab={activeTab}
        dashboardData={dashboardData}
        allLinePerformance={allLinePerformance}
        filters={filters}
        onKPIClick={onKPIClick}
        onLineClick={onLineClick}
        onDateClick={onDateClick}
        onNavigateTab={onNavigateTab}
        onExport={onExport}
        onRefreshDashboard={onRefreshDashboard}
      />
    );
  }

  // Business & Orders Analysis Tabs
  const businessTabKeys = [
    "unit-performance",
    "buyer-performance",
    "manpower-analysis",
    "all-orders",
    "order-performance",
    "delayed-orders",
    "production-gap",
    "attention-required",
    "signoff-summary",
    "management-summary",
    "executive-summary",
    "unit-report",
  ];
  if (businessTabKeys.includes(activeTab)) {
    return (
      <BusinessTabs
        activeTab={activeTab}
        dashboardData={dashboardData}
        filters={filters}
        onLineClick={onLineClick}
        onUnitClick={onUnitClick}
        onBuyerClick={onBuyerClick}
        onNavigateTab={onNavigateTab}
        onOpenSettingsModal={onOpenSettingsModal}
        onExport={onExport}
      />
    );
  }

  // Excel Ingestion & Management Tab
  if (
    activeTab === "excel-import" ||
    activeTab === "import-history" ||
    activeTab === "data-validation"
  ) {
    return (
      <ExcelManagementTab
        importHistory={importHistory}
        loadingHistory={loadingHistory}
        activeBatchId={filters.batchId}
        onRefreshHistory={onRefreshHistory}
        onOpenImportModal={onOpenImportModal}
        onSelectBatch={onSelectBatch}
        onPromptDeleteBatch={onPromptDeleteBatch}
      />
    );
  }

  // User Management Tab
  if (activeTab === "user-management") {
    return (
      <div className="space-y-6">
        <UserManagement />
      </div>
    );
  }

  // Settings Tab
  if (activeTab === "settings") {
    return (
      <SystemSettingsTab
        lowThreshold={dashboardData.alerts?.lowThreshold || 60}
        onOpenSettingsModal={onOpenSettingsModal}
      />
    );
  }

  return null;
}
