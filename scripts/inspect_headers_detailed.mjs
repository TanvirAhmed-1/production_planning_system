import xlsx from 'xlsx';
import path from 'path';

const filePath = path.resolve('Birichina- Month of October Sign off Production Plan- 26th October.xlsx');
const wb = xlsx.readFile(filePath);

const sheet = wb.Sheets['U02'];
const allRows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
const headers = allRows[0];

headers.forEach((h, idx) => {
  let label = h;
  if (typeof h === 'number' && h > 40000) {
    const d = xlsx.SSF.parse_date_code(h);
    label = `DATE: ${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')} (serial ${h})`;
  }
});

for (let r = 0; r < 30; r++) {
  const row = allRows[r];
  if (!row) continue;
}
