import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function inspectDbAndQuery() {
  const batches = await prisma.importBatch.findMany();

  const orders = await prisma.order.findMany({ take: 3 });

  const daily = await prisma.productionDaily.findMany({ take: 3 });

  const lines = await prisma.productionLine.findMany();
  const totalMp = lines.reduce((a, b) => a + b.manpower, 0);

  const dailyAggNoFilter = await prisma.productionDaily.aggregate({
    _sum: {
      targetQty: true,
      actualQty: true,
      gap: true,
      targetSah: true,
      actualSah: true,
      clockHours: true
    }
  });

  const dailyAggMonth = await prisma.productionDaily.aggregate({
    where: { month: '2026-10' },
    _sum: {
      targetQty: true,
      actualQty: true,
      gap: true,
      targetSah: true,
      actualSah: true,
      clockHours: true
    }
  });

  // Check if month in daily records is '2026-10'
  const distinctMonths = await prisma.productionDaily.findMany({
    select: { month: true },
    distinct: ['month']
  });

  await prisma.$disconnect();
}

inspectDbAndQuery().catch(() => {});
