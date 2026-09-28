"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, ArrowLeft, Layers, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SecondExcelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))] pointer-events-none" />
      
      <div className="max-w-xl w-full bg-slate-900/90 border border-emerald-500/30 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl shadow-emerald-500/10 text-center space-y-6 relative z-10">
        <div className="w-20 h-20 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center rounded-2xl mx-auto shadow-lg shadow-emerald-600/30">
          <FileSpreadsheet className="w-10 h-10" />
        </div>
        
        <div className="space-y-2">
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs px-3 py-1">
            2nd Excel Route: /second-excel
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Secondary Excel Module
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            This route is ready to integrate your 2nd Excel file type. Drop your new spreadsheet structure or business logic requirements to configure dedicated schema parsing, validation, and analytics.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button 
            onClick={() => router.push("/")} 
            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-6 py-2.5 rounded-xl border border-slate-700 transition-all gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>App Launcher Menu</span>
          </Button>
          <Button 
            onClick={() => router.push("/production-erp")} 
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 transition-all gap-2"
          >
            <Layers className="w-4 h-4" />
            <span>Open Production ERP</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
