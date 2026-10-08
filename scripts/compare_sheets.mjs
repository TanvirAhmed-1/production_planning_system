import xlsx from 'xlsx';
import path from 'path';

const filePath = path.resolve('Birichina- Month of October Sign off Production Plan- 26th October.xlsx');
const wb = xlsx.readFile(filePath);


const birichinaSheet = wb.Sheets['Birichina'];
if (birichinaSheet) {
  const rows = xlsx.utils.sheet_to_json(birichinaSheet, { header: 1, defval: null });
}

for (const name of ['U02', 'U03', 'U04', 'B2', 'Summary']) {
  const s = wb.Sheets[name];
  if (s) {
    const rows = xlsx.utils.sheet_to_json(s, { header: 1, defval: null });
  }
}
