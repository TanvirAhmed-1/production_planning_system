const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  
  // 1. Create or ensure Units B2U2 and B2U3 exist
  let b2u2Unit = await prisma.unit.findUnique({ where: { code: 'B2U2' } });
  if (!b2u2Unit) {
    b2u2Unit = await prisma.unit.create({
      data: {
        code: 'B2U2',
        name: 'B2 Unit-02 (B2U2)',
      }
    });
  } else {
  }

  let b2u3Unit = await prisma.unit.findUnique({ where: { code: 'B2U3' } });
  if (!b2u3Unit) {
    b2u3Unit = await prisma.unit.create({
      data: {
        code: 'B2U3',
        name: 'B2 Unit-03 (B2U3)',
      }
    });
  } else {
  }

  // 2. Update ProductionLines
  const linesB2U2 = await prisma.productionLine.updateMany({
    where: { name: { startsWith: 'B2U2' } },
    data: { unitId: b2u2Unit.id, unitCode: 'B2U2' }
  });

  const linesB2U3 = await prisma.productionLine.updateMany({
    where: { name: { startsWith: 'B2U3' } },
    data: { unitId: b2u3Unit.id, unitCode: 'B2U3' }
  });

  // 3. Update ProductionDaily
  // Find all line IDs for B2U2 and B2U3
  const b2u2LineRecords = await prisma.productionLine.findMany({ where: { unitCode: 'B2U2' } });
  const b2u2LineIds = b2u2LineRecords.map(l => l.id);
  
  if (b2u2LineIds.length > 0) {
    const dailyB2U2 = await prisma.productionDaily.updateMany({
      where: { lineId: { in: b2u2LineIds } },
      data: { unitId: b2u2Unit.id }
    });
  }

  const b2u3LineRecords = await prisma.productionLine.findMany({ where: { unitCode: 'B2U3' } });
  const b2u3LineIds = b2u3LineRecords.map(l => l.id);
  
  if (b2u3LineIds.length > 0) {
    const dailyB2U3 = await prisma.productionDaily.updateMany({
      where: { lineId: { in: b2u3LineIds } },
      data: { unitId: b2u3Unit.id }
    });
  }

  // 4. Update Orders (Orders have unitCode)
  // For orders, it's slightly harder because they might not link to lineId, they link to lineName.
  const ordersB2U2 = await prisma.order.updateMany({
    where: { lineName: { startsWith: 'B2U2' } },
    data: { unitCode: 'B2U2' }
  });

  const ordersB2U3 = await prisma.order.updateMany({
    where: { lineName: { startsWith: 'B2U3' } },
    data: { unitCode: 'B2U3' }
  });
  
}

main().catch(console.error).finally(() => prisma.$disconnect());
