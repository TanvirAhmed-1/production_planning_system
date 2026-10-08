import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runAudit() {

  // 1. Check Import Batches
  const batches = await prisma.importBatch.findMany({ orderBy: { createdAt: 'desc' } });
  batches.forEach(b => {
  });

  // 2. Check Units
  const units = await prisma.unit.findMany({ include: { lines: true } });
  units.forEach(u => {
  });

  // 3. Check Production Lines
  const allLines = await prisma.productionLine.findMany({ orderBy: [{ unitCode: 'asc' }, { name: 'asc' }] });

  // 4. Check Unique Buyers
  const buyers = await prisma.buyer.findMany({ orderBy: { name: 'asc' } });

  // 5. Check Orders
  const totalOrders = await prisma.order.count();
  const orderAgg = await prisma.order.aggregate({
    _sum: { orderQty: true, planQty: true }
  });

  // 6. Check Production Daily Records
  const totalDaily = await prisma.productionDaily.count();
  const dailyDates = await prisma.productionDaily.findMany({
    distinct: ['dateString'],
    select: { dateString: true },
    orderBy: { dateString: 'asc' }
  });

  // 7. Check Daily Aggregations (Overall)
  const dailyAgg = await prisma.productionDaily.aggregate({
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

  const planned = dailyAgg._sum.targetQty || 0;
  const actual = dailyAgg._sum.actualQty || 0;
  const gap = dailyAgg._sum.gap || 0;
  const targetSah = dailyAgg._sum.targetSah || 0;
  const actualSah = dailyAgg._sum.actualSah || 0;
  const clockHours = dailyAgg._sum.clockHours || 0;
  const achievementRate = planned > 0 ? ((actual / planned) * 100).toFixed(1) : 0;
  const efficiency = clockHours > 0 ? ((actualSah / clockHours) * 100).toFixed(1) : 0;


  // 8. Check Unit-wise Totals
  const unitStats = await prisma.productionDaily.groupBy({
    by: ['unitId'],
    _sum: {
      targetQty: true,
      actualQty: true,
      gap: true,
      targetSah: true,
      actualSah: true,
      clockHours: true
    }
  });

  for (const us of unitStats) {
    const u = units.find(unit => unit.id === us.unitId);
    const uPlanned = us._sum.targetQty || 0;
    const uActual = us._sum.actualQty || 0;
    const uAch = uPlanned > 0 ? ((uActual / uPlanned) * 100).toFixed(1) : 0;
    const uActSah = us._sum.actualSah || 0;
    const uClkHrs = us._sum.clockHours || 0;
    const uEff = uClkHrs > 0 ? ((uActSah / uClkHrs) * 100).toFixed(1) : 0;
  }

  // 9. Check Unique Lines in ProductionDaily GroupBy vs ProductionLine Table
  const lineNamesCount = {};
  allLines.forEach(l => {
    lineNamesCount[l.name] = (lineNamesCount[l.name] || 0) + 1;
  });
  const duplicateLineNames = Object.entries(lineNamesCount).filter(([name, count]) => count > 1);
  if (duplicateLineNames.length > 0) {
  }

}

runAudit().catch(() => {}).finally(() => prisma.$disconnect());
