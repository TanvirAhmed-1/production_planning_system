import prisma from '@/lib/prisma';

export interface FilterParams {
  month?: string;
  batchId?: string;
  startDate?: string;
  endDate?: string;
  unitCode?: string;
  lineName?: string;
  buyerName?: string;
  styleRef?: string;
  season?: string;
  orderStatus?: string;
  search?: string;
}

export function buildWhereClause(filters: FilterParams, isLineSummary: boolean = false) {
  const where: any = {};

  if (filters.batchId && filters.batchId !== 'ALL') {
    where.importBatchId = filters.batchId;
  }

  if (filters.month && filters.month !== 'ALL') {
    where.month = filters.month;
  }

  if (filters.startDate || filters.endDate) {
    where.dateString = {};
    if (filters.startDate) where.dateString.gte = filters.startDate;
    if (filters.endDate) where.dateString.lte = filters.endDate;
  }

  if (filters.unitCode && filters.unitCode !== 'ALL') {
    where.unit = { code: filters.unitCode };
  }

  if (filters.lineName && filters.lineName !== 'ALL') {
    where.line = { name: filters.lineName };
  }

  if (!isLineSummary) {
    if (filters.buyerName && filters.buyerName !== 'ALL') {
      where.buyer = { name: filters.buyerName };
    }

    if (filters.styleRef) {
      where.order = { ...where.order, styleRef: { contains: filters.styleRef, mode: 'insensitive' } };
    }

    if (filters.season && filters.season !== 'ALL') {
      where.order = { ...where.order, season: filters.season };
    }

    if (filters.orderStatus && filters.orderStatus !== 'ALL') {
      where.order = { ...where.order, orderStatus: filters.orderStatus };
    }
  }

  return where;
}

