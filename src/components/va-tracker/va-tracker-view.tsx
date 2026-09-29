"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FileSpreadsheet,
  Upload,
  Download,
  RefreshCw,
  Search,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  X,
  Layers,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Database,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Users,
  Factory,
  BarChart3,
  Sliders,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Check,
  ChevronDown,
  History,
  FileCode,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { PRODUCTION_SCHEMA_FIELDS, calculateDynamicKpis } from "@/lib/dynamic-excel-engine";
import { ExecutiveSummaryTab } from "./executive-summary-tab";
import { DailyProductionReportTab } from "./daily-production-report-tab";
import { ActualProductionTab } from "./actual-production-tab";
import { ClockHourTab } from "./clock-hour-tab";
import { VaTrackerTab } from "./va-tracker-tab";
import { EpmdTab } from "./epmd-tab";
import { LineEfficiencyTab } from "./line-efficiency-tab";
import { LossAnalysisTab } from "./loss-analysis-tab";
import { AiImportStudio } from "./ai-import-studio";
import { UniversalSheetViewer } from "./universal-sheet-viewer";

// Tab configurations
const NAVIGATION_TABS = [
  { id: "Summary", label: "Executive Summary", group: "Performance" },
  { id: "Report", label: "Daily Production Report", group: "Performance" },
  { id: "Actual", label: "Actual Production (DB)", group: "Performance" },
  { id: "Clock hour", label: "Clock Hours & Attendance", group: "Performance" },
  { id: "VA Tracker", label: "VA Tracker", group: "Analytics" },
  { id: "EPMD", label: "EPMD Analysis", group: "Analytics" },
  { id: "Line Efficiency", label: "Line Efficiency", group: "Analytics" },
  { id: "Loss Analysis", label: "Loss Time & Loss Hr", group: "Analytics" },
  { id: "Dynamic Sheet", label: "Universal Sheet Viewer", group: "Analytics" },
  { id: "Excel Import", label: "Excel Import Workflow", group: "Data & Sync" },
  { id: "Import History", label: "Import History & Batches", group: "Data & Sync" },
  { id: "Data Management", label: "Data Management & CRUD", group: "Data & Sync" },
];

