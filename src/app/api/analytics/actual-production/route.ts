import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedBatchId = searchParams.get('batchId');
    const selectedUnit = searchParams.get('unitCode');
    const selectedLine = searchParams.get('lineName');
    const selectedDate = searchParams.get('date');
    const searchQuery = searchParams.get('search')?.trim().toLowerCase();

    // 1. Fetch all available ACTUAL batches
    const allActualBatches = await prisma.importBatch.findMany({
      where: { batchType: 'ACTUAL' },
      orderBy: { createdAt: 'desc' },
      include: {
        parentPlan: {
          select: { id: true, fileName: true, month: true }
        }
      }
    });

    if (allActualBatches.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No actual production batches found.',
        allActualBatches: [],
        activeBatch: null,
        kpis: null,
        unitBreakdown: [],
        lineBreakdown: [],
        dateBreakdown: [],
        buyerBreakdown: [],
        records: []
      });
    }

    // 2. Resolve Active Batch: user selected or default to the latest
    let activeBatch = null;
    if (requestedBatchId && requestedBatchId !== 'ALL') {
      activeBatch = allActualBatches.find(b => b.id === requestedBatchId) || null;
    }
    if (!activeBatch) {
      activeBatch = allActualBatches[0];
    }

    // 3. Build query filter for actual records of active batch
    const whereClause: any = {
      importBatchId: activeBatch.id
    };

    if (selectedUnit && selectedUnit !== 'ALL') {
      whereClause.unitCode = selectedUnit;
    }
    if (selectedLine && selectedLine !== 'ALL') {
      whereClause.lineName = selectedLine;
    }
    if (selectedDate && selectedDate !== 'ALL') {
      whereClause.dateString = selectedDate;
    }
    if (searchQuery) {
      whereClause.OR = [
        { lineName: { contains: searchQuery, mode: 'insensitive' } },
        { style: { contains: searchQuery, mode: 'insensitive' } },
        { buyerName: { contains: searchQuery, mode: 'insensitive' } },
        { oc: { contains: searchQuery, mode: 'insensitive' } },
        { unitCode: { contains: searchQuery, mode: 'insensitive' } }
      ];
    }

    // 4. Fetch records for active batch with applied filters
    const records = await prisma.productionActualRecord.findMany({
      where: whereClause,
      orderBy: [
        { dateString: 'desc' },
        { unitCode: 'asc' },
        { lineName: 'asc' }
      ]
    });

    // 5. Also fetch unfiltered records for filter dropdown options
    const batchAllRecords = await prisma.productionActualRecord.findMany({
      where: { importBatchId: activeBatch.id },
      select: {
        unitCode: true,
        lineName: true,
        cluster: true,
        dateString: true,
        buyerName: true
      }
    });

    // Extract dynamic filter options
    const uniqueUnitsMap = new Map<string, { count: number; cluster: string }>();
    const uniqueLinesMap = new Map<string, { unitCode: string }>();
    const uniqueDatesSet = new Set<string>();
    const uniqueBuyersSet = new Set<string>();

    batchAllRecords.forEach(r => {
      if (r.unitCode) {
        if (!uniqueUnitsMap.has(r.unitCode)) {
          uniqueUnitsMap.set(r.unitCode, { count: 0, cluster: r.cluster || 'B1' });
        }
        uniqueUnitsMap.get(r.unitCode)!.count += 1;
      }
      if (r.lineName) {
        uniqueLinesMap.set(r.lineName, { unitCode: r.unitCode });
      }
      if (r.dateString) uniqueDatesSet.add(r.dateString);
      if (r.buyerName) uniqueBuyersSet.add(r.buyerName);
    });

    const filterOptions = {
      units: Array.from(uniqueUnitsMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([code, meta]) => ({
          value: code,
          label: `${code} (${meta.count} records)`,
          cluster: meta.cluster
        })),
      lines: Array.from(uniqueLinesMap.entries())
        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
        .map(([name, meta]) => ({
          value: name,
          label: `${name} (${meta.unitCode})`,
          unitCode: meta.unitCode
        })),
      dates: Array.from(uniqueDatesSet).sort().reverse(),
      buyers: Array.from(uniqueBuyersSet).sort().filter(Boolean)
    };

    // 6. Aggregate KPIs and Groupings
    let totalActualPcs = 0;
    let totalActualSah = 0;
    let totalClockHours = 0;
    let totalManpower = 0;
    let totalTtlFob = 0;
    let totalTtlVa = 0;

    const unitMap = new Map<string, any>();
    const lineMap = new Map<string, any>();
    const dateMap = new Map<string, any>();
    const buyerMap = new Map<string, any>();
    const styleSet = new Set<string>();

    records.forEach(r => {
      const pcs = r.actualPcs || 0;
      const sah = r.actualSah || 0;
      const clk = r.clockHours || 0;
      const mp = r.manpower || 0;
      const fob = r.ttlFob || 0;
      const va = r.ttlVa || 0;

      totalActualPcs += pcs;
      totalActualSah += sah;
      totalClockHours += clk;
      totalManpower += mp;
      totalTtlFob += fob;
      totalTtlVa += va;

      if (r.style) styleSet.add(r.style);

      // Unit grouping
      const uKey = r.unitCode || 'OTHER';
      if (!unitMap.has(uKey)) {
        unitMap.set(uKey, {
          unitCode: uKey,
          cluster: r.cluster || 'B1',
          totalPcs: 0,
          totalSah: 0,
          totalClockHours: 0,
          totalManpower: 0,
          totalFob: 0,
          totalVa: 0,
          lines: new Set<string>(),
          styles: new Set<string>(),
          recordsCount: 0
        });
      }
      const u = unitMap.get(uKey);
      u.totalPcs += pcs;
      u.totalSah += sah;
      u.totalClockHours += clk;
      u.totalManpower += mp;
      u.totalFob += fob;
      u.totalVa += va;
      u.lines.add(r.lineName);
      if (r.style) u.styles.add(r.style);
      u.recordsCount += 1;

      // Line grouping
      const lKey = `${r.unitCode}_${r.lineName}`;
      if (!lineMap.has(lKey)) {
        lineMap.set(lKey, {
          lineName: r.lineName,
          unitCode: r.unitCode,
          cluster: r.cluster || 'B1',
          totalPcs: 0,
          totalSah: 0,
          totalClockHours: 0,
          totalManpower: 0,
          totalFob: 0,
          totalVa: 0,
          styles: new Set<string>(),
          buyers: new Set<string>(),
          dates: new Set<string>(),
          recordsCount: 0
        });
      }
      const l = lineMap.get(lKey);
      l.totalPcs += pcs;
      l.totalSah += sah;
      l.totalClockHours += clk;
      l.totalManpower += mp;
      l.totalFob += fob;
      l.totalVa += va;
      if (r.style) l.styles.add(r.style);
      if (r.buyerName) l.buyers.add(r.buyerName);
      l.dates.add(r.dateString);
      l.recordsCount += 1;

      // Date grouping
      const dKey = r.dateString;
      if (!dateMap.has(dKey)) {
        dateMap.set(dKey, {
          dateString: dKey,
          totalPcs: 0,
          totalSah: 0,
          totalClockHours: 0,
          totalManpower: 0,
          lines: new Set<string>(),
          recordsCount: 0
        });
      }
      const d = dateMap.get(dKey);
      d.totalPcs += pcs;
      d.totalSah += sah;
      d.totalClockHours += clk;
      d.totalManpower += mp;
      d.lines.add(r.lineName);
      d.recordsCount += 1;

      // Buyer grouping
      const bKey = r.buyerName || 'Unspecified';
      if (!buyerMap.has(bKey)) {
        buyerMap.set(bKey, {
          buyerName: bKey,
          totalPcs: 0,
          totalSah: 0,
          totalFob: 0,
          styles: new Set<string>(),
          lines: new Set<string>(),
          recordsCount: 0
        });
      }
      const b = buyerMap.get(bKey);
      b.totalPcs += pcs;
      b.totalSah += sah;
      b.totalFob += fob;
      if (r.style) b.styles.add(r.style);
      b.lines.add(r.lineName);
      b.recordsCount += 1;
    });

    const overallEfficiency = totalClockHours > 0
      ? Number(((totalActualSah / totalClockHours) * 100).toFixed(1))
      : 0;

    const kpis = {
      totalActualPcs,
      totalActualSah: Number(totalActualSah.toFixed(1)),
      totalClockHours: Number(totalClockHours.toFixed(1)),
      overallEfficiency,
      totalManpower: Math.round(totalManpower),
      totalFobValue: Number(totalTtlFob.toFixed(2)),
      totalVaValue: Number(totalTtlVa.toFixed(2)),
      uniqueUnitsCount: unitMap.size,
      uniqueLinesCount: lineMap.size,
      uniqueStylesCount: styleSet.size,
      uniqueBuyersCount: buyerMap.size,
      uniqueDatesCount: dateMap.size,
      totalRecordsCount: records.length
    };

    // Format unit breakdown
    const unitBreakdown = Array.from(unitMap.values())
      .map(u => ({
        unitCode: u.unitCode,
        cluster: u.cluster,
        linesCount: u.lines.size,
        stylesCount: u.styles.size,
        totalPcs: u.totalPcs,
        totalSah: Number(u.totalSah.toFixed(1)),
        totalClockHours: Number(u.totalClockHours.toFixed(1)),
        efficiency: u.totalClockHours > 0 ? Number(((u.totalSah / u.totalClockHours) * 100).toFixed(1)) : 0,
        totalManpower: Math.round(u.totalManpower),
        totalFob: Number(u.totalFob.toFixed(2)),
        totalVa: Number(u.totalVa.toFixed(2)),
        recordsCount: u.recordsCount
      }))
      .sort((a, b) => b.totalPcs - a.totalPcs);

    // Format line breakdown
    const lineBreakdown = Array.from(lineMap.values())
      .map(l => ({
        lineName: l.lineName,
        unitCode: l.unitCode,
        cluster: l.cluster,
        totalPcs: l.totalPcs,
        totalSah: Number(l.totalSah.toFixed(1)),
        totalClockHours: Number(l.totalClockHours.toFixed(1)),
        efficiency: l.totalClockHours > 0 ? Number(((l.totalSah / l.totalClockHours) * 100).toFixed(1)) : 0,
        manpower: Math.round(l.totalManpower),
        stylesCount: l.styles.size,
        stylesList: Array.from(l.styles),
        buyersList: Array.from(l.buyers),
        datesCount: l.dates.size,
        recordsCount: l.recordsCount
      }))
      .sort((a, b) => b.totalPcs - a.totalPcs);

    // Format date breakdown
    const dateBreakdown = Array.from(dateMap.values())
      .map(d => ({
        dateString: d.dateString,
        totalPcs: d.totalPcs,
        totalSah: Number(d.totalSah.toFixed(1)),
        totalClockHours: Number(d.totalClockHours.toFixed(1)),
        efficiency: d.totalClockHours > 0 ? Number(((d.totalSah / d.totalClockHours) * 100).toFixed(1)) : 0,
        activeLinesCount: d.lines.size,
        recordsCount: d.recordsCount
      }))
      .sort((a, b) => a.dateString.localeCompare(b.dateString));

    // Format buyer breakdown
    const buyerBreakdown = Array.from(buyerMap.values())
      .map(b => ({
        buyerName: b.buyerName,
        totalPcs: b.totalPcs,
        totalSah: Number(b.totalSah.toFixed(1)),
        totalFob: Number(b.totalFob.toFixed(2)),
        stylesCount: b.styles.size,
        linesCount: b.lines.size,
        recordsCount: b.recordsCount
      }))
      .sort((a, b) => b.totalPcs - a.totalPcs);

    return NextResponse.json({
      success: true,
      activeBatch: {
        id: activeBatch.id,
        fileName: activeBatch.fileName,
        month: activeBatch.month,
        fileSize: activeBatch.fileSize,
        importedRows: activeBatch.importedRows,
        totalRows: activeBatch.totalRows,
        createdAt: activeBatch.createdAt,
        parentPlan: activeBatch.parentPlan || null
      },
      allActualBatches: allActualBatches.map(b => ({
        id: b.id,
        fileName: b.fileName,
        month: b.month,
        importedRows: b.importedRows,
        createdAt: b.createdAt,
        parentPlanName: b.parentPlan?.fileName || null
      })),
      filterOptions,
      kpis,
      unitBreakdown,
      lineBreakdown,
      dateBreakdown,
      buyerBreakdown,
      records: records.slice(0, 300) // First 300 records for audit log table
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch actual production data' },
      { status: 500 }
    );
  }
}
