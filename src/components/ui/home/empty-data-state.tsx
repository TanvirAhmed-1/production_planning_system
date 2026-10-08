"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileSpreadsheet } from "lucide-react";

interface EmptyDataStateProps {
  onOpenImportModal: () => void;
}

export function EmptyDataState({ onOpenImportModal }: EmptyDataStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-3 rounded-lg border border-dashed border-slate-300 p-8 text-center">
      <AlertCircle className="h-10 w-10 text-amber-500" />
      <h3 className="text-base font-semibold text-slate-800">
        No Production Data Found
      </h3>
      <p className="max-w-md text-sm text-slate-500">
        Please upload an Excel production sheet to populate line performance, order
        tracking, and efficiency analytics.
      </p>
      <Button
        onClick={onOpenImportModal}
        className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
      >
        <FileSpreadsheet className="h-4 w-4" />
        Upload Excel Sheet
      </Button>
    </div>
  );
}
