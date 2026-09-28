"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FileSpreadsheet,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Edit3,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  Gauge,
  Sparkles,
  Layers,
  Factory,
  Search,
  Filter,
  RefreshCw,
  Eye,
  ChevronRight,
  TrendingUp,
  Calendar,
  X,
  HelpCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/shared/searchable-select";

export interface UnitLineEditorProps {
  initialUnitCode?: string;
  initialLineName?: string;
  initialMonth?: string;
  initialBatchId?: string;
  onDataSaved?: () => void;
}

interface EditableOrder {
  id: string;
  isNew?: boolean;
  isDeleted?: boolean;
  orderCode: string;
  ocs: string;
  subOc: string;
  buyerName: string;
  unitCode: string;
  lineId?: string;
  lineName: string;
  styleRef: string;
  article: string;
  season: string;
  poNo: string;
  color: string;
  orderQty: number;
  planQty: number;
  actualQty: number;
  smv: number;
  mainCategory: string;
  subCategory: string;
  productType: string;
  orderStatus: string;
  fobPrice: number;
  salesValue: number;
  leadMerchant: string;
  orderDept: string;
  workingDays: number;
  daily: Record<string, { target: number; actual: number; eff: number }>;
  importBatchId?: string | null;
}

export function UnitLineEditor({
  initialUnitCode = "U02",
  initialLineName = "ALL",
  initialMonth = "2026-10",
  initialBatchId = "ALL",
  onDataSaved,
}: UnitLineEditorProps) {
  // Filter & Selection States
  const [selectedBatchId, setSelectedBatchId] = useState<string>(initialBatchId);
  const [selectedUnit, setSelectedUnit] = useState<string>(initialUnitCode);
  const [selectedLine, setSelectedLine] = useState<string>(initialLineName);
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"matrix" | "attributes" | "capacity">("matrix");
  const [dateFilterPreset, setDateFilterPreset] = useState<string>("ALL");
  const [selectedEditorDate, setSelectedEditorDate] = useState<string>("ALL");

  // Server Data
  const [unitsList, setUnitsList] = useState<any[]>([]);
  const [linesList, setLinesList] = useState<any[]>([]);
  const [batchesList, setBatchesList] = useState<any[]>([]);
  const [buyersList, setBuyersList] = useState<any[]>([]);
  const [dateColumns, setDateColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Editable Working Copy
  const [lineMetadata, setLineMetadata] = useState<{
    id: string;
    name: string;
    unitCode: string;
    manpower: number;
    workingHours: number;
  }>({
    id: "",
    name: "",
    unitCode: initialUnitCode,
    manpower: 25,
    workingHours: 10.0,
  });

  const [orders, setOrders] = useState<EditableOrder[]>([]);
  const [originalOrders, setOriginalOrders] = useState<EditableOrder[]>([]);
  const [originalLineMeta, setOriginalLineMeta] = useState<any>(null);
  const [manualEfficiencyOverrides, setManualEfficiencyOverrides] = useState<Record<string, number>>({});

  // Modal State for Adding Style
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState<{
    styleRef: string;
    buyerName: string;
    poNo: string;
    color: string;
    season: string;
    smv: number;
    orderQty: number;
    planQty: number;
    dailyQtyPerActiveDay: number;
  }>({
    styleRef: "",
    buyerName: "MS",
    poNo: "",
    color: "",
    season: "Spring-2027",
    smv: 2.5,
    orderQty: 1000,
    planQty: 1000,
    dailyQtyPerActiveDay: 200,
  });

  // Fetch Editor Data from API
  const fetchEditorData = useCallback(async () => {
    setLoading(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);
    try {
      const params = new URLSearchParams({
        unitCode: selectedUnit,
        lineName: selectedLine,
        month: selectedMonth,
        batchId: selectedBatchId,
      });

      const res = await fetch(`/api/excel/editor?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUnitsList(data.units || []);
        setLinesList(data.lines || []);
        setBatchesList(data.batches || []);
        setBuyersList(data.buyers || []);
        setDateColumns(data.dateColumns || []);

        if (data.selectedLine) {
          const meta = {
            id: data.selectedLine.id,
            name: data.selectedLine.name,
            unitCode: data.selectedLine.unitCode,
            manpower: data.selectedLine.manpower || 25,
            workingHours: data.selectedLine.workingHours || 10.0,
          };
          setLineMetadata(meta);
          setOriginalLineMeta(meta);
          if (selectedLine === "ALL" || selectedLine !== data.selectedLine.name) {
            setSelectedLine(data.selectedLine.name);
          }
        }

        const ords: EditableOrder[] = data.orders || [];
        setOrders(JSON.parse(JSON.stringify(ords)));
        setOriginalOrders(JSON.parse(JSON.stringify(ords)));
      } else {
        const err = await res.json();
        setSaveErrorMsg(err.error || "Failed to load line data");
      }
    } catch (err: any) {
      console.error("Failed to load editor data:", err);
      setSaveErrorMsg(err.message || "Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }, [selectedUnit, selectedLine, selectedMonth, selectedBatchId]);

  useEffect(() => {
    fetchEditorData();
  }, [fetchEditorData]);

  // Filter visible date columns by preset or single date
  const visibleDateColumns = useMemo(() => {
    if (selectedEditorDate !== "ALL") {
      return dateColumns.filter((d) => d.dateStr === selectedEditorDate);
    }
    if (dateFilterPreset === "WEEK_1") {
      return dateColumns.filter((d) => d.dateStr >= "2026-10-01" && d.dateStr <= "2026-10-07");
    }
    if (dateFilterPreset === "WEEK_2") {
      return dateColumns.filter((d) => d.dateStr >= "2026-10-08" && d.dateStr <= "2026-10-14");
    }
    if (dateFilterPreset === "WEEK_3") {
      return dateColumns.filter((d) => d.dateStr >= "2026-10-15" && d.dateStr <= "2026-10-21");
    }
    if (dateFilterPreset === "WEEK_4") {
      return dateColumns.filter((d) => d.dateStr >= "2026-10-22" && d.dateStr <= "2026-10-31");
    }
    if (dateFilterPreset === "HALF_1") {
      return dateColumns.filter((d) => d.dateStr >= "2026-10-01" && d.dateStr <= "2026-10-15");
    }
    if (dateFilterPreset === "HALF_2") {
      return dateColumns.filter((d) => d.dateStr >= "2026-10-16" && d.dateStr <= "2026-10-31");
    }
    return dateColumns;
  }, [dateColumns, dateFilterPreset, selectedEditorDate]);

  // When Unit changes, reset selectedLine to first line in that unit
  const handleUnitChange = (unitCode: string) => {
    setSelectedUnit(unitCode);
    setSelectedLine("ALL");
  };

  // Searchable Select Options
  const batchOptions = useMemo(() => {
    return batchesList.map((b) => ({
      label: b.fileName || `Batch ${b.id.slice(-6)}`,
      value: b.id,
      badge: b.month || undefined,
      sublabel: `Month: ${b.month || "N/A"}`,
    }));
  }, [batchesList]);

  const unitOptions = useMemo(() => {
    if (unitsList.length > 0) {
      return unitsList.map((u) => ({
        label: `${u.name} (${u.code})`,
        value: u.code,
        badge: `${u.totalLines} Lines`,
        unit: u.code,
      }));
    }
    return [
      { label: "Unit 02 (U02)", value: "U02", unit: "U02" },
      { label: "Unit 03 (U03)", value: "U03", unit: "U03" },
      { label: "Unit 04 (U04)", value: "U04", unit: "U04" },
      { label: "Unit B2 (B2)", value: "B2", unit: "B2" },
    ];
  }, [unitsList]);

  const lineOptions = useMemo(() => {
    return linesList.map((l) => ({
      label: l.name,
      value: l.name,
      badge: `MP: ${l.manpower || 25}`,
      unit: l.unitCode,
    }));
  }, [linesList]);

  const monthOptions = useMemo(
    () => [
      { label: "October 2026 (31 Days)", value: "2026-10", badge: "Active" },
      { label: "November 2026 (30 Days)", value: "2026-11" },
      { label: "December 2026 (31 Days)", value: "2026-12" },
    ],
    []
  );

  const editorDateOptions = useMemo(() => {
    return dateColumns.map((d) => ({
      label: `Day ${d.dayNumber} • ${d.dayName} (${d.dateStr})`,
      value: d.dateStr,
      badge: d.dayName,
      sublabel: `Single day isolated view: ${d.dateStr}`,
    }));
  }, [dateColumns]);

  // Determine if there are unsaved changes
  const hasChanges = useMemo(() => {
    if (!originalLineMeta) return false;
    if (
      lineMetadata.manpower !== originalLineMeta.manpower ||
      lineMetadata.workingHours !== originalLineMeta.workingHours
    ) {
      return true;
    }
    if (Object.keys(manualEfficiencyOverrides).length > 0) return true;
    if (orders.length !== originalOrders.length) return true;

    // Check individual orders
    for (let i = 0; i < orders.length; i++) {
      const o = orders[i];
      if (o.isNew || o.isDeleted) return true;
      const orig = originalOrders.find((origO) => origO.id === o.id);
      if (!orig) return true;
      if (
        o.styleRef !== orig.styleRef ||
        o.poNo !== orig.poNo ||
        o.color !== orig.color ||
        o.buyerName !== orig.buyerName ||
        o.smv !== orig.smv ||
        o.orderQty !== orig.orderQty ||
        o.planQty !== orig.planQty ||
        o.orderStatus !== orig.orderStatus
      ) {
        return true;
      }
      // Check daily map
      for (const d of dateColumns) {
        const dVal = o.daily?.[d.dateStr]?.target || 0;
        const origVal = orig.daily?.[d.dateStr]?.target || 0;
        if (dVal !== origVal) return true;
      }
    }

    return false;
  }, [orders, originalOrders, lineMetadata, originalLineMeta, manualEfficiencyOverrides, dateColumns]);

  // Live Recalculations for the Active Line
  const calculatedLineSummaries = useMemo(() => {
    const planDaily: Record<string, number> = {};
    const sahDaily: Record<string, number> = {};
    const machineDaily: Record<string, number> = {};
    const effiDaily: Record<string, number> = {};

    const activeOrders = orders.filter((o) => !o.isDeleted);

    for (const d of dateColumns) {
      let dayPlan = 0;
      let daySah = 0;

      for (const ord of activeOrders) {
        const dayTarget = ord.daily?.[d.dateStr]?.target || 0;
        if (dayTarget > 0) {
          dayPlan += dayTarget;
          const orderSmv = ord.smv || 2.5;
          daySah += (dayTarget * orderSmv) / 60;
        }
      }

      let isHoliday = d.dayName === 'Fri';
      if (dayPlan > 0) {
        isHoliday = false;
      }

      const clockHrs = isHoliday ? 0 : (lineMetadata.manpower || 25) * (lineMetadata.workingHours || 10.0);
      let dayEff = clockHrs > 0 ? (daySah / clockHrs) * 100 : 0;

      if (manualEfficiencyOverrides[d.dateStr] !== undefined) {
        dayEff = manualEfficiencyOverrides[d.dateStr];
      }

      planDaily[d.dateStr] = dayPlan;
      sahDaily[d.dateStr] = Number(daySah.toFixed(2));
      machineDaily[d.dateStr] = Number(clockHrs.toFixed(2));
      effiDaily[d.dateStr] = dayEff > 0 ? Math.round(dayEff) : 0;
    }

    const totalPlan = Object.values(planDaily).reduce((a, b) => a + b, 0);
    const totalSah = Number(Object.values(sahDaily).reduce((a, b) => a + b, 0).toFixed(2));
    const totalMachine = Number(Object.values(machineDaily).reduce((a, b) => a + b, 0).toFixed(2));
    const totalEffi = totalMachine > 0 ? Math.round((totalSah / totalMachine) * 100) : 0;

    return {
      planDaily,
      sahDaily,
      machineDaily,
      effiDaily,
      totalPlan,
      totalSah,
      totalMachine,
      totalEffi,
      activeStylesCount: activeOrders.length,
    };
  }, [orders, dateColumns, lineMetadata, manualEfficiencyOverrides]);

  // Cell Edit Handler for Date targets
  const handleDailyTargetChange = (orderId: string, dateStr: string, rawVal: string) => {
    const num = rawVal === "" ? 0 : Math.max(0, parseInt(rawVal, 10) || 0);
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        const currentDaily = { ...(ord.daily || {}) };
        currentDaily[dateStr] = {
          target: num,
          actual: currentDaily[dateStr]?.actual || 0,
          eff: currentDaily[dateStr]?.eff || 0,
        };

        // Recompute order total plan qty as sum of all daily targets
        const newTotalPlan = Object.values(currentDaily).reduce((sum, item) => sum + (item.target || 0), 0);

        return {
          ...ord,
          daily: currentDaily,
          planQty: newTotalPlan > 0 ? newTotalPlan : ord.planQty,
        };
      })
    );
  };

  // Attribute Edit Handler
  const handleOrderFieldChange = (orderId: string, field: keyof EditableOrder, val: any) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          [field]: val,
        };
      })
    );
  };

  // Row Delete / Restore
  const toggleDeleteOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          isDeleted: !ord.isDeleted,
        };
      })
    );
  };

  // Add New Order to the line
  const handleAddNewOrder = () => {
    if (!newOrderForm.styleRef.trim()) {
      alert("Please enter a Style Reference");
      return;
    }

    const newDailyMap: Record<string, { target: number; actual: number; eff: number }> = {};
    const qtyPerDay = newOrderForm.dailyQtyPerActiveDay || 200;

    // Distribute among first 5 working days as a helpful default
    dateColumns.slice(0, 5).forEach((d) => {
      newDailyMap[d.dateStr] = {
        target: qtyPerDay,
        actual: 0,
        eff: 0,
      };
    });

    const totalFromDays = Object.values(newDailyMap).reduce((s, i) => s + i.target, 0);

    const newOrder: EditableOrder = {
      id: `new-${Date.now()}`,
      isNew: true,
      orderCode: `ORD-${selectedLine}-${newOrderForm.styleRef}-${Date.now()}`,
      ocs: "",
      subOc: "",
      buyerName: newOrderForm.buyerName || "MS",
      unitCode: selectedUnit,
      lineName: selectedLine,
      styleRef: newOrderForm.styleRef,
      article: `Art-${newOrderForm.styleRef}`,
      season: newOrderForm.season || "Spring-2027",
      poNo: newOrderForm.poNo || "PO-NEW",
      color: newOrderForm.color || "Standard",
      orderQty: newOrderForm.orderQty || 1000,
      planQty: newOrderForm.planQty || totalFromDays,
      actualQty: 0,
      smv: Number(newOrderForm.smv) || 2.5,
      mainCategory: "UNDERWEAR",
      subCategory: "BOXER",
      productType: "P1",
      orderStatus: "Confirmed",
      fobPrice: 0,
      salesValue: 0,
      leadMerchant: "",
      orderDept: "",
      workingDays: 5,
      daily: newDailyMap,
      importBatchId: selectedBatchId !== "ALL" ? selectedBatchId : null,
    };

    setOrders((prev) => [newOrder, ...prev]);
    setIsAddModalOpen(false);
    setNewOrderForm({
      styleRef: "",
      buyerName: "MS",
      poNo: "",
      color: "",
      season: "Spring-2027",
      smv: 2.5,
      orderQty: 1000,
      planQty: 1000,
      dailyQtyPerActiveDay: 200,
    });
  };

  // Discard Changes
  const handleDiscardChanges = () => {
    if (confirm("Are you sure you want to discard all unsaved edits?")) {
      setOrders(JSON.parse(JSON.stringify(originalOrders)));
      if (originalLineMeta) {
        setLineMetadata(JSON.parse(JSON.stringify(originalLineMeta)));
      }
      setManualEfficiencyOverrides({});
      setSaveSuccessMsg(null);
      setSaveErrorMsg(null);
    }
  };

  // Save All Changes to Server
  const handleSaveChanges = async () => {
    setSaving(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    try {
      const deletedOrderIds = orders.filter((o) => o.isDeleted && !o.isNew).map((o) => o.id);
      const activeOrNewOrders = orders.filter((o) => !o.isDeleted);

      const payload = {
        lineId: lineMetadata.id,
        lineName: lineMetadata.name || selectedLine,
        unitCode: lineMetadata.unitCode,
        month: selectedMonth,
        batchId: selectedBatchId,
        lineSettings: {
          manpower: lineMetadata.manpower,
          workingHours: lineMetadata.workingHours,
        },
        orders: activeOrNewOrders,
        deletedOrderIds,
        manualOverrides: {
          EFFI: manualEfficiencyOverrides,
        },
      };

      const res = await fetch("/api/excel/editor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccessMsg(data.message || "Line and Unit data saved successfully!");
        setOriginalOrders(JSON.parse(JSON.stringify(activeOrNewOrders)));
        setOriginalLineMeta(JSON.parse(JSON.stringify(lineMetadata)));
        setManualEfficiencyOverrides({});
        if (onDataSaved) onDataSaved();
      } else {
        setSaveErrorMsg(data.error || "Failed to save changes");
      }
    } catch (err: any) {
      console.error("Save error:", err);
      setSaveErrorMsg(err.message || "Failed to communicate with server");
    } finally {
      setSaving(false);
    }
  };

  // Filter orders by search term
  const filteredOrders = useMemo(() => {
    if (!searchFilter.trim()) return orders;
    const q = searchFilter.toLowerCase();
    return orders.filter(
      (o) =>
        o.styleRef.toLowerCase().includes(q) ||
        o.poNo.toLowerCase().includes(q) ||
        o.color.toLowerCase().includes(q) ||
        o.buyerName.toLowerCase().includes(q) ||
        o.orderCode.toLowerCase().includes(q)
    );
  }, [orders, searchFilter]);

  return (
    <div className="space-y-5">
      {/* Top Filter & Selector Control Bar */}
      <Card className="border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Title with badge */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-md">
                <Edit3 className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Unit & Line Data Correction Studio
                  </h2>
                  <Badge className="bg-sky-600 text-white text-[10px] py-0 px-2 font-semibold">
                    Live Data Fixer
                  </Badge>
                  {hasChanges && (
                    <Badge className="bg-amber-500 text-white text-[10px] py-0 px-2 font-bold animate-pulse">
                      ● Unsaved Changes
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select Excel batch, Unit, and Line to inspect, correct wrong data, adjust machines & efficiency, and save.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchEditorData}
                disabled={loading || saving}
                className="gap-1 text-xs border-slate-300 dark:border-slate-700"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Reload</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                className="gap-1 text-xs bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800 hover:bg-sky-100"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Style / Order</span>
              </Button>

              {hasChanges && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDiscardChanges}
                  disabled={saving}
                  className="gap-1 text-xs border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Discard</span>
                </Button>
              )}

              <Button
                size="sm"
                onClick={handleSaveChanges}
                disabled={saving || !hasChanges}
                className={`gap-1.5 text-xs font-bold shadow-sm transition-all ${
                  hasChanges
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400/50 animate-bounce-subtle"
                    : "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed"
                }`}
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Save All Changes</span>
              </Button>
            </div>
          </div>

          {/* Feedback Messages */}
          {saveSuccessMsg && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {saveErrorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-medium">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{saveErrorMsg}</span>
            </div>
          )}

          {/* 4 Multi-Level Filter Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* 1. Excel Batch / File Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                <span>Excel Upload File / Batch</span>
              </label>
              <SearchableSelect
                className="w-full"
                triggerClassName="w-full h-8 text-xs bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                dropdownWidth="w-80"
                placeholder="All Batches"
                searchPlaceholder="Search upload batch/file..."
                options={batchOptions}
                value={selectedBatchId}
                onChange={(val) => setSelectedBatchId(val)}
                allOptionLabel="All Ingested Excel Batches"
                allOptionValue="ALL"
              />
            </div>

            {/* 2. Unit Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Factory className="h-3.5 w-3.5 text-sky-600" />
                <span>Manufacturing Unit</span>
              </label>
              <SearchableSelect
                className="w-full"
                triggerClassName="w-full h-8 text-xs bg-sky-50/50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-100 font-bold"
                dropdownWidth="w-72"
                placeholder="Select Unit"
                searchPlaceholder="Search unit..."
                options={unitOptions}
                value={selectedUnit}
                onChange={(val) => handleUnitChange(val)}
                allOptionLabel="All Units"
                allOptionValue="ALL"
              />
            </div>

            {/* 3. Line Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-indigo-600" />
                <span>Production Line</span>
              </label>
              <SearchableSelect
                className="w-full"
                triggerClassName="w-full h-8 text-xs bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100 font-bold"
                dropdownWidth="w-72"
                placeholder="Select Line"
                searchPlaceholder="Search line..."
                options={lineOptions}
                value={selectedLine}
                onChange={(val) => setSelectedLine(val)}
                allOptionLabel="All Lines in Unit"
                allOptionValue="ALL"
              />
            </div>

            {/* 4. Month Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-purple-600" />
                <span>Plan Month</span>
              </label>
              <SearchableSelect
                className="w-full"
                triggerClassName="w-full h-8 text-xs bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                dropdownWidth="w-72"
                placeholder="Select Month"
                searchPlaceholder="Search month..."
                options={monthOptions}
                value={selectedMonth}
                onChange={(val) => setSelectedMonth(val)}
                allOptionLabel="All Months"
                allOptionValue="ALL"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Machine & Capacity KPI Banner */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {/* Card 1: Line Identity */}
        <div className="p-3.5 rounded-xl border border-sky-200 dark:border-sky-900 bg-gradient-to-br from-sky-50 to-white dark:from-sky-950/40 dark:to-slate-900 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
            Active Line & Unit
          </span>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xl font-extrabold text-sky-950 dark:text-sky-100 font-mono">
              {lineMetadata.name || selectedLine}
            </span>
            <Badge className="bg-sky-600 text-white text-[10px] font-bold">
              {lineMetadata.unitCode}
            </Badge>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {calculatedLineSummaries.activeStylesCount} styles assigned
          </p>
        </div>

        {/* Card 2: Line Manpower / Operators (Editable) */}
        <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/40 dark:to-slate-900 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>Line Manpower (Machine/Op)</span>
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={100}
              value={lineMetadata.manpower}
              onChange={(e) =>
                setLineMetadata((prev) => ({
                  ...prev,
                  manpower: Math.max(1, parseInt(e.target.value, 10) || 25),
                }))
              }
              className="h-8 w-20 text-base font-extrabold font-mono bg-white dark:bg-slate-950 border-indigo-300 dark:border-indigo-700 text-indigo-950 dark:text-indigo-100 px-2"
            />
            <span className="text-xs font-semibold text-slate-500">Operators</span>
          </div>
          <p className="mt-1 text-[10px] text-indigo-600 dark:text-indigo-400">
            Affects daily clock/machine hours
          </p>
        </div>

        {/* Card 3: Working Hours / Day (Editable) */}
        <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-900 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/40 dark:to-slate-900 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>Shift Working Hours</span>
          </span>
          <div className="mt-1 flex items-center gap-2">
            <Input
              type="number"
              step={0.5}
              min={1}
              max={24}
              value={lineMetadata.workingHours}
              onChange={(e) =>
                setLineMetadata((prev) => ({
                  ...prev,
                  workingHours: Math.max(1, parseFloat(e.target.value) || 10.0),
                }))
              }
              className="h-8 w-20 text-base font-extrabold font-mono bg-white dark:bg-slate-950 border-purple-300 dark:border-purple-700 text-purple-950 dark:text-purple-100 px-2"
            />
            <span className="text-xs font-semibold text-slate-500">Hrs / Day</span>
          </div>
          <p className="mt-1 text-[10px] text-purple-600 dark:text-purple-400">
            Daily Cap: {((lineMetadata.manpower || 25) * (lineMetadata.workingHours || 10)).toFixed(0)} Machine Hrs
          </p>
        </div>

        {/* Card 4: Total Plan Qty & SAH */}
        <div className="p-3.5 rounded-xl border border-teal-200 dark:border-teal-900 bg-gradient-to-br from-teal-50 to-white dark:from-teal-950/40 dark:to-slate-900 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
            Total Line Planned Production
          </span>
          <div className="mt-1 text-xl font-extrabold text-teal-950 dark:text-teal-100 font-mono">
            {calculatedLineSummaries.totalPlan.toLocaleString()} <span className="text-xs font-normal text-slate-500">PCS</span>
          </div>
          <p className="mt-1 text-[11px] text-teal-700 dark:text-teal-300 font-semibold">
            {calculatedLineSummaries.totalSah.toLocaleString()} Total SAH
          </p>
        </div>

        {/* Card 5: Calculated Line Efficiency */}
        <div
          className={`p-3.5 rounded-xl border shadow-2xs ${
            calculatedLineSummaries.totalEffi >= 80
              ? "border-emerald-300 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/40"
              : calculatedLineSummaries.totalEffi >= 70
              ? "border-sky-300 bg-sky-50/70 dark:border-sky-800 dark:bg-sky-950/40"
              : calculatedLineSummaries.totalEffi >= 60
              ? "border-amber-300 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-950/40"
              : "border-rose-300 bg-rose-50/70 dark:border-rose-800 dark:bg-rose-950/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5" />
              <span>Overall Line Efficiency</span>
            </span>
            <Badge
              className={`text-[9px] py-0 px-1.5 font-bold ${
                calculatedLineSummaries.totalEffi >= 80
                  ? "bg-emerald-600 text-white"
                  : calculatedLineSummaries.totalEffi >= 70
                  ? "bg-sky-600 text-white"
                  : calculatedLineSummaries.totalEffi >= 60
                  ? "bg-amber-600 text-white"
                  : "bg-rose-600 text-white"
              }`}
            >
              {calculatedLineSummaries.totalEffi >= 80
                ? "HIGH"
                : calculatedLineSummaries.totalEffi >= 70
                ? "NORMAL"
                : calculatedLineSummaries.totalEffi >= 60
                ? "ATTENTION"
                : "CRITICAL"}
            </Badge>
          </div>
          <div className="mt-1 text-2xl font-black font-mono">
            {calculatedLineSummaries.totalEffi}%
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            Formula: (SAH / Machine Hrs) × 100
          </p>
        </div>
      </div>

      {/* Editor Main Content & Tabs */}
      <Card className="border-slate-300 dark:border-slate-800 shadow-md bg-white dark:bg-slate-950 overflow-hidden">
        {/* Header Ribbon & Mode Switcher */}
        <div className="bg-slate-900 text-white px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("matrix")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "matrix"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>31-Day Production Matrix & Daily Target Inputs</span>
            </button>

            <button
              onClick={() => setActiveTab("attributes")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "attributes"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Style & Order Specifications Master</span>
            </button>

            <button
              onClick={() => setActiveTab("capacity")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "capacity"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Daily Capacity & Efficiency Overrides</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search style, PO, color..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full text-xs rounded-md bg-slate-800 border border-slate-700 pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter("")}
                className="absolute right-2 top-2 text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: 31-DAY INTERACTIVE SPREADSHEET MATRIX */}
        {activeTab === "matrix" && (
          <div className="space-y-0">
            {/* Quick Date Column Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-slate-850 border-b border-slate-750 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mr-1">
                  <Calendar className="h-3 w-3 text-sky-400" />
                  <span>Date View:</span>
                </span>

                {[
                  { id: "ALL", label: `All 31 Days (${dateColumns.length})` },
                  { id: "WEEK_1", label: "Week 1 (Oct 1-7)" },
                  { id: "WEEK_2", label: "Week 2 (Oct 8-14)" },
                  { id: "WEEK_3", label: "Week 3 (Oct 15-21)" },
                  { id: "WEEK_4", label: "Week 4 (Oct 22-31)" },
                  { id: "HALF_1", label: "1st Half (1-15)" },
                  { id: "HALF_2", label: "2nd Half (16-31)" },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setDateFilterPreset(p.id);
                      setSelectedEditorDate("ALL");
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                      dateFilterPreset === p.id && selectedEditorDate === "ALL"
                        ? "bg-sky-600 text-white font-bold"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Specific Date Quick Selector */}
              <div className="flex items-center gap-2 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-700 shadow-xs">
                <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 select-none">
                  <Calendar className="h-3.5 w-3.5 text-sky-400" />
                  <span>Focus Date:</span>
                </span>
                <SearchableSelect
                  dropdownAlign="right"
                  triggerClassName={`h-7 min-w-[150px] max-w-[220px] text-xs font-bold rounded-md px-2.5 py-0 border transition-all ${
                    selectedEditorDate !== "ALL"
                      ? "bg-sky-950 border-sky-500 text-sky-200 ring-1 ring-sky-500/50"
                      : "bg-slate-800 hover:bg-slate-750 border-slate-600 text-slate-100 hover:text-white"
                  }`}
                  dropdownWidth="w-72"
                  placeholder="All Column Dates"
                  searchPlaceholder="Search day or date (e.g. Day 1, Thu)..."
                  options={editorDateOptions}
                  value={selectedEditorDate}
                  onChange={(val) => {
                    setSelectedEditorDate(val);
                    if (val !== "ALL") {
                      setDateFilterPreset("CUSTOM");
                    }
                  }}
                  allOptionLabel={`All Column Dates (${dateColumns.length} Days)`}
                  allOptionValue="ALL"
                />
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse text-left text-xs font-sans">
              <thead className="bg-slate-800 text-slate-200 sticky top-0 z-30 select-none">
                <tr className="border-b border-slate-700">
                  <th className="px-2 py-2 text-center font-bold w-10 sticky left-0 z-30 bg-slate-850">#</th>
                  <th className="px-3 py-2 font-bold w-20 sticky left-10 z-30 bg-slate-850">Buyer</th>
                  <th className="px-3 py-2 font-bold w-36 sticky left-30 z-30 bg-slate-850">Style Ref</th>
                  <th className="px-3 py-2 font-bold w-28">PO No</th>
                  <th className="px-3 py-2 font-bold w-24">Color</th>
                  <th className="px-2 py-2 text-right font-bold w-16">SMV</th>
                  <th className="px-2 py-2 text-right font-bold w-20">Order Qty</th>
                  <th className="px-2 py-2 text-right font-bold w-20 bg-sky-950/60 text-sky-200">Plan Qty</th>

                  {/* Filtered Date Columns */}
                  {visibleDateColumns.map((d) => (
                    <th
                      key={d.dateStr}
                      className="px-1 py-1.5 text-center font-mono font-bold min-w-[58px] border-l border-slate-700/60 bg-slate-800 hover:bg-slate-750"
                      title={d.dateStr}
                    >
                      <div className="text-[11px] text-white">{d.dayNum}</div>
                      <div className="text-[9px] text-slate-400 font-normal uppercase">{d.dayName}</div>
                    </th>
                  ))}

                  <th className="px-3 py-2 text-right font-bold w-24 bg-emerald-950/60 text-emerald-200">
                    Total Target
                  </th>
                  <th className="px-2 py-2 text-center font-bold w-16">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10 + dateColumns.length} className="text-center py-12 text-slate-400">
                      No styles found for this line. Click &quot;Add Style / Order&quot; to insert one.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord, idx) => {
                    const isDel = ord.isDeleted;
                    return (
                      <tr
                        key={ord.id}
                        className={`transition-colors whitespace-nowrap group ${
                          isDel
                            ? "bg-rose-50/50 dark:bg-rose-950/30 line-through opacity-60"
                            : ord.isNew
                            ? "bg-emerald-50/50 dark:bg-emerald-950/20"
                            : "hover:bg-slate-50 dark:hover:bg-slate-900"
                        }`}
                      >
                        {/* Index */}
                        <td className="px-2 py-1.5 text-center font-mono text-[11px] text-slate-400 sticky left-0 z-20 bg-white dark:bg-slate-950 group-hover:bg-slate-50 dark:group-hover:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
                          {idx + 1}
                        </td>

                        {/* Buyer */}
                        <td className="px-3 py-1.5 font-bold text-slate-700 dark:text-slate-300 sticky left-10 z-20 bg-white dark:bg-slate-950 group-hover:bg-slate-50 dark:group-hover:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
                          {ord.buyerName}
                        </td>

                        {/* Style Ref */}
                        <td className="px-3 py-1.5 font-bold text-sky-700 dark:text-sky-300 sticky left-30 z-20 bg-white dark:bg-slate-950 group-hover:bg-slate-50 dark:group-hover:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
                          <span className="truncate max-w-[130px] block" title={ord.styleRef}>
                            {ord.styleRef}
                          </span>
                        </td>

                        {/* PO No */}
                        <td className="px-3 py-1.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {ord.poNo}
                        </td>

                        {/* Color */}
                        <td className="px-3 py-1.5 text-slate-600 dark:text-slate-400 truncate max-w-[100px]" title={ord.color}>
                          {ord.color}
                        </td>

                        {/* SMV (Editable inline) */}
                        <td className="px-1 py-1 text-right">
                          <input
                            type="number"
                            step={0.01}
                            min={0.1}
                            disabled={isDel}
                            value={ord.smv}
                            onChange={(e) => handleOrderFieldChange(ord.id, "smv", parseFloat(e.target.value) || 2.5)}
                            className="w-14 h-7 text-right font-mono text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-transparent px-1 focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 focus:outline-hidden"
                          />
                        </td>

                        {/* Order Qty (Editable inline) */}
                        <td className="px-1 py-1 text-right">
                          <input
                            type="number"
                            disabled={isDel}
                            value={ord.orderQty}
                            onChange={(e) => handleOrderFieldChange(ord.id, "orderQty", parseInt(e.target.value, 10) || 0)}
                            className="w-16 h-7 text-right font-mono text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-transparent px-1 focus:bg-white dark:focus:bg-slate-900 focus:border-sky-500 focus:outline-hidden"
                          />
                        </td>

                        {/* Plan Qty */}
                        <td className="px-2 py-1.5 text-right font-mono font-bold text-sky-800 dark:text-sky-200 bg-sky-50/40 dark:bg-sky-950/20">
                          {ord.planQty.toLocaleString()}
                        </td>

                        {/* Filtered Date Input Cells */}
                        {visibleDateColumns.map((d) => {
                          const val = ord.daily?.[d.dateStr]?.target || 0;
                          const hasVal = val > 0;
                          const origVal = originalOrders.find((o) => o.id === ord.id)?.daily?.[d.dateStr]?.target || 0;
                          const isModified = val !== origVal;

                          return (
                            <td
                              key={d.dateStr}
                              className={`p-0.5 border-l border-slate-100 dark:border-slate-850 text-center ${
                                isModified ? "bg-amber-100/60 dark:bg-amber-950/50" : ""
                              }`}
                            >
                              <input
                                type="number"
                                min={0}
                                disabled={isDel}
                                value={val === 0 ? "" : val}
                                placeholder="-"
                                onChange={(e) => handleDailyTargetChange(ord.id, d.dateStr, e.target.value)}
                                className={`w-full h-7 text-center font-mono text-[11px] rounded transition-all focus:outline-hidden ${
                                  isModified
                                    ? "bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-100 font-bold border border-amber-400"
                                    : hasVal
                                    ? "bg-slate-50/80 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold border border-slate-200 dark:border-slate-750"
                                    : "bg-transparent text-slate-300 dark:text-slate-700 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                                } focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-sky-500`}
                              />
                            </td>
                          );
                        })}

                        {/* Total Target */}
                        <td className="px-3 py-1.5 text-right font-mono font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20">
                          {ord.planQty.toLocaleString()}
                        </td>

                        {/* Action: Delete / Restore */}
                        <td className="px-2 py-1 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleDeleteOrder(ord.id)}
                            className={`h-7 w-7 p-0 ${
                              isDel
                                ? "text-emerald-600 hover:bg-emerald-50"
                                : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            }`}
                            title={isDel ? "Restore Style" : "Delete Style"}
                          >
                            {isDel ? <RotateCcw className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}

                {/* 4 LIVE CALCULATED SUMMARY ROWS */}
                {/* 1. PLAN / DAY */}
                <tr className="bg-sky-50/90 dark:bg-sky-950/70 border-t-2 border-sky-400 dark:border-sky-700 font-bold whitespace-nowrap">
                  <td className="px-2 py-1.5 text-center font-mono text-[10px] text-sky-700 sticky left-0 z-20 bg-sky-100 dark:bg-sky-900">
                    ∑
                  </td>
                  <td className="px-3 py-1.5 font-extrabold text-sky-900 dark:text-sky-100 sticky left-10 z-20 bg-sky-100 dark:bg-sky-900">
                    {lineMetadata.name || selectedLine}
                  </td>
                  <td className="px-3 py-1.5 font-extrabold text-sky-900 dark:text-sky-200 sticky left-30 z-20 bg-sky-100 dark:bg-sky-900">
                    PLAN / DAY (PCS)
                  </td>
                  <td className="px-3 py-1.5 text-slate-400" colSpan={4}></td>
                  <td className="px-2 py-1.5 text-right font-mono font-extrabold text-sky-950 dark:text-sky-100 bg-sky-200/60 dark:bg-sky-900/60">
                    {calculatedLineSummaries.totalPlan.toLocaleString()}
                  </td>

                  {/* Day Plan Cells */}
                  {visibleDateColumns.map((d) => {
                    const planVal = calculatedLineSummaries.planDaily[d.dateStr] || 0;
                    return (
                      <td
                        key={d.dateStr}
                        className="px-1 py-1.5 text-center font-mono text-[11px] font-bold text-sky-900 dark:text-sky-100 border-l border-sky-200 dark:border-sky-800"
                      >
                        {planVal > 0 ? planVal.toLocaleString() : "-"}
                      </td>
                    );
                  })}

                  <td className="px-3 py-1.5 text-right font-mono font-extrabold text-sky-950 dark:text-sky-100 bg-sky-200/80 dark:bg-sky-900/80">
                    {calculatedLineSummaries.totalPlan.toLocaleString()}
                  </td>
                  <td></td>
                </tr>

                {/* 2. SAH / DAY */}
                <tr className="bg-purple-50/80 dark:bg-purple-950/60 border-t border-purple-200 dark:border-purple-800 font-bold whitespace-nowrap">
                  <td className="px-2 py-1.5 text-center font-mono text-[10px] text-purple-700 sticky left-0 z-20 bg-purple-100 dark:bg-purple-900">
                    ⏱
                  </td>
                  <td className="px-3 py-1.5 font-extrabold text-purple-900 dark:text-purple-100 sticky left-10 z-20 bg-purple-100 dark:bg-purple-900">
                    {lineMetadata.name || selectedLine}
                  </td>
                  <td className="px-3 py-1.5 font-extrabold text-purple-900 dark:text-purple-200 sticky left-30 z-20 bg-purple-100 dark:bg-purple-900">
                    SAH EARNED
                  </td>
                  <td className="px-3 py-1.5 text-slate-400" colSpan={4}></td>
                  <td className="px-2 py-1.5 text-right font-mono font-extrabold text-purple-950 dark:text-purple-100 bg-purple-200/60 dark:bg-purple-900/60">
                    {calculatedLineSummaries.totalSah.toLocaleString()}
                  </td>

                  {/* Day SAH Cells */}
                  {visibleDateColumns.map((d) => {
                    const sahVal = calculatedLineSummaries.sahDaily[d.dateStr] || 0;
                    return (
                      <td
                        key={d.dateStr}
                        className="px-1 py-1.5 text-center font-mono text-[11px] font-bold text-purple-900 dark:text-purple-100 border-l border-purple-200 dark:border-purple-800"
                      >
                        {sahVal > 0 ? sahVal.toFixed(1) : "-"}
                      </td>
                    );
                  })}

                  <td className="px-3 py-1.5 text-right font-mono font-extrabold text-purple-950 dark:text-purple-100 bg-purple-200/80 dark:bg-purple-900/80">
                    {calculatedLineSummaries.totalSah.toLocaleString()}
                  </td>
                  <td></td>
                </tr>

                {/* 3. MACHINE HR */}
                <tr className="bg-amber-50/70 dark:bg-amber-950/50 border-t border-amber-200 dark:border-amber-800 font-bold whitespace-nowrap">
                  <td className="px-2 py-1.5 text-center font-mono text-[10px] text-amber-700 sticky left-0 z-20 bg-amber-100 dark:bg-amber-900">
                    ⚙
                  </td>
                  <td className="px-3 py-1.5 font-extrabold text-amber-900 dark:text-amber-100 sticky left-10 z-20 bg-amber-100 dark:bg-amber-900">
                    {lineMetadata.name || selectedLine}
                  </td>
                  <td className="px-3 py-1.5 font-extrabold text-amber-900 dark:text-amber-200 sticky left-30 z-20 bg-amber-100 dark:bg-amber-900">
                    MACHINE / CLOCK HR
                  </td>
                  <td className="px-3 py-1.5 text-slate-400" colSpan={4}></td>
                  <td className="px-2 py-1.5 text-right font-mono font-extrabold text-amber-950 dark:text-amber-100 bg-amber-200/60 dark:bg-amber-900/60">
                    {calculatedLineSummaries.totalMachine.toLocaleString()}
                  </td>

                  {/* Day Machine Hr Cells */}
                  {visibleDateColumns.map((d) => {
                    const mVal = calculatedLineSummaries.machineDaily[d.dateStr] || 0;
                    return (
                      <td
                        key={d.dateStr}
                        className="px-1 py-1.5 text-center font-mono text-[11px] font-bold text-amber-900 dark:text-amber-100 border-l border-amber-200 dark:border-amber-800"
                      >
                        {mVal > 0 ? mVal.toFixed(0) : "-"}
                      </td>
                    );
                  })}

                  <td className="px-3 py-1.5 text-right font-mono font-extrabold text-amber-950 dark:text-amber-100 bg-amber-200/80 dark:bg-amber-900/80">
                    {calculatedLineSummaries.totalMachine.toLocaleString()}
                  </td>
                  <td></td>
                </tr>

                {/* 4. EFFI. PLAN / D (%) */}
                <tr className="bg-emerald-50/90 dark:bg-emerald-950/70 border-t border-emerald-300 dark:border-emerald-700 font-bold whitespace-nowrap">
                  <td className="px-2 py-1.5 text-center font-mono text-[10px] text-emerald-700 sticky left-0 z-20 bg-emerald-100 dark:bg-emerald-900">
                    %
                  </td>
                  <td className="px-3 py-1.5 font-extrabold text-emerald-900 dark:text-emerald-100 sticky left-10 z-20 bg-emerald-100 dark:bg-emerald-900">
                    {lineMetadata.name || selectedLine}
                  </td>
                  <td className="px-3 py-1.5 font-extrabold text-emerald-900 dark:text-emerald-200 sticky left-30 z-20 bg-emerald-100 dark:bg-emerald-900">
                    EFFI. PLAN / D (%)
                  </td>
                  <td className="px-3 py-1.5 text-slate-400" colSpan={4}></td>
                  <td className="px-2 py-1.5 text-right font-mono font-extrabold text-emerald-950 dark:text-emerald-100 bg-emerald-200/60 dark:bg-emerald-900/60">
                    {calculatedLineSummaries.totalEffi}%
                  </td>

                  {/* Day Efficiency Cells */}
                  {visibleDateColumns.map((d) => {
                    const effVal = calculatedLineSummaries.effiDaily[d.dateStr] || 0;
                    return (
                      <td
                        key={d.dateStr}
                        className={`px-1 py-1.5 text-center font-mono text-[11px] font-extrabold border-l border-emerald-200 dark:border-emerald-800 ${
                          effVal >= 80
                            ? "text-emerald-700 dark:text-emerald-300"
                            : effVal >= 70
                            ? "text-sky-700 dark:text-sky-300"
                            : effVal >= 60
                            ? "text-amber-700 dark:text-amber-300"
                            : effVal > 0
                            ? "text-rose-700 dark:text-rose-300"
                            : "text-slate-300 dark:text-slate-700"
                        }`}
                      >
                        {effVal > 0 ? `${effVal}%` : "-"}
                      </td>
                    );
                  })}

                  <td className="px-3 py-1.5 text-right font-mono font-extrabold text-emerald-950 dark:text-emerald-100 bg-emerald-200/80 dark:bg-emerald-900/80">
                    {calculatedLineSummaries.totalEffi}%
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

        {/* TAB 2: STYLE & ORDER ATTRIBUTES SPECIFICATION MASTER */}
        {activeTab === "attributes" && (
          <div className="overflow-x-auto p-4 custom-scrollbar">
            <table className="w-full border-collapse text-left text-xs font-sans">
              <thead className="bg-slate-800 text-slate-200">
                <tr>
                  <th className="px-3 py-2 font-bold w-12">#</th>
                  <th className="px-3 py-2 font-bold w-32">Buyer</th>
                  <th className="px-3 py-2 font-bold w-44">Style Reference</th>
                  <th className="px-3 py-2 font-bold w-40">PO Number</th>
                  <th className="px-3 py-2 font-bold w-36">Color</th>
                  <th className="px-3 py-2 font-bold w-32">Season</th>
                  <th className="px-3 py-2 font-bold w-24 text-right">SMV</th>
                  <th className="px-3 py-2 font-bold w-28 text-right">Order Qty</th>
                  <th className="px-3 py-2 font-bold w-28 text-right">Plan Qty</th>
                  <th className="px-3 py-2 font-bold w-32">Status</th>
                  <th className="px-3 py-2 font-bold w-16 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
                {filteredOrders.map((ord, idx) => (
                  <tr key={ord.id} className={ord.isDeleted ? "line-through opacity-50 bg-rose-50/40" : "hover:bg-slate-50 dark:hover:bg-slate-900"}>
                    <td className="px-3 py-2 font-mono text-slate-400">{idx + 1}</td>
                    
                    {/* Buyer */}
                    <td className="px-2 py-1.5">
                      <Input
                        type="text"
                        value={ord.buyerName}
                        onChange={(e) => handleOrderFieldChange(ord.id, "buyerName", e.target.value)}
                        className="h-7 text-xs font-semibold"
                      />
                    </td>

                    {/* Style Ref */}
                    <td className="px-2 py-1.5">
                      <Input
                        type="text"
                        value={ord.styleRef}
                        onChange={(e) => handleOrderFieldChange(ord.id, "styleRef", e.target.value)}
                        className="h-7 text-xs font-bold text-sky-700 dark:text-sky-300"
                      />
                    </td>

                    {/* PO No */}
                    <td className="px-2 py-1.5">
                      <Input
                        type="text"
                        value={ord.poNo}
                        onChange={(e) => handleOrderFieldChange(ord.id, "poNo", e.target.value)}
                        className="h-7 text-xs font-mono"
                      />
                    </td>

                    {/* Color */}
                    <td className="px-2 py-1.5">
                      <Input
                        type="text"
                        value={ord.color}
                        onChange={(e) => handleOrderFieldChange(ord.id, "color", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </td>

                    {/* Season */}
                    <td className="px-2 py-1.5">
                      <Input
                        type="text"
                        value={ord.season}
                        onChange={(e) => handleOrderFieldChange(ord.id, "season", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </td>

                    {/* SMV */}
                    <td className="px-2 py-1.5 text-right">
                      <Input
                        type="number"
                        step={0.01}
                        min={0.1}
                        value={ord.smv}
                        onChange={(e) => handleOrderFieldChange(ord.id, "smv", parseFloat(e.target.value) || 2.5)}
                        className="h-7 text-xs text-right font-mono"
                      />
                    </td>

                    {/* Order Qty */}
                    <td className="px-2 py-1.5 text-right">
                      <Input
                        type="number"
                        value={ord.orderQty}
                        onChange={(e) => handleOrderFieldChange(ord.id, "orderQty", parseInt(e.target.value, 10) || 0)}
                        className="h-7 text-xs text-right font-mono"
                      />
                    </td>

                    {/* Plan Qty */}
                    <td className="px-2 py-1.5 text-right">
                      <Input
                        type="number"
                        value={ord.planQty}
                        onChange={(e) => handleOrderFieldChange(ord.id, "planQty", parseInt(e.target.value, 10) || 0)}
                        className="h-7 text-xs text-right font-mono font-bold text-sky-700"
                      />
                    </td>

                    {/* Status */}
                    <td className="px-2 py-1.5">
                      <select
                        value={ord.orderStatus}
                        onChange={(e) => handleOrderFieldChange(ord.id, "orderStatus", e.target.value)}
                        className="w-full h-7 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-1"
                      >
                        <option value="Confirmed">Confirmed</option>
                        <option value="Running">Running</option>
                        <option value="Completed">Completed</option>
                        <option value="Delayed">Delayed</option>
                      </select>
                    </td>

                    {/* Delete */}
                    <td className="px-2 py-1.5 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleDeleteOrder(ord.id)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                      >
                        {ord.isDeleted ? <RotateCcw className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: DAILY CAPACITY & EFFICIENCY OVERRIDES */}
        {activeTab === "capacity" && (
          <div className="p-5 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-purple-600" />
                <span>Line Capacity & Direct Efficiency Tuning</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                You can directly adjust daily efficiency benchmark targets or machine hours if actual floor hours deviate from regular schedule.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {dateColumns.map((d) => {
                const autoEff = calculatedLineSummaries.effiDaily[d.dateStr] || 0;
                const overrideVal = manualEfficiencyOverrides[d.dateStr];
                const displayVal = overrideVal !== undefined ? overrideVal : autoEff;

                return (
                  <div
                    key={d.dateStr}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      <span>{d.shortLabel}</span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {calculatedLineSummaries.planDaily[d.dateStr] || 0} pcs
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        step={0.1}
                        min={0}
                        max={150}
                        value={displayVal === 0 ? "" : displayVal}
                        placeholder={`${autoEff}%`}
                        onChange={(e) => {
                          const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                          setManualEfficiencyOverrides((prev) => {
                            const next = { ...prev };
                            if (val === undefined || isNaN(val)) {
                              delete next[d.dateStr];
                            } else {
                              next[d.dateStr] = val;
                            }
                            return next;
                          });
                        }}
                        className={`h-7 text-xs font-mono font-bold text-right px-2 ${
                          overrideVal !== undefined
                            ? "border-purple-400 bg-purple-50 dark:bg-purple-950 text-purple-900 dark:text-purple-100"
                            : ""
                        }`}
                      />
                      <span className="text-xs font-bold text-slate-500">%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Floating Save Reminder Bar if changes exist */}
      {hasChanges && (
        <div className="sticky bottom-4 z-40 flex items-center justify-between p-4 rounded-xl bg-slate-900 text-white shadow-xl border border-sky-500/50 backdrop-blur-md animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white font-bold">
              !
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Unsaved Modifications Detected</h4>
              <p className="text-xs text-slate-300">
                You have changed production parameters on line {lineMetadata.name || selectedLine}. Click Save to apply changes across all dashboards and reports.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDiscardChanges}
              className="text-xs text-slate-300 hover:text-white"
            >
              Discard Edits
            </Button>

            <Button
              size="sm"
              onClick={handleSaveChanges}
              disabled={saving}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Save & Update Database</span>
            </Button>
          </div>
        </div>
      )}

      {/* Modal: Add New Style / Order to Line */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-scale-up">
            <div className="bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                <h3 className="font-bold text-base">Add New Style / Order to Line</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Target Line
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${selectedLine} (${selectedUnit})`}
                    className="w-full text-xs font-bold font-mono rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-slate-600 dark:text-slate-300"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Buyer Name *
                  </label>
                  <input
                    type="text"
                    list="buyers-list"
                    value={newOrderForm.buyerName}
                    onChange={(e) =>
                      setNewOrderForm((prev) => ({ ...prev, buyerName: e.target.value }))
                    }
                    placeholder="e.g. MS, GAP, H&M"
                    className="w-full text-xs font-semibold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
                  />
                  <datalist id="buyers-list">
                    {buyersList.map((b) => (
                      <option key={b.id} value={b.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Style Reference *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1190788 / SQ-BOXER-01"
                  value={newOrderForm.styleRef}
                  onChange={(e) =>
                    setNewOrderForm((prev) => ({ ...prev, styleRef: e.target.value }))
                  }
                  className="w-full text-xs font-bold font-mono rounded border border-sky-300 dark:border-sky-800 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    PO Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. P2560893"
                    value={newOrderForm.poNo}
                    onChange={(e) =>
                      setNewOrderForm((prev) => ({ ...prev, poNo: e.target.value }))
                    }
                    className="w-full text-xs font-mono rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Color
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Navy Floral"
                    value={newOrderForm.color}
                    onChange={(e) =>
                      setNewOrderForm((prev) => ({ ...prev, color: e.target.value }))
                    }
                    className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    SMV (Minutes)
                  </label>
                  <input
                    type="number"
                    step={0.01}
                    min={0.1}
                    value={newOrderForm.smv}
                    onChange={(e) =>
                      setNewOrderForm((prev) => ({
                        ...prev,
                        smv: parseFloat(e.target.value) || 2.5,
                      }))
                    }
                    className="w-full text-xs font-mono rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Order Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newOrderForm.orderQty}
                    onChange={(e) =>
                      setNewOrderForm((prev) => ({
                        ...prev,
                        orderQty: parseInt(e.target.value, 10) || 1000,
                      }))
                    }
                    className="w-full text-xs font-mono rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Daily Initial Target
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newOrderForm.dailyQtyPerActiveDay}
                    onChange={(e) =>
                      setNewOrderForm((prev) => ({
                        ...prev,
                        dailyQtyPerActiveDay: parseInt(e.target.value, 10) || 200,
                      }))
                    }
                    className="w-full text-xs font-mono rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/80 px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddNewOrder}
                className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Style to Grid</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
