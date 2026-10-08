import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get('batchId');
    const month = searchParams.get('month') || undefined;
    const unitCode = searchParams.get('unitCode');
    const lineName = searchParams.get('lineName');
    const buyerName = searchParams.get('buyerName');
    const season = searchParams.get('season');
    const search = searchParams.get('search')?.trim();
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '200', 10);

    // Build filter
    const where: any = {};

    if (batchId && batchId !== 'ALL') {
      where.importBatchId = batchId;
    }
    if (unitCode && unitCode !== 'ALL') {
      where.unitCode = unitCode;
    }
    if (lineName && lineName !== 'ALL') {
      where.lineName = lineName;
    }
    if (buyerName && buyerName !== 'ALL') {
      where.buyerName = buyerName;
    }
    if (season && season !== 'ALL') {
      where.season = season;
    }
    if (search) {
      where.OR = [
        { styleRef: { contains: search, mode: 'insensitive' } },
        { poNo: { contains: search, mode: 'insensitive' } },
        { color: { contains: search, mode: 'insensitive' } },
        { buyerName: { contains: search, mode: 'insensitive' } },
        { lineName: { contains: search, mode: 'insensitive' } },
        { orderCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const totalCount = await prisma.order.count({ where });

    // Fetch orders with pagination
    const orders = await prisma.order.findMany({
      where,
      include: {
        line: {
          select: {
            manpower: true,
            workingHours: true,
            summaryJson: true,
          }
        },
        dailyRecords: {
          where: month && month !== 'ALL' ? { month } : undefined,
          select: {
            dateString: true,
            targetQty: true,
            actualQty: true,
            efficiency: true,
            targetSah: true,
            actualSah: true,
          }
        }
      },
      orderBy: [
        { lineName: 'asc' },
        { buyerName: 'asc' },
        { planQty: 'desc' },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Extract all distinct date columns available for this month
    const distinctDates = await prisma.productionDaily.findMany({
      where: month && month !== 'ALL' ? { month } : undefined,
      select: { dateString: true },
      distinct: ['dateString'],
      orderBy: { dateString: 'asc' },
    });

    const dateColumns = distinctDates.map(d => {
      const parts = d.dateString.split('-');
      const dayNum = parseInt(parts[2], 10);
      const dateObj = new Date(`${d.dateString}T00:00:00Z`);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
      return {
        dateStr: d.dateString,
        dayNum,
        dayName,
        shortLabel: `${dayNum} (${dayName})`
      };
    });

    // Format rows for Excel grid
    const rows = orders.map((ord, idx) => {
      const dailyMap: Record<string, { target: number; actual: number; eff: number }> = {};
      let totalActual = 0;
      let totalTarget = 0;

      for (const d of ord.dailyRecords) {
        dailyMap[d.dateString] = {
          target: d.targetQty || 0,
          actual: d.actualQty || 0,
          eff: (d as any).efficiency || 0,
        };
        totalActual += d.actualQty || 0;
        totalTarget += d.targetQty || 0;
      }

      // If dailyRecords empty in DB relation, try ord.dailyPlanJson
      if (Object.keys(dailyMap).length === 0 && ord.dailyPlanJson) {
        try {
          const parsed = JSON.parse(ord.dailyPlanJson);
          for (const [dateStr, qty] of Object.entries(parsed)) {
            dailyMap[dateStr] = {
              target: Number(qty) || 0,
              actual: 0,
              eff: 0,
            };
            totalTarget += Number(qty) || 0;
          }
        } catch (e) {
          // ignore
        }
      }

      return {
        rowIndex: (page - 1) * pageSize + idx + 1,
        id: ord.id,
        lineName: ord.lineName || 'N/A',
        manpower: ord.line?.manpower || 25,
        unitCode: ord.unitCode,
        orderStatus: ord.orderStatus || 'Confirmed',
        buyerName: ord.buyerName,
        orderCode: ord.orderCode,
        ocs: ord.ocs || 'N/A',
        subOc: ord.subOc || 'N/A',
        styleRef: ord.styleRef || 'N/A',
        article: ord.article || 'N/A',
        season: ord.season || 'N/A',
        poNo: ord.poNo || 'N/A',
        color: ord.color || 'N/A',
        orderQty: ord.orderQty,
        smv: ord.smv,
        mainCategory: ord.mainCategory || 'UNDERWEAR',
        subCategory: ord.subCategory || 'BOXER',
        productType: ord.productType || 'P1',
        fobPrice: ord.fobPrice || 0,
        salesValue: ord.salesValue || 0,
        planQty: ord.planQty || totalTarget,
        actualQty: totalActual,
        gapQty: (ord.planQty || totalTarget) - totalActual,
        daily: dailyMap,
      };
    });

    // Extract unique line names from the paginated orders
    const uniqueLineNames = Array.from(new Set(orders.map(o => o.lineName).filter((l): l is string => Boolean(l))));

    // Fetch line entities for summaryJson
    const linesWithSummary = await prisma.productionLine.findMany({
      where: { name: { in: uniqueLineNames } },
      select: { name: true, summaryJson: true, manpower: true }
    });

    // Fetch line summary records from productionDaily (orderId == null)
    const lineSummaryRecords = await prisma.productionDaily.findMany({
      where: {
        orderId: null,
        month: month && month !== 'ALL' ? month : undefined,
        line: {
          name: { in: uniqueLineNames }
        }
      },
      include: {
        line: {
          select: { name: true }
        }
      }
    });

    // Build comprehensive lineSummaries data structure
    const lineSummaries: Record<string, {
      PLAN: { total: number; daily: Record<string, number | null> };
      SAH: { total: number; daily: Record<string, number | null> };
      MACHINE: { total: number; daily: Record<string, number | null> };
      EFFI: { total: number; daily: Record<string, number | null> };
      dates: Record<string, { targetQty: number; targetSah: number; clockHours: number; plannedEfficiency: number }>;
    }> = {};

    // 1. Initialize from linesWithSummary.summaryJson
    for (const l of linesWithSummary) {
      const ln = l.name;
      let parsedSum: any = null;
      if (l.summaryJson) {
        try {
          parsedSum = JSON.parse(l.summaryJson);
        } catch (e) {
          // ignore
        }
      }

      const planTotal = parsedSum?.PLAN?.total || 0;
      const sahTotal = parsedSum?.SAH?.total || 0;
      const machineTotal = parsedSum?.MACHINE?.total || (l.manpower * 260);
      const effiTotal = parsedSum?.EFFI?.total ? (parsedSum.EFFI.total <= 1.0 ? Number((parsedSum.EFFI.total * 100).toFixed(1)) : Number(parsedSum.EFFI.total.toFixed(1))) : (machineTotal > 0 ? Number(((sahTotal / machineTotal) * 100).toFixed(1)) : 0);

      lineSummaries[ln] = {
        PLAN: {
          total: planTotal,
          daily: parsedSum?.PLAN?.daily || {}
        },
        SAH: {
          total: sahTotal,
          daily: parsedSum?.SAH?.daily || {}
        },
        MACHINE: {
          total: machineTotal,
          daily: parsedSum?.MACHINE?.daily || {}
        },
        EFFI: {
          total: effiTotal,
          daily: {}
        },
        dates: {}
      };

      // Format daily efficiency percentages
      if (parsedSum?.EFFI?.daily) {
        for (const [dStr, effVal] of Object.entries(parsedSum.EFFI.daily)) {
          if (effVal !== null && effVal !== undefined) {
            const num = Number(effVal);
            lineSummaries[ln].EFFI.daily[dStr] = num <= 1.0 ? Number((num * 100).toFixed(1)) : Number(num.toFixed(1));
          } else {
            lineSummaries[ln].EFFI.daily[dStr] = null;
          }
        }
      }
    }

    // 2. Supplement from lineSummaryRecords
    for (const rec of lineSummaryRecords) {
      const ln = (rec as any).line?.name;
      if (!ln) continue;
      if (!lineSummaries[ln]) {
        lineSummaries[ln] = {
          PLAN: { total: 0, daily: {} },
          SAH: { total: 0, daily: {} },
          MACHINE: { total: 0, daily: {} },
          EFFI: { total: 0, daily: {} },
          dates: {}
        };
      }

      lineSummaries[ln].dates[rec.dateString] = {
        targetQty: rec.targetQty || 0,
        targetSah: Number((rec.targetSah || 0).toFixed(2)),
        clockHours: Number((rec.clockHours || 0).toFixed(2)),
        plannedEfficiency: rec.plannedEfficiency ? Math.round(rec.plannedEfficiency) : 0,
      };

      if (!lineSummaries[ln].PLAN.daily[rec.dateString] && rec.targetQty) {
        lineSummaries[ln].PLAN.daily[rec.dateString] = rec.targetQty;
      }
      if (!lineSummaries[ln].SAH.daily[rec.dateString] && rec.targetSah) {
        lineSummaries[ln].SAH.daily[rec.dateString] = Number(rec.targetSah.toFixed(2));
      }
      if (!lineSummaries[ln].MACHINE.daily[rec.dateString] && rec.clockHours) {
        lineSummaries[ln].MACHINE.daily[rec.dateString] = Number(rec.clockHours.toFixed(2));
      }
      if (!lineSummaries[ln].EFFI.daily[rec.dateString] && rec.plannedEfficiency) {
        lineSummaries[ln].EFFI.daily[rec.dateString] = Math.round(rec.plannedEfficiency);
      }
    }

    // Calculate Summary Totals for visible rows & global metrics
    const summaryAgg = await prisma.order.aggregate({
      where,
      _sum: {
        orderQty: true,
        planQty: true,
      }
    });

    return NextResponse.json({
      success: true,
      month,
      page,
      pageSize,
      totalRows: totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      dateColumns,
      rows,
      lineSummaries,
      summary: {
        totalOrderQty: summaryAgg._sum.orderQty || 0,
        totalPlanQty: summaryAgg._sum.planQty || 0,
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
