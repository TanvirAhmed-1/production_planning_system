"use client";

import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Search,
  Download,
  Filter,
  ArrowUpDown,
  Sparkles,
  RefreshCw,
  Table as TableIcon,
  ChevronDown,
  Info,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface UniversalSheetViewerProps {
  data: any;
  selectedSheetName: string;
  onSelectSheetName: (name: string) => void;
  exportToCSV: (rows: any[], filename: string) => void;
}

export function UniversalSheetViewer({
  data,
  selectedSheetName,
  onSelectSheetName,
  exportToCSV,
}: UniversalSheetViewerProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isAiExplaining, setIsAiExplaining] = useState<boolean>(false);
  const [aiSheetExplanation, setAiSheetExplanation] = useState<string | null>(null);

  const sheetNames = data?.sheetNames || [];
  const currentSheetData = data?.allSheetsUniversal?.[selectedSheetName] || data?.tabs?.[selectedSheetName]?.universal || data?.tabs?.[selectedSheetName];

  const headers: string[] = currentSheetData?.headers || [];
  const rawRows: any[] = currentSheetData?.rows || [];

  // Filter and Sort rows
  const processedRows = useMemo(() => {
    let result = [...rawRows];

    // Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((row) =>
        headers.some((h) => {
          const val = row[h];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
        })
      );
    }

    // Sort
    if (sortField) {
      result.sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined || valA === "") return 1;
        if (valB === null || valB === undefined || valB === "") return -1;

        const numA = Number(valA);
        const numB = Number(valB);
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortOrder === "asc" ? numA - numB : numB - numA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return sortOrder === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    return result;
  }, [rawRows, headers, searchQuery, sortField, sortOrder]);

  // Handle Sort Toggle
  const handleSort = (header: string) => {
    if (sortField === header) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(header);
      setSortOrder("asc");
    }
  };

  // AI Sheet Explainer using Gemini
  const handleAiExplainSheet = async () => {
    if (!currentSheetData) return;
    setIsAiExplaining(true);
    setAiSheetExplanation(null);

    try {
      const sampleData = rawRows.slice(0, 5);
      const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + (process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{
              text: `Explain worksheet "${selectedSheetName}" extracted from garments production monitoring workbook.
Headers: ${JSON.stringify(headers)}
Sample Rows: ${JSON.stringify(sampleData)}

Provide a concise 2-3 sentence executive explanation of what this sheet is used for, who uses it, and how it connects to garments production planning.`
            }]
          }]
        })
      });

      if (res.ok) {
        const resJson = await res.json();
        const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          setAiSheetExplanation(text);
          return;
        }
      }

      // Fallback explanation
      setAiSheetExplanation(`Worksheet '${selectedSheetName}' contains ${rawRows.length} rows and ${headers.length} columns representing production tracking and operational matrix data for garments manufacturing.`);
    } catch {
      setAiSheetExplanation(`Worksheet '${selectedSheetName}' contains ${rawRows.length} structured rows across ${headers.length} attributes.`);
    } finally {
      setIsAiExplaining(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Sheet Selector & Top Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 font-sans">Active Worksheet:</span>
            <div className="relative">
              <select
                value={selectedSheetName}
                onChange={(e) => {
                  onSelectSheetName(e.target.value);
                  setAiSheetExplanation(null);
                  setSortField(null);
                }}
                className="bg-slate-950 border border-purple-800/60 rounded-lg px-3 py-1.5 text-xs text-purple-200 font-bold font-mono focus:outline-none focus:border-purple-400 pr-8"
              >
                {sheetNames.map((name: string) => {
                  const sInfo = data?.allSheetsUniversal?.[name];
                  const rCount = sInfo?.rowCount || 0;
                  return (
                    <option key={name} value={name}>
                      {name} ({rCount} rows)
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-purple-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <Badge variant="outline" className="text-slate-300 border-slate-700 text-xs font-mono">
            {rawRows.length} Data Rows • {headers.length} Columns
          </Badge>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across all cells..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleAiExplainSheet}
            disabled={isAiExplaining}
            className="border-purple-800/60 bg-purple-950/30 text-purple-200 hover:bg-purple-900/40 text-xs gap-1.5"
          >
            {isAiExplaining ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            )}
            AI Explain Sheet
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV(rawRows, selectedSheetName)}
            className="border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-200 text-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* AI Explanation Callout if active */}
      {aiSheetExplanation && (
        <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-950 border border-purple-800/60 rounded-xl p-3.5 text-xs text-slate-200 flex items-start gap-3 shadow-md animate-fadeIn">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-purple-300">Gemini AI Sheet Analysis:</span>
            <p className="leading-relaxed text-slate-300 font-sans">{aiSheetExplanation}</p>
          </div>
        </div>
      )}

      {/* 2. Universal Data Grid */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/90 shadow-xl">
        <div className="overflow-x-auto max-h-[650px] custom-scrollbar">
          <table className="w-full text-xs text-left font-mono border-collapse">
            <thead className="bg-[#3d1849] text-white text-[11px] uppercase sticky top-0 z-20 shadow-md">
              <tr>
                <th className="py-2.5 px-3 border-r border-purple-900/60 bg-[#2c1337] w-12 text-center text-purple-300">
                  #
                </th>
                {headers.map((header: string, idx: number) => {
                  const isSorted = sortField === header;
                  return (
                    <th
                      key={idx}
                      onClick={() => handleSort(header)}
                      className="py-2.5 px-3 border-r border-purple-900/40 whitespace-nowrap cursor-pointer hover:bg-purple-900/50 transition-colors select-none"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate max-w-[200px]">{header}</span>
                        <ArrowUpDown className={`w-3 h-3 shrink-0 ${isSorted ? "text-amber-300" : "text-purple-400/60"}`} />
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 text-[11.5px]">
              {processedRows.length === 0 ? (
                <tr>
                  <td colSpan={headers.length + 1} className="py-12 text-center text-slate-500 font-sans">
                    {searchQuery ? "No matching records found for your search query." : "No data rows available in this worksheet."}
                  </td>
                </tr>
              ) : (
                processedRows.map((row: any, rIdx: number) => (
                  <tr key={rIdx} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-1.5 px-2 text-center text-slate-500 border-r border-slate-800 font-semibold bg-slate-950/40 text-[10px]">
                      {row._rowIndex || rIdx + 1}
                    </td>
                    {headers.map((header: string, cIdx: number) => {
                      const val = row[header];
                      const isNumber = typeof val === "number";
                      return (
                        <td
                          key={cIdx}
                          className={`py-1.5 px-3 border-r border-slate-800/40 truncate max-w-[250px] ${
                            isNumber ? "text-right font-medium text-slate-200" : "text-left"
                          }`}
                        >
                          {val !== null && val !== undefined ? String(val) : "-"}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
          <span>
            Showing {processedRows.length} of {rawRows.length} rows in &lsquo;{selectedSheetName}&rsquo;
          </span>
          {sortField && (
            <span className="text-purple-300">
              Sorted by: <strong>{sortField}</strong> ({sortOrder.toUpperCase()})
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
