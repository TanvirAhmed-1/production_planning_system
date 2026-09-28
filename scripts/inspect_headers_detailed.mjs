import xlsx from 'xlsx';
import path from 'path';

const filePath = path.resolve('Birichina- Month of October Sign off Production Plan- 26th October.xlsx');
const wb = xlsx.readFile(filePath);

const sheet = wb.Sheets['U02'];
const allRows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
const headers = allRows[0];

console.log('--- U02 Header Row Analysis ---');
headers.forEach((h, idx) => {
  let label = h;
  if (typeof h === 'number' && h > 40000) {
    const d = xlsx.SSF.parse_date_code(h);
    label = `DATE: ${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')} (serial ${h})`;
  }
  console.log(`Col ${idx} [${xlsx.utils.encode_col(idx)}]: ${label}`);
});

console.log('\n--- U02 First 30 rows summary analysis ---');
for (let r = 0; r < 30; r++) {
  const row = allRows[r];
  if (!row) continue;
  console.log(`R${r}: Line="${row[0]}" Unit="${row[2]}" Buyer="${row[4]}" Style="${row[8]}" TotalPlan(Col 34)=${row[34]} Day1(Col 35)=${row[35]} Day2(Col 37)=${row[37]} [Col 33 label="${row[33]}"]`);
}
