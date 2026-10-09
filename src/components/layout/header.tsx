"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Calendar,
  LogOut,
  ShieldAlert,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  activeTab: string;
  onOpenSidebar: () => void;
  onOpenImportModal: () => void;
  onOpenSettingsModal: () => void;
  onExport: (type?: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  alertCount?: number;
  selectedMonth?: string;
  onMonthChange?: (month: string) => void;
  monthOptions?: { label: string; value: string }[];
}

export function Header({
  activeTab,
  onOpenSidebar,
  onOpenImportModal,
  onOpenSettingsModal,
  onExport,
  onRefresh,
  isRefreshing = false,
  alertCount = 0,
  selectedMonth = "",
  onMonthChange,
  monthOptions = []
}: HeaderProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<{ name: string; role: string } | null>(null);

  React.useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
        } else if (data && !data.success) {
          router.push('/login');
        }
      })
      .catch(() => {});
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      router.push("/login");
    }
  };

  const titles: Record<string, { title: string; desc: string }> = {
    overview: { title: "Production Analytics & Performance Dashboard", desc: "Real-time production plan, efficiency, line outputs, and KPIs" },
    "daily-report": { title: "Daily Production Report", desc: "Date-wise planned vs actual output, achievement %, and SAH" },
    "target-vs-actual": { title: "Target vs Actual Production Analysis", desc: "Target quantities, actual performance, and gap variances" },
    "production-calendar": { title: "Monthly Production Calendar", desc: "Day-by-day production schedule and performance heat indicators" },
    "line-performance": { title: "Line-wise Performance & Ranking", desc: "High and low efficiency line comparisons, target vs actuals" },
    "efficiency-analysis": { title: "Production Efficiency Analytics", desc: "Line-wise, unit-wise, and date-wise efficiency trends" },
    "unit-performance": { title: "Unit Performance & Comparison", desc: "Performance breakdown across U02, U03, U04, and B2 units" },
    "buyer-performance": { title: "Buyer Performance Analytics", desc: "Volume, efficiency, order breakdown, and delivery performance" },
    "manpower-analysis": { title: "Manpower & Capacity Utilization", desc: "Worker allocation, production per worker, and SAH efficiency" },
    "all-orders": { title: "All Orders & Styles Management", desc: "Detailed tracking of orders, styles, POs, colors, and remaining quantities" },
    "production-gap": { title: "Production Gap & Deficit Analysis", desc: "Lines and orders with the largest production variances" },
    "attention-required": { title: "Attention Required & Problematic Lines", desc: "Lines below threshold, delayed orders, and production gaps" },
    "management-summary": { title: "Executive Management Summary", desc: "High-level overview of factory capacity, outputs, and alerts" },
    "excel-import": { title: "Excel Import & Synchronization", desc: "Upload and validate monthly production plan Excel files" },
    "import-history": { title: "Excel Import History", desc: "Log of imported plan batches and synchronizations" },
    settings: { title: "System Configuration & Thresholds", desc: "Manage efficiency alert thresholds and operational parameters" },
    "about-us": { title: "About Developer & ERP Platform", desc: "Professional Profile & Portfolio of Tanvir Ahmed (Full Stack Developer & Garments ERP Specialist)" },
    "user-management": { title: "User Management & Role Governance", desc: "Super Admin authorization, account creation, and user role assignments" }
  };

  const currentMeta = titles[activeTab] || { title: "Garments Production ERP", desc: "Production Management" };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      {/* Left: Mobile Menu & Current Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:block">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            {currentMeta.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xl">
            {currentMeta.desc}
          </p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Month Selector */}
        <div className="flex items-center gap-1 sm:gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-2 sm:px-2.5 py-1 text-xs font-medium dark:border-slate-800 dark:bg-slate-800/80">
          <Calendar className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange?.(e.target.value)}
            aria-label="Filter by month"
            className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer text-xs max-w-[90px] sm:max-w-none"
          >
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value} className="bg-white dark:bg-slate-900">
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Refresh button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-8 w-8 sm:w-auto sm:px-2.5 p-0 gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300"
          title="Refresh Data"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-sky-500" : ""}`} />
          <span className="hidden md:inline">Refresh</span>
        </Button>

        {/* Export Excel */}
        <div className="relative group hidden sm:block">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport("lines")}
            className="h-8 gap-1.5 text-xs font-medium border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Export Excel</span>
          </Button>
        </div>

        {/* Import Excel */}
        <Button
          variant="default"
          size="sm"
          onClick={onOpenImportModal}
          className="h-8 gap-1.5 px-2.5 sm:px-3 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
        >
          <Upload className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Upload Plan</span>
          <span className="sm:hidden">Upload</span>
        </Button>

        {/* Settings button */}
        <button
          onClick={onOpenSettingsModal}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          title="Settings & Thresholds"
        >
          <Settings className="h-4 w-4" />
        </button>

        {/* Logout */}
        <div className="flex items-center gap-1 sm:gap-1.5 pl-1 sm:pl-1.5 border-l border-slate-200 dark:border-slate-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="h-8 w-8 sm:w-auto p-0 sm:px-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1"
            title="Sign Out of Production ERP"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
