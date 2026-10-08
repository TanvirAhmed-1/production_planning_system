import fs from 'fs';
import { parseAndImportExcel } from '../src/lib/excel-importer';
import { parseAndImportActualExcel } from '../src/lib/actual-importer';
import { getDashboardData} from '../src/lib/analytics-service';
import prisma from '../src/lib/prisma';

async function run() {
  // Clear any test duplicates for a pristine database
  await prisma.productionActualRecord.deleteMany();
  await prisma.productionDaily.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productionLine.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.buyer.deleteMany();
  await prisma.importBatch.deleteMany();

  const planBuf = fs.readFileSync('Birichina- Month of October Sign off Production Plan- 1st October.xlsx');
  const planRes = await parseAndImportExcel(planBuf, 'Birichina- Month of October Sign off Production Plan- 1st October.xlsx');

  const actBuf = fs.readFileSync('Untitled spreadsheet.xlsx');
  const actRes = await parseAndImportActualExcel(actBuf, 'Untitled spreadsheet.xlsx', planRes.batchId);

  const overall = await getDashboardData({ batchId: planRes.batchId, month: '2026-10' });

  const activeDays = overall.efficiencyTrend.filter(d => d.actual > 0 || d.date === '2026-10-01' || d.date === '2026-10-03' || d.date === '2026-10-04');
  console.log('Active Days:', activeDays);

  for (const cluster of ['B1', 'B2']) {
    const clusterData = await getDashboardData({ cluster, month: '2026-10' });
    const planned = clusterData.kpis.totalPlannedProduction.toLocaleString();
    const actual = clusterData.kpis.totalActualProduction.toLocaleString();
    const eff = clusterData.kpis.averageEfficiency;
    console.log(`Cluster ${cluster}: Planned = ${planned}, Actual = ${actual}, Eff = ${eff}%`);
  }

  const styraxActualsCount = await prisma.productionActualRecord.count({
    where: {
      OR: [
        { cluster: { contains: 'Styrax', mode: 'insensitive' } },
        { unitCode: { startsWith: 'S' } },
        { lineName: { startsWith: 'S' } }
      ]
    }
  });
  console.log('Styrax actual records in DB after import:', styraxActualsCount);
}

run().catch(() => {}).finally(() => prisma.$disconnect());
