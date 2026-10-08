"use client";

import { AttentionRequired } from "@/components/ui/dashboard/attention-required";
import { UnitPerformanceSection } from "@/components/ui/dashboard/unit-performance-section";
import { BuyerPerformanceSection } from "@/components/ui/dashboard/buyer-performance-section";
import { ManpowerAnalysis } from "@/components/ui/dashboard/manpower-analysis";
import { ManagementSummary } from "@/components/ui/dashboard/management-summary";
import { OrdersTable } from "@/components/ui/orders/orders-table";
import { SignoffPlanSummary } from "@/components/ui/dashboard/signoff-plan-summary";

interface BusinessTabsProps {
  activeTab: string;
  dashboardData: any;
  filters: any;
  onLineClick: (lineName: string) => void;
  onUnitClick: (unitCode: string) => void;
  onBuyerClick: (buyerName: string) => void;
  onNavigateTab: (tab: string) => void;
  onOpenSettingsModal: () => void;
  onExport: (type: string) => void;
}

export function BusinessTabs({
  activeTab,
  dashboardData,
  filters,
  onLineClick,
  onUnitClick,
  onBuyerClick,
  onNavigateTab,
  onOpenSettingsModal,
  onExport,
}: BusinessTabsProps) {
  // TAB: UNIT PERFORMANCE
  if (activeTab === "unit-performance") {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-0.5 sm:gap-1">
          <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            Manufacturing Unit Comparison
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Cross-unit operational and output comparison across active manufacturing facilities
          </p>
        </div>
        <UnitPerformanceSection
          units={dashboardData.unitPerformance}
          onSelectUnit={onUnitClick}
        />
      </div>
    );
  }

  // TAB: BUYER PERFORMANCE
  if (activeTab === "buyer-performance") {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-0.5 sm:gap-1">
          <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            Buyer & Brand Analytics
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Production output and performance breakdown across all active buyers and brands
          </p>
        </div>
        <BuyerPerformanceSection
          buyers={dashboardData.buyerPerformance}
          onSelectBuyer={onBuyerClick}
          onExport={() => onExport("buyer")}
        />
      </div>
    );
  }

  // TAB: MANPOWER ANALYSIS
  if (activeTab === "manpower-analysis") {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-0.5 sm:gap-1">
          <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            Manpower & Capacity Utilization
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Operator allocation, SAH earned, and labor productivity by unit and line
          </p>
        </div>
        <ManpowerAnalysis
          unitPerformance={dashboardData.unitPerformance || []}
          linePerformance={dashboardData.linePerformance || []}
        />
      </div>
    );
  }

  // TAB: ALL ORDERS / DELAYED ORDERS
  if (
    activeTab === "all-orders" ||
    activeTab === "order-performance" ||
    activeTab === "delayed-orders"
  ) {
    const ordersCount = dashboardData?.kpis?.totalOrders
      ? `${dashboardData.kpis.totalOrders.toLocaleString()} `
      : "";

    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-0.5 sm:gap-1">
          <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            {activeTab === "delayed-orders"
              ? "Delayed & Critical Orders"
              : "Order Master Management"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Track {ordersCount}style orders, POs, colors, ordered qty, produced qty, and remaining balance
          </p>
        </div>
        <OrdersTable onExport={() => onExport("orders")} />
      </div>
    );
  }

  // TAB: PRODUCTION GAP / ATTENTION REQUIRED
  if (activeTab === "production-gap" || activeTab === "attention-required") {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-0.5 sm:gap-1">
          <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            Production Gap & Anomaly Alerts
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Automatic detection of lines and orders lagging behind target production
          </p>
        </div>
        <AttentionRequired
          alerts={dashboardData.alerts}
          onLineClick={onLineClick}
          onOpenSettings={onOpenSettingsModal}
        />
      </div>
    );
  }

  // TAB: SIGNOFF PLAN SUMMARY
  if (activeTab === "signoff-summary") {
    return (
      <div className="space-y-4 sm:space-y-6">
        <SignoffPlanSummary
          month={filters.month !== "ALL" ? filters.month : "2026-10"}
          batchId={filters.batchId}
          unitCode={filters.unitCode}
        />
      </div>
    );
  }

  // TAB: MANAGEMENT SUMMARY
  if (
    activeTab === "management-summary" ||
    activeTab === "executive-summary" ||
    activeTab === "unit-report"
  ) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-0.5 sm:gap-1">
          <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            Executive Management Summary
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            C-Level overview of garments production health, volume, and operational highlights
          </p>
        </div>
        <ManagementSummary
          kpis={dashboardData.kpis}
          topLines={dashboardData.topLines}
          lowestLines={dashboardData.lowestLines}
          unitPerformance={dashboardData.unitPerformance}
          alerts={dashboardData.alerts}
          onNavigateTab={onNavigateTab}
        />
      </div>
    );
  }

  return null;
}
