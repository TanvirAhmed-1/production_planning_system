import XLSX from 'xlsx';
import path from 'path';

const filePath = path.resolve('Birichina- Month of October Sign off Production Plan- 26th October.xlsx');
const workbook = XLSX.readFile(filePath);


for (const sheetName of workbook.SheetNames) {
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  // Find header rows (rows 0-10)
  for (let r = 0; r < Math.min(10, data.length); r++) {
    const row = data[r];
    if (row && row.some(cell => cell !== null && cell !== undefined)) {
    }
  }
}
