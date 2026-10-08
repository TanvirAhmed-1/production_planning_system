import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function runCleanup() {
  const batches = await prisma.importBatch.findMany({ orderBy: { createdAt: 'desc' } });
  
  // Find the official Birichina batch
  const birichinaBatch = batches.find(b => b.fileName.includes('Birichina')) || batches[0];

  for (const b of batches) {
    if (b.id !== birichinaBatch.id) {
      await prisma.productionDaily.deleteMany({ where: { importBatchId: b.id } });
      await prisma.order.deleteMany({ where: { importBatchId: b.id } });
      await prisma.importBatch.delete({ where: { id: b.id } });
    }
  }

  // Delete orphaned lines (lines with 0 orders in the active batch)
  const activeLineIds = await prisma.order.findMany({
    select: { lineId: true },
    distinct: ['lineId']
  });
  const validIds = new Set(activeLineIds.map(o => o.lineId).filter(Boolean));

  const allLines = await prisma.productionLine.findMany();
  let deletedLineCount = 0;
  for (const line of allLines) {
    if (!validIds.has(line.id)) {
      await prisma.productionDaily.deleteMany({ where: { lineId: line.id } });
      await prisma.productionLine.delete({ where: { id: line.id } });
      deletedLineCount++;
    }
  }

  // Update total registered lines on units
  const units = await prisma.unit.findMany({ include: { lines: true } });
  for (const u of units) {
    await prisma.unit.update({
      where: { id: u.id },
      data: {
        totalLines: u.lines.length,
        totalManpower: u.lines.reduce((acc, l) => acc + l.manpower, 0)
      }
    });
  }

  // Final verification
  const finalLines = await prisma.productionLine.findMany({ include: { unit: true } });
  const finalOrders = await prisma.order.count();
  const finalDaily = await prisma.productionDaily.count();
  const finalSums = await prisma.productionDaily.aggregate({
    _sum: { targetQty: true, actualQty: true, targetSah: true, actualSah: true, clockHours: true }
  });

  const unitCounts = {};
  for (const l of finalLines) {
    unitCounts[l.unitCode] = (unitCounts[l.unitCode] || 0) + 1;
  }

}

runCleanup().catch(() => {}).finally(() => prisma.$disconnect());
