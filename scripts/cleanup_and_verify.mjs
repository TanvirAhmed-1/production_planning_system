import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupAndVerify() {

  // 1. Delete test batch (cfa23882-d9b4-4255-8eb8-c94361bb28a4)
  const testBatchId = 'cfa23882-d9b4-4255-8eb8-c94361bb28a4';
  const testBatch = await prisma.importBatch.findUnique({ where: { id: testBatchId } });
  if (testBatch) {
    await prisma.productionDaily.deleteMany({ where: { importBatchId: testBatchId } });
    await prisma.order.deleteMany({ where: { importBatchId: testBatchId } });
    await prisma.importBatch.delete({ where: { id: testBatchId } });
  }

  // 2. Remove extra lines in ProductionLine that have 0 daily records and 0 orders
  const allLines = await prisma.productionLine.findMany({
    include: {
      _count: {
        select: { dailyRecords: true, orders: true }
      }
    }
  });

  const unusedLines = allLines.filter(l => l._count.dailyRecords === 0 && l._count.orders === 0);
  for (const l of unusedLines) {
    await prisma.productionLine.delete({ where: { id: l.id } });
  }

  // 3. Verify Remaining Lines in DB
  const remainingLines = await prisma.productionLine.findMany({
    orderBy: [{ unitCode: 'asc' }, { name: 'asc' }]
  });

  const unitLineCounts = {};
  remainingLines.forEach(l => {
    unitLineCounts[l.unitCode] = (unitLineCounts[l.unitCode] || 0) + 1;
  });

  // 4. Run Full Database Audit
  const batches = await prisma.importBatch.findMany();
  const units = await prisma.unit.findMany({ include: { lines: true } });
  const buyers = await prisma.buyer.findMany({ orderBy: { name: 'asc' } });
  const totalOrders = await prisma.order.count();
  const orderAgg = await prisma.order.aggregate({ _sum: { orderQty: true, planQty: true } });
  const totalDaily = await prisma.productionDaily.count();
  const dailyDates = await prisma.productionDaily.findMany({
    distinct: ['dateString'],
    select: { dateString: true },
    orderBy: { dateString: 'asc' }
  });

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
  const gap = planned - actual;
  const targetSah = dailyAgg._sum.targetSah || 0;
  const actualSah = dailyAgg._sum.actualSah || 0;
  const clockHours = dailyAgg._sum.clockHours || 0;
  const achievementRate = planned > 0 ? ((actual / planned) * 100).toFixed(1) : 0;
  const efficiency = clockHours > 0 ? ((actualSah / clockHours) * 100).toFixed(1) : 0;


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
    const uGap = uPlanned - uActual;
    const uAch = uPlanned > 0 ? ((uActual / uPlanned) * 100).toFixed(1) : 0;
    const uActSah = us._sum.actualSah || 0;
    const uClkHrs = us._sum.clockHours || 0;
    const uEff = uClkHrs > 0 ? ((uActSah / uClkHrs) * 100).toFixed(1) : 0;
  }
}

cleanupAndVerify().catch(() => {}).finally(() => prisma.$disconnect());
