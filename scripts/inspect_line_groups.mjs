import XLSX from 'xlsx';
import path from 'path';

const filePath = path.resolve('Birichina- Month of October Sign off Production Plan- 26th October.xlsx');
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets['Birichina'];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });


for (let i = 0; i < Math.min(30, rows.length); i++) {
  const row = rows[i];
  if (!row[4] && row[33]) {
    // Summary row for line (e.g. Plan/Day, SAH, CLK Hour, Eff%)
  }
}
