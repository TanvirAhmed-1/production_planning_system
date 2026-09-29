"use client";

import React, { useState, useEffect } from "react";
import { format, getDaysInMonth } from "date-fns";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function RunLinesReport() {
  const [selectedMonth, setSelectedMonth] = useState("2026-10");
  const [data, setData] = useState<Record<string, Record<string, number>>>({});
  const [capacities, setCapacities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/analytics/run-lines?month=${selectedMonth}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
          setCapacities(json.capacities);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedMonth]);

  // Generate days array for the selected month
  const [year, month] = selectedMonth.split('-');
  const daysInMonth = getDaysInMonth(new Date(parseInt(year), parseInt(month) - 1));
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    return `${month}/${day.toString().padStart(2, '0')}`;
  });

  const getDayStr = (dayStr: string) => `${selectedMonth}-${dayStr.split('/')[1]}`;

  const getValue = (unit: string, day: string) => {
    const dStr = getDayStr(day);
    return data[dStr]?.[unit] || 0;
  };

  // Groupings
  const b1Units = [
    { code: "U02", label: "B1 Unit-02" },
    { code: "U03", label: "B1 Unit-03" },
    { code: "U04", label: "B1 Unit-04" },
  ];
  
  const b2Units = [
    { code: "B2U2", label: "B2 Unit-02" },
    { code: "B2U3", label: "B2 Unit-03" },
  ];

  const getB1Total = (day: string) => b1Units.reduce((acc, u) => acc + getValue(u.code, day), 0);
  const getB2Total = (day: string) => b2Units.reduce((acc, u) => acc + getValue(u.code, day), 0);
  
  const b1Capacity = b1Units.reduce((acc, u) => acc + (capacities[u.code] || 0), 0);
  const b2Capacity = b2Units.reduce((acc, u) => acc + (capacities[u.code] || 0), 0);

  return (
    <div className="space-y-6">
      <Card className="p-6 border-emerald-100 shadow-sm bg-white">
        <h2 className="text-xl font-bold text-slate-800 mb-1">Run Lines — lines with an active plan, per unit per day</h2>
        <p className="text-sm text-slate-500 mb-6">
          Idle Lines = unit capacity (Settings) minus running lines. Shows every calendar day of the selected month, even days with no plan data.
        </p>

        <div className="w-64 mb-8">
          <label className="block text-sm text-slate-600 mb-1.5">Month</label>
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full h-10 px-3 py-2 bg-emerald-50/50 border border-emerald-200 rounded-md text-sm outline-none focus:border-emerald-500"
          >
            <option value="2026-09">September 2026</option>
            <option value="2026-10">October 2026</option>
            <option value="2026-11">November 2026</option>
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
                  <th className="text-left px-4 py-3 font-semibold min-w-[150px] sticky left-0 bg-emerald-50/50 border-r border-emerald-100">Unit</th>
                  {days.map(day => (
                    <th key={day} className="px-2 py-3 font-semibold border-r border-emerald-50/50">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* B1 Units */}
                {b1Units.map(unit => (
                  <tr key={unit.code} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="text-left px-4 py-2.5 font-medium text-slate-600 sticky left-0 bg-white border-r border-slate-100">{unit.label}</td>
                    {days.map(day => {
                      const val = getValue(unit.code, day);
                      return (
                        <td key={day} className={`px-2 py-2.5 border-r border-slate-50 ${val === 0 ? 'bg-slate-50/50 text-slate-400' : 'text-slate-700'}`}>
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                
                {/* B1 Total */}
                <tr className="bg-emerald-50/70 border-b border-emerald-100 font-bold text-emerald-700">
                  <td className="text-left px-4 py-2.5 sticky left-0 bg-emerald-50 border-r border-emerald-100">Birichina-1 (B1 total)</td>
                  {days.map(day => {
                    const val = getB1Total(day);
                    return <td key={day} className={`px-2 py-2.5 border-r border-emerald-100/50 ${val === 0 ? 'text-emerald-400' : ''}`}>{val}</td>;
                  })}
                </tr>

                {/* B1 Idle */}
                <tr className="border-b border-slate-100 bg-red-50/30 text-red-500 font-medium">
                  <td className="text-left px-4 py-2.5 sticky left-0 bg-red-50/30 border-r border-slate-100">Idle Lines (B1)</td>
                  {days.map(day => {
                    const running = getB1Total(day);
                    const idle = running > 0 ? b1Capacity - running : -b1Capacity;
                    return <td key={day} className="px-2 py-2.5 border-r border-slate-50">{idle}</td>;
                  })}
                </tr>

                {/* B2 Units */}
                {b2Units.map(unit => (
                  <tr key={unit.code} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="text-left px-4 py-2.5 font-medium text-slate-600 sticky left-0 bg-white border-r border-slate-100">{unit.label}</td>
                    {days.map(day => {
                      const val = getValue(unit.code, day);
                      return (
                        <td key={day} className={`px-2 py-2.5 border-r border-slate-50 ${val === 0 ? 'bg-slate-50/50 text-slate-400' : 'text-slate-700'}`}>
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                
                {/* B2 Total */}
                <tr className="bg-emerald-50/70 border-b border-emerald-100 font-bold text-emerald-700">
                  <td className="text-left px-4 py-2.5 sticky left-0 bg-emerald-50 border-r border-emerald-100">Birichina-2 (B2 total)</td>
                  {days.map(day => {
                    const val = getB2Total(day);
                    return <td key={day} className={`px-2 py-2.5 border-r border-emerald-100/50 ${val === 0 ? 'text-emerald-400' : ''}`}>{val}</td>;
                  })}
                </tr>

                {/* B2 Idle */}
                <tr className="border-b border-slate-100 bg-red-50/30 text-red-500 font-medium">
                  <td className="text-left px-4 py-2.5 sticky left-0 bg-red-50/30 border-r border-slate-100">Idle Lines (B2)</td>
                  {days.map(day => {
                    const running = getB2Total(day);
                    const idle = running > 0 ? b2Capacity - running : -b2Capacity;
                    return <td key={day} className="px-2 py-2.5 border-r border-slate-50">{idle}</td>;
                  })}
                </tr>

                {/* Grand Total */}
                <tr className="bg-emerald-100/60 border-t-2 border-emerald-200 font-bold text-emerald-800 text-[13px]">
                  <td className="text-left px-4 py-3 rounded-bl-lg sticky left-0 bg-emerald-100 border-r border-emerald-200">Birichina Total</td>
                  {days.map(day => {
                    const val = getB1Total(day) + getB2Total(day);
                    return <td key={day} className={`px-2 py-3 border-r border-emerald-200/50 ${val === 0 ? 'text-emerald-500' : ''}`}>{val}</td>;
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
