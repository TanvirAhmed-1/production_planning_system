import fs from 'fs';
import path from 'path';
import { parseAndImportExcel } from '../src/lib/excel-importer';
import prisma from '../src/lib/prisma';

async function main() {
  console.log('--- Starting Excel Import Test ---');
  const filePath = path.resolve('Birichina- Month of October Sign off Production Plan- 26th October.xlsx');
  const buffer = fs.readFileSync(filePath);
  
  console.log(`Read file: ${filePath} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
  const result = await parseAndImportExcel(buffer, 'Birichina- Month of October Sign off Production Plan- 26th October.xlsx');
  
  console.log('Import result:', JSON.stringify(result, null, 2));

  // Verify DB counts
  const [orders, daily, lines, units, buyers] = await Promise.all([
    prisma.order.count(),
    prisma.productionDaily.count(),
    prisma.productionLine.count(),
    prisma.unit.count(),
    prisma.buyer.count()
  ]);

  console.log('\n--- Database Stats after Import ---');
  console.log({ orders, daily, lines, units, buyers });

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
  console.log('\nSample Order dailyPlanJson:', sampleOrder);

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
  console.log('\nSample Line summaryJson (first 200 chars):', sampleLine?.summaryJson?.substring(0, 300));
}

main().catch(console.error).finally(() => prisma.$disconnect());
