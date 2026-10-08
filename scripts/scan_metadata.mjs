import XLSX from 'xlsx';
import path from 'path';

const filePath = path.resolve('Birichina- Month of October Sign off Production Plan- 26th October.xlsx');
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets['Birichina'];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

const summaryTypes = new Set();
const units = new Set();
const buyers = new Set();
const lines = new Set();
let totalOrderRows = 0;
let totalSpecialRows = 0;

for (let i = 1; i < rows.length; i++) {
  const row = rows[i];
  if (!row || row.length === 0) continue;
  
  const line = row[0];
  const unit = row[2];
  const buyer = row[4];
  const col33 = row[33];
  
  if (line) lines.add(line);
  if (unit) units.add(unit);
  if (buyer) {
    buyers.add(buyer);
    totalOrderRows++;
  }
  if (col33) {
    summaryTypes.add(col33);
    totalSpecialRows++;
  }
}

