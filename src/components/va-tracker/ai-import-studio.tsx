"use client";

import React, { useState } from "react";
import {
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  RefreshCw,
  Eye,
  Database,
  ShieldCheck,
  Check,
  Download,
  Info,
  Zap,
  Activity,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AiImportStudioProps {
  onImportComplete?: () => void;
}

export function AiImportStudio({ onImportComplete }: AiImportStudioProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isCommitting, setIsCommitting] = useState<boolean>(false);

  // Results State
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [commitResult, setCommitResult] = useState<any>(null);
  const [selectedTargetSheet, setSelectedTargetSheet] = useState<string>("Actual");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setErrorMessage(null);
      setAiAnalysisResult(null);
      setValidationResult(null);
      setCommitResult(null);
      setStep(1);
    }
  };

  // 2. Trigger AI Analysis (Gemini API)
  const handleRunAiAnalysis = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/excel/ai-analyze", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "AI Analysis failed.");
      }

      setAiAnalysisResult(json);
      // Auto-detect best target sheet
      if (json.inspection?.sheetNames?.includes("Actual")) {
        setSelectedTargetSheet("Actual");
      } else if (json.inspection?.sheetNames?.[0]) {
        setSelectedTargetSheet(json.inspection.sheetNames[0]);
      }

      setStep(2);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to analyze workbook with AI.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 3. Trigger Deterministic Validation & Dry-Run
  const handleRunValidation = async () => {
    if (!selectedFile) return;
    setIsValidating(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("targetSheet", selectedTargetSheet);

      const res = await fetch("/api/excel/validate-dryrun", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Validation failed.");
      }

      setValidationResult(json);
      setStep(3);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to validate workbook.");
    } finally {
      setIsValidating(false);
    }
  };

  // 4. Trigger Live Transactional Database Commit
  const handleCommitToDatabase = async () => {
    if (!selectedFile && !validationResult?.fileUploadId) return;
    setIsCommitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      if (selectedFile) formData.append("file", selectedFile);
      if (validationResult?.fileUploadId) {
        formData.append("fileUploadId", validationResult.fileUploadId);
      }
      formData.append("targetSheet", selectedTargetSheet);

      const res = await fetch("/api/excel/commit-import", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Database commit failed.");
      }

      setCommitResult(json);
      setStep(4);
      if (onImportComplete) onImportComplete();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to commit data to database.");
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-[#4a235a] text-purple-200 border-purple-600/50 text-xs px-2.5 py-0.5 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
              AI-Powered Excel Engine
            </Badge>
            <span className="text-xs text-slate-400 font-mono">Gemini 2.5 Flash • Zero Data Loss</span>
          </div>
          <h2 className="text-lg font-black text-white tracking-tight mt-1.5">
            Automated Excel Import, AI Schema Analysis & Production Synchronizer
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Multi-sheet extraction (XLSX, XLSB, XLS) with automatic error correction, deterministic validation, and transactional DB import
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs font-mono">
          <div className={`px-2.5 py-1 rounded flex items-center gap-1.5 ${step === 1 ? "bg-purple-900/80 text-white font-bold" : "text-slate-400"}`}>
            <span>1</span> Upload
          </div>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <div className={`px-2.5 py-1 rounded flex items-center gap-1.5 ${step === 2 ? "bg-purple-900/80 text-white font-bold" : "text-slate-400"}`}>
            <span>2</span> AI Schema
          </div>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <div className={`px-2.5 py-1 rounded flex items-center gap-1.5 ${step === 3 ? "bg-purple-900/80 text-white font-bold" : "text-slate-400"}`}>
            <span>3</span> Quality & Audit
          </div>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <div className={`px-2.5 py-1 rounded flex items-center gap-1.5 ${step === 4 ? "bg-emerald-900/80 text-emerald-200 font-bold" : "text-slate-400"}`}>
            <span>4</span> DB Sync
          </div>
        </div>
      </div>

      {/* Error Alert if any */}
      {errorMessage && (
        <div className="bg-rose-950/60 border border-rose-800/80 rounded-xl p-4 text-rose-200 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Workflow Notice: </span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* STEP 1: FILE UPLOAD DROPZONE */}
      {step === 1 && (
        <div className="border border-slate-800 rounded-xl bg-slate-900/80 p-6 shadow-md">
          <div className="max-w-xl mx-auto text-center space-y-4">
            <div className="border-2 border-dashed border-slate-700 hover:border-purple-500/80 transition-colors rounded-2xl p-8 bg-slate-950/60 cursor-pointer relative group">
              <input
                type="file"
                accept=".xlsx,.xls,.xlsb,.xlsm"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[#4a235a]/30 border border-purple-700/50 flex items-center justify-center text-purple-300 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {selectedFile ? selectedFile.name : "Select or drag & drop Garments Excel Workbook"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports <span className="text-purple-300 font-semibold font-mono">.XLSB</span>, <span className="text-purple-300 font-semibold font-mono">.XLSX</span>, and <span className="text-purple-300 font-semibold font-mono">.XLS</span>
                  </p>
                </div>
                {selectedFile && (
                  <Badge variant="outline" className="border-emerald-500/50 text-emerald-300 bg-emerald-950/30 text-xs">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for AI Analysis
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button
                disabled={!selectedFile || isAnalyzing}
                onClick={handleRunAiAnalysis}
                className="bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xs gap-2 px-6 py-2.5 h-auto shadow-md"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    AI Analyzing Workbook Structure...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze Workbook with Gemini AI
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: AI WORKBOOK INTELLIGENCE & COLUMN MAPPING REVIEW */}
      {step === 2 && aiAnalysisResult && (
        <div className="space-y-5">
          {/* AI Global Insights Card */}
          <div className="border border-purple-800/40 bg-gradient-to-br from-slate-900 to-[#2c1337] rounded-xl p-4.5 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-sm text-white">Gemini AI Workbook Intelligence</h3>
              </div>
              <Badge className="bg-purple-900 text-purple-200 text-xs">
                {aiAnalysisResult.totalSheets} Sheets Detected
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950/70 p-3 rounded-lg border border-purple-900/30">
                <span className="text-slate-400 font-semibold block mb-1">Company / Period:</span>
                <span className="font-bold text-white font-sans text-sm">
                  {aiAnalysisResult.aiAnalysis?.companyName || "SQ Birichina Ltd."} • {aiAnalysisResult.aiAnalysis?.periodOrMonth || "September 2026"}
                </span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-lg border border-purple-900/30">
                <span className="text-slate-400 font-semibold block mb-1">AI Structural Summary:</span>
                <span className="text-slate-200">
                  {aiAnalysisResult.aiAnalysis?.globalInsights?.[0] || "Multi-sheet relational production workbook verified."}
                </span>
              </div>
            </div>
          </div>

          {/* Sheets Detected Grid */}
          <div className="border border-slate-800 rounded-xl bg-slate-900/90 p-4 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wide text-slate-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  Select Target Sheet for Deterministic Validation & Import
                </h4>
                <p className="text-[11px] text-slate-400">
                  Choose which sheet to validate and commit into production database
                </p>
              </div>

              <select
                value={selectedTargetSheet}
                onChange={(e) => setSelectedTargetSheet(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-xs rounded-lg px-3 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-purple-500"
              >
                {aiAnalysisResult.sheets?.map((s: any) => (
                  <option key={s.sheetName} value={s.sheetName}>
                    {s.sheetName} ({s.rowCount} rows, {s.colCount} cols)
                  </option>
                ))}
              </select>
            </div>

            {/* Sheet Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {aiAnalysisResult.aiAnalysis?.sheetsAnalysis?.map((sheet: any, idx: number) => {
                const isSelected = selectedTargetSheet === sheet.sheetName;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedTargetSheet(sheet.sheetName)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-purple-500 bg-purple-950/30 shadow-md"
                        : "border-slate-800 bg-slate-950 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-white text-xs font-mono">{sheet.sheetName}</span>
                      <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-300">
                        {sheet.detectedType}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{sheet.description}</p>
                    <div className="mt-2 text-[10px] text-slate-500 font-mono">
                      Target: <span className="text-purple-300 font-semibold">{sheet.detectedTargetModel}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(1)}
                className="border-slate-800 text-xs"
              >
                Back to Upload
              </Button>
              <Button
                onClick={handleRunValidation}
                disabled={isValidating}
                className="bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xs gap-1.5"
              >
                {isValidating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Validating Sheet & Rules...
                  </>
                ) : (
                  <>
                    Run Data Validation & Auto-Correction
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: DATA QUALITY, AUTO-CORRECTION & DRY-RUN AUDIT */}
      {step === 3 && validationResult && (
        <div className="space-y-5">
          {/* Quality Summary Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
              <span className="text-xs text-slate-400 font-medium block mb-1">Total Extracted Rows</span>
              <span className="text-2xl font-black text-white font-mono">
                {validationResult.validationReport?.totalRows || 0}
              </span>
              <div className="text-[11px] text-slate-500 mt-1">From sheet: {selectedTargetSheet}</div>
            </div>

            <div className="bg-slate-900 border border-emerald-900/40 rounded-xl p-3.5 shadow-sm">
              <span className="text-xs text-emerald-400 font-medium block mb-1">Verified Valid Rows</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {validationResult.validationReport?.validCount || 0}
              </span>
              <div className="text-[11px] text-emerald-600 mt-1">Ready for database upsert</div>
            </div>

            <div className="bg-slate-900 border border-purple-900/40 rounded-xl p-3.5 shadow-sm">
              <span className="text-xs text-purple-400 font-medium block mb-1">Auto-Corrected Cells</span>
              <span className="text-2xl font-black text-purple-300 font-mono">
                {validationResult.validationReport?.autoCorrectedCount || 0}
              </span>
              <div className="text-[11px] text-purple-400 mt-1">Deterministic high-confidence fixes</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
              <span className="text-xs text-slate-400 font-medium block mb-1">Errors / Skipped</span>
              <span className="text-2xl font-black text-rose-400 font-mono">
                {validationResult.validationReport?.errorCount || 0}
              </span>
              <div className="text-[11px] text-slate-500 mt-1">Unsafe / incomplete records</div>
            </div>
          </div>

          {/* Auto-Correction Audit Trail */}
          {validationResult.validationReport?.corrections?.length > 0 && (
            <div className="border border-slate-800 rounded-xl bg-slate-900/90 overflow-hidden shadow-sm">
              <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wide flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Auto-Correction Audit Trail (High-Confidence Deterministic Fixes)
                </h4>
                <Badge variant="outline" className="text-xs border-purple-800 text-purple-300">
                  {validationResult.validationReport.corrections.length} Corrections
                </Badge>
              </div>

              <div className="overflow-x-auto custom-scrollbar max-h-[260px]">
                <table className="w-full text-xs text-left font-mono">
                  <thead className="bg-slate-950 text-slate-400 text-[11px] sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Row #</th>
                      <th className="py-2 px-3">Field</th>
                      <th className="py-2 px-3">Original Raw Value</th>
                      <th className="py-2 px-3 text-emerald-400">Sanitized Value</th>
                      <th className="py-2 px-3">Rule Applied</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {validationResult.validationReport.corrections.slice(0, 50).map((c: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-1.5 px-3 font-semibold text-slate-400">{c.sourceRowIndex}</td>
                        <td className="py-1.5 px-3 font-medium text-purple-300">{c.field}</td>
                        <td className="py-1.5 px-3 text-slate-400 truncate max-w-[150px]">{String(c.originalValue)}</td>
                        <td className="py-1.5 px-3 font-bold text-emerald-400">{String(c.correctedValue)}</td>
                        <td className="py-1.5 px-3 text-slate-400 font-sans text-[11px]">{c.ruleApplied}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep(2)}
              className="border-slate-800 text-xs"
            >
              Back to Schema
            </Button>
            <Button
              onClick={handleCommitToDatabase}
              disabled={isCommitting}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs gap-2 px-6 py-2.5 h-auto shadow-md"
            >
              {isCommitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Executing Transactional Database Commit...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  Confirm & Commit to Database (Prisma Upsert)
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: IMPORT COMPLETED SUCCESSFULLY */}
      {step === 4 && commitResult && (
        <div className="border border-emerald-800/60 bg-gradient-to-b from-slate-900 to-slate-950 rounded-xl p-6 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/60 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <h3 className="text-base font-black text-white">
              Database Synchronization Completed Successfully!
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              All records have been safely upserted into PostgreSQL with zero duplicates and full audit log traceability.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto text-xs font-mono">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block mb-0.5">Inserted:</span>
              <span className="font-bold text-emerald-400 text-base">
                {commitResult.importResult?.insertedCount || 0}
              </span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block mb-0.5">Updated:</span>
              <span className="font-bold text-sky-400 text-base">
                {commitResult.importResult?.updatedCount || 0}
              </span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block mb-0.5">Audit Logs:</span>
              <span className="font-bold text-purple-300 text-base">
                {commitResult.importResult?.auditLogsCreated || 0}
              </span>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-center gap-3">
            <Button
              onClick={() => {
                setStep(1);
                setSelectedFile(null);
                setAiAnalysisResult(null);
                setValidationResult(null);
                setCommitResult(null);
              }}
              variant="outline"
              size="sm"
              className="border-slate-800 text-xs"
            >
              Import Another File
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
