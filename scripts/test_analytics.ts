import { getDashboardData } from '../src/lib/analytics-service';
import prisma from '../src/lib/prisma';

async function main() {
  const data = await getDashboardData({ month: '2026-10' });
  console.log('--- KPI Summary ---');
  console.log(data.kpis);
  console.log('\n--- Daily Trend (first 3 days) ---');
  console.log(data.efficiencyTrend.slice(0, 3));
  console.log('\n--- Unit Breakdown ---');
  console.log(data.unitPerformance);
  console.log('\n--- Buyer Breakdown ---');
  console.log(data.buyerPerformance);
}

main().catch(console.error).finally(() => prisma.$disconnect());
