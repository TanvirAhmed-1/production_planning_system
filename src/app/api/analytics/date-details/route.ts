import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date');
    const unitCode = searchParams.get('unitCode');
    const batchId = searchParams.get('batchId');

    if (!dateStr) {
      return NextResponse.json({ error: 'Date parameter is required (YYYY-MM-DD)' }, { status: 400 });
    }

    const whereDailySummary: any = {
      dateString: dateStr,
      orderId: null,
    };

    const whereOrderDaily: any = {
      dateString: dateStr,
      orderId: { not: null },
    };

    if (unitCode && unitCode !== 'ALL') {
      whereDailySummary.unit = { code: unitCode };
      whereOrderDaily.unit = { code: unitCode };
    }

    if (batchId && batchId !== 'ALL') {
      whereDailySummary.importBatchId = batchId;
      whereOrderDaily.importBatchId = batchId;
    }

    // 1. Fetch line daily summary records for this date
    const lineSummaries = await prisma.productionDaily.findMany({
      where: whereDailySummary,
      include: {
        line: {
          select: {
            id: true,
            name: true,
            unitCode: true,
            manpower: true,
            workingHours: true,
            status: true,
          },
        },
        unit: {
          select: {
            code: true,
            name: true,
          },
        },
      },
      orderBy: [
        { unit: { code: 'asc' } },
        { line: { name: 'asc' } },
      ],
    });

    // 2. Fetch all orders running on this date with style info
    const orderRecords = await prisma.productionDaily.findMany({
      where: whereOrderDaily,
      include: {
        order: {
          select: {
            id: true,
            orderCode: true,
            styleRef: true,
            poNo: true,
            color: true,
            buyerName: true,
            smv: true,
            orderQty: true,
            planQty: true,
          },
        },
        line: {
          select: {
            name: true,
            unitCode: true,
          },
        },
      },
    });

    // Group running styles by line
    const stylesByLine: Record<string, any[]> = {};
    for (const ordRec of orderRecords) {
      const lineName = ordRec.line?.name || 'UNASSIGNED';
      if (!stylesByLine[lineName]) {
        stylesByLine[lineName] = [];
      }
      stylesByLine[lineName].push({
        orderId: ordRec.order?.id,
        styleRef: ordRec.order?.styleRef || 'N/A',
        buyer: ordRec.order?.buyerName || 'N/A',
        poNo: ordRec.order?.poNo || 'N/A',
        color: ordRec.order?.color || 'N/A',
        smv: ordRec.smv || ordRec.order?.smv || 2.5,
        targetQty: ordRec.targetQty || 0,
        actualQty: ordRec.actualQty || 0,
        targetSah: ordRec.targetSah || 0,
      });
    }

    // 3. Format line details list
    const lines = lineSummaries.map((rec) => {
      const lineName = rec.line?.name || 'Unknown';
      const styles = stylesByLine[lineName] || [];
      const target = rec.targetQty || 0;
      const actual = rec.actualQty || 0;
      const gap = rec.gap || (target - actual);
      const targetSah = Number((rec.targetSah || 0).toFixed(2));
      const actualSah = Number((rec.actualSah || 0).toFixed(2));
      const clockHours = Number((rec.clockHours || 0).toFixed(2));
      const plannedEfficiency = clockHours > 0 ? Math.round((targetSah / clockHours) * 100) : 0;
      const actualEfficiency = clockHours > 0 && actualSah > 0 ? Math.round((actualSah / clockHours) * 100) : 0;
      const efficiency = rec.plannedEfficiency ? Math.round(rec.plannedEfficiency) : plannedEfficiency;

      return {
        lineId: rec.lineId,
        lineName,
        unitCode: rec.unit?.code || rec.line?.unitCode || 'Unit',
        unitName: rec.unit?.name || 'Unit',
        manpower: rec.manpower || rec.line?.manpower || 25,
        workingHours: rec.line?.workingHours || 10.0,
        target,
        actual,
        gap,
        targetSah,
        actualSah,
        clockHours,
        plannedEfficiency,
        actualEfficiency,
        efficiency,
        achievementRate: target > 0 ? Number(((actual / target) * 100).toFixed(1)) : 0,
        stylesCount: styles.length,
        styles,
      };
    });

    // 4. Calculate Date Summary Totals
    const totalTarget = lines.reduce((acc, l) => acc + l.target, 0);
    const totalActual = lines.reduce((acc, l) => acc + l.actual, 0);
    const totalGap = lines.reduce((acc, l) => acc + l.gap, 0);
    const totalTargetSah = Number(lines.reduce((acc, l) => acc + l.targetSah, 0).toFixed(2));
    const totalActualSah = Number(lines.reduce((acc, l) => acc + l.actualSah, 0).toFixed(2));
    const totalClockHours = Number(lines.reduce((acc, l) => acc + l.clockHours, 0).toFixed(2));
    const overallPlannedEfficiency = totalClockHours > 0 ? Number(((totalTargetSah / totalClockHours) * 100).toFixed(1)) : 0;
    const overallActualEfficiency = totalClockHours > 0 && totalActualSah > 0 ? Number(((totalActualSah / totalClockHours) * 100).toFixed(1)) : 0;
    const totalManpower = lines.reduce((acc, l) => acc + l.manpower, 0);

    // 5. Unit breakdown for this date
    const unitsMap: Record<string, { unitCode: string; target: number; actual: number; targetSah: number; clockHours: number; linesCount: number; efficiency: number }> = {};
    for (const l of lines) {
      if (!unitsMap[l.unitCode]) {
        unitsMap[l.unitCode] = {
          unitCode: l.unitCode,
          target: 0,
          actual: 0,
          targetSah: 0,
          clockHours: 0,
          linesCount: 0,
          efficiency: 0,
        };
      }
      unitsMap[l.unitCode].target += l.target;
      unitsMap[l.unitCode].actual += l.actual;
      unitsMap[l.unitCode].targetSah += l.targetSah;
      unitsMap[l.unitCode].clockHours += l.clockHours;
      unitsMap[l.unitCode].linesCount += 1;
    }

    const unitBreakdown = Object.values(unitsMap).map((u) => ({
      ...u,
      targetSah: Number(u.targetSah.toFixed(1)),
      clockHours: Number(u.clockHours.toFixed(1)),
      efficiency: u.clockHours > 0 ? Number(((u.targetSah / u.clockHours) * 100).toFixed(1)) : 0,
    }));

    return NextResponse.json({
      success: true,
      date: dateStr,
      dayOfWeek: new Date(`${dateStr}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }),
      summary: {
        totalTarget,
        totalActual,
        totalGap,
        totalTargetSah,
        totalActualSah,
        totalClockHours,
        overallPlannedEfficiency,
        overallActualEfficiency,
        totalManpower,
        totalActiveLines: lines.length,
      },
      unitBreakdown,
      lines,
    });
  } catch (error: any) {
    console.error('Date details API error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
