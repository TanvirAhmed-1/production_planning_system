import xlsx from 'xlsx';
import path from 'path';

const filePath = path.resolve('Birichina- Month of October Sign off Production Plan- 26th October.xlsx');
const wb = xlsx.readFile(filePath);

const sheet = wb.Sheets['Summary'];
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

rows.forEach((r, idx) => {
  if (r && r.some(c => c !== null)) {
  }
});
