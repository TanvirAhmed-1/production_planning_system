"use client";

import React from "react";

export function ExcelLogsSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase">
          <tr>
            <th className="px-4 py-3">File & Hierarchy</th>
            <th className="px-4 py-3">Type & Link</th>
            <th className="px-4 py-3">Month</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Imported Rows</th>
            <th className="px-4 py-3">Attached Data</th>
            <th className="px-4 py-3">Uploaded At</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {[1, 2, 3, 4].map((i) => (
            <tr key={i} className="animate-pulse">
              <td className="px-4 py-3.5">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-slate-200" />
                    <div className="h-4 w-48 rounded bg-slate-200" />
                  </div>
                  <div className="h-3 w-32 rounded bg-slate-100" />
                </div>
              </td>
              <td className="px-4 py-3.5">
                <div className="h-5 w-24 rounded-full bg-slate-200" />
              </td>
              <td className="px-4 py-3.5">
                <div className="h-4 w-16 rounded bg-slate-200" />
              </td>
              <td className="px-4 py-3.5">
                <div className="h-5 w-16 rounded-full bg-slate-200" />
              </td>
              <td className="px-4 py-3.5">
                <div className="h-4 w-14 rounded bg-slate-200" />
              </td>
              <td className="px-4 py-3.5">
                <div className="h-4 w-20 rounded bg-slate-200" />
              </td>
              <td className="px-4 py-3.5">
                <div className="h-4 w-28 rounded bg-slate-200" />
              </td>
              <td className="px-4 py-3.5 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="h-7 w-24 rounded bg-slate-200" />
                  <div className="h-7 w-7 rounded bg-slate-200" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
