import xlsx from 'xlsx';
import path from 'path';

const filePath = path.resolve('Birichina- Month of October Sign off Production Plan- 26th October.xlsx');
const wb = xlsx.readFile(filePath);

const sheet = wb.Sheets['Birichina'];
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

const lineSummaries = {};
let currentLine = null;

for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  if (!r) continue;
  
  const line = r[0];
  if (line && /^[UB]/.test(String(line))) {
    currentLine = String(line).trim();
  }
  
  const label = r[33];
  if (label && (label.includes('Plan/Day') || label.includes('SAH') || label.includes('Machine') || label.includes('Effi'))) {
    if (!lineSummaries[currentLine]) lineSummaries[currentLine] = {};
    const type = label.includes('Plan/Day') ? 'PLAN' :
                 label.includes('SAH') ? 'SAH' :
                 label.includes('Machine') ? 'MACHINE' : 'EFFI';
    
    lineSummaries[currentLine][type] = {
      total: r[34],
      oct01: r[35],
      oct02: r[36],
      oct03: r[37],
      oct04: r[38],
      oct05: r[39]
    };
  }
}

console.log('Detected summary rows for lines:', Object.keys(lineSummaries).length);
console.log('Sample for U02-01:', lineSummaries['U02-01']);
console.log('Sample for U03-01:', lineSummaries['U03-01']);
console.log('Sample for B2U2-01:', lineSummaries['B2U2-01']);
