import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function runTest() {
  
  // 1. Fetch line U02-01
  const line = await prisma.productionLine.findUnique({
    where: { name: 'U02-01' },
    include: {
      orders: { take: 3 },
      dailyRecords: { where: { orderId: null }, take: 3 }
    }
  });


  // 2. Fetch distinct dates for October 2026
  const dates = await prisma.productionDaily.findMany({
    where: { month: '2026-10' },
    distinct: ['dateString'],
    select: { dateString: true },
    orderBy: { dateString: 'asc' }
  });

}

runTest()
  .catch(() => {})
  .finally(() => prisma.$disconnect());
