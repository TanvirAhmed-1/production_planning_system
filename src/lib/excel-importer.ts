import * as XLSX from 'xlsx';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

export interface ExcelImportResult {
  success: boolean;
  batchId?: string;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  linesCount: number;
  buyersCount: number;
  dailyCount: number;
  totalPlanQty: number;
  totalOdrQty: number;
  totalSah: number;
  errors: string[];
  message: string;
  verification?: any;
}

// ===== COLUMN INDEX CONSTANTS =====
const C = {
  LINE: 0,
  MANPOWER: 1,
  UNIT: 2,
  ORDER_STATUS: 3,
  BUYER: 4,
  ORDER_CODE: 5,
  OCS: 6,
  SUB_OC: 7,
  STYLE_REF: 8,
  ENGAGE: 9,
  ORDER_DEPT: 10,
  LEAD_MM: 11,
  MERCHANT: 12,
  ARTICLE: 13,
  SEASON: 14,
  PO_NO: 15,
  COLOR: 16,
  ODR_QTY: 17,
  SMV: 18,
  MAIN_CAT: 19,
  SUB_CAT: 20,
  TYPE: 21,
  OTT: 22,
  REV_OTT: 23,
  PCD: 24,
  PSD: 25,
  PFD: 26,
  EX_FAC: 27,
  REV_DEL: 28,
  O_CREATED: 29,
  FOB: 30,
  SALES_VAL: 31,
  WORK_DAYS: 32,
  PLAN_DAY_LABEL: 33,
  PLAN_QTY: 34,
  DATE_START: 35,
};

// ===== HELPER FUNCTIONS =====

export function normalizeUnitCode(rawUnit: string, lineName: string): string {
  const u = (rawUnit || '').trim().toUpperCase();
  const ln = (lineName || '').trim().toUpperCase();

  if (u.includes('U02') || u.includes('B1U2') || ln.includes('U02') || ln.includes('B1U2')) return 'U02';
  if (u.includes('U03') || u.includes('B1U3') || ln.includes('U03') || ln.includes('B1U3')) return 'U03';
  if (u.includes('U04') || u.includes('B1U4') || ln.includes('U04') || ln.includes('B1U4')) return 'U04';
  if (u.startsWith('B2') || ln.startsWith('B2')) return 'B2';
  if (u) return u;

  return 'Unknown';
}

function getUnitDisplayName(code: string): string {
  switch (code) {
    case 'U02': return 'Unit 02 (B1U2)';
    case 'U03': return 'Unit 03 (B1U3)';
    case 'U04': return 'Unit 04 (B1U4)';
    case 'B2': return 'Unit B2';
    default: return `Unit ${code}`;
  }
}

function safeStr(val: any): string | null {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  return s.length > 0 ? s : null;
}

function safeInt(val: any, fallback = 0): number {
  if (val === null || val === undefined || val === '') return fallback;
  const n = Number(val);
  return isNaN(n) ? fallback : Math.round(n);
}

function safeFloat(val: any, fallback = 0): number {
  if (val === null || val === undefined || val === '') return fallback;
  const n = Number(val);
  return isNaN(n) ? fallback : Number(n.toFixed(4));
}

