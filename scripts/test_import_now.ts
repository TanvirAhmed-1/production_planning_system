import fs from 'fs';
import path from 'path';
import { parseAndImportExcel } from '../src/lib/excel-importer';
import prisma from '../src/lib/prisma';

async function main() {
  const filePath = path.resolve('Birichina- Month of October Sign off Production Plan- 26th October.xlsx');
  const buffer = fs.readFileSync(filePath);
  
  const result = await parseAndImportExcel(buffer, 'Birichina- Month of October Sign off Production Plan- 26th October.xlsx');
  

  // Verify DB counts
  const [orders, daily, lines, units, buyers] = await Promise.all([
    prisma.order.count(),
    prisma.productionDaily.count(),
    prisma.productionLine.count(),
    prisma.unit.count(),
    prisma.buyer.count()
  ]);


  // Sample order with dailyPlanJson
  const sampleOrder = await prisma.order.findFirst({
    where: { dailyPlanJson: { not: null } },
    select: {
      orderCode: true,
      lineName: true,
      buyerName: true,
      styleRef: true,
      planQty: true,
      dailyPlanJson: true
    }
  });

  // Sample line with summaryJson
  const sampleLine = await prisma.productionLine.findFirst({
    where: { summaryJson: { not: null } },
    select: {
      name: true,
      unitCode: true,
      manpower: true,
      summaryJson: true
    }
  });
}

main().catch(() => {}).finally(() => prisma.$disconnect());
