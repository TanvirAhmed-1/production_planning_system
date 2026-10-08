"use client";

import { TopLowLinesCards } from "@/components/ui/home/top-low-lines-cards";
import { KpiCards } from "@/components/ui/dashboard/kpi-cards";
import { ProductionCharts } from "@/components/ui/dashboard/production-charts";
import { LinePerformanceTable } from "@/components/ui/dashboard/line-performance-table";
import { DailyProductionReport } from "@/components/ui/dashboard/daily-production-report";
import { ProductionCalendar } from "@/components/ui/dashboard/production-calendar";
import { ExcelMasterSheet } from "@/components/ui/dashboard/excel-master-sheet";
import { UnitLineEditor } from "@/components/ui/dashboard/unit-line-editor";
import { RunLinesReport } from "@/components/ui/dashboard/run-lines-report";

interface ProductionTabsProps {
  activeTab: string;
  dashboardData: any;
  allLinePerformance: any[];
  filters: any;
  onKPIClick: (kpiKey: string) => void;
  onLineClick: (lineName: string) => void;
  onDateClick: (dateStr: string) => void;
  onNavigateTab: (tab: string) => void;
  onExport: (type: string) => void;
  onRefreshDashboard: () => void;
}

export function ProductionTabs({
  activeTab,
  dashboardData,
  allLinePerformance,
  filters,
  onKPIClick,
  onLineClick,
  onDateClick,
  onNavigateTab,
  onExport,
  onRefreshDashboard,
}: ProductionTabsProps) {
  // TAB: UNIT & LINE DATA EDITOR
  if (activeTab === "unit-editor" || activeTab === "data-editor") {
    return (
      <div className="space-y-6">
        <UnitLineEditor
          initialUnitCode={
            filters.unitCode !== "ALL" ? filters.unitCode : "U02"
          }
          initialLineName={
            filters.lineName !== "ALL" ? filters.lineName : "ALL"
          }
          initialMonth={
            filters.month !== "ALL" ? filters.month : "2026-10"
          }
          initialBatchId={filters.batchId}
          onDataSaved={onRefreshDashboard}
        />
      </div>
    );
  }

  // TAB: EXCEL MASTER SHEET
  if (activeTab === "excel-master") {
    return (
      <div className="space-y-6">
        <ExcelMasterSheet
          initialMonth={
            filters.month !== "ALL" ? filters.month : "2026-10"
          }
          onExport={() => onExport("orders")}
        />
      </div>
    );
  }

  // TAB: DAILY REPORT
  if (activeTab === "daily-report") {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-0.5 sm:gap-1">
          <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            Daily Production Report
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Day-by-day target, actual output, efficiency variance, and achievement percentages
          </p>
        </div>
        <DailyProductionReport
          data={dashboardData.efficiencyTrend}
          onDateClick={onDateClick}
          onExport={() => onExport("daily")}
        />
      </div>
    );
  }

  // TAB: TARGET VS ACTUAL / PRODUCTION PLAN
  if (activeTab === "target-vs-actual" || activeTab === "production-plan") {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-0.5 sm:gap-1">
          <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            Target vs Actual Production Analysis
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Comprehensive plan comparison, production variances, and fulfillment rates
          </p>
        </div>
        <KpiCards data={dashboardData.kpis} onCardClick={onKPIClick} />
        <ProductionCharts
          efficiencyTrend={dashboardData.efficiencyTrend}
          topLines={dashboardData.topLines}
          lowestLines={dashboardData.lowestLines}
          unitPerformance={dashboardData.unitPerformance}
          buyerPerformance={dashboardData.buyerPerformance}
        />
        <TopLowLinesCards
          topLines={dashboardData.topLines}
          lowestLines={dashboardData.lowestLines}
          onLineClick={onLineClick}
          onViewAllClick={() => onNavigateTab("line-performance")}
          onAnalyzeGapsClick={() => onNavigateTab("line-performance")}
        />
      </div>
    );
  }

  // TAB: PRODUCTION CALENDAR
  if (activeTab === "production-calendar") {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-0.5 sm:gap-1">
          <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            Monthly Production Calendar
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Color-coded date grid showing plan adherence, actual quantities, and efficiency rating
          </p>
        </div>
        <ProductionCalendar
          days={dashboardData.efficiencyTrend}
          onSelectDate={onDateClick}
        />
      </div>
    );
  }

  // TAB: LINE PERFORMANCE MASTER
  if (activeTab === "line-performance") {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-0.5 sm:gap-1">
          <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            Line-wise Production Performance Master
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Monitor all production lines across all manufacturing units with floor actual synchronization and deep drill-down analytics
          </p>
        </div>
        <LinePerformanceTable
          lines={
            allLinePerformance.length > 0
              ? allLinePerformance
              : dashboardData.linePerformance || []
          }
          onLineClick={onLineClick}
          onExport={() => onExport("line")}
        />
      </div>
    );
  }

  // TAB: EFFICIENCY ANALYSIS
  if (activeTab === "efficiency-analysis") {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-0.5 sm:gap-1">
          <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            Efficiency Analytics & Benchmarking
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Unit comparisons, top/bottom efficiency ranking, and daily efficiency fluctuation
          </p>
        </div>
        <ProductionCharts
          efficiencyTrend={dashboardData.efficiencyTrend}
          topLines={dashboardData.topLines}
          lowestLines={dashboardData.lowestLines}
          unitPerformance={dashboardData.unitPerformance}
          buyerPerformance={dashboardData.buyerPerformance}
        />
      </div>
    );
  }

  // TAB: RUN LINES
  if (activeTab === "run-lines") {
    return (
      <div className="space-y-6">
        <RunLinesReport />
      </div>
    );
  }

  return null;
}
