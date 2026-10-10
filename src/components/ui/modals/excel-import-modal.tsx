"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Check,
  Activity,
  Layers3,
  FileCheck2,
  ArrowRight
} from "lucide-react";

interface PlanItem {
  id: string;
  fileName: string;
  month: string;
  ordersCount: number;
  totalPlanQty: number;
  totalSah: number;
  createdAt: string;
}

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: (result?: any) => void;
}

export function ExcelImportModal({ isOpen, onClose, onImportSuccess }: ExcelImportModalProps) {
  // Mode: "PLAN" or "ACTUAL"
  const [activeMode, setActiveMode] = React.useState<"PLAN" | "ACTUAL">("ACTUAL");
  
  // Plans list
  const [availablePlans, setAvailablePlans] = React.useState<PlanItem[]>([]);
  const [loadingPlans, setLoadingPlans] = React.useState<boolean>(false);
  const [selectedPlanId, setSelectedPlanId] = React.useState<string>("");

  // File upload state
  const [file, setFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadStep, setUploadStep] = React.useState<number>(1);
  const [importResult, setImportResult] = React.useState<any | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Load available plans
  const loadPlans = React.useCallback(async () => {
    setLoadingPlans(true);
    try {
      const res = await fetch("/api/excel/plans");
      if (res.ok) {
        const data: PlanItem[] = await res.json();
        setAvailablePlans(data);
        if (data.length > 0 && !selectedPlanId) {
          setSelectedPlanId(data[0].id);
        }
      }
    } catch (err) {
    } finally {
      setLoadingPlans(false);
    }
  }, [selectedPlanId]);

  React.useEffect(() => {
    if (isOpen) {
      loadPlans();
      handleReset();
    }
  }, [isOpen, loadPlans]);

  const validateFile = (selectedFile: File): boolean => {
    const lowerName = selectedFile.name.toLowerCase();
    if (activeMode === 'ACTUAL') {
      if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.xlsb')) {
        return true;
      }
      setErrorMsg('Please select a valid Actual Tracker file (.xlsx, .xls, or .xlsb)');
      return false;
    } else {
      if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
        return true;
      }
      setErrorMsg('Production Plan only accepts standard Excel files (.xlsx or .xls). .xlsb is not supported for plans.');
      return false;
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        setErrorMsg(null);
        setImportResult(null);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        setErrorMsg(null);
        setImportResult(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    if (activeMode === "ACTUAL" && !selectedPlanId && availablePlans.length > 0) {
      setErrorMsg("Please select the target plan to link this actual production data to.");
      return;
    }

    setIsUploading(true);
    setUploadStep(1);
    setErrorMsg(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const endpoint = activeMode === 'ACTUAL' ? '/api/excel/import-actual' : '/api/excel/import';
      if (activeMode === 'ACTUAL' && selectedPlanId) {
        formData.append('planBatchId', selectedPlanId);
      }

      const stepTimer = setTimeout(() => {
        setUploadStep(2);
      }, 1200);

      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      clearTimeout(stepTimer);

      let data: any = null;
      const text = await res.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: text || `Server error (${res.status} ${res.statusText})` };
      }

      if (!res.ok) {
        throw new Error(data?.error || `Failed to import Excel file (${res.status} ${res.statusText})`);
      }

      setImportResult(data);
      loadPlans();
      onImportSuccess?.(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while uploading Excel file');
    } finally {
      setIsUploading(false);
      setUploadStep(1);
    }
  };

  const handleReset = () => {
    setFile(null);
    setImportResult(null);
    setErrorMsg(null);
  };

  const selectedPlan = availablePlans.find(p => p.id === selectedPlanId);
  const v = importResult?.verification;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
            <UploadCloud className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            Production Excel Import Center
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Select what you want to upload: a base <b>Production Plan</b> or <b>Daily Actual Output Tracker</b>.
          </DialogDescription>
        </DialogHeader>

        {/* Mode Selector */}
        {!importResult && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl my-2">
            <button
              type="button"
              onClick={() => { setActiveMode("ACTUAL"); handleReset(); }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                activeMode === "ACTUAL"
                  ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>1. Upload Actual Production</span>
              <Badge variant="secondary" className="text-[10px] bg-sky-100 text-sky-700 py-0 px-1">Daily Tracker</Badge>
            </button>

            <button
              type="button"
              onClick={() => { setActiveMode("PLAN"); handleReset(); }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                activeMode === "PLAN"
                  ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Layers3 className="h-4 w-4" />
              <span>2. Upload Production Plan</span>
              <Badge variant="secondary" className="text-[10px] bg-purple-100 text-purple-700 py-0 px-1">Sign-Off</Badge>
            </button>
          </div>
        )}

        <div className="space-y-4 py-1">
          {!importResult ? (
            <>
              {/* If ACTUAL mode, Step 1 is selecting which Plan to link */}
              {activeMode === "ACTUAL" && (
                <div className="space-y-2 rounded-xl border border-sky-200 bg-sky-50/50 p-3.5 dark:border-sky-900/60 dark:bg-sky-950/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                      <FileCheck2 className="h-4 w-4 text-sky-600" />
                      Step 1: Select Plan to Map this Actual Production Against:
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-white text-sky-700 border-sky-300">
                      Required
                    </Badge>
                  </div>

                  {loadingPlans ? (
                    <div className="p-3 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Loading available plans...
                    </div>
                  ) : availablePlans.length > 0 ? (
                    <div className="space-y-2 mt-2">
                      {availablePlans.map((plan) => {
                        const isSelected = selectedPlanId === plan.id;
                        return (
                          <div
                            key={plan.id}
                            onClick={() => setSelectedPlanId(plan.id)}
                            className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? "bg-white dark:bg-slate-900 border-sky-500 shadow-xs ring-2 ring-sky-500/20"
                                : "bg-white/80 dark:bg-slate-900/60 border-slate-200 hover:border-sky-300"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                isSelected ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-500"
                              }`}>
                                <FileSpreadsheet className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                  {plan.fileName}
                                </p>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                  <span className="font-semibold text-sky-600 dark:text-sky-400">{plan.month}</span>
                                  <span>•</span>
                                  <span>{plan.ordersCount.toLocaleString()} Orders</span>
                                  {plan.totalPlanQty > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="font-mono">{(plan.totalPlanQty / 1000).toFixed(0)}k Planned PCS</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                              isSelected ? "border-sky-600 bg-sky-600 text-white" : "border-slate-300"
                            }`}>
                              {isSelected && <Check className="h-3 w-3" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 text-amber-800 dark:text-amber-200 text-xs">
                      <p className="font-semibold">⚠️ No Plan files found in database.</p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                        Please upload a <b>Production Plan</b> first, so actual production metrics can be mapped against targets.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setActiveMode("PLAN")}
                        className="mt-2 bg-amber-600 hover:bg-amber-700 text-white text-xs h-7 gap-1"
                      >
                        <Layers3 className="h-3.5 w-3.5" /> Upload Production Plan First
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2 / File Upload Zone */}
              <div className="space-y-1.5">
                {activeMode === "ACTUAL" && (
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <ArrowRight className="h-3.5 w-3.5 text-sky-600" />
                    Step 2: Upload Daily Floor Actual Output Excel:
                  </span>
                )}

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
                    file
                      ? activeMode === "ACTUAL"
                        ? "border-sky-500 bg-sky-50/50 dark:bg-sky-950/20"
                        : "border-purple-500 bg-purple-50/50 dark:bg-purple-950/20"
                      : "border-slate-300 hover:border-sky-400 hover:bg-slate-50/50 dark:border-slate-700 dark:hover:bg-slate-800/40"
                  }`}
                  onClick={() => document.getElementById('excel-file-input')?.click()}
                >
                  <input
                    id="excel-file-input"
                    type="file"
                    accept={activeMode === "ACTUAL" ? ".xlsx, .xls, .xlsb" : ".xlsx, .xls"}
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  <div className={`flex h-12 w-12 items-center justify-center rounded-full mb-3 ${
                    activeMode === "ACTUAL"
                      ? "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400"
                      : "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
                  }`}>
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>

                  {file ? (
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{file.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <Badge className={`mt-2 text-[10px] text-white ${activeMode === "ACTUAL" ? "bg-sky-600" : "bg-purple-600"}`}>
                        Ready for Automated Matching & Ingestion
                      </Badge>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Drag & Drop {activeMode === "ACTUAL" ? "Actual Floor Tracker Excel (.xlsx / .xlsb)" : "Plan Excel (.xlsx)"} here, or <span className="text-sky-600 dark:text-sky-400 underline">Browse</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {activeMode === "ACTUAL"
                          ? "Supports .xlsx, .xls, .xlsb • Ensure sheets are Unhidden • Matches Date, Cluster, Unit, Line, Pcs, MO"
                          : "Supports .xlsx, .xls • Ensure master sheet is Unhidden • Extracts Line Targets, Styles, Buyers, OCs"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Steps Visualizer when uploading */}
              {isUploading && (
                <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-sky-900">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-sky-600" />
                      {uploadStep === 1
                        ? "Step 1/2: Parsing Excel & Matching against Selected Plan..."
                        : "Step 2/2: Computing Actual Output, Line Variances & Efficiencies..."}
                    </span>
                    <span className="text-[11px] text-sky-700">{uploadStep === 1 ? "50%" : "95%"}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-sky-200">
                    <div
                      className="h-full bg-sky-600 transition-all duration-500"
                      style={{ width: uploadStep === 1 ? "50%" : "95%" }}
                    />
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </>
          ) : (
            /* Results & Verification Card */
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50/80 p-3.5 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800">
                <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-100">
                    Import & Matching Verified (100% Data Integrity)
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {importResult.message}
                  </p>
                </div>
              </div>

              {/* Statistics Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-900">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block">Total Output</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {activeMode === "ACTUAL"
                      ? `${(importResult.totalActualPcs || 0).toLocaleString()} Pcs`
                      : `${(importResult.totalPlanQty || 0).toLocaleString()} Pcs`}
                  </span>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-900">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                    {activeMode === "ACTUAL" ? "Floor Efficiency" : "Total SAH"}
                  </span>
                  <span className="text-sm font-bold text-sky-600 dark:text-sky-400">
                    {activeMode === "ACTUAL"
                      ? `${importResult.overallEfficiency || 0}%`
                      : `${Math.round(importResult.totalSah || 0).toLocaleString()} SAH`}
                  </span>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-900">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block">Active Lines</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {importResult.linesCount} Lines
                  </span>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-900">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block">Active Dates</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {importResult.datesCount || importResult.verification?.datesCount || "All Month"}
                  </span>
                </div>
              </div>

              {/* Audit Checks Checklist */}
              {v?.checks && (
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <h5 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    System Audit Checklist
                  </h5>
                  <div className="space-y-1.5">
                    {v.checks.map((chk: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                        <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          {chk.name}
                        </span>
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                          {chk.actual}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100 dark:border-slate-800">
          {!importResult ? (
            <>
              <Button variant="outline" size="sm" onClick={onClose} disabled={isUploading}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleUpload}
                disabled={!file || isUploading || (activeMode === "ACTUAL" && availablePlans.length === 0)}
                className={activeMode === "ACTUAL" ? "bg-sky-600 hover:bg-sky-700 text-white" : "bg-purple-600 hover:bg-purple-700 text-white"}
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <UploadCloud className="mr-1.5 h-3.5 w-3.5" />
                    {activeMode === "ACTUAL" ? "Match & Ingest Actuals" : "Import Production Plan"}
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                handleReset();
                onClose();
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Done & Refresh Dashboard
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
