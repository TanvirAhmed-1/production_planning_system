import xlsx from 'xlsx';
import path from 'path';

const filePath = path.resolve('Birichina- Month of October Sign off Production Plan- 26th October.xlsx');
const wb = xlsx.readFile(filePath);

console.log('Sheet Names in Workbook:', wb.SheetNames);

for (const sheetName of wb.SheetNames) {
  const ws = wb.Sheets[sheetName];
  const allRows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: null });
  console.log(`\n================ Sheet: ${sheetName} (Rows: ${allRows.length}) ================`);
  
  // Look at Row 0
  const headers = allRows[0] || [];
  console.log(`Row 0 Headers (${headers.length} columns):`);
  headers.forEach((h, idx) => {
    if (h !== null && h !== undefined) {
      console.log(`  Col ${idx} (${xlsx.utils.encode_col(idx)}): ${typeof h === 'number' && h > 40000 ? `[Excel Date: ${JSON.stringify(xlsx.SSF.parse_date_code(h))}] (${h})` : h}`);
    }
  });

  // Look for summary rows like "Plan/Day", "SAH", "Machine", "Effi. plan"
  console.log(`\nScanning for Summary rows in ${sheetName}:`);
  for (let i = 0; i < allRows.length; i++) {
    const row = allRows[i];
    if (!row) continue;
    const rowText = row.filter(c => c !== null).map(c => String(c)).join(' | ');
    if (rowText.toLowerCase().includes('plan/day') || 
        rowText.toLowerCase().includes('effi') || 
        rowText.toLowerCase().includes('sah') || 
        rowText.toLowerCase().includes('machine')) {
      console.log(`  Row ${i}:`, row.slice(0, 45).map(c => c === null ? '' : c));
    }
  }
}
