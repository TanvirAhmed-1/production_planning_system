"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExcelLogsSkeleton } from "./excel-logs-skeleton";
import {
  FileSpreadsheet,
  History,
  RefreshCw,
  Trash2,
  Eye,
  Layers,
  Activity,
  CornerDownRight,
  GitBranch,
  Calendar,
  Clock,
  Upload
} from "lucide-react";

interface ExcelManagementTabProps {
  importHistory: any[];
  loadingHistory: boolean;
  activeBatchId: string;
  onRefreshHistory: () => void;
  onOpenImportModal: () => void;
  onSelectBatch: (batchId: string, month?: string) => void;
  onPromptDeleteBatch: (
    batchId: string,
    fileName: string,
    batchType?: string,
    childCount?: number,
    parentPlanName?: string
  ) => void;
}

export function ExcelManagementTab({
  importHistory = [],
  loadingHistory,
  activeBatchId,
  onRefreshHistory,
  onOpenImportModal,
  onSelectBatch,
  onPromptDeleteBatch,
}: ExcelManagementTabProps) {
  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Excel Data Management & Ingestion
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Upload monthly production sign-off sheets, validate line mappings, and
            manage historical imports
          </p>
        </div>
        <Button
          onClick={onOpenImportModal}
          className="gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-xs h-9 shadow-sm active:scale-95 transition-all self-start sm:self-auto shrink-0"
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Import New Excel File</span>
        </Button>
      </div>

      {/* Import History Table */}
      <Card className="shadow-xs border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Excel Ingestion Logs ({importHistory.length})
            </CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshHistory}
            disabled={loadingHistory}
            className="gap-1.5 text-xs h-8 border-slate-200 dark:border-slate-700 font-semibold"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-indigo-600 ${loadingHistory ? "animate-spin" : ""}`}
            />
            <span>Refresh Logs</span>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loadingHistory ? (
            <div className="p-4">
              <ExcelLogsSkeleton />
            </div>
          ) : importHistory.length === 0 ? (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500 space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 mx-auto">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No Excel imports recorded yet
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click &quot;Import New Excel File&quot; to ingest your production plan or actual floor data.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenImportModal}
                className="text-xs font-semibold text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              >
                Import First File
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">File & Hierarchy</th>
                    <th className="px-4 py-3">Type & Link</th>
                    <th className="px-4 py-3">Month</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Imported Rows</th>
                    <th className="px-4 py-3">Attached Data</th>
                    <th className="px-4 py-3">Uploaded At</th>
                    <th className="px-4 py-3 text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {importHistory.map((h: any) => {
                    const isActive = activeBatchId === h.id;
                    const isActual = h.batchType === "ACTUAL";
                    const actualBatchesCount = h.actualBatches?.length || 0;

                    return (
                      <tr
                        key={h.id}
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-850/50 transition-colors ${
                          isActive
                            ? "bg-indigo-50/40 dark:bg-indigo-950/20"
                            : isActual
                            ? "bg-emerald-50/10 dark:bg-emerald-950/10"
                            : ""
                        }`}
                      >
                        {/* File Name & Hierarchy Tree */}
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 min-w-[340px]">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {isActual ? (
                                <div className="flex items-center gap-1.5 pl-2 border-l-2 border-emerald-500">
                                  <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  <span
                                    className="font-bold text-slate-900 dark:text-slate-100"
                                    title={h.fileName}
                                  >
                                    {h.fileName}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <FileSpreadsheet className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                  <span
                                    className="font-bold text-slate-900 dark:text-slate-100"
                                    title={h.fileName}
                                  >
                                    {h.fileName}
                                  </span>
                                </div>
                              )}

                              {isActive && (
                                <Badge className="bg-indigo-600 text-white text-[10px] py-0 px-1.5 font-bold shrink-0">
                                  Active View
                                </Badge>
                              )}
                            </div>

                            {/* Child Link to Parent / Parent Linked Actuals Subtext */}
                            {isActual && (
                              <div className="flex items-center gap-1.5 pl-2 text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200/70 dark:border-emerald-800/60 w-fit flex-wrap">
                                <CornerDownRight className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                <span className="font-semibold">
                                  Actual Floor Output of:
                                </span>
                                <span className="font-bold text-emerald-950 dark:text-emerald-200">
                                  {h.parentPlan?.fileName || "Production Plan"}
                                </span>
                              </div>
                            )}

                            {!isActual && actualBatchesCount > 0 && (
                              <div className="flex items-center gap-1.5 text-[11px] text-indigo-800 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/40 px-2.5 py-1 rounded-md border border-indigo-200/70 dark:border-indigo-800/60 w-fit flex-wrap">
                                <GitBranch className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                                <span className="font-semibold">
                                  {actualBatchesCount} Actual Upload(s) Attached:
                                </span>
                                <span className="text-slate-700 dark:text-slate-300 font-medium">
                                  {h.actualBatches
                                    .map((b: any) => b.fileName)
                                    .join(", ")}
                                </span>
                              </div>
                            )}

                            {!isActual && actualBatchesCount === 0 && (
                              <span className="text-[11px] text-slate-400 italic">
                                Awaiting actual floor output upload
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Type & Link Column */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isActual ? (
                            <Badge
                              variant="outline"
                              className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 font-semibold gap-1 text-[10px] px-2 py-0.5"
                            >
                              <Activity className="h-3 w-3" />
                              ACTUAL (Child)
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60 font-semibold gap-1 text-[10px] px-2 py-0.5"
                            >
                              <Layers className="h-3 w-3" />
                              PLAN (Parent)
                            </Badge>
                          )}
                        </td>

                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-semibold font-mono whitespace-nowrap">
                          {h.month}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 font-semibold text-[10px] px-2 py-0.5 rounded-full border ${
                              h.status === "SUCCESS" || h.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60"
                                : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                h.status === "SUCCESS" || h.status === "COMPLETED"
                                  ? "bg-emerald-500"
                                  : "bg-rose-500"
                              }`}
                            />
                            {h.status}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-slate-800 dark:text-slate-200 font-semibold font-mono whitespace-nowrap">
                          {(h.importedRows || h.rowCount || 0).toLocaleString()} rows
                        </td>

                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
                          {isActual ? (
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {(h._count?.actualRecords || h.importedRows || 0).toLocaleString()}{" "}
                              floor records
                            </span>
                          ) : (
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                              {h._count?.orders ||
                                (h.summary
                                  ? JSON.parse(h.summary)?.orders
                                  : "-")}{" "}
                              orders
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {new Date(h.createdAt).toLocaleString()}
                        </td>

                        <td className="px-4 py-3 text-right pr-4 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onSelectBatch(h.id, h.month)}
                              className={`h-7 text-xs font-semibold gap-1 ${
                                isActive
                                  ? "bg-indigo-600 text-white border-indigo-600"
                                  : "border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300"
                              }`}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>{isActive ? "Active View" : "View Dashboard"}</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                onPromptDeleteBatch(
                                  h.id,
                                  h.fileName,
                                  h.batchType,
                                  actualBatchesCount,
                                  h.parentPlan?.fileName
                                )
                              }
                              className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                              title="Delete Batch & Records"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