export async function getDashboardData(filters: FilterParams = {}) {
  const hasSpecificOrderFilters = !!(
    (filters.buyerName && filters.buyerName !== 'ALL') ||
    filters.styleRef ||
    (filters.season && filters.season !== 'ALL') ||
    (filters.orderStatus && filters.orderStatus !== 'ALL')
  );

  // When filtering by specific buyer/style/season, aggregate order-level records (orderId != null)
  // When viewing factory/unit/line overall, aggregate line-level summaries (orderId == null) for accurate Machine Hours & Planned SAH
  const lineSummaryWhere = {
    ...buildWhereClause(filters, true),
    orderId: null
  };

  const orderDailyWhere = {
    ...buildWhereClause(filters, false),
    orderId: { not: null }
  };

  // 1. Order Table Aggregates (Orders count, Order Qty, Plan Qty)
  const orderTableWhere: any = {};
  if (filters.batchId && filters.batchId !== 'ALL') orderTableWhere.importBatchId = filters.batchId;
  if (filters.unitCode && filters.unitCode !== 'ALL') orderTableWhere.unitCode = filters.unitCode;
  if (filters.lineName && filters.lineName !== 'ALL') orderTableWhere.lineName = filters.lineName;
  if (filters.buyerName && filters.buyerName !== 'ALL') orderTableWhere.buyerName = filters.buyerName;
  if (filters.season && filters.season !== 'ALL') orderTableWhere.season = filters.season;
  if (filters.orderStatus && filters.orderStatus !== 'ALL') orderTableWhere.orderStatus = filters.orderStatus;
  if (filters.styleRef) orderTableWhere.styleRef = { contains: filters.styleRef, mode: 'insensitive' };

  const orderAgg = await prisma.order.aggregate({
    where: orderTableWhere,
    _sum: { orderQty: true, planQty: true },
    _count: { id: true }
  });

  const totalOrderQty = orderAgg._sum.orderQty || 0;
  const totalOrders = orderAgg._count.id || 0;

  // 2. Production Aggregates
  const activeWhere = hasSpecificOrderFilters ? orderDailyWhere : lineSummaryWhere;

  const dailyAgg = await prisma.productionDaily.aggregate({
    where: activeWhere,
    _sum: {
      targetQty: true,
      actualQty: true,
      gap: true,
      targetSah: true,
      actualSah: true,
      clockHours: true,
      manpower: true
    }
  });

  const totalPlannedProduction = dailyAgg._sum.targetQty || orderAgg._sum.planQty || 0;
  const totalActualProduction = dailyAgg._sum.actualQty || 0;
  const totalGap = dailyAgg._sum.gap || (totalPlannedProduction - totalActualProduction);
  const totalTargetSah = dailyAgg._sum.targetSah || 0;
  const totalActualSah = dailyAgg._sum.actualSah || 0;
  const totalClockHours = dailyAgg._sum.clockHours || 0;

  // If actualSah > 0, calculate actual efficiency. Otherwise calculate planned efficiency
  const plannedEfficiency = totalClockHours > 0 ? Number(((totalTargetSah / totalClockHours) * 100).toFixed(1)) : 0;
  const actualEfficiency = totalClockHours > 0 && totalActualSah > 0 ? Number(((totalActualSah / totalClockHours) * 100).toFixed(1)) : 0;
  const averageEfficiency = totalActualSah > 0 ? actualEfficiency : plannedEfficiency;
  const targetAchievementRate = totalPlannedProduction > 0 ? Number(((totalActualProduction / totalPlannedProduction) * 100).toFixed(1)) : 0;

  // 3. Line Manpower and Active Lines
  const lineStats = await prisma.productionDaily.groupBy({
    by: ['lineId'],
    where: activeWhere,
    _sum: {
      targetQty: true,
      actualQty: true,
      gap: true,
      targetSah: true,
      actualSah: true,
      clockHours: true
    }
  });

  const lineIds = lineStats.map(s => s.lineId);
  const linesInfo = await prisma.productionLine.findMany({
    where: { id: { in: lineIds } },
    include: { unit: true }
  });
  const linesInfoMap = new Map(linesInfo.map(l => [l.id, l]));

  const totalActiveLines = linesInfo.length;
  const totalManpower = linesInfo.reduce((acc, l) => acc + (l.manpower || 25), 0);

  const linesManpowerAgg = await prisma.productionLine.aggregate({
    where: filters.unitCode && filters.unitCode !== 'ALL' ? { unitCode: filters.unitCode } : {},
    _sum: { manpower: true },
    _count: { id: true }
  });
  const totalRegisteredLines = linesManpowerAgg._count.id || 0;

  // 4. Detailed Line Performance List
  const linePerformanceList = lineStats.map(stat => {
    const line = linesInfoMap.get(stat.lineId);
    const target = stat._sum.targetQty || 0;
    const actual = stat._sum.actualQty || 0;
    const gap = stat._sum.gap || (target - actual);
    const tarSah = Number((stat._sum.targetSah || 0).toFixed(1));
    const actSah = Number((stat._sum.actualSah || 0).toFixed(1));
    const clkHrs = Number((stat._sum.clockHours || 0).toFixed(1));
    
    // Parse summaryJson fallback if clockHours is 0
    let plannedEff = clkHrs > 0 ? Number(((tarSah / clkHrs) * 100).toFixed(1)) : 0;
    if (plannedEff === 0 && line?.summaryJson) {
      try {
        const sum = JSON.parse(line.summaryJson);
        if (sum.EFFI?.total) {
          const e = Number(sum.EFFI.total);
          plannedEff = e <= 1.0 ? Number((e * 100).toFixed(1)) : Number(e.toFixed(1));
        }
      } catch (e) {
        // ignore
      }
    }

    const actualEff = clkHrs > 0 && actSah > 0 ? Number(((actSah / clkHrs) * 100).toFixed(1)) : 0;
    const eff = actSah > 0 ? actualEff : plannedEff;
    const ach = target > 0 ? Number(((actual / target) * 100).toFixed(1)) : 0;

    let status = 'NORMAL';
    if (eff >= 80) status = 'HIGH';
    else if (eff >= 70) status = 'NORMAL';
    else if (eff >= 60) status = 'NEEDS_ATTENTION';
    else status = 'LOW';

    return {
      lineId: stat.lineId,
      lineName: line?.name || 'Unknown',
      unitCode: line?.unitCode || 'U02',
      unitName: line?.unit?.name || 'Unit',
      manpower: line?.manpower || 25,
      target,
      actual,
      gap,
      sah: tarSah,
      actualSah: actSah,
      machineHours: clkHrs,
      clockHours: clkHrs,
      plannedEfficiency: plannedEff,
      efficiency: eff,
      achievementRate: ach,
      status
    };
  });

  linePerformanceList.sort((a, b) => b.efficiency - a.efficiency);

  const topLines = linePerformanceList.slice(0, 5);
  const lowestLines = [...linePerformanceList].reverse().slice(0, 5);

  const highestLineEfficiency = linePerformanceList[0]?.efficiency || 0;
  const lowestLineEfficiency = linePerformanceList[linePerformanceList.length - 1]?.efficiency || 0;

  // 5. Efficiency Trend by Date
  const dateTrendStats = await prisma.productionDaily.groupBy({
    by: ['dateString'],
    where: activeWhere,
    _sum: {
      targetQty: true,
      actualQty: true,
      targetSah: true,
      actualSah: true,
      clockHours: true,
      gap: true
    },
    orderBy: { dateString: 'asc' }
  });

  const efficiencyTrend = dateTrendStats.map(d => {
    const tarSah = d._sum.targetSah || 0;
    const actSah = d._sum.actualSah || 0;
    const clkHrs = d._sum.clockHours || 0;
    const target = d._sum.targetQty || 0;
    const actual = d._sum.actualQty || 0;
    const plannedEff = clkHrs > 0 ? Number(((tarSah / clkHrs) * 100).toFixed(1)) : 0;
    const actualEff = clkHrs > 0 && actSah > 0 ? Number(((actSah / clkHrs) * 100).toFixed(1)) : 0;
    const eff = actSah > 0 ? actualEff : plannedEff;

    return {
      date: d.dateString,
      shortDate: d.dateString.substring(5), // "10-01"
      target,
      actual,
      gap: d._sum.gap || (target - actual),
      targetSah: Number(tarSah.toFixed(1)),
      actualSah: Number(actSah.toFixed(1)),
      clockHours: Number(clkHrs.toFixed(1)),
      plannedEfficiency: plannedEff,
      efficiency: eff,
      achievementRate: target > 0 ? Number(((actual / target) * 100).toFixed(1)) : 0
    };
  });

  // 6. Unit-wise Performance
  const unitStats = await prisma.productionDaily.groupBy({
    by: ['unitId'],
    where: activeWhere,
    _sum: {
      targetQty: true,
      actualQty: true,
      gap: true,
      targetSah: true,
      actualSah: true,
      clockHours: true
    }
  });

  const unitIds = unitStats.map(u => u.unitId);
  const unitsInfo = await prisma.unit.findMany({
    where: { id: { in: unitIds } }
  });
  const unitsInfoMap = new Map(unitsInfo.map(u => [u.id, u]));

  const unitPerformance = unitStats.map(u => {
    const unit = unitsInfoMap.get(u.unitId);
    const target = u._sum.targetQty || 0;
    const actual = u._sum.actualQty || 0;
    const tarSah = u._sum.targetSah || 0;
    const actSah = u._sum.actualSah || 0;
    const clkHrs = u._sum.clockHours || 0;
    const plannedEff = clkHrs > 0 ? Number(((tarSah / clkHrs) * 100).toFixed(1)) : 0;
    const actualEff = clkHrs > 0 && actSah > 0 ? Number(((actSah / clkHrs) * 100).toFixed(1)) : 0;
    const eff = actSah > 0 ? actualEff : plannedEff;
    const ach = target > 0 ? Number(((actual / target) * 100).toFixed(1)) : 0;

    return {
      unitId: u.unitId,
      unitCode: unit?.code || 'U02',
      unitName: unit?.name || 'Unit',
      totalLines: unit?.totalLines || 0,
      totalManpower: unit?.totalManpower || 0,
      target,
      actual,
      gap: u._sum.gap || (target - actual),
      sah: Number(tarSah.toFixed(1)),
      actualSah: Number(actSah.toFixed(1)),
      clockHours: Number(clkHrs.toFixed(1)),
      plannedEfficiency: plannedEff,
      efficiency: eff,
      achievementRate: ach
    };
  });
  unitPerformance.sort((a, b) => b.target - a.target);

  // 7. Buyer Performance (from order records)
  const buyerStats = await prisma.productionDaily.groupBy({
    by: ['buyerId'],
    where: orderDailyWhere,
    _sum: {
      targetQty: true,
      actualQty: true,
      gap: true,
      targetSah: true,
      actualSah: true,
      clockHours: true
    }
  });

  const buyerIds = buyerStats.map(b => b.buyerId).filter((id): id is string => Boolean(id));
  const buyersInfo = await prisma.buyer.findMany({
    where: { id: { in: buyerIds } }
  });
  const buyersInfoMap = new Map(buyersInfo.map(b => [b.id, b]));

  const buyerPerformance = buyerStats.map(b => {
    const buyer = b.buyerId ? buyersInfoMap.get(b.buyerId) : null;
    const target = b._sum.targetQty || 0;
    const actual = b._sum.actualQty || 0;
    const tarSah = b._sum.targetSah || 0;
    const actSah = b._sum.actualSah || 0;
    const clkHrs = b._sum.clockHours || 0;
    const plannedEff = clkHrs > 0 ? Number(((tarSah / clkHrs) * 100).toFixed(1)) : 0;
    const actualEff = clkHrs > 0 && actSah > 0 ? Number(((actSah / clkHrs) * 100).toFixed(1)) : 0;
    const eff = actSah > 0 ? actualEff : plannedEff;
    const ach = target > 0 ? Number(((actual / target) * 100).toFixed(1)) : 0;

    return {
      buyerId: b.buyerId,
      buyerName: buyer?.name || 'Unknown',
      target,
      actual,
      gap: b._sum.gap || (target - actual),
      sah: Number(tarSah.toFixed(1)),
      actualSah: Number(actSah.toFixed(1)),
      efficiency: eff,
      achievementRate: ach
    };
  });
  buyerPerformance.sort((a, b) => b.target - a.target);

  // 8. Alerts & Attention Required
  const settings = await getSettings();
  const lowThreshold = Number(settings.lowEfficiencyThreshold || 60);

  const lowPerformingLines = linePerformanceList.filter(l => l.efficiency < lowThreshold);
  const linesWithLargeGaps = [...linePerformanceList].sort((a, b) => b.gap - a.gap).slice(0, 5);

  return {
    kpis: {
      totalOrderQty,
      totalOrders,
      totalPlannedProduction,
      totalActualProduction,
      totalGap,
      averageEfficiency,
      plannedEfficiency,
      actualEfficiency,
      highestLineEfficiency,
      lowestLineEfficiency,
      totalActiveLines,
      totalRegisteredLines,
      totalManpower,
      totalSAH: Number(totalTargetSah.toFixed(1)),
      targetSAH: Number(totalTargetSah.toFixed(1)),
      totalClockHours: Number(totalClockHours.toFixed(1)),
      targetAchievementRate,
      status: averageEfficiency >= 80 ? 'EXCELLENT' : averageEfficiency >= 65 ? 'GOOD' : 'ATTENTION_NEEDED'
    },
    topLines,
    lowestLines,
    linePerformance: linePerformanceList,
    efficiencyTrend,
    unitPerformance,
    buyerPerformance,
    alerts: {
      lowPerformingLinesCount: lowPerformingLines.length,
      lowPerformingLines: lowPerformingLines.slice(0, 10),
      linesWithLargeGaps,
      lowThreshold
    }
  };
}

