"use client";

import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { GlobalFilterBar } from "@/components/ui/dashboard/global-filter-bar";
import { AboutUs } from "@/components/ui/dashboard/about-us";
import { UserGuide } from "@/components/ui/dashboard/user-guide";
import { DateDetailsView } from "@/components/ui/dashboard/date-details-view";
import { ExcelImportModal } from "@/components/ui/modals/excel-import-modal";
import { SettingsModal } from "@/components/ui/modals/settings-modal";
import { DeleteConfirmationModal } from "@/components/shared/delete-confirmation-modal";
import {
  useDashboardData,
  HomeTabContent,
  EmptyDataState,
} from "@/components/ui/home";
import { RefreshCw } from "lucide-react";

export default function DashboardPage() {
  const {
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
  } = useDashboardData();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50/50">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab: string) => {
          setActiveTab(tab);
          window.location.hash = tab;
        }}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        alertCount={dashboardData?.alerts?.lowPerformingLinesCount || 0}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          activeTab={activeTab}
          onOpenSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenImportModal={() => setIsImportModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onExport={() => handleExport("filtered")}
          onRefresh={handleRefresh}
          isRefreshing={refreshing}
          alertCount={dashboardData?.alerts?.lowPerformingLinesCount || 0}
          selectedMonth={selectedMonth}
          onMonthChange={(m: string) => setSelectedMonth(m)}
          monthOptions={filterOptions?.months || []}
        />

        {/* Global Filter Bar */}
        <GlobalFilterBar
          filters={filters}
          setFilters={setFilters}
          filterOptions={filterOptions}
          importHistory={importHistory}
          onReset={handleResetFilters}
          onOpenUploadModal={() => setIsImportModalOpen(true)}
        />

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-2.5 sm:p-4 md:p-6 lg:p-8">
          {activeTab === "date-details" ? (
            <DateDetailsView
              initialDate={selectedDateForDetails}
              onBack={() => setActiveTab("daily-report")}
              onSelectLine={handleLineClick}
            />
          ) : activeTab === "about-us" ? (
            <AboutUs />
          ) : activeTab === "user-guide" ? (
            <UserGuide onNavigateTab={(tab) => setActiveTab(tab)} />
          ) : loading ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center space-y-3">
              <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="text-sm font-medium text-slate-500">
                Loading production analytics from database...
              </p>
            </div>
          ) : dashboardData ? (
            <HomeTabContent
              activeTab={activeTab}
              dashboardData={dashboardData}
              allLinePerformance={allLinePerformance}
              filters={filters}
              selectedMonth={selectedMonth}
              importHistory={importHistory}
              loadingHistory={loadingHistory}
              onKPIClick={handleKPIClick}
              onLineClick={handleLineClick}
              onUnitClick={handleUnitClick}
              onBuyerClick={handleBuyerClick}
              onDateClick={handleDateClick}
              onNavigateTab={(tab) => {
                setActiveTab(tab);
                window.location.hash = tab;
              }}
              onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              onExport={handleExport}
              onRefreshDashboard={() =>
                fetchDashboardData(filters, selectedMonth)
              }
              onRefreshHistory={fetchImportHistory}
              onSelectBatch={handleSelectBatch}
              onPromptDeleteBatch={promptDeleteBatch}
            />
          ) : (
            <EmptyDataState
              onOpenImportModal={() => setIsImportModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSettingsSaved={() => fetchDashboardData(filters, selectedMonth)}
      />

      <DeleteConfirmationModal
        isOpen={deleteModalState.isOpen}
        onClose={() =>
          setDeleteModalState((prev) => ({ ...prev, isOpen: false }))
        }
        onConfirm={confirmDeleteBatch}
        title={deleteModalState.title || "Delete Excel Import Batch"}
        fileName={deleteModalState.fileName}
        description={deleteModalState.description}
      />
    </div>
  );
}
