"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { DateDetailsView } from "@/components/ui/dashboard/date-details-view";

interface PageProps {
  params: Promise<{ date: string }>;
}

export default function DateBreakdownPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const dateParam = resolvedParams?.date || "2026-10-01";

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <DateDetailsView
          initialDate={dateParam}
          onBack={() => router.push("/")}
          onSelectLine={(lineName) =>
            router.push(`/?line=${encodeURIComponent(lineName)}`)
          }
        />
      </div>
    </div>
  );
}
