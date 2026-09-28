import xlsx from 'xlsx';
import path from 'path';

const filePath = path.resolve('Birichina- Month of October Sign off Production Plan- 26th October.xlsx');
const wb = xlsx.readFile(filePath);

console.log('Sheet Names:', wb.SheetNames);

const birichinaSheet = wb.Sheets['Birichina'];
if (birichinaSheet) {
  const rows = xlsx.utils.sheet_to_json(birichinaSheet, { header: 1, defval: null });
  console.log(`Birichina sheet has ${rows.length} rows.`);
  console.log('Headers in Birichina:', rows[0].filter(c => c !== null).slice(0, 36));
}

for (const name of ['U02', 'U03', 'U04', 'B2', 'Summary']) {
  const s = wb.Sheets[name];
  if (s) {
    const rows = xlsx.utils.sheet_to_json(s, { header: 1, defval: null });
    console.log(`Sheet ${name} has ${rows.length} rows.`);
  }
}
