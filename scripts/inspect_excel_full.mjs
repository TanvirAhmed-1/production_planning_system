import xlsx from 'xlsx';
import path from 'path';

const filePath = path.resolve('Birichina- Month of October Sign off Production Plan- 26th October.xlsx');
const wb = xlsx.readFile(filePath);


for (const sheetName of wb.SheetNames) {
  const ws = wb.Sheets[sheetName];
  const allRows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: null });
  
  // Look at Row 0
  const headers = allRows[0] || [];
  headers.forEach((h, idx) => {
    if (h !== null && h !== undefined) {
    }
  });

  // Look for summary rows like "Plan/Day", "SAH", "Machine", "Effi. plan"
  for (let i = 0; i < allRows.length; i++) {
    const row = allRows[i];
    if (!row) continue;
    const rowText = row.filter(c => c !== null).map(c => String(c)).join(' | ');
    if (rowText.toLowerCase().includes('plan/day') || 
        rowText.toLowerCase().includes('effi') || 
        rowText.toLowerCase().includes('sah') || 
        rowText.toLowerCase().includes('machine')) {
    }
  }
}
