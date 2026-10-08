"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Calendar,
  Layers,
  TrendingUp,
  Users,
  Briefcase,
  AlertTriangle,
  UploadCloud,
  FileSpreadsheet,
  Factory,
  BarChart3,
  ChevronRight,
  ChevronDown,
  Radio,
  ShieldCheck,
  BookOpen,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  alertCount?: number;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
  alertCount = 0,
}: SidebarProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    production: true,
    performance: true,
    orders: true,
    monitoring: true,
    administration: true,
    data: true,
  });

  const toggleSection = (sec: string) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const navSections = [
    {
      section: "production",
      label: "Production Planning",
      items: [
        { id: "date-details", label: "Date Breakdown", icon: Calendar, badge: "Daily" },
        { id: "actual-production", label: "Actual Floor Details", icon: Radio, href: "/actual-production" },
        { id: "run-lines", label: "Run Lines Matrix", icon: FileSpreadsheet },
        { id: "excel-master", label: "Excel Plan Matrix", icon: FileSpreadsheet },
        { id: "daily-report", label: "Daily Production", icon: Calendar },
        { id: "target-vs-actual", label: "Target vs Actual", icon: BarChart3 },
        { id: "production-calendar", label: "Production Calendar", icon: Calendar },
      ],
    },
    {
      section: "performance",
      label: "Analytics & KPI",
      items: [
        { id: "line-performance", label: "Line Performance", icon: Layers },
        { id: "efficiency-analysis", label: "Efficiency Analytics", icon: TrendingUp },
        { id: "unit-performance", label: "Unit Performance", icon: Factory },
        { id: "buyer-performance", label: "Buyer Performance", icon: Briefcase },
        { id: "manpower-analysis", label: "Manpower Analysis", icon: Users },
      ],
    },
    {
      section: "orders",
      label: "Orders & Styles",
      items: [
        { id: "all-orders", label: "All Garment Orders", icon: FileSpreadsheet },
        { id: "production-gap", label: "Gap Variance Analysis", icon: TrendingUp },
      ],
    },
    {
      section: "data",
      label: "Data Ingestion",
      items: [
        { id: "excel-import", label: "Excel Import / Sync", icon: UploadCloud, badge: "Live" },
      ],
    },
    {
      section: "administration",
      label: "System & Help",
      items: [
        {
          id: "attention-required",
          label: "Alerts & Low Lines",
          icon: AlertTriangle,
          badge: alertCount > 0 ? alertCount : null,
          badgeVariant: "destructive",
        },
        {
          id: "user-management",
          label: "User Management",
          icon: ShieldCheck,
          badge: "Admin",
          badgeVariant: "destructive",
        },
        {
          id: "user-guide",
          label: "User Guide",
          icon: BookOpen,
          badge: "Help",
          badgeVariant: "info",
        },
      ],
    },
  ];

  const renderSidebarBody = () => (
    <div className="flex h-full w-full flex-col bg-slate-950 text-slate-200">
      {/* Header Branding */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800/80 px-4 bg-slate-950/90 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-emerald-400 shadow-md shadow-sky-500/20">
            <Factory className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold tracking-tight text-white">
                Production<span className="text-sky-400">ERP</span>
              </h1>
              <span className="rounded-full bg-sky-500/15 border border-sky-500/30 px-1.5 py-0.2 text-[9px] font-semibold text-sky-300">
                v2.4
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Planning & Floor Tracking</p>
          </div>
        </div>
      </div>

      {/* Top Direct Navigation: Overview */}
      <div className="px-3 pt-3 pb-1 shrink-0">
        <button
          type="button"
          onClick={() => {
            setActiveTab("overview");
            setIsOpen(false);
          }}
          className={cn(
            "group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200",
            activeTab === "overview"
              ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-600/25 border border-sky-400/30"
              : "text-slate-300 bg-slate-900/60 hover:bg-slate-800/80 hover:text-white border border-slate-800/60"
          )}
        >
          <div className="flex items-center gap-2.5">
            <LayoutDashboard
              className={cn("h-4 w-4", activeTab === "overview" ? "text-white" : "text-sky-400")}
            />
            <span>Overview Dashboard</span>
          </div>
          <Sparkles
            className={cn(
              "h-3.5 w-3.5",
              activeTab === "overview" ? "text-sky-200 animate-pulse" : "text-slate-500"
            )}
          />
        </button>
      </div>

      {/* Scrollable Navigation Area */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 no-scrollbar">
        {navSections.map((group) => (
          <div key={group.section} className="space-y-1">
            <button
              type="button"
              onClick={() => toggleSection(group.section)}
              className="flex w-full items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors select-none"
            >
              <span>{group.label}</span>
              {openSections[group.section] ? (
                <ChevronDown className="h-3 w-3 opacity-70" />
              ) : (
                <ChevronRight className="h-3 w-3 opacity-70" />
              )}
            </button>

            {openSections[group.section] && (
              <div className="space-y-0.5 pt-0.5">
                {group.items.map((item: any) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  const content = (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            isActive ? "text-sky-400" : "text-slate-400 group-hover:text-slate-200"
                          )}
                        />
                        <span className="truncate text-xs font-medium">{item.label}</span>
                      </div>
                      {item.badge !== null && item.badge !== undefined && (
                        <span
                          className={cn(
                            "ml-2 shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold border",
                            item.badgeVariant === "destructive"
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                              : item.badgeVariant === "info"
                              ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                              : "bg-sky-500/15 text-sky-300 border-sky-500/30"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  );

                  const btnClass = cn(
                    "group flex w-full items-center rounded-lg px-2.5 py-2 transition-all duration-150 relative",
                    isActive
                      ? "bg-slate-800/90 text-white font-semibold shadow-sm border-l-2 border-sky-500 pl-2"
                      : "text-slate-300 hover:bg-slate-900/80 hover:text-white"
                  );

                  if (item.href) {
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={btnClass}
                      >
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsOpen(false);
                      }}
                      className={btnClass}
                    >
                      {content}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Profile & Developer Card */}
      <div className="shrink-0 border-t border-slate-800/90 bg-slate-950/95 p-3 space-y-2 pb-6">
        <button
          type="button"
          onClick={() => {
            setActiveTab("about-us");
            setIsOpen(false);
          }}
          className={cn(
            "flex w-full items-center justify-between rounded-xl p-2 transition-all border",
            activeTab === "about-us"
              ? "bg-purple-950/60 border-purple-500/40 text-white"
              : "bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-900 hover:border-slate-700"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative h-8 w-8 rounded-full overflow-hidden border border-purple-400/60 shrink-0 bg-slate-800">
              <img
                src="/image.png"
                alt="Tanvir"
                className="h-full w-full object-cover object-top"
              />
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-slate-950" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-xs font-semibold text-white truncate">Tanvir Ahmed</p>
              <p className="text-[10px] text-slate-400 truncate">Lead Developer</p>
            </div>
          </div>
          <span className="rounded-md bg-purple-500/20 border border-purple-500/30 px-1.5 py-0.5 text-[9px] font-bold text-purple-300">
            Developer
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer using Shadcn Sheet */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="left" className="p-0 border-slate-800 w-72 bg-slate-950">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
              <SheetDescription>Main navigation options for Production ERP</SheetDescription>
            </SheetHeader>
            {renderSidebarBody()}
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Permanent Sidebar */}
      <aside className="hidden lg:flex w-72 shrink-0 h-screen sticky top-0 flex-col border-r border-slate-800/80 bg-slate-950 text-slate-200 overflow-hidden">
        {renderSidebarBody()}
      </aside>
    </>
  );
}
