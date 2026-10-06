import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runAudit() {
  console.log('--- STARTING DATABASE AUDIT ---');

  // 1. Check Import Batches
  const batches = await prisma.importBatch.findMany({ orderBy: { createdAt: 'desc' } });
  console.log(`1. Total Import Batches: ${batches.length}`);
  batches.forEach(b => {
    console.log(`   - [${b.batchType}] ${b.fileName} (Rows: ${b.importedRows}/${b.totalRows})`);
  });

  // 2. Check Units
  const units = await prisma.unit.findMany({ include: { lines: true } });
  console.log(`\n2. Total Units: ${units.length}`);
  units.forEach(u => {
    console.log(`   - Unit [${u.code}] "${u.name}": ${u.lines.length} lines configured`);
  });

  // 3. Check Production Lines
  const allLines = await prisma.productionLine.findMany({ orderBy: [{ unitCode: 'asc' }, { name: 'asc' }] });
  console.log(`\n3. Total Production Lines: ${allLines.length}`);

  // 4. Check Unique Buyers
  const buyers = await prisma.buyer.findMany({ orderBy: { name: 'asc' } });
  console.log(`\n4. Total Buyers: ${buyers.length}`);

  // 5. Check Orders
  const totalOrders = await prisma.order.count();
  const orderAgg = await prisma.order.aggregate({
    _sum: { orderQty: true, planQty: true }
  });
  console.log(`\n5. Total Orders: ${totalOrders} (Plan Qty: ${orderAgg._sum.planQty?.toLocaleString() || 0})`);

  // 6. Check Production Daily Records
  const totalDaily = await prisma.productionDaily.count();
  const dailyDates = await prisma.productionDaily.findMany({
    distinct: ['dateString'],
    select: { dateString: true },
    orderBy: { dateString: 'asc' }
  });
  console.log(`\n6. Total Daily Records: ${totalDaily} across ${dailyDates.length} distinct days`);

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

  console.log(`\n7. Overall Daily Metrics:`);
  console.log(`   - Planned Target: ${planned.toLocaleString()} PCS`);
  console.log(`   - Actual Production: ${actual.toLocaleString()} PCS`);
  console.log(`   - Gap: ${gap.toLocaleString()} PCS`);
  console.log(`   - Target SAH: ${targetSah.toFixed(2)} hrs`);
  console.log(`   - Actual SAH: ${actualSah.toFixed(2)} hrs`);
  console.log(`   - Clock Hours: ${clockHours.toFixed(1)} hrs`);
  console.log(`   - Achievement: ${achievementRate}%`);
  console.log(`   - Efficiency: ${efficiency}%`);

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

  console.log(`\n8. Unit-wise Production Breakdown:`);
  for (const us of unitStats) {
    const u = units.find(unit => unit.id === us.unitId);
    const uPlanned = us._sum.targetQty || 0;
    const uActual = us._sum.actualQty || 0;
    const uAch = uPlanned > 0 ? ((uActual / uPlanned) * 100).toFixed(1) : 0;
    const uActSah = us._sum.actualSah || 0;
    const uClkHrs = us._sum.clockHours || 0;
    const uEff = uClkHrs > 0 ? ((uActSah / uClkHrs) * 100).toFixed(1) : 0;
    console.log(`   - Unit [${u?.code || us.unitId}] "${u?.name || ''}": Target: ${uPlanned.toLocaleString()}, Actual: ${uActual.toLocaleString()} (Ach: ${uAch}%, Eff: ${uEff}%)`);
  }

  // 9. Check Unique Lines in ProductionDaily GroupBy vs ProductionLine Table
  const lineNamesCount = {};
  allLines.forEach(l => {
    lineNamesCount[l.name] = (lineNamesCount[l.name] || 0) + 1;
  });
  const duplicateLineNames = Object.entries(lineNamesCount).filter(([name, count]) => count > 1);
  if (duplicateLineNames.length > 0) {
    console.log(`\n⚠️ Warning: Duplicate line names detected:`, duplicateLineNames);
  }

  console.log('\n--- AUDIT COMPLETE ---');
}

runAudit().catch(console.error).finally(() => prisma.$disconnect());
