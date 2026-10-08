"use client";

import { KpiCards } from "@/components/ui/dashboard/kpi-cards";
import { ProductionCharts } from "@/components/ui/dashboard/production-charts";
import { AttentionRequired } from "@/components/ui/dashboard/attention-required";
import { SignoffPlanSummary } from "@/components/ui/dashboard/signoff-plan-summary";
import { UnitPerformanceSection } from "@/components/ui/dashboard/unit-performance-section";
import { BuyerPerformanceSection } from "@/components/ui/dashboard/buyer-performance-section";
import { LinePerformanceTable } from "@/components/ui/dashboard/line-performance-table";
import { DailyProductionReport } from "@/components/ui/dashboard/daily-production-report";
import { ProductionCalendar } from "@/components/ui/dashboard/production-calendar";
import { TopLowLinesCards } from "@/components/ui/home/top-low-lines-cards";

interface OverviewTabProps {
  dashboardData: any;
  allLinePerformance: any[];
  filters: any;
  onKPIClick: (kpiKey: string) => void;
  onLineClick: (lineName: string) => void;
  onUnitClick: (unitCode: string) => void;
  onBuyerClick: (buyerName: string) => void;
  onDateClick: (dateStr: string) => void;
  onNavigateTab: (tab: string) => void;
  onOpenSettings: () => void;
  onExport: (type: string) => void;
}

export function OverviewTab({
  dashboardData,
  allLinePerformance,
  filters,
  onKPIClick,
  onLineClick,
  onUnitClick,
  onBuyerClick,
  onDateClick,
  onNavigateTab,
  onOpenSettings,
  onExport,
}: OverviewTabProps) {
  if (!dashboardData) return null;

  return (
    <div className="space-y-6">
      {/* Top 10 KPI Cards */}
      <KpiCards data={dashboardData.kpis} onCardClick={onKPIClick} />

      {/* Major Charts: Target vs Actual & Efficiency Trend */}
      <ProductionCharts
        efficiencyTrend={dashboardData.efficiencyTrend}
        topLines={dashboardData.topLines}
        lowestLines={dashboardData.lowestLines}
        unitPerformance={dashboardData.unitPerformance}
        buyerPerformance={dashboardData.buyerPerformance}
      />

      {/* High and Low Performing Lines Side by Side */}
      <TopLowLinesCards
        topLines={dashboardData.topLines}
        lowestLines={dashboardData.lowestLines}
        onLineClick={onLineClick}
        onViewAllClick={() => onNavigateTab("line-performance")}
        onAnalyzeGapsClick={() => onNavigateTab("line-performance")}
      />

      {/* Attention Required / Anomalies */}
      <AttentionRequired
        alerts={dashboardData.alerts}
        onLineClick={onLineClick}
        onOpenSettings={onOpenSettings}
      />

      {/* Sign-Off Plan Summary Section (Same as Excel Summary Sheet) */}
      <SignoffPlanSummary
        month={filters.month !== "ALL" ? filters.month : "2026-10"}
        batchId={filters.batchId}
        unitCode={filters.unitCode}
      />

      {/* Unit Performance Section */}
      <UnitPerformanceSection
        units={dashboardData.unitPerformance}
        onSelectUnit={onUnitClick}
      />

      {/* Buyer Performance Section */}
      <BuyerPerformanceSection
        buyers={dashboardData.buyerPerformance}
        onSelectBuyer={onBuyerClick}
        onExport={() => onExport("buyer")}
      />

      {/* Line Performance Detailed Table */}
      <LinePerformanceTable
        lines={
          allLinePerformance.length > 0
            ? allLinePerformance
            : dashboardData.linePerformance || []
        }
        onLineClick={onLineClick}
        onExport={() => onExport("line")}
      />

      {/* Daily Production Report Section */}
      <DailyProductionReport
        data={dashboardData.efficiencyTrend}
        onDateClick={onDateClick}
        onExport={() => onExport("daily")}
      />

      {/* Production Calendar View */}
      <ProductionCalendar
        days={dashboardData.efficiencyTrend}
        onSelectDate={onDateClick}
      />
    </div>
  );
}