export function VaTrackerView() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("Summary");
  const [data, setData] = useState<any>(null);
  const [dbStats, setDbStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [clusterFilter, setClusterFilter] = useState<string>("ALL");
  const [fileName, setFileName] = useState<string>("Production Monitoring VA Tracker September'26 Birichina & Styrax.xlsb");

  // Dynamic File Selection States
  const [fileUploads, setFileUploads] = useState<any[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [hasFiles, setHasFiles] = useState<boolean>(true);
  const [isSeedingReference, setIsSeedingReference] = useState<boolean>(false);

  // Dynamic Sheet Viewer State
  const [selectedSheetName, setSelectedSheetName] = useState<string>("Summary");
  const [dynamicSheetHeaders, setDynamicSheetHeaders] = useState<string[]>([]);
  const [dynamicSheetRows, setDynamicSheetRows] = useState<any[]>([]);

  // Import History State
  const [importHistoryList, setImportHistoryList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Pagination for heavy sheets (Actual / Clock Hours)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 50;

  // Multi-Step Upload & Import Modal State
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadStep, setUploadStep] = useState<"UPLOAD" | "MAPPING" | "VALIDATOR" | "CONFIRM">("UPLOAD");
  const [analyzedWorkbook, setAnalyzedWorkbook] = useState<any>(null);
  const [selectedMappingSheet, setSelectedMappingSheet] = useState<string>("");
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [validatedRows, setValidatedRows] = useState<any[]>([]);
  const [validatorFilter, setValidatorFilter] = useState<"ALL" | "VALID" | "WARNING" | "ERROR">("ALL");
  const [validatorStats, setValidatorStats] = useState<any>({ total: 0, valid: 0, warning: 0, error: 0 });
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<"INSERT_UPDATE" | "INSERT_NEW" | "UPDATE_ONLY">("INSERT_UPDATE");
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);

  // Sub-tabs state
  const [lossSubTab, setLossSubTab] = useState<string>("B1 - Loss Time");
  const [epmdSubTab, setEpmdSubTab] = useState<string>("B1 EPMD");
  const [effSubTab, setEffSubTab] = useState<string>("B-1 Line Efficiency");

  // CRUD Modal State
  const [isAddRecordOpen, setIsAddRecordOpen] = useState<boolean>(false);
  const [recordFormData, setRecordFormData] = useState<any>({});
  const [savingRecord, setSavingRecord] = useState<boolean>(false);

  // Batch & File Delete States
  const [batchToDelete, setBatchToDelete] = useState<any | null>(null);
  const [isDeleteBatchModalOpen, setIsDeleteBatchModalOpen] = useState<boolean>(false);
  const [isDeletingBatch, setIsDeletingBatch] = useState<boolean>(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState<boolean>(false);
  const [isClearingAll, setIsClearingAll] = useState<boolean>(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  // Single batch delete handler
  const handleDeleteBatch = (batch: any) => {
    setBatchToDelete(batch);
    setDeleteErrorMessage(null);
    setIsDeleteBatchModalOpen(true);
  };

  const handleConfirmDeleteBatch = async () => {
    if (!batchToDelete?.id) return;
    setIsDeletingBatch(true);
    setDeleteErrorMessage(null);
    try {
      const res = await fetch(`/api/imports/${batchToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete file and records");
      }

      const json = await res.json();
      setImportStatusMessage(json.message || `File '${batchToDelete.fileName}' deleted successfully.`);
      setTimeout(() => setImportStatusMessage(null), 5000);
      setIsDeleteBatchModalOpen(false);
      setBatchToDelete(null);
      await Promise.all([fetchImportHistory(), fetchData()]);
    } catch (err: any) {
      setDeleteErrorMessage(err.message || "Failed to delete file batch");
    } finally {
      setIsDeletingBatch(false);
    }
  };

  // Clear all batches & records handler
  const handleConfirmClearAll = async () => {
    setIsClearingAll(true);
    setDeleteErrorMessage(null);
    try {
      const res = await fetch("/api/imports?all=true", {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to clear all batches");
      }

      const json = await res.json();
      setImportStatusMessage(json.message || "All file uploads and records have been cleared.");
      setTimeout(() => setImportStatusMessage(null), 5000);
      setIsClearAllModalOpen(false);
      await Promise.all([fetchImportHistory(), fetchData()]);
    } catch (err: any) {
      setDeleteErrorMessage(err.message || "Failed to clear database records");
    } finally {
      setIsClearingAll(false);
    }
  };

  // Fetch data dynamically for active/selected file
  const fetchData = async (targetFileId?: string) => {
    setLoading(true);
    try {
      const activeId = targetFileId !== undefined ? targetFileId : (selectedFileId || "");
      const res = await fetch(`/api/excel/va-tracker?fileId=${activeId}`);
      if (res.ok) {
        const json = await res.json();
        setHasFiles(json.hasFiles ?? (json.fileUploads?.length > 0));
        setFileUploads(json.fileUploads || []);
        if (json.activeFileUpload) {
          setSelectedFileId(json.activeFileUpload.id);
        } else if (json.fileUploads?.length > 0 && !selectedFileId) {
          setSelectedFileId(json.fileUploads[0].id);
        } else if (!json.fileUploads || json.fileUploads.length === 0) {
          setSelectedFileId(null);
        }
        setData(json.data);
        if (json.fileName) setFileName(json.fileName);
        if (json.dbStats) setDbStats(json.dbStats);

        // Initialize Dynamic Sheet viewer with default sheet
        if (json.data?.sheetNames && json.data.sheetNames.length > 0) {
          const firstSheet = json.data.sheetNames[0];
          setSelectedSheetName(firstSheet);
        }
      }
    } catch (err) {
      console.error("Failed to fetch VA tracker data", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to load default reference workbook into PostgreSQL
  const handleLoadReferenceWorkbook = async () => {
    setIsSeedingReference(true);
    try {
      const res = await fetch("/api/excel/va-tracker?action=seed-reference");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load reference workbook");
      }
      setImportStatusMessage("September'26 Reference Workbook loaded into PostgreSQL!");
      setTimeout(() => setImportStatusMessage(null), 5000);
      await Promise.all([fetchData(), fetchImportHistory()]);
    } catch (err: any) {
      alert(err.message || "Failed to seed reference workbook");
    } finally {
      setIsSeedingReference(false);
    }
  };

  const fetchImportHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/imports?limit=50");
      if (res.ok) {
        const json = await res.json();
        setImportHistoryList(json.imports || []);
      }
    } catch (err) {
      console.error("Failed to fetch import history", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchImportHistory();
  }, []);

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, clusterFilter, activeTab]);

  // Step 1: Analyze Uploaded File
  const handleAnalyzeUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);

      const res = await fetch("/api/imports/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to analyze workbook");
      }

      const json = await res.json();
      setAnalyzedWorkbook(json);

      // Default to Actual or first sheet
      const defaultSheet = json.sheets?.find((s: any) => s.sheetName.toLowerCase().includes("actual")) || json.sheets?.[0];
      if (defaultSheet) {
        setSelectedMappingSheet(defaultSheet.sheetName);
        setColumnMappings(defaultSheet.suggestedMappings || {});
      }

      setUploadStep("MAPPING");
    } catch (err: any) {
      setUploadError(err.message || "Failed to process file");
    } finally {
      setUploading(false);
    }
  };

  // Step 2: Generate Preview & Run Validator
  const handleRunValidator = async () => {
    if (!uploadFile || !selectedMappingSheet) return;
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("sheetName", selectedMappingSheet);
      formData.append("columnMapping", JSON.stringify(columnMappings));

      const res = await fetch("/api/imports/preview-sheet", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Validation preview failed");
      }

      const json = await res.json();
      setValidatedRows(json.rows || []);
      setValidatorStats({
        total: json.totalRows || 0,
        valid: json.validCount || 0,
        warning: json.warningCount || 0,
        error: json.errorCount || 0,
      });
      setUploadStep("VALIDATOR");
    } catch (err: any) {
      setUploadError(err.message || "Validation failed");
    } finally {
      setUploading(false);
    }
  };

  // Step 3: Execute Commit to PostgreSQL
  const handleExecuteCommit = async () => {
    if (validatedRows.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      const validOnlyRows = validatedRows.filter((r) => r.status === "VALID" || r.status === "WARNING");

      const res = await fetch("/api/imports/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUploadId: analyzedWorkbook?.fileUploadId,
          rows: validOnlyRows,
          importMode,
          userEmail: "admin@garments.local",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Database commit failed");
      }

      const json = await res.json();
      setImportStatusMessage(`Successfully saved ${json.importedRows} records into PostgreSQL!`);
      setIsUploadOpen(false);
      setUploadFile(null);
      setUploadStep("UPLOAD");
      fetchData();
      fetchImportHistory();
    } catch (err: any) {
      setUploadError(err.message || "Failed to commit records");
    } finally {
      setUploading(false);
    }
  };

  // Helper to format values with negative parentheses & colors
  const formatCell = (val: number, isPercent = false, isVariance = false) => {
    if (val === undefined || val === null || isNaN(val)) return "-";
    if (val === 0 && !isVariance) return "0";

    const formattedNum = isPercent
      ? `${(Math.abs(val) <= 1 && val !== 0 ? val * 100 : val).toFixed(1)}%`
      : Math.abs(val) >= 100
      ? Math.round(val).toLocaleString()
      : val.toFixed(2);

    if (val < 0) {
      const positiveVal = Math.abs(val);
      const text = isPercent
        ? `-${(positiveVal <= 1 ? positiveVal * 100 : positiveVal).toFixed(1)}%`
        : `(${positiveVal >= 100 ? Math.round(positiveVal).toLocaleString() : positiveVal.toFixed(2)})`;
      return <span className="text-red-400 font-bold">{text}</span>;
    }

    if (isVariance && val > 0) {
      return <span className="text-emerald-400 font-bold">+{formattedNum}</span>;
    }

    return formattedNum;
  };

  // Export table to CSV
  const exportToCSV = (rows: any[], filename: string) => {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            if (val === null || val === undefined) return '""';
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute Dynamic Summary KPIs
  const actualRecords = data?.tabs?.["Actual"]?.records || [];
  const dynamicKpis = useMemo(() => calculateDynamicKpis(actualRecords), [actualRecords]);
  const summarySheet = data?.tabs?.["Summary"];

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Top Header Bar */}
      <header className="w-full bg-slate-900 border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="text-slate-400 hover:text-white hover:bg-slate-800 gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-semibold">Hub</span>
          </Button>

          <div className="h-5 w-[1px] bg-slate-800" />

          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>Garments Production Monitoring & Analytics</span>
              <Badge className="bg-purple-600/30 text-purple-300 border border-purple-500/40 text-[10px] uppercase font-mono">
                XLSB / PostgreSQL
              </Badge>
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              {fileUploads.length > 0 ? (
                <div className="flex items-center gap-1.5 bg-slate-950 border border-purple-900/50 rounded-md px-2 py-0.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <select
                    value={selectedFileId || ""}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setSelectedFileId(newId);
                      fetchData(newId);
                    }}
                    className="bg-transparent text-xs font-semibold text-purple-200 focus:outline-none cursor-pointer max-w-[280px] sm:max-w-md truncate"
                  >
                    {fileUploads.map((f: any) => (
                      <option key={f.id} value={f.id} className="bg-slate-900 text-white">
                        {f.fileName} ({new Date(f.createdAt).toLocaleDateString()} • {f.importedRows || f._count?.monitoringRecords || 0} rows)
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <Badge className="bg-rose-950/40 text-rose-300 border border-rose-800/40 text-[10px]">
                  No Active File Uploaded
                </Badge>
              )}
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 flex items-center gap-1 font-medium text-xs">
                <Database className="w-3 h-3" />
                {dbStats?.recordCount ? `${dbStats.recordCount.toLocaleString()} DB Records` : "0 DB Records"}
              </span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5">
          {importStatusMessage && (
            <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs py-1 px-2.5 flex items-center gap-1 animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {importStatusMessage}
            </Badge>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData()}
            disabled={loading}
            className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 text-xs gap-1.5 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-sky-400" : ""}`} />
            <span>Refresh</span>
          </Button>

          {fileUploads.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadReferenceWorkbook}
              disabled={isSeedingReference}
              className="border-purple-800/60 bg-purple-950/30 text-purple-300 hover:bg-purple-900/50 hover:text-white text-xs gap-1.5"
            >
              {isSeedingReference ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
              <span>Load Reference XLSB</span>
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => {
              setUploadStep("UPLOAD");
              setIsUploadOpen(true);
            }}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold gap-1.5 shadow-md shadow-purple-900/20"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload & Import Excel</span>
          </Button>
        </div>
      </header>

      {/* Dynamic KPI Cards Strip */}
      <section className="bg-slate-900/60 border-b border-slate-800/80 px-6 py-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Day / Total Actual Pcs */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              Total Actual Output
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </span>
            <div className="mt-1">
              <span className="text-lg font-black text-emerald-300 font-mono">
                {hasFiles && dynamicKpis.totalActualPcs > 0 ? `${dynamicKpis.totalActualPcs.toLocaleString()} Pcs` : "0 Pcs"}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5">
              Across {hasFiles ? dynamicKpis.totalLines || 0 : 0} Active Lines
            </span>
          </div>

          {/* Dynamic Average Efficiency */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              Avg Line Efficiency
              <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
            </span>
            <div className="mt-1">
              <span className="text-lg font-black text-purple-300 font-mono">
                {hasFiles && dynamicKpis.overallEfficiency > 0 ? `${dynamicKpis.overallEfficiency.toFixed(1)}%` : "0.0%"}
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold mt-0.5">
              Target Benchmark 70.0%
            </span>
          </div>

          {/* Clock Hours */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              Total Clock Hours
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </span>
            <div className="mt-1">
              <span className="text-lg font-black text-white font-mono">
                {hasFiles && dynamicKpis.totalClockHours > 0 ? Math.round(dynamicKpis.totalClockHours).toLocaleString() : "0"}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5">Working Hours Recorded</span>
          </div>

          {/* Total Value Addition ($VA) */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              Total Value Addition
              <DollarSign className="w-3.5 h-3.5 text-sky-400" />
            </span>
            <div className="mt-1">
              <span className="text-lg font-black text-sky-300 font-mono">
                {hasFiles && dynamicKpis.totalVaValue > 0 ? `$${Math.round(dynamicKpis.totalVaValue).toLocaleString()}` : "$0"}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5">
              FOB: ${hasFiles ? Math.round(dynamicKpis.totalFobValue || 0).toLocaleString() : "0"}
            </span>
          </div>

          {/* Buyers & Styles Active */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              Buyers & Styles
              <Users className="w-3.5 h-3.5 text-indigo-400" />
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg font-black text-white font-mono">{hasFiles ? dynamicKpis.totalBuyers || 0 : 0}</span>
              <span className="text-xs text-slate-400">Buyers / {hasFiles ? dynamicKpis.totalStyles || 0 : 0} Styles</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5">Tracked Active Styles</span>
          </div>

          {/* PostgreSQL Records in DB */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              Database Persistence
              <Database className="w-3.5 h-3.5 text-emerald-400" />
            </span>
            <div className="mt-1 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${dbStats?.recordCount ? "bg-emerald-400 animate-ping" : "bg-slate-600"}`} />
              <span className="text-xs font-bold text-emerald-300">
                {dbStats?.recordCount ? `${dbStats.recordCount.toLocaleString()} Rows` : "0 Rows"}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5">Safe Transactional Sync</span>
          </div>
        </div>
      </section>

      {/* Navigation Tabs Bar */}
      <nav className="bg-slate-900 border-b border-slate-800 px-6 py-2 flex items-center justify-between gap-3 overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-1.5">
          {NAVIGATION_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? "bg-[#4a235a] text-white shadow-sm border border-purple-500/40"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Global Filter / Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter line, buyer, style..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 w-44 sm:w-60"
            />
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-y-auto">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Loading Production Monitoring Workbook...</p>
          </div>
        ) : !hasFiles && !["Import History", "Excel Import", "Data Management"].includes(activeTab) ? (
          <div className="h-[480px] flex items-center justify-center">
            <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center space-y-5 shadow-2xl shadow-purple-950/20">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/40 mx-auto flex items-center justify-center text-purple-400 shadow-lg">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white">No Production Workbook Active</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  There are currently no uploaded Excel files or database records. Select or upload an Excel workbook (.xlsb, .xlsx, .xlsm, .csv) to begin monitoring, or load the September&apos;26 reference workbook.
                </p>
              </div>
              <div className="space-y-2.5 pt-2">
                <Button
                  onClick={() => {
                    setUploadStep("UPLOAD");
                    setIsUploadOpen(true);
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs py-2.5 gap-2 shadow-lg shadow-purple-950"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload & Import New Workbook</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLoadReferenceWorkbook}
                  disabled={isSeedingReference}
                  className="w-full border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs py-2.5 gap-2"
                >
                  {isSeedingReference ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" /> : <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
                  <span>Load September&apos;26 Reference XLSB</span>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 1. EXECUTIVE SUMMARY TAB */}
            {activeTab === "Summary" && (
              <ExecutiveSummaryTab
                summarySheet={summarySheet}
                exportToCSV={exportToCSV}
              />
            )}

            {/* 2. DAILY PRODUCTION REPORT TAB */}
            {activeTab === "Report" && (
              <DailyProductionReportTab
                data={data}
                exportToCSV={exportToCSV}
              />
            )}

            {/* 3. ACTUAL PRODUCTION (DB) TAB */}
            {activeTab === "Actual" && (
              <ActualProductionTab
                data={data}
                dbStats={dbStats}
                exportToCSV={exportToCSV}
              />
            )}

            {/* 4. DYNAMIC SHEET VIEWER TAB (Universal 100% extraction for any sheet) */}
            {activeTab === "Dynamic Sheet" && (
              <UniversalSheetViewer
                data={data}
                selectedSheetName={selectedSheetName}
                onSelectSheetName={(name) => setSelectedSheetName(name)}
                exportToCSV={exportToCSV}
              />
            )}

            {/* 5. IMPORT HISTORY & BATCHES TAB */}
            {activeTab === "Import History" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Import History & Audit Log</span>
                      <Badge className="bg-purple-600/30 text-purple-300 border border-purple-500/40 text-[10px] font-mono">
                        {importHistoryList.length} Batches
                      </Badge>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Audit trail of all uploaded Excel files, processing status, and imported row counts with cascade delete support.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeleteErrorMessage(null);
                        setIsClearAllModalOpen(true);
                      }}
                      disabled={importHistoryList.length === 0}
                      className="border-rose-900/60 bg-rose-950/20 text-rose-300 hover:bg-rose-900/40 hover:text-white text-xs gap-1.5 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Clear All Batches</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchImportHistory}
                      className="border-slate-800 bg-slate-900 text-slate-300 hover:text-white text-xs gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? "animate-spin text-purple-400" : ""}`} />
                      <span>Refresh Logs</span>
                    </Button>
                  </div>
                </div>

                <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900 shadow-sm">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-xs text-left font-mono">
                      <thead className="bg-[#4a235a] text-white text-[11px] uppercase">
                        <tr>
                          <th className="py-2.5 px-4">Upload Date</th>
                          <th className="py-2.5 px-4">File Name</th>
                          <th className="py-2.5 px-3 text-center">Format</th>
                          <th className="py-2.5 px-3 text-right">File Size</th>
                          <th className="py-2.5 px-3 text-right">Sheets</th>
                          <th className="py-2.5 px-3 text-right text-emerald-300 font-bold">Imported Rows</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-4">Uploaded By</th>
                          <th className="py-2.5 px-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {importHistoryList.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-8 text-center text-slate-500 font-sans">
                              No previous import batches found.
                            </td>
                          </tr>
                        ) : (
                          importHistoryList.map((batch: any) => (
                            <tr key={batch.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-2 px-4 whitespace-nowrap text-slate-400">
                                {new Date(batch.createdAt).toLocaleString()}
                              </td>
                              <td className="py-2 px-4 font-bold text-white max-w-[280px] truncate" title={batch.fileName}>
                                {batch.fileName}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <Badge className="bg-slate-800 text-purple-300 text-[10px] uppercase font-mono">
                                  {batch.fileFormat}
                                </Badge>
                              </td>
                              <td className="py-2 px-3 text-right text-slate-300">{(batch.fileSize / 1024 / 1024).toFixed(2)} MB</td>
                              <td className="py-2 px-3 text-right text-slate-300">{batch.totalSheets}</td>
                              <td className="py-2 px-3 text-right font-bold text-emerald-300 font-mono">
                                {batch.importedRows?.toLocaleString() || batch._count?.monitoringRecords?.toLocaleString() || 0}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <Badge
                                  className={`text-[10px] uppercase font-mono ${
                                    batch.status === "COMPLETED"
                                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                      : batch.status === "IMPORTING" || batch.status === "PROCESSING"
                                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse"
                                      : "bg-slate-800 text-slate-300"
                                  }`}
                                >
                                  {batch.status}
                                </Badge>
                              </td>
                              <td className="py-2 px-4 text-slate-400">{batch.uploadedBy || "System Admin"}</td>
                              <td className="py-2 px-4 text-center whitespace-nowrap">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteBatch(batch)}
                                  className="h-7 px-2 text-rose-400 hover:text-rose-100 hover:bg-rose-950/70 border border-transparent hover:border-rose-800/60 rounded text-xs gap-1 transition-all"
                                  title="Delete file and cascade delete all its records"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                  <span className="font-semibold text-[11px]">Delete</span>
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 4. CLOCK HOURS & ATTENDANCE TAB */}
            {activeTab === "Clock hour" && (
              <ClockHourTab
                data={data}
                exportToCSV={exportToCSV}
              />
            )}

            {/* 5. VA TRACKER TAB */}
            {activeTab === "VA Tracker" && (
              <VaTrackerTab
                data={data}
                exportToCSV={exportToCSV}
              />
            )}

            {/* 6. EPMD ANALYSIS TAB */}
            {activeTab === "EPMD" && (
              <EpmdTab
                data={data}
                exportToCSV={exportToCSV}
              />
            )}

            {/* 7. LINE EFFICIENCY TAB */}
            {activeTab === "Line Efficiency" && (
              <LineEfficiencyTab
                data={data}
                exportToCSV={exportToCSV}
              />
            )}

            {/* 8. LOSS ANALYSIS TAB */}
            {activeTab === "Loss Analysis" && (
              <LossAnalysisTab
                data={data}
                exportToCSV={exportToCSV}
              />
            )}

            {/* 10. EXCEL IMPORT WORKFLOW TAB */}
            {activeTab === "Excel Import" && (
              <AiImportStudio
                onImportComplete={() => {
                  fetchData(selectedFileId || undefined);
                }}
              />
            )}

            {/* 11. DATA MANAGEMENT & CRUD TAB */}
            {activeTab === "Data Management" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Database Records & Cascade Management</span>
                      <Badge className="bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono">
                        {dbStats?.recordCount ? `${dbStats.recordCount.toLocaleString()} Rows` : "Active"}
                      </Badge>
                    </h2>
                    <p className="text-xs text-slate-400">
                      View all PostgreSQL persisted production monitoring rows with full audit trail and deletion controls.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeleteErrorMessage(null);
                        setIsClearAllModalOpen(true);
                      }}
                      disabled={!dbStats?.recordCount || dbStats.recordCount === 0}
                      className="border-rose-900/60 bg-rose-950/20 text-rose-300 hover:bg-rose-900/40 hover:text-white text-xs gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Purge All DB Records</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchData()}
                      className="border-slate-800 text-xs gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh</span>
                    </Button>
                  </div>
                </div>

                {/* DB Table Preview */}
                <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900 shadow-sm">
                  <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                    <table className="w-full text-xs text-left font-mono">
                      <thead className="bg-[#4a235a] text-white text-[11px] uppercase sticky top-0 z-10">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Unit-Line</th>
                          <th className="py-2.5 px-2 text-center">Cluster</th>
                          <th className="py-2.5 px-3">Buyer</th>
                          <th className="py-2.5 px-3">Style</th>
                          <th className="py-2.5 px-2 text-right">Actual Pcs</th>
                          <th className="py-2.5 px-2 text-right">Target Pcs</th>
                          <th className="py-2.5 px-2 text-right">Clock Hrs</th>
                          <th className="py-2.5 px-2 text-right font-bold">Eff%</th>
                          <th className="py-2.5 px-3 text-right">FOB Value</th>
                          <th className="py-2.5 px-3 text-right">VA Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {actualRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((rec: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="py-2 px-3 font-sans text-slate-300 whitespace-nowrap">{rec.dateString}</td>
                            <td className="py-2 px-3 font-sans font-bold text-sky-400 whitespace-nowrap">{rec.unitLine}</td>
                            <td className="py-2 px-2 text-center font-bold text-purple-300">{rec.cluster || "B1"}</td>
                            <td className="py-2 px-3 truncate max-w-[120px]">{rec.buyer || "-"}</td>
                            <td className="py-2 px-3 truncate max-w-[160px]">{rec.style || "-"}</td>
                            <td className="py-2 px-2 text-right font-bold text-emerald-400">{rec.actualQty?.toLocaleString() || 0}</td>
                            <td className="py-2 px-2 text-right text-slate-400">{rec.targetQty?.toLocaleString() || 0}</td>
                            <td className="py-2 px-2 text-right">{rec.clockHours || 0}</td>
                            <td className="py-2 px-2 text-right font-bold text-purple-300">{formatCell(rec.efficiency, true)}</td>
                            <td className="py-2 px-3 text-right font-mono">${(rec.fobValue || 0).toLocaleString()}</td>
                            <td className="py-2 px-3 text-right font-mono text-emerald-300">${(rec.vaValue || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Showing {Math.min(actualRecords.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(actualRecords.length, currentPage * itemsPerPage)} of {actualRecords.length.toLocaleString()} records
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-7 text-xs border-slate-800"
                      >
                        Previous
                      </Button>
                      <span className="font-mono text-white px-2">Page {currentPage} of {Math.ceil(actualRecords.length / itemsPerPage) || 1}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => p + 1)}
                        disabled={currentPage * itemsPerPage >= actualRecords.length}
                        className="h-7 text-xs border-slate-800"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Multi-Step Interactive Import Modal */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-4xl bg-slate-900 border-slate-800 text-slate-100 max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-purple-400" />
              <span>Production Excel Import & Validation Engine</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              {uploadStep === "UPLOAD" && "Step 1/3: Select any .xlsx, .xls, .xlsm, .xlsb, or .csv workbook."}
              {uploadStep === "MAPPING" && "Step 2/3: Select sheet and review auto-suggested column mappings."}
              {uploadStep === "VALIDATOR" && "Step 3/3: Inspect spreadsheet validation and confirm database save."}
            </DialogDescription>
          </DialogHeader>

          {/* Modal Content Steps */}
          <div className="flex-1 overflow-y-auto py-3 space-y-4 custom-scrollbar">
            {/* STEP 1: UPLOAD */}
            {uploadStep === "UPLOAD" && (
              <div className="space-y-4">
                <div
                  onClick={() => {
                    const input = document.getElementById("modal-file-upload-input");
                    if (input) input.click();
                  }}
                  className="border-2 border-dashed border-slate-700 hover:border-purple-500 rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-slate-950 cursor-pointer transition-all"
                >
                  <Upload className="w-10 h-10 text-purple-400" />
                  <p className="text-sm font-semibold text-slate-200">
                    {uploadFile ? uploadFile.name : "Click to select or drag and drop workbook file"}
                  </p>
                  <p className="text-xs text-slate-500">Supports .xlsb, .xlsx, .xlsm, .xls, .csv</p>
                  <input
                    id="modal-file-upload-input"
                    type="file"
                    accept=".xlsb,.xlsx,.xlsm,.xls,.csv"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setUploadFile(e.target.files[0]);
                    }}
                    className="hidden"
                  />
                </div>

                {uploadError && (
                  <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: COLUMN MAPPING */}
            {uploadStep === "MAPPING" && analyzedWorkbook && (
              <div className="space-y-4">
                {/* Worksheet Selector */}
                <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-300">Target Worksheet:</span>
                    <select
                      value={selectedMappingSheet}
                      onChange={(e) => {
                        const newSheet = e.target.value;
                        setSelectedMappingSheet(newSheet);
                        const sInfo = analyzedWorkbook.sheets?.find((s: any) => s.sheetName === newSheet);
                        if (sInfo) setColumnMappings(sInfo.suggestedMappings || {});
                      }}
                      className="bg-slate-900 border border-slate-700 text-xs rounded px-3 py-1 text-white font-semibold focus:outline-none focus:border-purple-500"
                    >
                      {analyzedWorkbook.sheets?.map((s: any) => (
                        <option key={s.sheetName} value={s.sheetName}>
                          {s.sheetName} ({s.rowCount} rows, {s.colCount} cols)
                        </option>
                      ))}
                    </select>
                  </div>
                  <Badge className="bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs">
                    {analyzedWorkbook.totalSheets} Total Sheets Detected
                  </Badge>
                </div>

                {/* Mapping Grid */}
                <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                  <div className="bg-[#4a235a] text-white px-4 py-2 text-xs font-bold flex items-center justify-between">
                    <span>Source Column</span>
                    <span>Database Field Destination</span>
                  </div>
                  <div className="divide-y divide-slate-800 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {(() => {
                      const curSheet = analyzedWorkbook.sheets?.find((s: any) => s.sheetName === selectedMappingSheet);
                      const headers = curSheet?.headers || [];
                      return headers.map((header: string, idx: number) => (
                        <div key={idx} className="flex items-center justify-between px-4 py-2 text-xs hover:bg-slate-900/60">
                          <span className="font-mono text-slate-200 font-semibold">{header}</span>
                          <select
                            value={columnMappings[header] || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setColumnMappings((prev) => ({ ...prev, [header]: val }));
                            }}
                            className="bg-slate-900 border border-slate-800 text-xs rounded px-2.5 py-1 text-sky-400 focus:outline-none focus:border-purple-500 w-64"
                          >
                            <option value="">-- Skip / Unmapped --</option>
                            {PRODUCTION_SCHEMA_FIELDS.map((field) => (
                              <option key={field.key} value={field.key}>
                                {field.label} {field.required ? "(Required)" : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: SPREADSHEET PREVIEW & VALIDATOR */}
            {uploadStep === "VALIDATOR" && (
              <div className="space-y-4">
                {/* Validator Stats Bar */}
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <button
                    onClick={() => setValidatorFilter("ALL")}
                    className={`p-2.5 rounded border text-left transition-all ${
                      validatorFilter === "ALL" ? "bg-slate-800 border-purple-500 text-white" : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    <span className="text-slate-500 text-[10px]">Total Scanned:</span>
                    <p className="text-sm font-bold font-mono text-white">{validatorStats.total.toLocaleString()}</p>
                  </button>
                  <button
                    onClick={() => setValidatorFilter("VALID")}
                    className={`p-2.5 rounded border text-left transition-all ${
                      validatorFilter === "VALID" ? "bg-emerald-950/40 border-emerald-500 text-emerald-300" : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    <span className="text-slate-500 text-[10px]">Valid Rows:</span>
                    <p className="text-sm font-bold font-mono text-emerald-400">{validatorStats.valid.toLocaleString()}</p>
                  </button>
                  <button
                    onClick={() => setValidatorFilter("WARNING")}
                    className={`p-2.5 rounded border text-left transition-all ${
                      validatorFilter === "WARNING" ? "bg-amber-950/40 border-amber-500 text-amber-300" : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    <span className="text-slate-500 text-[10px]">Warnings:</span>
                    <p className="text-sm font-bold font-mono text-amber-400">{validatorStats.warning.toLocaleString()}</p>
                  </button>
                  <button
                    onClick={() => setValidatorFilter("ERROR")}
                    className={`p-2.5 rounded border text-left transition-all ${
                      validatorFilter === "ERROR" ? "bg-rose-950/40 border-rose-500 text-rose-300" : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    <span className="text-slate-500 text-[10px]">Errors:</span>
                    <p className="text-sm font-bold font-mono text-rose-400">{validatorStats.error.toLocaleString()}</p>
                  </button>
                </div>

                {/* Spreadsheet Validator Table */}
                <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                  <div className="overflow-x-auto max-h-[300px] custom-scrollbar">
                    <table className="w-full text-xs text-left font-mono">
                      <thead className="bg-[#4a235a] text-white text-[11px] uppercase sticky top-0 z-10">
                        <tr>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3">Line #</th>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Unit-Line</th>
                          <th className="py-2 px-3">Buyer</th>
                          <th className="py-2 px-3">Style</th>
                          <th className="py-2 px-2 text-right">Pcs</th>
                          <th className="py-2 px-2 text-right">Clock Hrs</th>
                          <th className="py-2 px-2 text-right">Eff%</th>
                          <th className="py-2 px-4">Validation Messages</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {validatedRows
                          .filter((r) => (validatorFilter === "ALL" ? true : r.status === validatorFilter))
                          .slice(0, 100)
                          .map((row: any, idx: number) => {
                            const p = row.parsed;
                            return (
                              <tr key={idx} className="hover:bg-slate-900/60">
                                <td className="py-1.5 px-3">
                                  {row.status === "VALID" && (
                                    <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
                                      VALID
                                    </Badge>
                                  )}
                                  {row.status === "WARNING" && (
                                    <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px]">
                                      WARNING
                                    </Badge>
                                  )}
                                  {row.status === "ERROR" && (
                                    <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px]">
                                      ERROR
                                    </Badge>
                                  )}
                                </td>
                                <td className="py-1.5 px-3 text-slate-500">{row.sourceRowIndex}</td>
                                <td className="py-1.5 px-3 text-slate-200">{p?.dateString || "-"}</td>
                                <td className="py-1.5 px-3 font-bold text-sky-400">{p?.unitLine || "-"}</td>
                                <td className="py-1.5 px-3 truncate max-w-[120px]">{p?.buyer || "-"}</td>
                                <td className="py-1.5 px-3 truncate max-w-[160px]">{p?.style || "-"}</td>
                                <td className="py-1.5 px-2 text-right font-bold text-emerald-300">{p?.actualQty?.toLocaleString() || 0}</td>
                                <td className="py-1.5 px-2 text-right">{p?.clockHours || 0}</td>
                                <td className="py-1.5 px-2 text-right font-bold text-purple-300">{formatCell(p?.efficiency, true)}</td>
                                <td className="py-1.5 px-4 text-[10px] text-slate-400">
                                  {row.errors?.length > 0 ? (
                                    <span className="text-rose-400 font-semibold">{row.errors.join(", ")}</span>
                                  ) : row.warnings?.length > 0 ? (
                                    <span className="text-amber-400">{row.warnings.join(", ")}</span>
                                  ) : (
                                    <span className="text-emerald-400">Ready for save</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Import Mode Selector */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Database Save Mode:</label>
                  <select
                    value={importMode}
                    onChange={(e: any) => setImportMode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="INSERT_UPDATE">Insert New & Update Matching Records (Recommended)</option>
                    <option value="INSERT_NEW">Insert New Records Only (Skip duplicates)</option>
                    <option value="UPDATE_ONLY">Update Matching Records Only</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 border-t border-slate-800 pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsUploadOpen(false)}
              className="text-xs text-slate-400"
            >
              Cancel
            </Button>
            {uploadStep === "UPLOAD" && (
              <Button
                size="sm"
                onClick={handleAnalyzeUpload}
                disabled={!uploadFile || uploading}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs gap-1.5"
              >
                {uploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Analyze Workbook</span>
              </Button>
            )}
            {uploadStep === "MAPPING" && (
              <Button
                size="sm"
                onClick={handleRunValidator}
                disabled={uploading}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs gap-1.5"
              >
                {uploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                <span>Preview & Validate Rows</span>
              </Button>
            )}
            {uploadStep === "VALIDATOR" && (
              <Button
                size="sm"
                onClick={handleExecuteCommit}
                disabled={uploading || validatorStats.valid === 0}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5"
              >
                {uploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                <span>Save Validated Records to PostgreSQL</span>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Single Batch Confirmation Modal */}
      <Dialog open={isDeleteBatchModalOpen} onOpenChange={setIsDeleteBatchModalOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-rose-900/50 text-slate-100 shadow-2xl shadow-rose-950/30">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-white">
                  Delete Import Batch & Records
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Permanently delete this file and cascade all associated database records.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            {/* File Details Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2 font-sans">
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-400 shrink-0">File Name:</span>
                <span className="font-semibold text-white truncate max-w-[220px] text-right font-mono text-[11px]" title={batchToDelete?.fileName}>
                  {batchToDelete?.fileName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Upload Date:</span>
                <span className="text-slate-300 font-mono text-[11px]">
                  {batchToDelete?.createdAt ? new Date(batchToDelete.createdAt).toLocaleString() : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Format & Size:</span>
                <span className="text-purple-300 font-mono text-[11px]">
                  {batchToDelete?.fileFormat} • {((batchToDelete?.fileSize || 0) / 1024 / 1024).toFixed(2)} MB • {batchToDelete?.totalSheets || 0} sheets
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
                <span className="text-slate-400 font-medium">Associated DB Rows:</span>
                <span className="font-bold font-mono text-rose-400 text-xs">
                  {batchToDelete?.importedRows?.toLocaleString() || batchToDelete?._count?.monitoringRecords?.toLocaleString() || 0} Records
                </span>
              </div>
            </div>

            {/* Warning Alert Banner */}
            <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-200 text-xs flex gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-rose-300">Cascade Deletion Warning:</p>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Deleting this file will permanently wipe the file upload record, all associated Production Monitoring records, Clock Hour records, Loss Analysis records, and sheet validation caches from PostgreSQL. This action cannot be undone.
                </p>
              </div>
            </div>

            {deleteErrorMessage && (
              <div className="p-2.5 rounded bg-red-900/40 border border-red-700 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{deleteErrorMessage}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-slate-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteBatchModalOpen(false)}
              disabled={isDeletingBatch}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmDeleteBatch}
              disabled={isDeletingBatch}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs gap-1.5 font-semibold shadow-md shadow-rose-950 transition-all"
            >
              {isDeletingBatch ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>{isDeletingBatch ? "Deleting File & Records..." : "Yes, Delete File & Cascade"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear All Batches Confirmation Modal */}
      <Dialog open={isClearAllModalOpen} onOpenChange={setIsClearAllModalOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-rose-900/60 text-slate-100 shadow-2xl shadow-rose-950/40">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-white">
                  Clear All Batches & Purge Database
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Complete wipe of all uploaded Excel files and all stored production records.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-600/50 text-rose-200 text-xs flex gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="font-bold text-rose-300">Are you absolutely sure?</p>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  This action will permanently delete <span className="text-white font-bold">{importHistoryList.length}</span> file batches and
                  all associated production records ({dbStats?.recordCount ? `${dbStats.recordCount.toLocaleString()}` : "all"} rows) from the PostgreSQL database.
                </p>
                <p className="text-rose-400 font-semibold text-[11px]">
                  This operation cannot be reversed.
                </p>
              </div>
            </div>

            {deleteErrorMessage && (
              <div className="p-2.5 rounded bg-red-900/40 border border-red-700 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{deleteErrorMessage}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-slate-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsClearAllModalOpen(false)}
              disabled={isClearingAll}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmClearAll}
              disabled={isClearingAll}
              className="bg-rose-700 hover:bg-rose-600 text-white text-xs gap-1.5 font-bold shadow-lg shadow-rose-950 transition-all"
            >
              {isClearingAll ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>{isClearingAll ? "Purging Entire Database..." : "Confirm & Delete Everything"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
