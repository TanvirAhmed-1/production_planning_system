import { getDashboardData } from '../src/lib/analytics-service.ts';
import prisma from '../src/lib/prisma.ts';

async function testDash() {
  const data = await getDashboardData();
  
  const unitBreakdown = {};
  data.linePerformance.forEach(l => {
    unitBreakdown[l.unitCode] = (unitBreakdown[l.unitCode] || 0) + 1;
  });

}

testDash().catch(() => {}).finally(() => prisma.$disconnect());
