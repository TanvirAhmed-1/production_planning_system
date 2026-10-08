"use client";

import React, { useState, useEffect } from "react";
import { getDaysInMonth } from "date-fns";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { fetchWithCache } from "@/lib/api-cache";

interface ClusterUnit {
  code: string;
  name: string;
  label: string;
  capacity: number;
}

interface ClusterGroup {
  cluster: string;
  clusterName: string;
  totalCapacity: number;
  units: ClusterUnit[];
}

export function RunLinesReport() {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [monthOptions, setMonthOptions] = useState<{ label: string; value: string }[]>([]);
  const [data, setData] = useState<Record<string, Record<string, number>>>({});
  const [capacities, setCapacities] = useState<Record<string, number>>({});
  const [clusters, setClusters] = useState<ClusterGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMonths() {
      try {
        const json = await fetchWithCache("/api/analytics/filters");
        if (json?.months && json.months.length > 0) {
          setMonthOptions(json.months);
          setSelectedMonth((prev) => prev || json.months[0].value);
        }
      } catch (err) {
        console.error("Error loading filter months:", err);
      }
    }
    loadMonths();
  }, []);

  useEffect(() => {
    if (!selectedMonth) return;
    async function fetchData() {
      setLoading(true);
      try {
        const json = await fetchWithCache(`/api/analytics/run-lines?month=${selectedMonth}`);
        if (json?.success) {
          setData(json.data || {});
          setCapacities(json.capacities || {});
          setClusters(json.clusters || []);
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedMonth]);

  // Generate days array for the selected month
  const [yearStr, monthStr] = (selectedMonth || "2026-10").split("-");
  const year = parseInt(yearStr, 10) || 2026;
  const month = parseInt(monthStr, 10) || 10;
  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    return `${month.toString().padStart(2, "0")}/${day.toString().padStart(2, "0")}`;
  });

  const getDayStr = (dayStr: string) => `${selectedMonth}-${dayStr.split("/")[1]}`;

  const getValue = (unit: string, day: string) => {
    const dStr = getDayStr(day);
    return data[dStr]?.[unit] || 0;
  };

  return (
    <div className="space-y-6">
      <Card className="p-3.5 sm:p-6 border-emerald-100 shadow-sm bg-white dark:bg-slate-900 dark:border-slate-800">
        <h2 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">
          Run Lines — lines with an active plan, per unit per day
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-6">
          Idle Lines = unit capacity (Settings) minus running lines. Shows every calendar day of the selected month, even days with no plan data.
        </p>

        <div className="w-full sm:w-64 mb-4 sm:mb-8">
          <label className="block text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-1.5 font-semibold">Month</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full h-9 sm:h-10 px-3 py-2 bg-emerald-50/50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 rounded-md text-xs sm:text-sm outline-none focus:border-emerald-500"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <div className="overflow-x-auto border border-emerald-100 rounded-lg">
            <table className="w-full text-xs text-center border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-emerald-50/50 text-emerald-900 border-b border-emerald-100">
                  <th className="text-left px-4 py-3 font-semibold min-w-[150px] sticky left-0 bg-emerald-50/50 border-r border-emerald-100">
                    Unit
                  </th>
                  {days.map((day) => (
                    <th key={day} className="px-2 py-3 font-semibold border-r border-emerald-50/50">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clusters.map((clusterGroup) => {
                  const getClusterRunning = (day: string) =>
                    clusterGroup.units.reduce((acc, u) => acc + getValue(u.code, day), 0);

                  return (
                    <React.Fragment key={clusterGroup.cluster}>
                      {/* Cluster Unit Rows */}
                      {clusterGroup.units.map((unit) => (
                        <tr
                          key={unit.code}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="text-left px-4 py-2.5 font-medium text-slate-600 sticky left-0 bg-white border-r border-slate-100">
                            {unit.label}
                          </td>
                          {days.map((day) => {
                            const val = getValue(unit.code, day);
                            return (
                              <td
                                key={day}
                                className={`px-2 py-2.5 border-r border-slate-50 ${
                                  val === 0 ? "bg-slate-50/50 text-slate-400" : "text-slate-700"
                                }`}
                              >
                                {val}
                              </td>
                            );
                          })}
                        </tr>
                      ))}

                      {/* Cluster Total */}
                      <tr className="bg-emerald-50/70 border-b border-emerald-100 font-bold text-emerald-700">
                        <td className="text-left px-4 py-2.5 sticky left-0 bg-emerald-50 border-r border-emerald-100">
                          {clusterGroup.clusterName}
                        </td>
                        {days.map((day) => {
                          const val = getClusterRunning(day);
                          return (
                            <td
                              key={day}
                              className={`px-2 py-2.5 border-r border-emerald-100/50 ${
                                val === 0 ? "text-emerald-400" : ""
                              }`}
                            >
                              {val}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Cluster Idle */}
                      <tr className="border-b border-slate-100 bg-red-50/30 text-red-500 font-medium">
                        <td className="text-left px-4 py-2.5 sticky left-0 bg-red-50/30 border-r border-slate-100">
                          Idle Lines ({clusterGroup.cluster})
                        </td>
                        {days.map((day) => {
                          const running = getClusterRunning(day);
                          const idle =
                            running > 0
                              ? clusterGroup.totalCapacity - running
                              : -clusterGroup.totalCapacity;
                          return (
                            <td key={day} className="px-2 py-2.5 border-r border-slate-50">
                              {idle}
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  );
                })}

                {/* Grand Total */}
                <tr className="bg-emerald-100/60 border-t-2 border-emerald-200 font-bold text-emerald-800 text-[13px]">
                  <td className="text-left px-4 py-3 rounded-bl-lg sticky left-0 bg-emerald-100 border-r border-emerald-200">
                    Birichina Total
                  </td>
                  {days.map((day) => {
                    const totalRunning = clusters.reduce((acc, cg) => {
                      return acc + cg.units.reduce((uAcc, u) => uAcc + getValue(u.code, day), 0);
                    }, 0);
                    return (
                      <td
                        key={day}
                        className={`px-2 py-3 border-r border-emerald-200/50 ${
                          totalRunning === 0 ? "text-emerald-500" : ""
                        }`}
                      >
                        {totalRunning}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
