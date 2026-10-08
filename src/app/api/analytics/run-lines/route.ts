import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let month = searchParams.get('month') || '';

    // If month not provided, dynamically resolve latest available month from DB
    if (!month || month === 'ALL') {
      const latestBatch = await prisma.importBatch.findFirst({
        where: { month: { not: '' } },
        orderBy: { createdAt: 'desc' },
        select: { month: true }
      });
      if (latestBatch?.month) {
        month = latestBatch.month;
      } else {
        const latestDaily = await prisma.productionDaily.findFirst({
          where: { month: { not: '' } },
          orderBy: { date: 'desc' },
          select: { month: true }
        });
        month = latestDaily?.month || new Date().toISOString().slice(0, 7);
      }
    }

    // 1. Get daily counts of running lines per unit
    const stats = await prisma.productionDaily.groupBy({
      by: ['dateString', 'unitId'],
      where: {
        month: month,
        targetQty: { gt: 0 } // Or actualQty > 0? The request says "active plan"
      },
      _count: {
        lineId: true
      }
    });
    
    // Also consider rows that might only have targetSah > 0 or are just present
    const statsAll = await prisma.productionDaily.groupBy({
      by: ['dateString', 'unitId'],
      where: {
        month: month
      },
      _count: {
        lineId: true
      }
    });

    // We use statsAll because if a row exists in ProductionDaily for that date, it means it has a plan
    
    // 2. Get unit capacities and metadata (excluding any Styrax units)
    const units = await prisma.unit.findMany({
      where: {
        NOT: {
          code: { in: ["S1", "S2", "S1U1", "S1U2", "S1U3", "S1U4"] }
        }
      },
      include: {
        _count: {
          select: { lines: true }
        }
      },
      orderBy: [
        { cluster: "asc" },
        { code: "asc" }
      ]
    });
    
    const unitMap = Object.fromEntries(units.map(u => [u.id, u]));

    // 3. Format data
    const dailyData: Record<string, Record<string, number>> = {};
    
    statsAll.forEach(s => {
      const date = s.dateString;
      const unitCode = unitMap[s.unitId]?.code;
      if (!unitCode) return;
      
      if (!dailyData[date]) {
        dailyData[date] = {};
      }
      dailyData[date][unitCode] = s._count.lineId;
    });

    const capacities: Record<string, number> = {};
    units.forEach(u => {
      capacities[u.code] = u._count.lines;
    });

    // Group units dynamically by cluster
    const clusterMap = new Map<string, {
      cluster: string;
      clusterName: string;
      totalCapacity: number;
      units: { code: string; name: string; label: string; capacity: number }[];
    }>();

    units.forEach(u => {
      const clusterKey = u.cluster || "Other";
      if (!clusterMap.has(clusterKey)) {
        let clusterName = `${clusterKey} Total`;
        if (clusterKey === "B1") clusterName = "Birichina-1 (B1 total)";
        else if (clusterKey === "B2") clusterName = "Birichina-2 (B2 total)";
        
        clusterMap.set(clusterKey, {
          cluster: clusterKey,
          clusterName,
          totalCapacity: 0,
          units: []
        });
      }

      const clusterGroup = clusterMap.get(clusterKey)!;
      const cap = u._count.lines;
      clusterGroup.totalCapacity += cap;
      clusterGroup.units.push({
        code: u.code,
        name: u.name,
        label: `${u.cluster ? u.cluster + " " : ""}${u.name}`,
        capacity: cap
      });
    });

    const clusters = Array.from(clusterMap.values());

    return NextResponse.json({
      success: true,
      data: dailyData,
      capacities,
      clusters,
      units: units.map(u => ({
        code: u.code,
        name: u.name,
        cluster: u.cluster,
        label: `${u.cluster ? u.cluster + " " : ""}${u.name}`,
        capacity: u._count.lines
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
