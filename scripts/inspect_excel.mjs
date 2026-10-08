import XLSX from 'xlsx';
import path from 'path';

const filePath = path.resolve('Birichina- Month of October Sign off Production Plan- 26th October.xlsx');

const workbook = XLSX.readFile(filePath);

for (const sheetName of workbook.SheetNames) {
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  for (let i = 0; i < Math.min(25, data.length); i++) {
    const row = data[i];
    if (row && row.length > 0) {
    }
  }
}
