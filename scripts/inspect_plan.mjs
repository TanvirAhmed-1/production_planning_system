import XLSX from 'xlsx';
import path from 'path';
const sheet = XLSX.readFile(path.resolve('Birichina- Month of October Sign off Production Plan- 26th October.xlsx')).Sheets['Birichina'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
data.forEach((r, i) => { 
    if (r[33] === 'Plan/Day') { 
    } 
});
