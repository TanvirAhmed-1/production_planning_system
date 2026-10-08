"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { DateDetailsView } from "@/components/ui/dashboard/date-details-view";

export default function DateDefaultPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <DateDetailsView
          initialDate="2026-10-01"
          onBack={() => router.push("/")}
          onSelectLine={(lineName) =>
            router.push(`/?line=${encodeURIComponent(lineName)}`)
          }
        />
      </div>
    </div>
  );
}
