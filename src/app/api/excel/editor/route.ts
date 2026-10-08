import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get('batchId') || 'ALL';
    const unitCode = searchParams.get('unitCode') || 'U02';
    const lineName = searchParams.get('lineName') || 'ALL';
    const month = searchParams.get('month') || undefined;
    const search = searchParams.get('search')?.trim();

    // 1. Fetch Units
    const units = await prisma.unit.findMany({
      select: { id: true, code: true, name: true, totalLines: true, totalManpower: true },
      orderBy: { code: 'asc' },
    });

    // 2. Fetch Batches
    const batches = await prisma.importBatch.findMany({
      select: { id: true, fileName: true, month: true, importedRows: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // 3. Fetch Lines for this unit (or all units)
    const lines = await prisma.productionLine.findMany({
      where: unitCode !== 'ALL' ? { unitCode } : {},
      select: {
        id: true,
        name: true,
        unitCode: true,
        manpower: true,
        workingHours: true,
        status: true,
        summaryJson: true,
      },
      orderBy: { name: 'asc' },
    });

    // Determine target line: if 'ALL' or not in list, pick the first line of the unit if available
    let activeLineName = lineName;
    if (activeLineName === 'ALL' && lines.length > 0) {
      activeLineName = lines[0].name;
    }

    const currentLine = lines.find((l) => l.name === activeLineName) || lines[0] || null;

    // 4. Fetch distinct date columns for the month
    const distinctDates = await prisma.productionDaily.findMany({
      where: month && month !== 'ALL' ? { month } : undefined,
      select: { dateString: true },
      distinct: ['dateString'],
      orderBy: { dateString: 'asc' },
    });

    const dateColumns = distinctDates.map((d) => {
      const parts = d.dateString.split('-');
      const dayNum = parseInt(parts[2], 10);
      const dateObj = new Date(`${d.dateString}T00:00:00Z`);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
      return {
        dateStr: d.dateString,
        dayNum,
        dayName,
        shortLabel: `${dayNum} (${dayName})`,
      };
    });

    // 5. Fetch Buyers list for autocomplete
    const buyers = await prisma.buyer.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    // 6. If no active line, return early
    if (!currentLine) {
      return NextResponse.json({
        success: true,
        units,
        lines: [],
        batches,
        buyers,
        dateColumns,
        selectedUnit: unitCode,
        selectedLine: null,
        orders: [],
        lineSummaries: {},
      });
    }

    // 7. Fetch Orders for the selected Line
    const orderWhere: any = {
      lineName: currentLine.name,
    };
    if (batchId && batchId !== 'ALL') {
      orderWhere.importBatchId = batchId;
    }
    if (search) {
      orderWhere.OR = [
        { styleRef: { contains: search, mode: 'insensitive' } },
        { poNo: { contains: search, mode: 'insensitive' } },
        { color: { contains: search, mode: 'insensitive' } },
        { buyerName: { contains: search, mode: 'insensitive' } },
        { orderCode: { contains: search, mode: 'insensitive' } },
        { article: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orders = await prisma.order.findMany({
      where: orderWhere,
      include: {
        dailyRecords: {
          where: month && month !== 'ALL' ? { month } : undefined,
          select: {
            dateString: true,
            targetQty: true,
            actualQty: true,
            efficiency: true,
            targetSah: true,
            actualSah: true,
          },
        },
      },
      orderBy: [{ planQty: 'desc' }, { styleRef: 'asc' }],
    });

    // 8. Format Orders with daily map
    const formattedOrders = orders.map((ord) => {
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
        } catch {
          // ignore
        }
      }

      return {
        id: ord.id,
        orderCode: ord.orderCode,
        ocs: ord.ocs || '',
        subOc: ord.subOc || '',
        buyerId: ord.buyerId,
        buyerName: ord.buyerName,
        unitCode: ord.unitCode,
        lineId: ord.lineId,
        lineName: ord.lineName,
        styleRef: ord.styleRef || '',
        article: ord.article || '',
        season: ord.season || '',
        poNo: ord.poNo || '',
        color: ord.color || '',
        orderQty: ord.orderQty || 0,
        planQty: ord.planQty || totalTarget,
        actualQty: totalActual,
        smv: ord.smv || 2.5,
        mainCategory: ord.mainCategory || 'UNDERWEAR',
        subCategory: ord.subCategory || 'BOXER',
        productType: ord.productType || 'P1',
        orderStatus: ord.orderStatus || 'Confirmed',
        fobPrice: ord.fobPrice || 0,
        salesValue: ord.salesValue || 0,
        leadMerchant: ord.leadMerchant || '',
        orderDept: ord.orderDept || '',
        workingDays: ord.workingDays || 0,
        daily: dailyMap,
        importBatchId: ord.importBatchId,
      };
    });

    // 9. Fetch Line Daily Summary records (orderId == null)
    const lineSummaryRecords = await prisma.productionDaily.findMany({
      where: {
        orderId: null,
        month: month && month !== 'ALL' ? month : undefined,
        lineId: currentLine.id,
      },
    });

    // 10. Build comprehensive summary structure
    let parsedSum: any = null;
    if (currentLine.summaryJson) {
      try {
        parsedSum = JSON.parse(currentLine.summaryJson);
      } catch {
        // ignore
      }
    }

    const planDaily: Record<string, number> = {};
    const sahDaily: Record<string, number> = {};
    const machineDaily: Record<string, number> = {};
    const effiDaily: Record<string, number> = {};

    for (const d of dateColumns) {
      // Check summary records from DB first
      const dbRec = lineSummaryRecords.find((r) => r.dateString === d.dateStr);
      if (dbRec) {
        planDaily[d.dateStr] = dbRec.targetQty || 0;
        sahDaily[d.dateStr] = Number((dbRec.targetSah || 0).toFixed(2));
        machineDaily[d.dateStr] = Number((dbRec.clockHours || 0).toFixed(2));
        effiDaily[d.dateStr] = dbRec.plannedEfficiency ? Math.round(dbRec.plannedEfficiency) : 0;
      } else {
        // Fallback to parsed summaryJson or calculated sum
        const pVal = parsedSum?.PLAN?.daily?.[d.dateStr];
        const sVal = parsedSum?.SAH?.daily?.[d.dateStr];
        const mVal = parsedSum?.MACHINE?.daily?.[d.dateStr];
        const eVal = parsedSum?.EFFI?.daily?.[d.dateStr];

        planDaily[d.dateStr] = pVal ? Number(pVal) : 0;
        sahDaily[d.dateStr] = sVal ? Number(Number(sVal).toFixed(2)) : 0;
        machineDaily[d.dateStr] = mVal ? Number(Number(mVal).toFixed(2)) : Number(((currentLine.manpower || 25) * (currentLine.workingHours || 10)).toFixed(2));
        effiDaily[d.dateStr] = eVal ? (Number(eVal) <= 1 ? Math.round(Number(eVal) * 100) : Math.round(Number(eVal))) : 0;
      }
    }

    // Totals
    const totalPlanQty = Object.values(planDaily).reduce((a, b) => a + b, 0);
    const totalSah = Number(Object.values(sahDaily).reduce((a, b) => a + b, 0).toFixed(2));
    const totalMachineHours = Number(Object.values(machineDaily).reduce((a, b) => a + b, 0).toFixed(2));
    const totalEffi = totalMachineHours > 0 ? Math.round((totalSah / totalMachineHours) * 100) : 0;

    const lineSummary = {
      PLAN: { total: totalPlanQty, daily: planDaily },
      SAH: { total: totalSah, daily: sahDaily },
      MACHINE: { total: totalMachineHours, daily: machineDaily },
      EFFI: { total: totalEffi, daily: effiDaily },
    };

    return NextResponse.json({
      success: true,
      month,
      selectedUnit: unitCode,
      selectedLineName: currentLine.name,
      units,
      lines,
      batches,
      buyers,
      dateColumns,
      selectedLine: {
        id: currentLine.id,
        name: currentLine.name,
        unitCode: currentLine.unitCode,
        manpower: currentLine.manpower,
        workingHours: currentLine.workingHours,
        status: currentLine.status,
      },
      orders: formattedOrders,
      lineSummary,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      lineId,
      lineName,
      unitCode,
      month,
      batchId = 'ALL',
      lineSettings,
      orders = [],
      deletedOrderIds = [],
      manualOverrides,
    } = body;

    if (!lineId && !lineName) {
      return NextResponse.json({ success: false, error: 'Line ID or Line Name is required' }, { status: 400 });
    }

    // 1. Resolve Line & Unit
    let line = lineId ? await prisma.productionLine.findUnique({ where: { id: lineId } }) : null;
    if (!line && lineName) {
      line = await prisma.productionLine.findFirst({
        where: {
          name: lineName,
          ...(unitCode ? { unitCode } : {})
        }
      });
    }

    if (!line) {
      return NextResponse.json({ success: false, error: 'Production Line not found' }, { status: 404 });
    }

    const effectiveUnitCode = unitCode || line.unitCode;
    let unit = await prisma.unit.findUnique({ where: { code: effectiveUnitCode } });
    if (!unit) {
      unit = await prisma.unit.findFirst();
    }

    // 2. Update Line settings if modified
    const manpower = typeof lineSettings?.manpower === 'number' && lineSettings.manpower > 0 ? lineSettings.manpower : line.manpower;
    const workingHours = typeof lineSettings?.workingHours === 'number' && lineSettings.workingHours > 0 ? lineSettings.workingHours : line.workingHours;

    await prisma.productionLine.update({
      where: { id: line.id },
      data: {
        manpower,
        workingHours,
        unitCode: effectiveUnitCode,
        unitId: unit?.id || line.unitId,
      },
    });

    // 3. Handle Deleted Orders
    if (Array.isArray(deletedOrderIds) && deletedOrderIds.length > 0) {
      // Delete order-level production daily records
      await prisma.productionDaily.deleteMany({
        where: { orderId: { in: deletedOrderIds } },
      });
      // Delete orders
      await prisma.order.deleteMany({
        where: { id: { in: deletedOrderIds } },
      });
    }

    // 4. Resolve Buyers Cache to minimize queries
    const buyerCache = new Map<string, string>(); // name -> id
    const existingBuyers = await prisma.buyer.findMany();
    for (const b of existingBuyers) {
      buyerCache.set(b.name.trim().toUpperCase(), b.id);
    }

    const getOrCreateBuyer = async (buyerName: string): Promise<string> => {
      const cleanName = (buyerName || 'MS').trim();
      const key = cleanName.toUpperCase();
      if (buyerCache.has(key)) {
        return buyerCache.get(key)!;
      }
      let b = await prisma.buyer.findUnique({ where: { name: cleanName } });
      if (!b) {
        b = await prisma.buyer.create({
          data: { id: crypto.randomUUID(), name: cleanName },
        });
      }
      buyerCache.set(key, b.id);
      return b.id;
    };

    // 5. Update and Create Orders
    const processedOrderIds: string[] = [];

    for (const ord of orders) {
      if (ord.isDeleted) continue;

      const buyerName = (ord.buyerName || 'MS').trim();
      const buyerId = await getOrCreateBuyer(buyerName);
      const smv = Number(ord.smv) > 0 ? Number(Number(ord.smv).toFixed(2)) : 2.5;
      const orderQty = Number(ord.orderQty) || 0;

      // Clean daily plan map
      const dailyMap: Record<string, number> = {};
      let totalPlanFromDays = 0;

      if (ord.daily && typeof ord.daily === 'object') {
        for (const [dStr, cell] of Object.entries(ord.daily)) {
          let targetNum = 0;
          if (typeof cell === 'number') {
            targetNum = cell;
          } else if (cell && typeof cell === 'object' && 'target' in (cell as any)) {
            targetNum = Number((cell as any).target) || 0;
          }
          if (targetNum > 0) {
            const intVal = Math.round(targetNum);
            dailyMap[dStr] = intVal;
            totalPlanFromDays += intVal;
          }
        }
      }

      const planQty = Number(ord.planQty) > 0 ? Number(ord.planQty) : totalPlanFromDays;
      const dailyPlanJson = Object.keys(dailyMap).length > 0 ? JSON.stringify(dailyMap) : null;
      const orderCode = ord.orderCode || `ORD-${line.name}-${ord.styleRef || 'STYLE'}-${Date.now()}`;

      let currentOrderId = ord.id;
      const isNewOrder = ord.isNew || !currentOrderId || currentOrderId.startsWith('new-');

      if (isNewOrder) {
        currentOrderId = crypto.randomUUID();
        await prisma.order.create({
          data: {
            id: currentOrderId,
            orderCode,
            ocs: ord.ocs || null,
            subOc: ord.subOc || null,
            buyerId,
            buyerName,
            unitId: unit?.id || line.unitId,
            unitCode: effectiveUnitCode,
            lineId: line.id,
            lineName: line.name,
            styleRef: ord.styleRef || 'N/A',
            article: ord.article || null,
            season: ord.season || 'N/A',
            poNo: ord.poNo || null,
            color: ord.color || null,
            orderQty,
            planQty,
            smv,
            mainCategory: ord.mainCategory || 'UNDERWEAR',
            subCategory: ord.subCategory || 'BOXER',
            productType: ord.productType || 'P1',
            orderStatus: ord.orderStatus || 'Confirmed',
            fobPrice: Number(ord.fobPrice) || 0,
            salesValue: Number(ord.salesValue) || 0,
            leadMerchant: ord.leadMerchant || null,
            orderDept: ord.orderDept || null,
            workingDays: Number(ord.workingDays) || 0,
            dailyPlanJson,
            importBatchId: ord.importBatchId || (batchId !== 'ALL' ? batchId : null),
          },
        });
      } else {
        await prisma.order.update({
          where: { id: currentOrderId },
          data: {
            buyerId,
            buyerName,
            styleRef: ord.styleRef || 'N/A',
            article: ord.article || null,
            season: ord.season || 'N/A',
            poNo: ord.poNo || null,
            color: ord.color || null,
            orderQty,
            planQty,
            smv,
            mainCategory: ord.mainCategory || 'UNDERWEAR',
            subCategory: ord.subCategory || 'BOXER',
            productType: ord.productType || 'P1',
            orderStatus: ord.orderStatus || 'Confirmed',
            fobPrice: Number(ord.fobPrice) || 0,
            salesValue: Number(ord.salesValue) || 0,
            leadMerchant: ord.leadMerchant || null,
            orderDept: ord.orderDept || null,
            workingDays: Number(ord.workingDays) || 0,
            dailyPlanJson,
          },
        });
      }

      processedOrderIds.push(currentOrderId);

      // Synchronize Order-level ProductionDaily records
      // 1. Delete existing records for this order for this month
      await prisma.productionDaily.deleteMany({
        where: {
          orderId: currentOrderId,
          month,
        },
      });

      // 2. Insert fresh daily records for this order
      const dailyRecordsToCreate: any[] = [];
      for (const [dateStr, targetQty] of Object.entries(dailyMap)) {
        if (targetQty > 0) {
          const targetSah = Number(((targetQty * smv) / 60).toFixed(2));
          const clockHours = Number((manpower * workingHours).toFixed(2));
          const dateObj = new Date(`${dateStr}T00:00:00Z`);

          dailyRecordsToCreate.push({
            id: crypto.randomUUID(),
            date: dateObj,
            dateString: dateStr,
            month,
            orderId: currentOrderId,
            lineId: line.id,
            unitId: unit?.id || line.unitId,
            buyerId,
            targetQty,
            actualQty: 0,
            gap: targetQty,
            smv,
            targetSah,
            actualSah: 0,
            clockHours,
            efficiency: 0,
            plannedEfficiency: 0,
            achievementRate: 0,
            manpower,
            importBatchId: ord.importBatchId || (batchId !== 'ALL' ? batchId : null),
          });
        }
      }

      if (dailyRecordsToCreate.length > 0) {
        await prisma.productionDaily.createMany({ data: dailyRecordsToCreate });
      }
    }

    // 6. Recalculate Line-level Summaries (orderId == null)
    // Fetch all active orders for this line
    const allLineOrders = await prisma.order.findMany({
      where: { lineId: line.id },
      include: {
        dailyRecords: {
          where: { month },
        },
      },
    });

    // Collect all dates from all orders or existing daily summary records
    const distinctDates = await prisma.productionDaily.findMany({
      where: { month },
      select: { dateString: true },
      distinct: ['dateString'],
      orderBy: { dateString: 'asc' },
    });

    const dateSet = new Set<string>();
    distinctDates.forEach((d) => dateSet.add(d.dateString));
    allLineOrders.forEach((o) => {
      o.dailyRecords.forEach((dr) => dateSet.add(dr.dateString));
      if (o.dailyPlanJson) {
        try {
          const parsed = JSON.parse(o.dailyPlanJson);
          Object.keys(parsed).forEach((k) => dateSet.add(k));
        } catch {
          // ignore
        }
      }
    });

    const allDates = Array.from(dateSet).sort();

    // Line summary accumulators
    const summaryPlanDaily: Record<string, number> = {};
    const summarySahDaily: Record<string, number> = {};
    const summaryMachineDaily: Record<string, number> = {};
    const summaryEffiDaily: Record<string, number> = {};

    // Remove old line-level daily summaries for this line and month
    await prisma.productionDaily.deleteMany({
      where: {
        lineId: line.id,
        orderId: null,
        month,
      },
    });

    const lineSummaryRecordsToInsert: any[] = [];

    for (const dateStr of allDates) {
      let dateTargetQty = 0;
      let dateTargetSah = 0;
      let dateActualQty = 0;
      let dateActualSah = 0;

      for (const ord of allLineOrders) {
        const dRec = ord.dailyRecords.find((r) => r.dateString === dateStr);
        if (dRec) {
          dateTargetQty += dRec.targetQty || 0;
          dateTargetSah += dRec.targetSah || 0;
          dateActualQty += dRec.actualQty || 0;
          dateActualSah += dRec.actualSah || 0;
        } else if (ord.dailyPlanJson) {
          try {
            const parsed = JSON.parse(ord.dailyPlanJson);
            if (parsed[dateStr]) {
              const qty = Number(parsed[dateStr]) || 0;
              dateTargetQty += qty;
              dateTargetSah += Number(((qty * (ord.smv || 2.5)) / 60).toFixed(2));
            }
          } catch {
            // ignore
          }
        }
      }

      // Check manual overrides if provided
      if (manualOverrides?.PLAN?.[dateStr] !== undefined) {
        dateTargetQty = Number(manualOverrides.PLAN[dateStr]) || 0;
      }
      if (manualOverrides?.SAH?.[dateStr] !== undefined) {
        dateTargetSah = Number(manualOverrides.SAH[dateStr]) || 0;
      }

      const clockHours = dateTargetQty > 0
        ? Number((manpower * workingHours).toFixed(2))
        : Number((manpower * workingHours).toFixed(2));

      let plannedEfficiency = clockHours > 0 ? Number(((dateTargetSah / clockHours) * 100).toFixed(2)) : 0;
      if (manualOverrides?.EFFI?.[dateStr] !== undefined) {
        const effOverride = Number(manualOverrides.EFFI[dateStr]);
        plannedEfficiency = effOverride <= 1 ? Number((effOverride * 100).toFixed(2)) : Number(effOverride.toFixed(2));
      }

      summaryPlanDaily[dateStr] = dateTargetQty;
      summarySahDaily[dateStr] = Number(dateTargetSah.toFixed(2));
      summaryMachineDaily[dateStr] = clockHours;
      summaryEffiDaily[dateStr] = plannedEfficiency;

      if (dateTargetQty > 0 || dateTargetSah > 0 || clockHours > 0) {
        const dateObj = new Date(`${dateStr}T00:00:00Z`);
        lineSummaryRecordsToInsert.push({
          id: crypto.randomUUID(),
          date: dateObj,
          dateString: dateStr,
          month,
          orderId: null,
          lineId: line.id,
          unitId: unit?.id || line.unitId,
          buyerId: null,
          targetQty: dateTargetQty,
          actualQty: dateActualQty,
          gap: dateTargetQty - dateActualQty,
          smv: 0,
          targetSah: Number(dateTargetSah.toFixed(2)),
          actualSah: Number(dateActualSah.toFixed(2)),
          clockHours,
          efficiency: 0,
          plannedEfficiency,
          achievementRate: 0,
          manpower,
          importBatchId: batchId !== 'ALL' ? batchId : null,
        });
      }
    }

    if (lineSummaryRecordsToInsert.length > 0) {
      await prisma.productionDaily.createMany({ data: lineSummaryRecordsToInsert });
    }

    // 7. Update ProductionLine.summaryJson
    const totalLinePlan = Object.values(summaryPlanDaily).reduce((a, b) => a + b, 0);
    const totalLineSah = Number(Object.values(summarySahDaily).reduce((a, b) => a + b, 0).toFixed(2));
    const totalLineMachine = Number(Object.values(summaryMachineDaily).reduce((a, b) => a + b, 0).toFixed(2));
    const totalLineEffi = totalLineMachine > 0 ? Number(((totalLineSah / totalLineMachine) * 100).toFixed(1)) : 0;

    const newSummaryJson = {
      PLAN: { total: totalLinePlan, daily: summaryPlanDaily },
      SAH: { total: totalLineSah, daily: summarySahDaily },
      MACHINE: { total: totalLineMachine, daily: summaryMachineDaily },
      EFFI: { total: totalLineEffi, daily: summaryEffiDaily },
    };

    await prisma.productionLine.update({
      where: { id: line.id },
      data: {
        summaryJson: JSON.stringify(newSummaryJson),
      },
    });

    // 8. Update Unit Aggregates
    if (unit) {
      const lineAgg = await prisma.productionLine.aggregate({
        where: { unitId: unit.id },
        _sum: { manpower: true },
        _count: { id: true },
      });
      await prisma.unit.update({
        where: { id: unit.id },
        data: {
          totalLines: lineAgg._count.id || 0,
          totalManpower: lineAgg._sum.manpower || 0,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Line ${line.name} data updated successfully. Total plan: ${totalLinePlan.toLocaleString()} pcs, Efficiency: ${totalLineEffi}%.`,
      line: {
        id: line.id,
        name: line.name,
        unitCode: effectiveUnitCode,
        manpower,
        workingHours,
      },
      summary: newSummaryJson,
      ordersCount: processedOrderIds.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
