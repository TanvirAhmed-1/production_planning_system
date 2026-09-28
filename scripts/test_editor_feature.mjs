import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function runTest() {
  console.log('Testing Unit & Line Data Logic...');
  
  // 1. Fetch line U02-01
  const line = await prisma.productionLine.findUnique({
    where: { name: 'U02-01' },
    include: {
      orders: { take: 3 },
      dailyRecords: { where: { orderId: null }, take: 3 }
    }
  });

  console.log('Found line:', line?.name, 'Manpower:', line?.manpower, 'Orders count:', line?.orders.length);
  console.log('Line summary records count (orderId == null):', line?.dailyRecords.length);

  // 2. Fetch distinct dates for October 2026
  const dates = await prisma.productionDaily.findMany({
    where: { month: '2026-10' },
    distinct: ['dateString'],
    select: { dateString: true },
    orderBy: { dateString: 'asc' }
  });
  console.log('Available October dates:', dates.length);

  console.log('Test completed successfully!');
}

runTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
