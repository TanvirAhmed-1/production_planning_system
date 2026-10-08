import XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDiff() {
  const filePath = './Birichina- Month of October Sign off Production Plan- 26th October.xlsx';
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['Birichina'];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const excelLineSet = new Set();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0]) continue;
    const l = r[0].toString().trim();
    if (l) excelLineSet.add(l);
  }


  const dbLines = await prisma.productionLine.findMany();

  const extraInDb = [];
  dbLines.forEach(l => {
    if (!excelLineSet.has(l.name)) {
      extraInDb.push(l);
    }
  });

  extraInDb.forEach(l => {
  });

  // Check how many productionDaily records belong to extraInDb lines
  const extraLineIds = extraInDb.map(l => l.id);
  const extraDailyCount = await prisma.productionDaily.count({
    where: { lineId: { in: extraLineIds } }
  });

  // Check how many orders associated with extra lines
  const extraOrdersCount = await prisma.order.count({
    where: { lineId: { in: extraLineIds } }
  });

  // Check where the extra lines came from: e.g. "Garments_Production_Test_Data_October_2026 (2).xlsx" or another file!
  const batch2Daily = await prisma.productionDaily.findMany({
    where: { lineId: { in: extraLineIds } },
    select: { importBatchId: true, month: true },
    distinct: ['importBatchId']
  });
}

checkDiff().catch(() => {}).finally(() => prisma.$disconnect());
