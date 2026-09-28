"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { 
  Factory, 
  FileSpreadsheet, 
  Bell
} from "lucide-react";

interface AppCardItem {
  id: string;
  name: string;
  path: string;
  icon: React.ElementType;
  iconColor: string;
}

export function AppLauncher() {
  const router = useRouter();

  const apps: AppCardItem[] = [
    {
      id: "production",
      name: "PRODUCTION ERP",
      path: "/production-erp",
      icon: Factory,
      iconColor: "text-blue-600",
    },
    {
      id: "inventory",
      name: "VA & LOSS TRACKER",
      path: "/second-excel",
      icon: FileSpreadsheet,
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#E2DCEB] via-[#ECE7F4] to-[#E5E0EE] flex flex-col justify-between font-sans select-none">
      {/* Top Header */}
      <header className="w-full flex items-center justify-end px-8 py-6 gap-5">
        <span className="font-semibold text-slate-800 text-sm sm:text-base tracking-tight">
          Birichina Garments Ltd
        </span>
        
        {/* Notification Bell */}
        <div className="relative cursor-pointer p-1">
          <Bell className="w-5 h-5 text-sky-500 fill-sky-500" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
            0
          </span>
        </div>

        {/* User / Org Avatar */}
        <div className="w-9 h-9 rounded-full bg-[#1E2B58] text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-md cursor-pointer ring-2 ring-white/60 hover:scale-105 transition-transform">
          B
        </div>
      </header>

      {/* Main Centered Area with the 2 Route-Based Apps */}
      <main className="flex-1 flex items-center justify-center px-6 py-4">
        <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-14 max-w-xl w-full mx-auto">
          {apps.map((app) => {
            const Icon = app.icon;
            return (
              <div 
                key={app.id} 
                onClick={() => router.push(app.path)}
                className="flex flex-col items-center justify-center gap-3 group cursor-pointer transition-all duration-200"
              >
                {/* Square Card */}
                <div 
                  className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex items-center justify-center transition-all duration-200 border border-white/90 hover:shadow-[0_10px_30px_rgba(0,0,0,0.12)] hover:-translate-y-2 hover:scale-105 active:scale-95 ring-2 ring-transparent hover:ring-indigo-400/40"
                >
                  <Icon 
                    className={`w-12 h-12 sm:w-14 sm:h-14 ${app.iconColor} transition-transform duration-200 group-hover:scale-110`} 
                    strokeWidth={1.5} 
                  />
                </div>

                {/* 1-Line Label */}
                <span 
                  className="text-xs sm:text-sm font-bold tracking-wider text-center text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors duration-200"
                >
                  {app.name}
                </span>
              </div>
            );
          })}
        </div>
      </main>

      {/* Subtle Bottom Space */}
      <footer className="h-10 w-full" />
    </div>
  );
}
