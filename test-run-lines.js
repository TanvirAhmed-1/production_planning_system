const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const stats = await prisma.productionDaily.groupBy({
    by: ['dateString', 'unitId'],
    _count: {
      lineId: true
    }
  });

  const units = await prisma.unit.findMany();
  const unitMap = Object.fromEntries(units.map(u => [u.id, u]));

  const result = stats.map(s => ({
    date: s.dateString,
    unitName: unitMap[s.unitId]?.name,
    unitCode: unitMap[s.unitId]?.code,
    runningLines: s._count.lineId
  }));

  console.log('Sample Run Lines:', result.slice(0, 10));
}

main().finally(() => prisma.$disconnect());