export async function getLineDetails(lineName: string) {
  const line = await prisma.productionLine.findUnique({
    where: { name: lineName },
    include: {
      unit: true,
      orders: {
        include: { buyer: true },
        orderBy: { planQty: 'desc' }
      }
    }
  });

  if (!line) {
    return null;
  }

  // Fetch all lines for quick switcher dropdown
  const allLines = await prisma.productionLine.findMany({
    select: { name: true, unitCode: true },
    orderBy: { name: 'asc' }
  });

  // Fetch line-level daily summary records (orderId == null)
  const lineDailySummaries = await prisma.productionDaily.findMany({
    where: { lineId: line.id, orderId: null },
    orderBy: { dateString: 'asc' }
  });

  // Also parse summaryJson as reference
  let parsedSummary: any = null;
  if (line.summaryJson) {
    try {
      parsedSummary = JSON.parse(line.summaryJson);
    } catch (e) {
      // ignore
    }
  }

  // Parse orders daily maps
  const orders = line.orders.map(ord => {
    let dailyPlan: Record<string, number> = {};
    if (ord.dailyPlanJson) {
      try {
        dailyPlan = JSON.parse(ord.dailyPlanJson);
      } catch (e) {
        // ignore
      }
    }
    return {
      id: ord.id,
      orderCode: ord.orderCode,
      buyer: ord.buyerName,
      styleRef: ord.styleRef || 'N/A',
      article: ord.article,
      season: ord.season,
      poNo: ord.poNo,
      color: ord.color,
      orderQty: ord.orderQty,
      planQty: ord.planQty,
      smv: ord.smv,
      mainCategory: ord.mainCategory,
      subCategory: ord.subCategory,
      productType: ord.productType,
      orderStatus: ord.orderStatus,
      ott: ord.ott ? ord.ott.toISOString().substring(0, 10) : null,
      pcd: ord.pcd ? ord.pcd.toISOString().substring(0, 10) : null,
      psd: ord.psd ? ord.psd.toISOString().substring(0, 10) : null,
      pfd: ord.pfd ? ord.pfd.toISOString().substring(0, 10) : null,
      exFactory: ord.exFactory ? ord.exFactory.toISOString().substring(0, 10) : null,
      fobPrice: ord.fobPrice,
      salesValue: ord.salesValue,
      workingDays: ord.workingDays,
      dailyPlan
    };
  });

  // Extract all distinct dates across daily summaries or orders
  const dateSet = new Set<string>();
  lineDailySummaries.forEach(d => dateSet.add(d.dateString));
  orders.forEach(o => Object.keys(o.dailyPlan).forEach(d => dateSet.add(d)));
  const dateColumns = Array.from(dateSet).sort();

  // Build daily breakdown
  const dailyBreakdown = dateColumns.map(dateStr => {
    const summaryRecord = lineDailySummaries.find(d => d.dateString === dateStr);
    
    // Find all styles running on this date
    const runningStyles = orders
      .filter(o => o.dailyPlan[dateStr] && o.dailyPlan[dateStr] > 0)
      .map(o => ({
        styleRef: o.styleRef,
        buyer: o.buyer,
        color: o.color,
        poNo: o.poNo,
        planQty: o.dailyPlan[dateStr],
        smv: o.smv
      }));

    const styleSumPlan = runningStyles.reduce((acc, s) => acc + s.planQty, 0);
    const targetQty = summaryRecord?.targetQty || styleSumPlan;
    const targetSah = summaryRecord ? Number((summaryRecord.targetSah || 0).toFixed(2)) : Number(((styleSumPlan * (orders[0]?.smv || 2.5)) / 60).toFixed(2));
    const clockHours = summaryRecord ? Number((summaryRecord.clockHours || 0).toFixed(2)) : Number(((line.manpower || 25) * 10).toFixed(2));
    
    let plannedEff = clockHours > 0 ? Math.round((targetSah / clockHours) * 100) : 0;
    const summaryEffVal = parsedSummary?.EFFI?.daily?.[dateStr];
    if (summaryEffVal !== null && summaryEffVal !== undefined) {
      plannedEff = summaryEffVal <= 1.0 ? Math.round(summaryEffVal * 100) : Math.round(summaryEffVal);
    } else if (summaryRecord?.plannedEfficiency && summaryRecord.plannedEfficiency > 0) {
      plannedEff = Math.round(summaryRecord.plannedEfficiency);
    }

    const actualQty = summaryRecord?.actualQty || 0;
    const actualSah = summaryRecord?.actualSah || 0;
    const actualEff = clockHours > 0 && actualSah > 0 ? Math.round((actualSah / clockHours) * 100) : 0;

    return {
      date: dateStr,
      dayOfWeek: new Date(dateStr + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
      targetQty,
      actualQty,
      gap: targetQty - actualQty,
      targetSah,
      actualSah,
      clockHours,
      machineHours: clockHours,
      plannedEfficiency: plannedEff,
      efficiency: actualSah > 0 ? actualEff : plannedEff,
      stylesCount: runningStyles.length,
      runningStyles
    };
  });

  // Calculate Line Totals
  const totalPlannedProduction = dailyBreakdown.reduce((acc, d) => acc + d.targetQty, 0) || orders.reduce((acc, o) => acc + o.planQty, 0);
  const totalOrderQty = orders.reduce((acc, o) => acc + o.orderQty, 0);
  const totalTargetSah = Number(dailyBreakdown.reduce((acc, d) => acc + d.targetSah, 0).toFixed(1));
  const totalClockHours = Number(dailyBreakdown.reduce((acc, d) => acc + d.clockHours, 0).toFixed(1));
  
  let overallEfficiency = totalClockHours > 0 ? Math.round((totalTargetSah / totalClockHours) * 100) : 0;
  if (parsedSummary?.EFFI?.total !== null && parsedSummary?.EFFI?.total !== undefined) {
    const rawTotal = parsedSummary.EFFI.total;
    overallEfficiency = rawTotal <= 1.0 ? Math.round(rawTotal * 100) : Math.round(rawTotal);
  }
  
  const workingDays = dailyBreakdown.filter(d => d.targetQty > 0 || d.clockHours > 0);
  const workingDaysCount = workingDays.length;
  const averageDailyPlan = workingDaysCount > 0 ? Math.round(totalPlannedProduction / workingDaysCount) : 0;

  const activeEffList = workingDays.map(d => d.plannedEfficiency).filter(e => e > 0);
  const minEff = activeEffList.length > 0 ? Math.min(...activeEffList) : 0;
  const maxEff = activeEffList.length > 0 ? Math.max(...activeEffList) : 0;
  const avgEff = activeEffList.length > 0 ? Math.round(activeEffList.reduce((a, b) => a + b, 0) / activeEffList.length) : overallEfficiency;

  return {
    line: {
      id: line.id,
      name: line.name,
      unitCode: line.unitCode,
      unitName: line.unit?.name || `Unit ${line.unitCode}`,
      manpower: line.manpower || 25,
      workingHours: line.workingHours || 10.0,
      status: line.status || 'ACTIVE'
    },
    kpis: {
      totalPlannedProduction,
      totalOrderQty,
      totalTargetSah,
      totalClockHours,
      totalMachineHours: totalClockHours,
      overallEfficiency,
      plannedEfficiency: overallEfficiency,
      effiPlanD: overallEfficiency,
      minEfficiency: minEff,
      maxEfficiency: maxEff,
      avgEfficiency: avgEff,
      actualProduction: 0,
      actualSah: 0,
      actualEfficiency: 0,
      manpower: line.manpower || 25,
      ordersCount: orders.length,
      workingDaysCount,
      averageDailyPlan,
      status: overallEfficiency >= 80 ? 'HIGH' : overallEfficiency >= 70 ? 'NORMAL' : overallEfficiency >= 60 ? 'NEEDS_ATTENTION' : 'LOW'
    },
    dailyBreakdown,
    orders,
    dateColumns,
    allLines,
    summaryJson: parsedSummary
  };
}

export async function getFilterOptions() {
  const [units, lines, buyers, seasons, months, batches] = await Promise.all([
    prisma.unit.findMany({ select: { code: true, name: true } }),
    prisma.productionLine.findMany({ select: { name: true, unitCode: true }, orderBy: { name: 'asc' } }),
    prisma.buyer.findMany({ select: { name: true }, orderBy: { name: 'asc' } }),
    prisma.order.findMany({
      where: { season: { not: null } },
      distinct: ['season'],
      select: { season: true }
    }),
    prisma.productionDaily.findMany({
      distinct: ['month'],
      select: { month: true },
      orderBy: { month: 'desc' }
    }),
    prisma.importBatch.findMany({
      select: { id: true, fileName: true, month: true, totalRows: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  return {
    units: units.map(u => ({ label: `${u.code} (${u.name})`, value: u.code })),
    lines: lines.map(l => ({ label: l.name, value: l.name, unit: l.unitCode })),
    buyers: buyers.map(b => ({ label: b.name, value: b.name })),
    seasons: seasons.map(s => ({ label: s.season!, value: s.season! })),
    months: months.map(m => ({ label: m.month, value: m.month })),
    batches: batches.map(b => ({
      label: `${b.fileName} (${b.month})`,
      value: b.id,
      month: b.month,
      fileName: b.fileName
    }))
  };
}

export async function getOrdersReport(filters: FilterParams = {}, page = 1, pageSize = 50) {
  const where: any = {};
  if (filters.batchId && filters.batchId !== 'ALL') where.importBatchId = filters.batchId;
  if (filters.unitCode && filters.unitCode !== 'ALL') where.unitCode = filters.unitCode;
  if (filters.lineName && filters.lineName !== 'ALL') where.lineName = filters.lineName;
  if (filters.buyerName && filters.buyerName !== 'ALL') where.buyerName = filters.buyerName;
  if (filters.season && filters.season !== 'ALL') where.season = filters.season;
  if (filters.orderStatus && filters.orderStatus !== 'ALL') where.orderStatus = filters.orderStatus;
  if (filters.search) {
    where.OR = [
      { orderCode: { contains: filters.search, mode: 'insensitive' } },
      { styleRef: { contains: filters.search, mode: 'insensitive' } },
      { poNo: { contains: filters.search, mode: 'insensitive' } },
      { color: { contains: filters.search, mode: 'insensitive' } },
      { article: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        dailyRecords: {
          select: { actualQty: true, targetQty: true, targetSah: true, actualSah: true }
        }
      },
      orderBy: { planQty: 'desc' }
    })
  ]);

  const rows = orders.map(ord => {
    const totalActual = ord.dailyRecords.reduce((acc, r) => acc + (r.actualQty || 0), 0);
    const totalTarget = ord.dailyRecords.reduce((acc, r) => acc + (r.targetQty || 0), 0);
    const remainingQty = Math.max(0, ord.orderQty - totalActual);
    const ach = totalTarget > 0 ? Number(((totalActual / totalTarget) * 100).toFixed(1)) : 0;
    
    let status = 'IN_PROGRESS';
    if (totalActual >= ord.orderQty) status = 'COMPLETED';
    else if (ach >= 90) status = 'ON_TRACK';
    else if (ach < 60) status = 'DELAYED';

    return {
      id: ord.id,
      orderCode: ord.orderCode,
      buyer: ord.buyerName,
      unit: ord.unitCode,
      line: ord.lineName,
      style: ord.styleRef,
      article: ord.article,
      poNo: ord.poNo,
      color: ord.color,
      season: ord.season,
      orderQty: ord.orderQty,
      planQty: ord.planQty,
      actualQty: totalActual,
      remainingQty,
      smv: ord.smv,
      achievementRate: ach,
      status,
      fobPrice: ord.fobPrice,
      salesValue: ord.salesValue
    };
  });

  return { total, page, pageSize, totalPages: Math.ceil(total / pageSize), data: rows };
}

export async function getSettings() {
  const settings = await prisma.systemSetting.findMany();
  const res: Record<string, string> = {
    lowEfficiencyThreshold: '60',
    mediumEfficiencyThreshold: '80',
    highEfficiencyThreshold: '100',
    defaultWorkingHours: '10'
  };
  settings.forEach(s => {
    res[s.key] = s.value;
  });
  return res;
}

export async function updateSettings(newSettings: Record<string, string>) {
  for (const [key, value] of Object.entries(newSettings)) {
    await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value }
    });
  }
  return getSettings();
}
