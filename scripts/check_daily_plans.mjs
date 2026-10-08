import xlsx from 'xlsx';
import path from 'path';

const filePath = path.resolve('Birichina- Month of October Sign off Production Plan- 26th October.xlsx');
const wb = xlsx.readFile(filePath);

const sheet = wb.Sheets['Birichina'];
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
const headers = rows[0];


let orderRowsCount = 0;
let ordersWithDailyPlan = 0;
let totalDailyPlanSum = 0;
let planDaySubtotalSum = 0;

for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  if (!r) continue;
  
  const buyer = r[4];
  const orderCode = r[5];
  const styleRef = r[8];
  const label = r[33];

  if (buyer && orderCode && styleRef) {
    orderRowsCount++;
    let hasDaily = false;
    for (let c = 35; c <= 65; c++) {
      if (r[c] !== null && r[c] !== undefined && r[c] !== '') {
        const val = Number(r[c]);
        if (!isNaN(val) && val > 0) {
          hasDaily = true;
          totalDailyPlanSum += val;
        }
      }
    }
    if (hasDaily) ordersWithDailyPlan++;
  } else if (label === 'Plan/Day') {
    for (let c = 35; c <= 65; c++) {
      if (r[c] !== null && r[c] !== undefined && r[c] !== '') {
        const val = Number(r[c]);
        if (!isNaN(val) && val > 0) {
          planDaySubtotalSum += val;
        }
      }
    }
  }
}

  orderRowsCount,
  ordersWithDailyPlan,
  totalDailyPlanSum,
  planDaySubtotalSum
});
