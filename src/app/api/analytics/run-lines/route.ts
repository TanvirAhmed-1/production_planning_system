import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || '2026-10'; // Default to Oct 2026

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
    
    // 2. Get unit capacities
    const units = await prisma.unit.findMany({
      include: {
        _count: {
          select: { lines: true }
        }
      }
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

    return NextResponse.json({
      success: true,
      data: dailyData,
      capacities
    });
  } catch (error: any) {
    console.error("Run Lines API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
