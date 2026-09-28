"use client";

import React, { useState, useEffect } from "react";
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
  TrendingDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const TAB_CONFIG = [
  { id: "Summary", label: "Summary" },
  { id: "Report", label: "Report" },
  { id: "B1 - Loss Time", label: "B1 - Loss Time" },
  { id: "B2 - Loss Time", label: "B2 - Loss Time" },
  { id: "Styrax- Loss Time", label: "Styrax- Loss Time" },
  { id: "B1 - Loss Hr. Analysis", label: "B1 - Loss Hr. Analysis" },
  { id: "B2 - Loss Hr. Analysis", label: "B2 - Loss Hr. Analysis" },
  { id: "Styrax - Loss Hr. Analysis", label: "Styrax - Loss Hr. Analysis" },
];

export function VaTrackerView() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("Summary");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [fileName, setFileName] = useState<string>("Production Monitoring VA Tracker September'26 Birichina & Styrax.xlsb");

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/excel/va-tracker");
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
        if (json.fileName) setFileName(json.fileName);
      }
    } catch (err) {
      console.error("Failed to fetch VA tracker data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUploadSubmit = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);

      const res = await fetch("/api/excel/va-tracker", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      const json = await res.json();
      setData(json.data);
      setFileName(json.fileName);
      setIsUploadOpen(false);
      setUploadFile(null);
    } catch (err: any) {
      setUploadError(err.message || "Failed to process workbook file");
    } finally {
      setUploading(false);
    }
  };

  const currentTabData = data?.tabs?.[activeTab];
  const summaryData = data?.tabs?.["Summary"];

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
      return <span className="text-red-500 font-bold">{text}</span>;
    }

    if (isVariance && val > 0) {
      return <span className="text-emerald-500 font-bold">{formattedNum}</span>;
    }

    return formattedNum;
  };

  const renderTableBlock = (block: any, keyPrefix: string) => {
    if (!block) return null;
    return (
      <div key={keyPrefix} className="border border-slate-700/80 rounded-lg overflow-hidden bg-slate-900/90 shadow-sm">
        {/* Table Header with Group Name */}
        <div className="grid grid-cols-12 bg-[#4a235a] text-white text-xs font-bold py-1.5 px-2 border-b border-purple-900">
          <div className="col-span-2 flex items-center font-extrabold tracking-wide">{block.groupName}</div>
          <div className="col-span-5 text-center border-l border-r border-purple-900/60 font-mono">
            {block.dateStr || "26-Sep-26"}
          </div>
          <div className="col-span-5 text-center font-mono">MTD</div>
        </div>

        {/* Sub Columns Header */}
        <div className="grid grid-cols-12 bg-slate-950 text-[11px] font-semibold text-slate-300 py-1 px-2 border-b border-slate-800 text-center font-mono">
          <div className="col-span-2 text-left font-sans text-slate-400">Metric</div>
          {/* Day Columns */}
          <div className="col-span-5 grid grid-cols-6 border-r border-slate-800">
            <div>MDs</div>
            <div>Clk Hrs</div>
            <div>Pcs</div>
            <div>SAH</div>
            <div>Eff.</div>
            <div>EPMD</div>
          </div>
          {/* MTD Columns */}
          <div className="col-span-5 grid grid-cols-6">
            <div>MDs</div>
            <div>Clk Hrs</div>
            <div>Pcs</div>
            <div>SAH</div>
            <div>Eff.</div>
            <div>EPMD</div>
          </div>
        </div>

        {/* Metric Rows */}
        <div className="divide-y divide-slate-800 text-xs font-mono">
          {block.rows?.map((row: any, rIdx: number) => {
            const isVariance = row.label.includes("Variance");
            return (
              <div
                key={`${keyPrefix}-row-${rIdx}`}
                className={`grid grid-cols-12 py-1.5 px-2 items-center text-center ${
                  isVariance ? "bg-slate-950/70 font-semibold" : "hover:bg-slate-800/40"
                }`}
              >
                <div className="col-span-2 text-left font-sans text-slate-200 text-[11px] truncate pr-1" title={row.label}>
                  {row.label}
                </div>

                {/* Day values */}
                <div className="col-span-5 grid grid-cols-6 border-r border-slate-800 text-[11px]">
                  <div>{formatCell(row.day.mds, false, isVariance)}</div>
                  <div>{formatCell(row.day.clkHrs, false, isVariance)}</div>
                  <div>{formatCell(row.day.pcs, false, isVariance)}</div>
                  <div>{formatCell(row.day.sah, false, isVariance)}</div>
                  <div>{formatCell(row.day.eff, true, isVariance)}</div>
                  <div>{formatCell(row.day.epmd, false, isVariance)}</div>
                </div>

                {/* MTD values */}
                <div className="col-span-5 grid grid-cols-6 text-[11px]">
                  <div>{formatCell(row.mtd.mds, false, isVariance)}</div>
                  <div>{formatCell(row.mtd.clkHrs, false, isVariance)}</div>
                  <div>{formatCell(row.mtd.pcs, false, isVariance)}</div>
                  <div>{formatCell(row.mtd.sah, false, isVariance)}</div>
                  <div>{formatCell(row.mtd.eff, true, isVariance)}</div>
                  <div>{formatCell(row.mtd.epmd, false, isVariance)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTrendBarChart = (title: string, dataKey: string, barColor: string) => {
    const trendDays = summaryData?.trendDays || [];
    if (trendDays.length === 0) return null;

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h4 className="text-sm font-bold text-slate-100">{title}</h4>
          <span className="text-[10px] text-slate-400">September 2026 Daily Efficiency %</span>
        </div>

        <div className="overflow-x-auto custom-scrollbar pb-2">
          <div className="flex items-end gap-1.5 min-w-[700px] h-36 pt-6 px-2">
            {trendDays.map((d: any, idx: number) => {
              const val = Number(d[dataKey] || 0);
              const pct = val <= 1 && val > 0 ? Math.round(val * 100) : Math.round(val);
              const height = Math.min(Math.max(pct, 0), 100);

              return (
                <div key={`${dataKey}-${idx}`} className="flex-1 flex flex-col items-center gap-1 group">
                  {pct > 0 && (
                    <span className="text-[9px] font-bold text-slate-300 transform -rotate-45 sm:rotate-0 origin-bottom">
                      {pct}%
                    </span>
                  )}
                  <div className="w-full flex items-end justify-center h-24 bg-slate-950/40 rounded-t">
                    <div
                      className={`w-full max-w-[18px] rounded-t transition-all ${barColor} group-hover:brightness-125`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 truncate max-w-[28px]">
                    {d.dateStr?.split("-")?.slice(0, 2)?.join("-")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans select-none pb-20 relative">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/")}
            className="h-8 gap-1.5 px-2.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white border-slate-700 shadow-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Menu</span>
          </Button>

          <div className="border-l border-slate-800 pl-3">
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
              {summaryData?.company || "SQ Birichina Ltd."}
            </h1>
            <p className="text-xs text-slate-400">
              {summaryData?.title || "Snap Shot of Unitwise Performance & Efficiency Trend"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="h-8 text-xs font-medium border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin text-purple-400" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            className="h-8 text-xs font-semibold bg-[#4a235a] hover:bg-[#5b2c6f] text-white shadow-sm gap-1.5 border border-purple-800"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload .xlsb</span>
          </Button>
        </div>
      </header>

      {/* Main Sheet View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* TAB 1: SUMMARY EXACT REPLICA */}
        {activeTab === "Summary" && (
          <div className="space-y-6">
            
            {/* Header Title Box matching Excel screenshot */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-white">{summaryData?.company || "SQ Birichina Ltd."}</h2>
                <p className="text-xs text-slate-400">{summaryData?.title || "Snap Shot of Unitwise Performance & Efficiency Trend"}</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
                <span className="text-slate-400">Date:</span>
                <strong className="text-purple-300">{summaryData?.dateStr || "26-Sep-26"}</strong>
              </div>
            </div>

            {/* Main Factory 4 Blocks (Birichina, Styrax, Birichina - 1, Birichina - 2) */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                Factory Performance Overview
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {summaryData?.mainBlocks?.map((block: any, idx: number) =>
                  renderTableBlock(block, `main-block-${idx}`)
                )}
              </div>
            </div>

            {/* Unit-wise Performance Section */}
            <div className="space-y-4 pt-2">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Unit-wise Performance
                </h3>
              </div>

              {/* Birichina 01 (B1U2, B1U3, B1U4) */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-sky-400">Birichina 01 (Units U02, U03, U04)</span>
                <div className="grid grid-cols-1 gap-3">
                  {summaryData?.unitBlocks?.birichina01?.map((b: any, idx: number) =>
                    renderTableBlock(b, `b1-unit-${idx}`)
                  )}
                </div>
              </div>

              {/* Birichina 02 (B2U2, B2U3) */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-teal-400">Birichina 02 (Units U02, U03)</span>
                <div className="grid grid-cols-1 gap-3">
                  {summaryData?.unitBlocks?.birichina02?.map((b: any, idx: number) =>
                    renderTableBlock(b, `b2-unit-${idx}`)
                  )}
                </div>
              </div>

              {/* Styrax (S1U1, S1U2, S1U3, S1U4) */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-fuchsia-400">Styrax Apparels (Units U01, U02, U03, U04)</span>
                <div className="grid grid-cols-1 gap-3">
                  {summaryData?.unitBlocks?.styrax?.map((b: any, idx: number) =>
                    renderTableBlock(b, `styrax-unit-${idx}`)
                  )}
                </div>
              </div>
            </div>

            {/* Efficiency Trend Bar Charts (Screenshot 4) */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Monthly Efficiency Trend Graphs
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {renderTrendBarChart("Factory Efficiency Trend - Birichina", "birichina", "bg-rose-600")}
                {renderTrendBarChart("Birichina 01 Efficiency Trend", "b1", "bg-sky-500")}
                {renderTrendBarChart("Birichina 02 Efficiency Trend", "b2", "bg-teal-500")}
                {renderTrendBarChart("Styrax Efficiency Trend", "styrax", "bg-fuchsia-500")}
              </div>
            </div>

          </div>
        )}

        {/* TAB: LOSS TIME (B1, B2, Styrax) */}
        {activeTab.includes("Loss Time") && currentTabData && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between shadow-sm">
              <span className="text-sm font-extrabold text-purple-300">{currentTabData.title}</span>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Department Lost SAH Matrix</span>
            </div>

            {currentTabData.blocks ? (
              currentTabData.blocks.map((block: any, bIdx: number) => (
                <div key={`lt-block-${bIdx}`} className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
                  <div className="bg-slate-800/80 px-4 py-2 border-b border-slate-700 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-bold text-white tracking-wider">{block.unitName}</h3>
                  </div>
                  <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                    <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
                      <thead className="bg-[#4a235a] text-white font-bold sticky top-0 z-20">
                        <tr>
                          <th className="px-4 py-3 sticky left-0 z-30 bg-[#4a235a]">Department</th>
                          <th className="px-3 py-3 sticky left-[150px] z-30 bg-[#4a235a] border-r border-purple-900">Code</th>
                          {block.days?.map((d: any, dIdx: number) => (
                            <th key={`day-hdr-${bIdx}-${dIdx}`} className="px-2.5 py-3 text-center min-w-[50px] font-mono text-[11px]">
                              {d.label}
                            </th>
                          ))}
                          <th className="px-4 py-3 text-right bg-[#3b1c48] sticky right-0 z-30 font-extrabold border-l border-purple-900">
                            Total Lost SAH
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 font-mono">
                        {block.rows?.map((row: any, idx: number) => (
                          <tr key={`loss-time-${bIdx}-${idx}`} className="hover:bg-slate-800/50">
                            <td className="px-4 py-2 font-sans font-semibold text-slate-200 sticky left-0 z-10 bg-slate-900">
                              {row.department}
                            </td>
                            <td className="px-3 py-2 text-slate-400 font-bold sticky left-[150px] z-10 bg-slate-900 border-r border-slate-800">
                              {row.code}
                            </td>
                            {row.dayValues?.map((val: number, cIdx: number) => (
                              <td key={`cell-${bIdx}-${idx}-${cIdx}`} className="px-2.5 py-2 text-center text-[11px] text-slate-300">
                                {val > 0 ? val.toLocaleString() : "-"}
                              </td>
                            ))}
                            <td className="px-4 py-2 text-right font-black text-rose-400 bg-slate-900 sticky right-0 z-10 border-l border-slate-800">
                              {row.total ? row.total.toLocaleString() : "0"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            ) : (
              // Fallback for single table view
              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
                <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                  <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
                    <thead className="bg-[#4a235a] text-white font-bold sticky top-0 z-20">
                      <tr>
                        <th className="px-4 py-3 sticky left-0 z-30 bg-[#4a235a]">Department</th>
                        <th className="px-3 py-3 sticky left-[150px] z-30 bg-[#4a235a] border-r border-purple-900">Code</th>
                        {currentTabData.days?.map((d: any, dIdx: number) => (
                          <th key={`day-hdr-${dIdx}`} className="px-2.5 py-3 text-center min-w-[50px] font-mono text-[11px]">
                            {d.label}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-right bg-[#3b1c48] sticky right-0 z-30 font-extrabold border-l border-purple-900">
                          Total Lost SAH
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {currentTabData.rows?.map((row: any, idx: number) => (
                        <tr key={`loss-time-${idx}`} className="hover:bg-slate-800/50">
                          <td className="px-4 py-2 font-sans font-semibold text-slate-200 sticky left-0 z-10 bg-slate-900">
                            {row.department}
                          </td>
                          <td className="px-3 py-2 text-slate-400 font-bold sticky left-[150px] z-10 bg-slate-900 border-r border-slate-800">
                            {row.code}
                          </td>
                          {row.dayValues?.map((val: number, cIdx: number) => (
                            <td key={`cell-${idx}-${cIdx}`} className="px-2.5 py-2 text-center text-[11px] text-slate-300">
                              {val > 0 ? val.toLocaleString() : "-"}
                            </td>
                          ))}
                          <td className="px-4 py-2 text-right font-black text-rose-400 bg-slate-900 sticky right-0 z-10 border-l border-slate-800">
                            {row.total ? row.total.toLocaleString() : "0"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: LOSS HR ANALYSIS */}
        {activeTab.includes("Loss Hr. Analysis") && currentTabData && (
          <div className="space-y-6">
            {currentTabData.tables ? (
              currentTabData.tables.map((table: any, tIdx: number) => (
                <div key={`hr-table-${tIdx}`} className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
                  <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-400" />
                    <h3 className="text-sm font-extrabold text-white tracking-wider uppercase">{table.title}</h3>
                  </div>
                  <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                    <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
                      <thead className="bg-[#4a235a] text-white font-bold sticky top-0 z-20">
                        <tr>
                          {table.headers?.map((h: string, hIdx: number) => (
                            <th 
                              key={`th-${tIdx}-${hIdx}`} 
                              className={`px-4 py-3 border-r border-purple-900/50 ${hIdx === 0 ? 'sticky left-0 z-30 bg-[#4a235a]' : ''} ${['Total', '%', 'Share', 'Loss Hour'].includes(h) ? 'text-right' : ''}`}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 font-mono">
                        {table.rows?.map((row: any, rIdx: number) => (
                          <tr key={`tr-${tIdx}-${rIdx}`} className={`hover:bg-slate-800/50 transition-colors ${row.isTotal ? 'bg-purple-950/40 border-t-2 border-purple-700' : ''}`}>
                            {table.headers?.map((h: string, cIdx: number) => {
                              const val = row[h];
                              const isNum = typeof val === 'number';
                              const isTotalRow = row.isTotal;
                              
                              let displayVal = val || "-";
                              if (isNum) {
                                if (h === '%' || h === 'Share') displayVal = `${val.toFixed(1)}%`;
                                else displayVal = val.toLocaleString(undefined, { maximumFractionDigits: 1 });
                              }
                              
                              return (
                                <td 
                                  key={`td-${tIdx}-${rIdx}-${cIdx}`} 
                                  className={`px-4 py-2.5 border-r border-slate-800/50 ${cIdx === 0 ? 'sticky left-0 z-10 bg-slate-900' : ''} ${isNum ? 'text-right font-mono' : ''} ${isTotalRow ? 'font-black text-purple-300' : (isNum ? 'text-emerald-400 font-medium' : 'text-slate-300 font-sans')}`}
                                >
                                  {displayVal}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            ) : (
              // Fallback for single table view
              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
                    <thead className="bg-[#4a235a] text-white font-bold">
                      <tr>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-3 py-3">Code</th>
                        {currentTabData.units?.map((u: string, uIdx: number) => (
                          <th key={`unit-${uIdx}`} className="px-4 py-3 text-right font-mono">
                            {u}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-right font-black">Total Loss</th>
                        <th className="px-4 py-3 text-right font-black">% Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {currentTabData.rows?.map((row: any, idx: number) => (
                        <tr key={`analysis-row-${idx}`} className="hover:bg-slate-800/50">
                          <td className="px-4 py-2.5 font-sans font-semibold text-slate-200">{row.department}</td>
                          <td className="px-3 py-2.5 text-slate-400 font-bold">{row.code}</td>
                          {currentTabData.units?.map((u: string, uIdx: number) => (
                            <td key={`unit-val-${idx}-${uIdx}`} className="px-4 py-2.5 text-right text-slate-300">
                              {row.unitValues?.[u] > 0 ? row.unitValues[u].toLocaleString() : "-"}
                            </td>
                          ))}
                          <td className="px-4 py-2.5 text-right font-bold text-rose-400">{row.total?.toLocaleString() || "0"}</td>
                          <td className="px-4 py-2.5 text-right font-extrabold text-purple-400">
                            {row.percentage ? `${row.percentage.toFixed(1)}%` : "0%"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: REPORT */}
        {activeTab === "Report" && currentTabData && (
          <div className="space-y-4">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-purple-400" />
                  {currentTabData.company || "SQ Birichina Ltd."} — {currentTabData.title || "Daily Production Monitoring Report"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Report Date: <span className="font-semibold text-purple-300">{currentTabData.dateStr || "26-Sep-26"}</span> | Total Records: <span className="font-semibold text-slate-200">{currentTabData.rows?.length || 0}</span>
                </p>
              </div>

              {/* Quick Search inside Report */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Line, Buyer, Style..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-purple-500 w-64 shadow-inner"
                  />
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Complete Data Table matching Excel format */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto max-h-[720px] custom-scrollbar">
                <table className="w-full text-left text-xs whitespace-nowrap border-collapse border border-slate-700">
                  <thead className="sticky top-0 z-20 shadow-md select-none">
                    {/* Tier 1: Grouped Section Headers */}
                    <tr className="text-xs font-black uppercase tracking-wider text-slate-950">
                      <th colSpan={7} className="bg-[#88c4e4] px-4 py-2.5 text-center border-r border-slate-800">
                        Unit & Line Specification
                      </th>
                      <th colSpan={5} className="bg-[#b399c7] px-3 py-2.5 text-center border-r border-slate-800">
                        Plan- {currentTabData.dateStr || "26/Sep"}
                      </th>
                      <th colSpan={5} className="bg-[#c7e8b8] px-3 py-2.5 text-center border-r border-slate-800">
                        Actual- {currentTabData.dateStr || "26/Sep"}
                      </th>
                      <th colSpan={5} className="bg-[#f0b8b8] px-3 py-2.5 text-center border-r border-slate-800">
                        Variance- {currentTabData.dateStr || "26/Sep"}
                      </th>
                      <th colSpan={5} className="bg-[#c4b8d9] px-3 py-2.5 text-center border-r border-slate-800">
                        Plan Target - MTD
                      </th>
                      <th colSpan={5} className="bg-[#d4eed0] px-3 py-2.5 text-center border-r border-slate-800">
                        Achievements - MTD
                      </th>
                      <th colSpan={5} className="bg-[#ffd6d6] px-3 py-2.5 text-center">
                        Variance - MTD
                      </th>
                    </tr>

                    {/* Tier 2: Column Headers */}
                    <tr className="text-[11px] font-extrabold text-slate-950 uppercase border-b border-slate-700">
                      {/* Left Info Columns (Blue) */}
                      <th className="bg-[#88c4e4] px-3 py-2 sticky left-0 z-30 border-r border-slate-400">Unit-Line</th>
                      <th className="bg-[#88c4e4] px-3 py-2 border-r border-slate-400">Buyer</th>
                      <th className="bg-[#88c4e4] px-3 py-2 min-w-[220px] border-r border-slate-400">Style</th>
                      <th className="bg-[#88c4e4] px-2 py-2 text-center border-r border-slate-400">Type</th>
                      <th className="bg-[#88c4e4] px-2 py-2 text-center border-r border-slate-400">Status</th>
                      <th className="bg-[#88c4e4] px-2 py-2 text-center border-r border-slate-400">Run Days</th>
                      <th className="bg-[#88c4e4] px-2.5 py-2 text-right border-r-2 border-slate-800">M/C SMV</th>

                      {/* Day Plan Columns (Purple) */}
                      <th className="bg-[#b399c7] px-2.5 py-2 text-right border-r border-slate-400">MD</th>
                      <th className="bg-[#b399c7] px-2.5 py-2 text-right border-r border-slate-400">Avail Hrs</th>
                      <th className="bg-[#b399c7] px-2.5 py-2 text-right border-r border-slate-400">M/C SAH</th>
                      <th className="bg-[#b399c7] px-3 py-2 text-right border-r border-slate-400">PCS</th>
                      <th className="bg-[#b399c7] px-2.5 py-2 text-right border-r-2 border-slate-800">Eff%</th>

                      {/* Day Actual Columns (Green) */}
                      <th className="bg-[#c7e8b8] px-2.5 py-2 text-right border-r border-slate-400">MD</th>
                      <th className="bg-[#c7e8b8] px-2.5 py-2 text-right border-r border-slate-400">Avail Hrs</th>
                      <th className="bg-[#c7e8b8] px-2.5 py-2 text-right border-r border-slate-400">M/C SAH</th>
                      <th className="bg-[#c7e8b8] px-3 py-2 text-right border-r border-slate-400">PCS</th>
                      <th className="bg-[#c7e8b8] px-2.5 py-2 text-right border-r-2 border-slate-800">Eff%</th>

                      {/* Day Variance Columns (Pink) */}
                      <th className="bg-[#f0b8b8] px-2.5 py-2 text-right border-r border-slate-400">MD</th>
                      <th className="bg-[#f0b8b8] px-2.5 py-2 text-right border-r border-slate-400">Avail Hrs</th>
                      <th className="bg-[#f0b8b8] px-2.5 py-2 text-right border-r border-slate-400">M/C SAH</th>
                      <th className="bg-[#f0b8b8] px-3 py-2 text-right border-r border-slate-400">PCS</th>
                      <th className="bg-[#f0b8b8] px-2.5 py-2 text-right border-r-2 border-slate-800">Eff%</th>

                      {/* MTD Plan Columns (Lavender) */}
                      <th className="bg-[#c4b8d9] px-2.5 py-2 text-right border-r border-slate-400">MD</th>
                      <th className="bg-[#c4b8d9] px-2.5 py-2 text-right border-r border-slate-400">Avail Hrs</th>
                      <th className="bg-[#c4b8d9] px-2.5 py-2 text-right border-r border-slate-400">M/C SAH</th>
                      <th className="bg-[#c4b8d9] px-3 py-2 text-right border-r border-slate-400">PCS</th>
                      <th className="bg-[#c4b8d9] px-2.5 py-2 text-right border-r-2 border-slate-800">Eff%</th>

                      {/* MTD Actual Columns (Pale Green) */}
                      <th className="bg-[#d4eed0] px-2.5 py-2 text-right border-r border-slate-400">MD</th>
                      <th className="bg-[#d4eed0] px-2.5 py-2 text-right border-r border-slate-400">Avail Hrs</th>
                      <th className="bg-[#d4eed0] px-2.5 py-2 text-right border-r border-slate-400">M/C SAH</th>
                      <th className="bg-[#d4eed0] px-3 py-2 text-right border-r border-slate-400">PCS</th>
                      <th className="bg-[#d4eed0] px-2.5 py-2 text-right border-r-2 border-slate-800">Eff%</th>

                      {/* MTD Variance Columns (Soft Red) */}
                      <th className="bg-[#ffd6d6] px-2.5 py-2 text-right border-r border-slate-400">MD</th>
                      <th className="bg-[#ffd6d6] px-2.5 py-2 text-right border-r border-slate-400">Avail Hrs</th>
                      <th className="bg-[#ffd6d6] px-2.5 py-2 text-right border-r border-slate-400">M/C SAH</th>
                      <th className="bg-[#ffd6d6] px-3 py-2 text-right border-r border-slate-400">PCS</th>
                      <th className="bg-[#ffd6d6] px-2.5 py-2 text-right">Eff%</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                    {currentTabData.rows
                      ?.filter((r: any) => {
                        if (!searchQuery) return true;
                        const q = searchQuery.toLowerCase();
                        return (
                          r.unitLine?.toLowerCase().includes(q) ||
                          r.buyer?.toLowerCase().includes(q) ||
                          r.style?.toLowerCase().includes(q) ||
                          r.type?.toLowerCase().includes(q)
                        );
                      })
                      .map((r: any, idx: number) => {
                        const isSubtotal = r.isSubtotal;

                        // Helpers for value formatting
                        const fmtNum = (v: number | undefined | null) => {
                          if (v === undefined || v === null || v === 0) return <span className="text-slate-500">-</span>;
                          return Math.round(v).toLocaleString();
                        };

                        const fmtEff = (eff: number | undefined | null) => {
                          if (eff === undefined || eff === null || eff === 0) return <span className="text-slate-500">-</span>;
                          const pct = eff <= 1 && eff > -1 ? (eff * 100).toFixed(1) : eff.toFixed(1);
                          return <span>{pct}%</span>;
                        };

                        const fmtVarNum = (v: number | undefined | null) => {
                          if (v === undefined || v === null || v === 0) return <span className="text-slate-500">-</span>;
                          if (v < 0) return <span className="text-rose-400 font-bold">({Math.abs(Math.round(v)).toLocaleString()})</span>;
                          return <span className="text-emerald-400 font-bold">{Math.round(v).toLocaleString()}</span>;
                        };

                        const fmtVarEff = (eff: number | undefined | null) => {
                          if (eff === undefined || eff === null || eff === 0) return <span className="text-slate-500">-</span>;
                          const pct = eff <= 1 && eff > -1 ? (eff * 100).toFixed(1) : eff.toFixed(1);
                          if (eff < 0) return <span className="text-rose-400 font-bold">{pct}%</span>;
                          return <span className="text-emerald-400 font-bold">+{pct}%</span>;
                        };

                        if (isSubtotal) {
                          return (
                            <tr
                              key={`subtotal-${idx}`}
                              className="bg-[#211b33] hover:bg-[#2a2242] font-bold text-white border-y-2 border-purple-600/60 transition-colors"
                            >
                              <td className="px-3 py-2.5 font-sans font-black text-amber-300 sticky left-0 z-10 bg-[#211b33] border-r border-slate-700 shadow-md">
                                {r.unitLine}
                              </td>
                              <td className="px-3 py-2.5 text-slate-400 font-sans border-r border-slate-800">-</td>
                              <td className="px-3 py-2.5 text-slate-400 font-sans border-r border-slate-800">Unit Subtotal</td>
                              <td className="px-2 py-2.5 text-center text-slate-400 border-r border-slate-800">-</td>
                              <td className="px-2 py-2.5 text-center text-slate-400 border-r border-slate-800">-</td>
                              <td className="px-2 py-2.5 text-center text-slate-400 border-r border-slate-800">-</td>
                              <td className="px-2.5 py-2.5 text-right text-amber-200 border-r-2 border-slate-700">
                                {r.smv ? r.smv.toFixed(2) : "-"}
                              </td>

                              {/* Day Plan */}
                              <td className="px-2.5 py-2.5 text-right border-r border-slate-800">{fmtNum(r.dayPlan?.md)}</td>
                              <td className="px-2.5 py-2.5 text-right border-r border-slate-800">{fmtNum(r.dayPlan?.availHrs)}</td>
                              <td className="px-2.5 py-2.5 text-right border-r border-slate-800">{fmtNum(r.dayPlan?.sah)}</td>
                              <td className="px-3 py-2.5 text-right font-black text-purple-300 border-r border-slate-800">{fmtNum(r.dayPlan?.pcs)}</td>
                              <td className="px-2.5 py-2.5 text-right border-r-2 border-slate-700">{fmtEff(r.dayPlan?.eff)}</td>

                              {/* Day Actual */}
                              <td className="px-2.5 py-2.5 text-right border-r border-slate-800">{fmtNum(r.dayActual?.md)}</td>
                              <td className="px-2.5 py-2.5 text-right border-r border-slate-800">{fmtNum(r.dayActual?.availHrs)}</td>
                              <td className="px-2.5 py-2.5 text-right border-r border-slate-800">{fmtNum(r.dayActual?.sah)}</td>
                              <td className="px-3 py-2.5 text-right font-black text-emerald-300 border-r border-slate-800">{fmtNum(r.dayActual?.pcs)}</td>
                              <td className="px-2.5 py-2.5 text-right text-emerald-400 font-black border-r-2 border-slate-700">{fmtEff(r.dayActual?.eff)}</td>

                              {/* Day Var */}
                              <td className="px-2.5 py-2.5 text-right border-r border-slate-800">{fmtVarNum(r.dayVar?.md)}</td>
                              <td className="px-2.5 py-2.5 text-right border-r border-slate-800">{fmtVarNum(r.dayVar?.availHrs)}</td>
                              <td className="px-2.5 py-2.5 text-right border-r border-slate-800">{fmtVarNum(r.dayVar?.sah)}</td>
                              <td className="px-3 py-2.5 text-right border-r border-slate-800">{fmtVarNum(r.dayVar?.pcs)}</td>
                              <td className="px-2.5 py-2.5 text-right border-r-2 border-slate-700">{fmtVarEff(r.dayVar?.eff)}</td>

                              {/* MTD Plan */}
                              <td className="px-2.5 py-2.5 text-right border-r border-slate-800">{fmtNum(r.planMtd?.md)}</td>
                              <td className="px-2.5 py-2.5 text-right border-r border-slate-800">{fmtNum(r.planMtd?.availHrs)}</td>
                              <td className="px-2.5 py-2.5 text-right border-r border-slate-800">{fmtNum(r.planMtd?.sah)}</td>
                              <td className="px-3 py-2.5 text-right font-black text-purple-300 border-r border-slate-800">{fmtNum(r.planMtd?.pcs)}</td>
                              <td className="px-2.5 py-2.5 text-right border-r-2 border-slate-700">{fmtEff(r.planMtd?.eff)}</td>

                              {/* MTD Actual */}
                              <td className="px-2.5 py-2.5 text-right border-r border-slate-800">{fmtNum(r.actMtd?.md)}</td>
                              <td className="px-2.5 py-2.5 text-right border-r border-slate-800">{fmtNum(r.actMtd?.availHrs)}</td>
                              <td className="px-2.5 py-2.5 text-right border-r border-slate-800">{fmtNum(r.actMtd?.sah)}</td>
                              <td className="px-3 py-2.5 text-right font-black text-emerald-300 border-r border-slate-800">{fmtNum(r.actMtd?.pcs)}</td>
                              <td className="px-2.5 py-2.5 text-right text-emerald-400 font-black border-r-2 border-slate-700">{fmtEff(r.actMtd?.eff)}</td>

                              {/* MTD Var */}
                              <td className="px-2.5 py-2.5 text-right border-r border-slate-800">{fmtVarNum(r.varMtd?.md)}</td>
                              <td className="px-2.5 py-2.5 text-right border-r border-slate-800">{fmtVarNum(r.varMtd?.availHrs)}</td>
                              <td className="px-2.5 py-2.5 text-right border-r border-slate-800">{fmtVarNum(r.varMtd?.sah)}</td>
                              <td className="px-3 py-2.5 text-right border-r border-slate-800">{fmtVarNum(r.varMtd?.pcs)}</td>
                              <td className="px-2.5 py-2.5 text-right">{fmtVarEff(r.varMtd?.eff)}</td>
                            </tr>
                          );
                        }

                        // Regular Line Row
                        return (
                          <tr key={`line-${idx}`} className="hover:bg-slate-800/60 transition-colors">
                            <td className="px-3 py-2 font-sans font-bold text-sky-400 sticky left-0 z-10 bg-slate-900 border-r border-slate-800 shadow-sm">
                              {r.unitLine}
                            </td>
                            <td className="px-3 py-2 text-slate-300 font-sans border-r border-slate-800/60">{r.buyer || "-"}</td>
                            <td className="px-3 py-2 text-slate-300 font-sans truncate max-w-[240px] border-r border-slate-800/60" title={r.style}>
                              {r.style || "-"}
                            </td>
                            <td className="px-2 py-2 text-center text-slate-300 border-r border-slate-800/60">{r.type || "-"}</td>
                            <td className="px-2 py-2 text-center text-slate-400 border-r border-slate-800/60">{r.status || "-"}</td>
                            <td className="px-2 py-2 text-center text-slate-400 border-r border-slate-800/60">{r.runDays || "-"}</td>
                            <td className="px-2.5 py-2 text-right text-slate-200 border-r-2 border-slate-800">
                              {r.smv ? r.smv.toFixed(2) : "-"}
                            </td>

                            {/* Day Plan */}
                            <td className="px-2.5 py-2 text-right text-slate-400 border-r border-slate-800/60">{fmtNum(r.dayPlan?.md)}</td>
                            <td className="px-2.5 py-2 text-right text-slate-400 border-r border-slate-800/60">{fmtNum(r.dayPlan?.availHrs)}</td>
                            <td className="px-2.5 py-2 text-right text-slate-400 border-r border-slate-800/60">{fmtNum(r.dayPlan?.sah)}</td>
                            <td className="px-3 py-2 text-right text-purple-300 font-semibold border-r border-slate-800/60">{fmtNum(r.dayPlan?.pcs)}</td>
                            <td className="px-2.5 py-2 text-right text-slate-300 border-r-2 border-slate-800">{fmtEff(r.dayPlan?.eff)}</td>

                            {/* Day Actual */}
                            <td className="px-2.5 py-2 text-right text-slate-300 border-r border-slate-800/60">{fmtNum(r.dayActual?.md)}</td>
                            <td className="px-2.5 py-2 text-right text-slate-300 border-r border-slate-800/60">{fmtNum(r.dayActual?.availHrs)}</td>
                            <td className="px-2.5 py-2 text-right text-slate-300 border-r border-slate-800/60">{fmtNum(r.dayActual?.sah)}</td>
                            <td className="px-3 py-2 text-right text-white font-bold border-r border-slate-800/60">{fmtNum(r.dayActual?.pcs)}</td>
                            <td className="px-2.5 py-2 text-right text-emerald-400 font-bold border-r-2 border-slate-800">{fmtEff(r.dayActual?.eff)}</td>

                            {/* Day Var */}
                            <td className="px-2.5 py-2 text-right border-r border-slate-800/60">{fmtVarNum(r.dayVar?.md)}</td>
                            <td className="px-2.5 py-2 text-right border-r border-slate-800/60">{fmtVarNum(r.dayVar?.availHrs)}</td>
                            <td className="px-2.5 py-2 text-right border-r border-slate-800/60">{fmtVarNum(r.dayVar?.sah)}</td>
                            <td className="px-3 py-2 text-right border-r border-slate-800/60">{fmtVarNum(r.dayVar?.pcs)}</td>
                            <td className="px-2.5 py-2 text-right border-r-2 border-slate-800">{fmtVarEff(r.dayVar?.eff)}</td>

                            {/* MTD Plan */}
                            <td className="px-2.5 py-2 text-right text-slate-400 border-r border-slate-800/60">{fmtNum(r.planMtd?.md)}</td>
                            <td className="px-2.5 py-2 text-right text-slate-400 border-r border-slate-800/60">{fmtNum(r.planMtd?.availHrs)}</td>
                            <td className="px-2.5 py-2 text-right text-slate-400 border-r border-slate-800/60">{fmtNum(r.planMtd?.sah)}</td>
                            <td className="px-3 py-2 text-right text-purple-300 font-semibold border-r border-slate-800/60">{fmtNum(r.planMtd?.pcs)}</td>
                            <td className="px-2.5 py-2 text-right text-slate-300 border-r-2 border-slate-800">{fmtEff(r.planMtd?.eff)}</td>

                            {/* MTD Actual */}
                            <td className="px-2.5 py-2 text-right text-slate-300 border-r border-slate-800/60">{fmtNum(r.actMtd?.md)}</td>
                            <td className="px-2.5 py-2 text-right text-slate-300 border-r border-slate-800/60">{fmtNum(r.actMtd?.availHrs)}</td>
                            <td className="px-2.5 py-2 text-right text-slate-300 border-r border-slate-800/60">{fmtNum(r.actMtd?.sah)}</td>
                            <td className="px-3 py-2 text-right text-white font-bold border-r border-slate-800/60">{fmtNum(r.actMtd?.pcs)}</td>
                            <td className="px-2.5 py-2 text-right text-emerald-400 font-bold border-r-2 border-slate-800">{fmtEff(r.actMtd?.eff)}</td>

                            {/* MTD Var */}
                            <td className="px-2.5 py-2 text-right border-r border-slate-800/60">{fmtVarNum(r.varMtd?.md)}</td>
                            <td className="px-2.5 py-2 text-right border-r border-slate-800/60">{fmtVarNum(r.varMtd?.availHrs)}</td>
                            <td className="px-2.5 py-2 text-right border-r border-slate-800/60">{fmtVarNum(r.varMtd?.sah)}</td>
                            <td className="px-3 py-2 text-right border-r border-slate-800/60">{fmtVarNum(r.varMtd?.pcs)}</td>
                            <td className="px-2.5 py-2 text-right">{fmtVarEff(r.varMtd?.eff)}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Excel Sheet Bottom Tabs Ribbon (Exact Match with Excel Screenshot) */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[#2b2b2b] border-t border-slate-700 px-4 py-1.5 flex items-center gap-1 overflow-x-auto custom-scrollbar shadow-2xl">
        {TAB_CONFIG.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 text-xs font-semibold whitespace-nowrap rounded-t transition-all ${
                isActive
                  ? "bg-white text-slate-900 font-bold shadow-md border-t-2 border-purple-600"
                  : "bg-[#4a235a] hover:bg-[#5e2d73] text-white border-r border-slate-700"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </footer>

      {/* Upload Modal */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-purple-400" />
              Upload VA Tracker (.xlsb / .xlsx)
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Upload any VA Tracker workbook to extract Summary tables and Loss Time matrices.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div
              className="border-2 border-dashed border-purple-500/30 hover:border-purple-500/60 rounded-2xl p-6 text-center bg-purple-950/20 transition-all cursor-pointer"
              onClick={() => document.getElementById("va-file-input")?.click()}
            >
              <FileSpreadsheet className="w-10 h-10 text-purple-400 mx-auto mb-2" />
              {uploadFile ? (
                <div>
                  <p className="text-sm font-bold text-white truncate max-w-xs mx-auto">{uploadFile.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-slate-200">Click or drag & drop .xlsb file here</p>
                  <p className="text-[11px] text-slate-500 mt-1">Supports Birichina & Styrax VA Tracker Binary Workbooks</p>
                </div>
              )}
              <input
                id="va-file-input"
                type="file"
                accept=".xlsb,.xlsx,.xls"
                onChange={(e) => e.target.files && setUploadFile(e.target.files[0])}
                className="hidden"
              />
            </div>

            {uploadError && (
              <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsUploadOpen(false)} className="text-xs border-slate-700 bg-slate-800 text-slate-300">
              Cancel
            </Button>
            <Button size="sm" disabled={!uploadFile || uploading} onClick={handleUploadSubmit} className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold">
              {uploading ? "Parsing Workbook..." : "Import & Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
