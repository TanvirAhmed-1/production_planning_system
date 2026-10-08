"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TopLowLinesCardsProps {
  topLines: any[];
  lowestLines: any[];
  onLineClick: (lineName: string) => void;
  onViewAllClick: () => void;
  onAnalyzeGapsClick: () => void;
}

export function TopLowLinesCards({
  topLines = [],
  lowestLines = [],
  onLineClick,
  onViewAllClick,
  onAnalyzeGapsClick,
}: TopLowLinesCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Top Performing Lines Card */}
      <Card className="shadow-xs border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Top Performing Lines
              </CardTitle>
              <p className="text-xs text-slate-500">
                Highest operational efficiency
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-indigo-600"
            onClick={onViewAllClick}
          >
            View All Lines →
          </Button>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-3">
            {topLines.slice(0, 5).map((l: any, idx: number) => (
              <div
                key={l.lineName}
                onClick={() => onLineClick(l.lineName)}
                className="group flex cursor-pointer items-center justify-between rounded-lg border border-slate-100 p-3 transition-colors hover:border-emerald-200 hover:bg-emerald-50/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 group-hover:text-emerald-700">
                        {l.lineName}
                      </span>
                      <Badge variant="outline" className="text-[10px] py-0 px-1">
                        {l.unitCode}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      Target: {l.target.toLocaleString()} pcs • Actual:{" "}
                      {l.actual.toLocaleString()} pcs
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-emerald-700">
                    {l.efficiency}%
                  </span>
                  <p className="text-[11px] text-slate-500">
                    {l.target > 0
                      ? ((l.actual / l.target) * 100).toFixed(1)
                      : 0}
                    % Achieved
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Low Performing Lines Card */}
      <Card className="shadow-xs border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
              <TrendingDown className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Low Performing Lines
              </CardTitle>
              <p className="text-xs text-slate-500">
                Efficiency requiring supervision
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-indigo-600"
            onClick={onAnalyzeGapsClick}
          >
            Analyze Gaps →
          </Button>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-3">
            {lowestLines.slice(0, 5).map((l: any, idx: number) => (
              <div
                key={l.lineName}
                onClick={() => onLineClick(l.lineName)}
                className="group flex cursor-pointer items-center justify-between rounded-lg border border-slate-100 p-3 transition-colors hover:border-rose-200 hover:bg-rose-50/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 text-xs font-semibold text-rose-700">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 group-hover:text-rose-700">
                        {l.lineName}
                      </span>
                      <Badge variant="outline" className="text-[10px] py-0 px-1">
                        {l.unitCode}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      Gap: -{l.gap.toLocaleString()} pcs • Target:{" "}
                      {l.target.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-rose-600">
                    {l.efficiency}%
                  </span>
                  <p className="text-[11px] text-slate-500">
                    {l.target > 0
                      ? ((l.actual / l.target) * 100).toFixed(1)
                      : 0}
                    % Achieved
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
