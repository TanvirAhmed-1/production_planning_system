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

  console.log('=====================================================');
  console.log('STEP 1: IMPORTING PLAN FILE');
  console.log('File: Birichina- Month of October Sign off Production Plan- 1st October.xlsx');
  console.log('=====================================================');
  const planBuf = fs.readFileSync('Birichina- Month of October Sign off Production Plan- 1st October.xlsx');
  const planRes = await parseAndImportExcel(planBuf, 'Birichina- Month of October Sign off Production Plan- 1st October.xlsx');
  console.log('Plan Import Status:', planRes.success ? 'SUCCESS' : 'FAILED');
  console.log('Message:', planRes.message);
  console.log('Batch ID:', planRes.batchId);
  console.log('Total Orders:', planRes.importedRows);
  console.log('Total Plan Qty:', planRes.totalPlanQty.toLocaleString(), 'Pcs');
  console.log('Total Plan SAH:', Math.round(planRes.totalSah).toLocaleString());

  console.log('\n=====================================================');
  console.log('STEP 2: IMPORTING ACTUAL FLOOR TRACKER FILE');
  console.log('File: Untitled spreadsheet.xlsx');
  console.log('Mapped to Plan Batch ID:', planRes.batchId);
  console.log('=====================================================');
  const actBuf = fs.readFileSync('Untitled spreadsheet.xlsx');
  const actRes = await parseAndImportActualExcel(actBuf, 'Untitled spreadsheet.xlsx', planRes.batchId);
  console.log('Actual Import Status:', actRes.success ? 'SUCCESS' : 'FAILED');
  console.log('Message:', actRes.message);
  console.log('Batch ID:', actRes.batchId);
  console.log('Imported Floor Records:', actRes.importedRows);
  console.log('Total Actual Output:', actRes.totalActualPcs.toLocaleString(), 'Pcs');
  console.log('Total Actual SAH:', actRes.totalActualSah.toLocaleString());
  console.log('Overall Floor Efficiency:', actRes.overallEfficiency, '%');

  console.log('\n=====================================================');
  console.log('STEP 3: OVERALL MONTHLY PRODUCTION OVERVIEW (OCT 2026)');
  console.log('=====================================================');
  const overall = await getDashboardData({ batchId: planRes.batchId, month: '2026-10' });
  console.log('KPI Cards Summary:');
  console.log('  Total Planned Production:', overall.kpis.totalPlannedProduction.toLocaleString(), 'Pcs');
  console.log('  Total Actual Production :', overall.kpis.totalActualProduction.toLocaleString(), 'Pcs');
  console.log('  Total Production Gap     :', overall.kpis.totalGap.toLocaleString(), 'Pcs');
  console.log('  Planned Efficiency       :', overall.kpis.plannedEfficiency, '%');
  console.log('  Actual Overall Efficiency:', overall.kpis.actualEfficiency, '%');
  console.log('  Target Achievement Rate  :', overall.kpis.targetAchievementRate, '%');
  console.log('  Active Production Lines  :', overall.kpis.totalActiveLines);

  console.log('\nDaily Calendar Trend for Active Production Days:');
  const activeDays = overall.efficiencyTrend.filter(d => d.actual > 0 || d.date === '2026-10-01' || d.date === '2026-10-03' || d.date === '2026-10-04');
  console.table(activeDays.map(d => ({
    Date: d.date,
    Target: d.target.toLocaleString(),
    Actual: d.actual.toLocaleString(),
    Gap: d.gap.toLocaleString(),
    'Eff %': d.efficiency + '%',
    'Ach %': d.achievementRate + '%'
  })));

  console.log('\n=====================================================');
  console.log('STEP 4: CLUSTER-WISE DRILLDOWN');
  console.log('=====================================================');
  for (const cluster of ['B1', 'B2', 'Styrax']) {
    const clusterData = await getDashboardData({ cluster, month: '2026-10' });
    const planned = clusterData.kpis.totalPlannedProduction.toLocaleString();
    const actual = clusterData.kpis.totalActualProduction.toLocaleString();
    const eff = clusterData.kpis.averageEfficiency;
    console.log(`Cluster ${cluster}: Target = ${planned} Pcs | Actual = ${actual} Pcs | Eff = ${eff}%`);
  }

  console.log('\n=====================================================');
  console.log('STEP 5: UNIT-WISE REPORT SUMMARY');
  console.log('=====================================================');
  console.table(overall.unitPerformance.map(u => ({
    UnitCode: u.unitCode,
    UnitName: u.unitName,
    Target: u.target.toLocaleString(),
    Actual: u.actual.toLocaleString(),
    Gap: u.gap.toLocaleString(),
    Eff: u.efficiency + '%',
    Ach: u.achievementRate + '%'
  })));
}

run().catch(console.error).finally(() => prisma.$disconnect());
