import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testDateDetails() {
  
  const lineSummaries = await prisma.productionDaily.findMany({
    where: {
      dateString: '2026-10-01',
      orderId: null,
    },
    include: {
      line: true,
      unit: true,
    }
  });

  const totalTarget = lineSummaries.reduce((acc, l) => acc + (l.targetQty || 0), 0);
  
  const orderDailies = await prisma.productionDaily.findMany({
    where: {
      dateString: '2026-10-01',
      orderId: { not: null }
    },
    include: {
      order: true
    }
  });
}

testDateDetails()
  .catch(() => {})
  .finally(() => prisma.$disconnect());
