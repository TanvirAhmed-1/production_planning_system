import { getDashboardData } from '../src/lib/analytics-service';
import prisma from '../src/lib/prisma';

async function main() {
  const data = await getDashboardData({ month: '2026-10' });
}

main().catch(() => {}).finally(() => prisma.$disconnect());
