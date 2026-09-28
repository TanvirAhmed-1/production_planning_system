import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testDateDetails() {
  console.log('Testing date details query for 2026-10-01...');
  
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

  console.log('Lines running on 2026-10-01:', lineSummaries.length);
  const totalTarget = lineSummaries.reduce((acc, l) => acc + (l.targetQty || 0), 0);
  console.log('Total planned PCS on 2026-10-01:', totalTarget.toLocaleString());
  
  const orderDailies = await prisma.productionDaily.findMany({
    where: {
      dateString: '2026-10-01',
      orderId: { not: null }
    },
    include: {
      order: true
    }
  });
  console.log('Total style daily records on 2026-10-01:', orderDailies.length);
}

testDateDetails()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
