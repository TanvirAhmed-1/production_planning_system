import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function keepSingleBatch() {
  const batches = await prisma.importBatch.findMany({ orderBy: { createdAt: 'desc' } });
  
  if (batches.length > 1) {
    const keepBatch = batches[0];
    const deleteBatches = batches.slice(1);
    for (const b of deleteBatches) {
      await prisma.productionDaily.deleteMany({ where: { importBatchId: b.id } });
      await prisma.order.deleteMany({ where: { importBatchId: b.id } });
      await prisma.importBatch.delete({ where: { id: b.id } });
    }
  }

  const orderCount = await prisma.order.count();
  const dailyCount = await prisma.productionDaily.count();
  const lineCount = await prisma.productionLine.count();
  const agg = await prisma.productionDaily.aggregate({ _sum: { targetQty: true, actualQty: true } });

}

keepSingleBatch().catch(() => {}).finally(() => prisma.$disconnect());