function parseExcelDate(val: any): Date | null {
  if (val === null || val === undefined || val === '' || val === '-') return null;
  if (typeof val === 'number' && val > 30000 && val < 60000) {
    const d = XLSX.SSF.parse_date_code(val);
    return new Date(Date.UTC(d.y, d.m - 1, d.d));
  }
  if (val instanceof Date) return val;
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function isOrderItemRow(row: any[]): boolean {
  const buyer = safeStr(row[C.BUYER]);
  const orderCode = safeStr(row[C.ORDER_CODE]);
  const styleRef = safeStr(row[C.STYLE_REF]);
  return !!(buyer && orderCode && styleRef);
}

function isSubtotalRow(row: any[]): boolean {
  const label = safeStr(row[C.PLAN_DAY_LABEL]);
  if (!label) return false;
  const l = label.toLowerCase();
  return l.includes('plan/day') || l.includes('sah') || l.includes('machine') || l.includes('effi');
}

function getSubtotalType(row: any[]): 'PLAN' | 'SAH' | 'MACHINE' | 'EFFI' | null {
  const label = safeStr(row[C.PLAN_DAY_LABEL]);
  if (!label) return null;
  const l = label.toLowerCase();
  if (l.includes('plan/day')) return 'PLAN';
  if (l.includes('sah')) return 'SAH';
  if (l.includes('machine')) return 'MACHINE';
  if (l.includes('effi')) return 'EFFI';
  return null;
}

export async function parseAndImportExcel(buffer: Buffer, fileName: string): Promise<ExcelImportResult> {
  const errors: string[] = [];
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Choose master sheet: prefer 'Birichina', otherwise first sheet with line data
    let sheetName = workbook.SheetNames.includes('Birichina') ? 'Birichina' : '';
    if (!sheetName) {
      for (const name of workbook.SheetNames) {
        if (name !== 'Summary') {
          sheetName = name;
          break;
        }
      }
    }
    if (!sheetName) sheetName = workbook.SheetNames[0];

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found in uploaded file.`);
    }

    const allRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    if (allRows.length < 2) {
      throw new Error('Excel file has no data rows.');
    }

    const headerRow = allRows[0];
    const dataRows = allRows.slice(1);

    // ===== 1. PARSE DATE COLUMNS =====
    const dateColumns: { colIndex: number; dateStr: string; date: Date; serial: number }[] = [];
    for (let c = C.DATE_START; c < headerRow.length; c++) {
      const val = headerRow[c];
      if (typeof val === 'number' && val > 40000 && val < 50000) {
        const d = XLSX.SSF.parse_date_code(val);
        const dateStr = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
        dateColumns.push({
          colIndex: c,
          dateStr,
          date: new Date(Date.UTC(d.y, d.m - 1, d.d)),
          serial: val
        });
      }
    }

    if (dateColumns.length === 0) {
      throw new Error('No date columns found in the Excel file (expected serial numbers in columns 35+).');
    }

    const month = dateColumns[0].dateStr.substring(0, 7);

    // ===== 2. SCAN & CLASSIFY ALL ROWS =====
    const orderItemRows: { rowIndex: number; row: any[]; lineName: string; unitCode: string }[] = [];
    const lineSubtotals: Record<string, Record<'PLAN' | 'SAH' | 'MACHINE' | 'EFFI', any[]>> = {};
    let currentLineName: string | null = null;
    let currentUnitCode: string | null = null;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      if (!row || row.every((c: any) => c === null || c === undefined || c === '')) continue;

      const lineVal = safeStr(row[C.LINE]);
      const unitVal = safeStr(row[C.UNIT]);

      if (lineVal && /^[UB]/i.test(lineVal)) {
        currentLineName = lineVal;
      }
      if (unitVal) {
        currentUnitCode = normalizeUnitCode(unitVal, currentLineName || lineVal || '');
      } else if (currentLineName) {
        currentUnitCode = normalizeUnitCode('', currentLineName);
      }

      if (isOrderItemRow(row)) {
        const effectiveLine = currentLineName || lineVal || 'UNASSIGNED';
        const effectiveUnit = currentUnitCode || normalizeUnitCode(unitVal || '', effectiveLine);
        orderItemRows.push({
          rowIndex: i,
          row,
          lineName: effectiveLine,
          unitCode: effectiveUnit
        });
      } else if (isSubtotalRow(row)) {
        const type = getSubtotalType(row);
        const ln = currentLineName || lineVal;
        if (ln && type) {
          if (!lineSubtotals[ln]) {
            lineSubtotals[ln] = {} as any;
          }
          lineSubtotals[ln][type] = row;
        }
      }
    }

    // ===== 3. CREATE UNITS IN DB =====
    const unitMap = new Map<string, string>(); // code -> unit.id
    const uniqueUnitCodes = new Set<string>();

    for (const { unitCode } of orderItemRows) {
      uniqueUnitCodes.add(unitCode);
    }
    // Also add known standard units if not present
    ['U02', 'U03', 'U04', 'B2'].forEach(u => uniqueUnitCodes.add(u));

    for (const code of uniqueUnitCodes) {
      let unit = await prisma.unit.findUnique({ where: { code } });
      const displayName = getUnitDisplayName(code);
      if (!unit) {
        unit = await prisma.unit.create({
          data: {
            id: crypto.randomUUID(),
            code,
            name: displayName
          }
        });
      } else if (unit.name === code) {
        unit = await prisma.unit.update({
          where: { id: unit.id },
          data: { name: displayName }
        });
      }
      unitMap.set(code, unit.id);
    }

    // ===== 4. BATCH CREATION =====
    const batchId = crypto.randomUUID();
    await prisma.importBatch.create({
      data: {
        id: batchId,
        fileName,
        fileSize: buffer.length,
        month,
        totalRows: dataRows.length,
        status: 'PROCESSING'
      }
    });

    // ===== 5. EXTRACT & UPSERT LINES & BUYERS =====
    const lineDefMap = new Map<string, any>();
    const buyerDefMap = new Map<string, any>();

    for (const { row, lineName, unitCode } of orderItemRows) {
      const ln = lineName;
      if (!ln) continue;

      const buyerRaw = safeStr(row[C.BUYER]);
      const manpowerRaw = row[C.MANPOWER];

      if (!lineDefMap.has(ln)) {
        const uCode = unitCode || normalizeUnitCode('', ln);
        const uId = unitMap.get(uCode) || unitMap.get('U02') || Array.from(unitMap.values())[0];
        
        // Build summary JSON for this line if available
        let lineSummaryData: any = null;
        if (lineSubtotals[ln]) {
          lineSummaryData = {};
          const types: ('PLAN' | 'SAH' | 'MACHINE' | 'EFFI')[] = ['PLAN', 'SAH', 'MACHINE', 'EFFI'];
          for (const t of types) {
            const r = lineSubtotals[ln][t];
            if (r) {
              const dailyValues: Record<string, number | null> = {};
              for (const dc of dateColumns) {
                const cellVal = r[dc.colIndex];
                if (cellVal !== null && cellVal !== undefined && cellVal !== '' && cellVal !== '-') {
                  const num = Number(cellVal);
                  dailyValues[dc.dateStr] = !isNaN(num) ? (t === 'EFFI' ? Number(num.toFixed(4)) : (t === 'SAH' ? Number(num.toFixed(2)) : Math.round(num))) : null;
                } else {
                  dailyValues[dc.dateStr] = null;
                }
              }
              lineSummaryData[t] = {
                total: r[C.PLAN_QTY] !== null ? (t === 'EFFI' ? safeFloat(r[C.PLAN_QTY]) : (t === 'SAH' ? safeFloat(r[C.PLAN_QTY]) : safeInt(r[C.PLAN_QTY]))) : null,
                daily: dailyValues
              };
            }
          }
        }

        let calculatedWorkingHours = 10.0;
        const manpowerVal = typeof manpowerRaw === 'number' && manpowerRaw > 0 ? manpowerRaw : 25;

        if (lineSummaryData && lineSummaryData.MACHINE && lineSummaryData.MACHINE.daily) {
          const dailyMachineValues = Object.values(lineSummaryData.MACHINE.daily);
          const firstValidMachineHr = dailyMachineValues.find(v => typeof v === 'number' && v > 0);
          if (firstValidMachineHr !== undefined) {
            calculatedWorkingHours = Number((Number(firstValidMachineHr) / manpowerVal).toFixed(2));
          }
        }

        lineDefMap.set(ln, {
          id: crypto.randomUUID(),
          name: ln,
          unitId: uId,
          unitCode: uCode,
          manpower: manpowerVal,
          workingHours: calculatedWorkingHours,
          status: 'ACTIVE',
          summaryJson: lineSummaryData ? JSON.stringify(lineSummaryData) : null
        });
      }

      if (buyerRaw && !buyerDefMap.has(buyerRaw)) {
        buyerDefMap.set(buyerRaw, { id: crypto.randomUUID(), name: buyerRaw });
      }
    }

    // Upsert Lines
    for (const line of lineDefMap.values()) {
      const existing = await prisma.productionLine.findUnique({ where: { name: line.name } });
      if (existing) {
        line.id = existing.id;
        await prisma.productionLine.update({
          where: { id: existing.id },
          data: {
            unitId: line.unitId,
            unitCode: line.unitCode,
            manpower: line.manpower,
            workingHours: line.workingHours,
            summaryJson: line.summaryJson
          }
        });
      } else {
        await prisma.productionLine.create({ data: line });
      }
    }

    // Upsert Buyers
    for (const buyer of buyerDefMap.values()) {
      const existing = await prisma.buyer.findUnique({ where: { name: buyer.name } });
      if (existing) {
        buyer.id = existing.id;
      } else {
        await prisma.buyer.create({ data: buyer });
      }
    }

    // ===== 6. EXTRACT ORDERS & ATTACH DAILY PLAN MAPS =====
    const ordersToInsert: any[] = [];
    const dailyRecordsToInsert: any[] = [];
    let totalPlanQty = 0;
    let totalOdrQty = 0;
    let totalSahSum = 0;

    for (const { row, lineName, unitCode } of orderItemRows) {
      const ln = lineName;
      const buyerRaw = safeStr(row[C.BUYER]);
      if (!ln || !buyerRaw) continue;

      const lineObj = lineDefMap.get(ln);
      const buyerObj = buyerDefMap.get(buyerRaw);
      if (!lineObj || !buyerObj) continue;

      const orderCode = safeStr(row[C.ORDER_CODE]) || `ORD-${ln}-${Date.now()}`;
      const odrQty = safeInt(row[C.ODR_QTY], 0);
      const planQty = safeInt(row[C.PLAN_QTY], 0);
      const smv = safeFloat(row[C.SMV], 2.5);
      const workingDays = safeInt(row[C.WORK_DAYS], 0);

      totalPlanQty += planQty;
      totalOdrQty += odrQty;

      // Extract daily plan values for this specific order
      const dailyPlanMap: Record<string, number> = {};
      let orderDailyTotal = 0;

      for (const dc of dateColumns) {
        const cellVal = row[dc.colIndex];
        if (cellVal !== null && cellVal !== undefined && cellVal !== '' && cellVal !== '-') {
          const valNum = Number(cellVal);
          if (!isNaN(valNum) && valNum > 0) {
            const intVal = Math.round(valNum);
            dailyPlanMap[dc.dateStr] = intVal;
            orderDailyTotal += intVal;
          }
        }
      }

      const orderId = crypto.randomUUID();

      ordersToInsert.push({
        id: orderId,
        orderCode,
        ocs: safeStr(row[C.OCS]),
        subOc: safeStr(row[C.SUB_OC]),
        buyerId: buyerObj.id,
        buyerName: buyerRaw,
        unitId: lineObj.unitId,
        unitCode: lineObj.unitCode,
        lineId: lineObj.id,
        lineName: ln,
        styleRef: safeStr(row[C.STYLE_REF]) || 'N/A',
        article: safeStr(row[C.ARTICLE]),
        season: safeStr(row[C.SEASON]) || 'N/A',
        poNo: safeStr(row[C.PO_NO]),
        color: safeStr(row[C.COLOR]),
        orderQty: odrQty,
        planQty: planQty > 0 ? planQty : orderDailyTotal,
        smv,
        mainCategory: safeStr(row[C.MAIN_CAT]) || null,
        subCategory: safeStr(row[C.SUB_CAT]) || null,
        productType: safeStr(row[C.TYPE]) || null,
        orderStatus: safeStr(row[C.ORDER_STATUS]) || 'Confirmed',
        ott: parseExcelDate(row[C.OTT]),
        revisedOtt: parseExcelDate(row[C.REV_OTT]),
        pcd: parseExcelDate(row[C.PCD]),
        psd: parseExcelDate(row[C.PSD]),
        pfd: parseExcelDate(row[C.PFD]),
        exFactory: parseExcelDate(row[C.EX_FAC]),
        revisedDelivery: parseExcelDate(row[C.REV_DEL]),
        orderCreatedDate: parseExcelDate(row[C.O_CREATED]),
        fobPrice: safeFloat(row[C.FOB], 0),
        salesValue: safeFloat(row[C.SALES_VAL], 0),
        leadMerchant: safeStr(row[C.LEAD_MM]),
        orderDept: safeStr(row[C.ORDER_DEPT]),
        workingDays,
        dailyPlanJson: Object.keys(dailyPlanMap).length > 0 ? JSON.stringify(dailyPlanMap) : null,
        importBatchId: batchId
      });

      // Also create order-level ProductionDaily records for relational querying
      for (const [dateStr, targetQty] of Object.entries(dailyPlanMap)) {
        const dc = dateColumns.find(d => d.dateStr === dateStr);
        if (dc && targetQty > 0) {
          const targetSah = Number(((targetQty * smv) / 60).toFixed(2));
          totalSahSum += targetSah;

          dailyRecordsToInsert.push({
            id: crypto.randomUUID(),
            date: dc.date,
            dateString: dc.dateStr,
            month,
            orderId: orderId,
            lineId: lineObj.id,
            unitId: lineObj.unitId,
            buyerId: buyerObj.id,
            targetQty,
            actualQty: 0,
            gap: targetQty,
            smv,
            targetSah,
            actualSah: 0,
            clockHours: Number(((lineObj.manpower || 25) * 10).toFixed(2)),
            efficiency: 0,
            plannedEfficiency: 0,
            achievementRate: 0,
            manpower: lineObj.manpower || 25,
            importBatchId: batchId
          });
        }
      }
    }

    // ===== 7. CREATE LINE-LEVEL DAILY SUMMARY RECORDS =====
    for (const [ln, subtotals] of Object.entries(lineSubtotals)) {
      const lineObj = lineDefMap.get(ln);
      if (!lineObj) continue;

      const planRow = subtotals.PLAN;
      const sahRow = subtotals.SAH;
      const machineRow = subtotals.MACHINE;
      const effRow = subtotals.EFFI;

      if (!planRow) continue;

      for (const dc of dateColumns) {
        const planCell = planRow[dc.colIndex];
        const targetQty = (planCell !== null && planCell !== undefined && planCell !== '' && planCell !== '-') ? safeInt(planCell) : 0;
        
        const sahCell = sahRow ? sahRow[dc.colIndex] : null;
        const targetSah = (sahCell !== null && sahCell !== undefined && sahCell !== '' && sahCell !== '-') ? safeFloat(sahCell) : 0;

        const machineCell = machineRow ? machineRow[dc.colIndex] : null;
        const clockHours = (machineCell !== null && machineCell !== undefined && machineCell !== '' && machineCell !== '-') ? safeFloat(machineCell) : 0;

        const effCell = effRow ? effRow[dc.colIndex] : null;
        const efficiencyRaw = (effCell !== null && effCell !== undefined && effCell !== '' && effCell !== '-') ? safeFloat(effCell) : 0;
        const plannedEfficiency = efficiencyRaw > 0 ? (efficiencyRaw <= 1.0 ? Number((efficiencyRaw * 100).toFixed(2)) : Number(efficiencyRaw.toFixed(2))) : 0;

        if (targetQty > 0 || targetSah > 0 || clockHours > 0) {
          dailyRecordsToInsert.push({
            id: crypto.randomUUID(),
            date: dc.date,
            dateString: dc.dateStr,
            month,
            orderId: null, // Indicates Line-level Daily Summary
            lineId: lineObj.id,
            unitId: lineObj.unitId,
            buyerId: null,
            targetQty,
            actualQty: 0,
            gap: targetQty,
            smv: 0,
            targetSah,
            actualSah: 0,
            clockHours,
            efficiency: 0,
            plannedEfficiency,
            achievementRate: 0,
            manpower: lineObj.manpower || 25,
            importBatchId: batchId
          });
        }
      }
    }

    // ===== 8. BULK INSERT INTO DATABASE =====
    const chunkSize = 500;
    for (let i = 0; i < ordersToInsert.length; i += chunkSize) {
      await prisma.order.createMany({ data: ordersToInsert.slice(i, i + chunkSize) });
    }

    for (let i = 0; i < dailyRecordsToInsert.length; i += chunkSize) {
      await prisma.productionDaily.createMany({ data: dailyRecordsToInsert.slice(i, i + chunkSize) });
    }

    // ===== 9. UPDATE UNIT STATS =====
    for (const [code, unitId] of unitMap.entries()) {
      const linesCount = await prisma.productionLine.count({ where: { unitId } });
      const lineAgg = await prisma.productionLine.aggregate({
        where: { unitId },
        _sum: { manpower: true }
      });
      await prisma.unit.update({
        where: { id: unitId },
        data: {
          totalLines: linesCount,
          totalManpower: lineAgg._sum.manpower || 0
        }
      });
    }

    // ===== 10. VERIFICATION METRICS =====
    const [dbOrdersCount, dbDailyCount, dbLineSummaryDaily, dbDates] = await Promise.all([
      prisma.order.count({ where: { importBatchId: batchId } }),
      prisma.productionDaily.count({ where: { importBatchId: batchId } }),
      prisma.productionDaily.count({ where: { importBatchId: batchId, orderId: null } }),
      prisma.productionDaily.findMany({
        where: { importBatchId: batchId },
        distinct: ['dateString'],
        select: { dateString: true }
      })
    ]);

    const verification = {
      passed: dbOrdersCount === ordersToInsert.length,
      totalOrders: dbOrdersCount,
      totalDailyRecords: dbDailyCount,
      lineSummaryRecords: dbLineSummaryDaily,
      totalPlanQty,
      totalOdrQty,
      totalSah: totalSahSum,
      linesCount: lineDefMap.size,
      buyersCount: buyerDefMap.size,
      datesCount: dbDates.length,
      month,
      importedAt: new Date().toISOString()
    };

    await prisma.importBatch.update({
      where: { id: batchId },
      data: {
        importedRows: dbOrdersCount,
        status: 'SUCCESS',
        summary: JSON.stringify(verification)
      }
    });

    return {
      success: true,
      batchId,
      totalRows: dataRows.length,
      importedRows: dbOrdersCount,
      skippedRows: dataRows.length - orderItemRows.length,
      linesCount: lineDefMap.size,
      buyersCount: buyerDefMap.size,
      dailyCount: dbDailyCount,
      totalPlanQty,
      totalOdrQty,
      totalSah: totalSahSum,
      errors,
      message: `Successfully imported ${dbOrdersCount.toLocaleString()} orders and ${dbDailyCount.toLocaleString()} daily records across ${lineDefMap.size} lines (${totalPlanQty.toLocaleString()} Plan PCS).`,
      verification
    };
  } catch (err: any) {
    errors.push(err.message || 'Unknown import error');
    return {
      success: false,
      totalRows: 0,
      importedRows: 0,
      skippedRows: 0,
      linesCount: 0,
      buyersCount: 0,
      dailyCount: 0,
      totalPlanQty: 0,
      totalOdrQty: 0,
      totalSah: 0,
      errors,
      message: err.message || 'Failed to import Excel file'
    };
  }
}

export function exportDataToExcel(records: any[], title: string = 'Production_Report'): Buffer {
  const worksheet = XLSX.utils.json_to_sheet(records);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
