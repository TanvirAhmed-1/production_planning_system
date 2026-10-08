"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sliders } from "lucide-react";

interface SystemSettingsTabProps {
  lowThreshold?: number;
  onOpenSettingsModal: () => void;
}

export function SystemSettingsTab({
  lowThreshold = 60,
  onOpenSettingsModal,
}: SystemSettingsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-slate-900">
          System Preferences & Thresholds
        </h2>
        <p className="text-sm text-slate-500">
          Configure efficiency benchmarks, notification triggers, and production
          targets
        </p>
      </div>
      <Card className="shadow-xs border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Efficiency Alert Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Adjust the baseline benchmarks used to trigger automatic alerts across
            all dashboards:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-rose-200 bg-rose-50/40 p-4">
              <span className="text-xs font-semibold text-rose-700 uppercase">
                Critical Low
              </span>
              <div className="mt-1 text-2xl font-bold text-rose-800">
                &lt; {lowThreshold}%
              </div>
              <p className="mt-1 text-xs text-rose-600">
                Triggers urgent supervisor warning
              </p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-4">
              <span className="text-xs font-semibold text-amber-700 uppercase">
                Attention Needed
              </span>
              <div className="mt-1 text-2xl font-bold text-amber-800">
                {lowThreshold}% - 80%
              </div>
              <p className="mt-1 text-xs text-amber-600">
                Requires daily line tracking
              </p>
            </div>
            <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-4">
              <span className="text-xs font-semibold text-indigo-700 uppercase">
                Target Range
              </span>
              <div className="mt-1 text-2xl font-bold text-indigo-800">
                80% - 100%
              </div>
              <p className="mt-1 text-xs text-indigo-600">
                Normal operating parameters
              </p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">
              <span className="text-xs font-semibold text-emerald-700 uppercase">
                High Benchmark
              </span>
              <div className="mt-1 text-2xl font-bold text-emerald-800">
                &gt; 100%
              </div>
              <p className="mt-1 text-xs text-emerald-600">
                Peak performance reward line
              </p>
            </div>
          </div>
          <div className="pt-2">
            <Button
              onClick={onOpenSettingsModal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            >
              <Sliders className="h-4 w-4" />
              Modify Threshold Values
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
