import * as XLSX from 'xlsx';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { normalizeUnitCode, CANONICAL_UNITS} from '@/lib/excel-importer';

export interface ActualImportResult {
  success: boolean;
  batchId?: string;
  planBatchId?: string;
  planName?: string;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  linesCount: number;
  datesCount: number;
  totalActualPcs: number;
  totalActualSah: number;
  totalClockHours: number;
  overallEfficiency: number;
  errors: string[];
  message: string;
  verification?: any;
}

export function parseActualDate(val: any): { date: Date; dateStr: string; month: string } | null {
  if (val === null || val === undefined || val === '' || val === '-') return null;
  
  if (typeof val === 'number' && val > 30000 && val < 60000) {
    const d = XLSX.SSF.parse_date_code(val);
    const dateStr = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
    const month = `${d.y}-${String(d.m).padStart(2, '0')}`;
    const date = new Date(Date.UTC(d.y, d.m - 1, d.d));
    return { date, dateStr, month };
  }
  
  if (val instanceof Date) {
    const dateStr = val.toISOString().slice(0, 10);
    const month = dateStr.substring(0, 7);
    return { date: val, dateStr, month };
  }
  
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const date = new Date(s + 'T00:00:00Z');
    const month = s.substring(0, 7);
    return { date, dateStr: s, month };
  }
  
  // DD/MM/YYYY or MM/DD/YYYY fallback
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    const dateStr = parsed.toISOString().slice(0, 10);
    const month = dateStr.substring(0, 7);
    return { date: parsed, dateStr, month };
  }
  
  return null;
}

export function normalizeLineAlias(lineName: string, unitCode?: string): string[] {
  const ln = (lineName || '').trim().toUpperCase();
  const aliases = new Set<string>([ln]);
  if (!ln) return Array.from(aliases);

  // Match pattern like B1U2-01 or B2U02-01 or B1U3-05
  const clusterMatch = ln.match(/^(B[12]|U)?U?0?(\d+)[-_](\d+)$/);
  if (clusterMatch) {
    const unitNum = parseInt(clusterMatch[2], 10);
    const lineNum = parseInt(clusterMatch[3], 10);
    const u2Digits = String(unitNum).padStart(2, '0');
    const l2Digits = String(lineNum).padStart(2, '0');

    aliases.add(`U${u2Digits}-${l2Digits}`);
    aliases.add(`U${unitNum}-${l2Digits}`);
    aliases.add(`B1U${unitNum}-${l2Digits}`);
    aliases.add(`B2U${unitNum}-${l2Digits}`);
    aliases.add(`B1U${u2Digits}-${l2Digits}`);
    aliases.add(`B2U${u2Digits}-${l2Digits}`);
  }

  // Also check direct prefix replacements
  if (ln.startsWith('B1U2-') || ln.startsWith('B2U2-')) {
    aliases.add(ln.replace(/^B[12]U2-/, 'U02-'));
    aliases.add(ln.replace(/^B[12]U2-/, 'B1U2-'));
    aliases.add(ln.replace(/^B[12]U2-/, 'B2U2-'));
  } else if (ln.startsWith('U02-')) {
    aliases.add(ln.replace('U02-', 'B1U2-'));
    aliases.add(ln.replace('U02-', 'B2U2-'));
  }

  if (ln.startsWith('B1U3-') || ln.startsWith('B2U3-')) {
    aliases.add(ln.replace(/^B[12]U3-/, 'U03-'));
    aliases.add(ln.replace(/^B[12]U3-/, 'B1U3-'));
    aliases.add(ln.replace(/^B[12]U3-/, 'B2U3-'));
  } else if (ln.startsWith('U03-')) {
    aliases.add(ln.replace('U03-', 'B1U3-'));
    aliases.add(ln.replace('U03-', 'B2U3-'));
  }

  if (ln.startsWith('B1U4-') || ln.startsWith('B2U4-')) {
    aliases.add(ln.replace(/^B[12]U4-/, 'U04-'));
    aliases.add(ln.replace(/^B[12]U4-/, 'B1U4-'));
    aliases.add(ln.replace(/^B[12]U4-/, 'B2U4-'));
  } else if (ln.startsWith('U04-')) {
    aliases.add(ln.replace('U04-', 'B1U4-'));
    aliases.add(ln.replace('U04-', 'B2U4-'));
  }

  // Handle Bonding lines
  if (ln.includes('BONDING-')) {
    aliases.add(ln.replace('BONDING-', 'B-'));
    aliases.add(ln.replace('B1U4-BONDING-', 'U04-B-'));
  } else if (ln.includes('-B-')) {
    aliases.add(ln.replace('-B-', '-BONDING-'));
  }
  
  if (ln.startsWith('B1U4-BONDING-')) {
    aliases.add(ln.replace('B1U4-BONDING-', 'U04-B-'));
  }

  return Array.from(aliases);
}

export function isStyrax(
  cluster?: string | null,
  unitCode?: string | null,
  lineName?: string | null,
  rawUnit?: string | null,
  rawUnitLine?: string | null
): boolean {
  const c = (cluster || '').trim().toUpperCase();
  const u = (unitCode || '').trim().toUpperCase();
  const l = (lineName || '').trim().toUpperCase();
  const ru = (rawUnit || '').trim().toUpperCase();
  const rul = (rawUnitLine || '').trim().toUpperCase();

  // Check cluster
  if (c === 'STYRAX' || c.includes('STYRAX') || c === 'S1' || c === 'S2') return true;

  // Check unit code & raw unit (S1, S2, S1U1, S1U2, S1U3, S1U4, STYRAX, etc.)
  if (u === 'STYRAX' || u.includes('STYRAX') || u.startsWith('S1') || u.startsWith('S2') || u.startsWith('S')) return true;
  if (ru.includes('STYRAX') || ru.startsWith('S1') || ru.startsWith('S2') || ru.startsWith('S')) return true;

  // Check line name & raw unit-line (S1U1-1, S1U2-1, S1U3-1, S1U4-1, etc.)
  if (l.startsWith('S1') || l.startsWith('S2') || l.startsWith('S1U') || l.startsWith('S-') || l.includes('STYRAX') || l.startsWith('S')) return true;
  if (rul.startsWith('S1') || rul.startsWith('S2') || rul.startsWith('S1U') || rul.startsWith('S-') || rul.includes('STYRAX') || rul.startsWith('S')) return true;

  return false;
}

export function detectCluster(clusterRaw: string | null, unitCode: string, lineName: string): string {
  if (clusterRaw && clusterRaw.trim()) {
    const c = clusterRaw.trim().toUpperCase();
    if (c.includes('STYRAX') || c === 'S1') return 'Styrax';
    if (c === 'B2') return 'B2';
    if (c === 'B1') return 'B1';
    return clusterRaw.trim();
  }
  
  const u = (unitCode || '').toUpperCase();
  const l = (lineName || '').toUpperCase();
  if (u.startsWith('S') || l.startsWith('S') || u.includes('STYRAX')) return 'Styrax';
  if (u.startsWith('B2') || l.startsWith('B2')) return 'B2';
  return 'B1';
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

function getField(obj: any, ...keys: string[]): any {
  if (!obj) return null;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
  }
  const cleanKeys: Record<string, any> = {};
  for (const k of Object.keys(obj)) {
    cleanKeys[k.toLowerCase().replace(/[^a-z0-9]/g, '')] = obj[k];
  }
  for (const k of keys) {
    const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanKeys[cleanK] !== undefined && cleanKeys[cleanK] !== null && cleanKeys[cleanK] !== '') {
      return cleanKeys[cleanK];
    }
  }
  return null;
}

export async function parseAndImportActualExcel(
  buffer: Buffer,
  fileName: string,
  selectedPlanBatchId?: string
): Promise<ActualImportResult> {
  const errors: string[] = [];

  try {
    // 1. Resolve Plan Batch ID
    let planBatchId = selectedPlanBatchId;
    let planBatch = null;

    if (planBatchId && planBatchId !== 'ALL' && planBatchId !== 'AUTO') {
      planBatch = await prisma.importBatch.findUnique({ where: { id: planBatchId } });
    }

    if (!planBatch) {
      // Find the most recent PLAN batch
      planBatch = await prisma.importBatch.findFirst({
        where: { batchType: 'PLAN' },
        orderBy: { createdAt: 'desc' }
      });
      if (planBatch) {
        planBatchId = planBatch.id;
      }
    }

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Find the sheet containing actual floor records
    let targetSheetName = workbook.SheetNames.find(n => /actual|floor|tracker|daily/i.test(n)) || workbook.SheetNames[0];
    let sheet = workbook.Sheets[targetSheetName];

    // If default sheet doesn't look like actual records, scan all sheets
    if (sheet) {
      const testRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
      const hasHeaders = testRows.slice(0, 10).some(r => 
        r && r.some((c: any) => /unit-line|pcs|eff%|mc sah/i.test(String(c || '')))
      );
      if (!hasHeaders) {
        for (const sName of workbook.SheetNames) {
          const s = workbook.Sheets[sName];
          const rws: any[][] = XLSX.utils.sheet_to_json(s, { header: 1, defval: null });
          if (rws.slice(0, 10).some(r => r && r.some((c: any) => /unit-line|pcs|eff%|mc sah/i.test(String(c || ''))))) {
            targetSheetName = sName;
            sheet = s;
            break;
          }
        }
      }
    }

    if (!sheet) {
      throw new Error(`Sheet "${targetSheetName}" not found in uploaded file.`);
    }

    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    if (!rawRows || rawRows.length === 0) {
      throw new Error('No data found in uploaded Excel file.');
    }

    // Find the header row
    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(10, rawRows.length); i++) {
      const row = rawRows[i];
      if (row && row.some((c: any) => /unit-line|mc sah|clock hrs|buyer|style/i.test(String(c || '')))) {
        headerRowIdx = i;
        break;
      }
    }

    const rawHeaders = (rawRows[headerRowIdx] || []).map((h: any) => String(h || '').trim());
    const rows: any[] = [];
    for (let i = headerRowIdx + 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || row.length === 0) continue;
      const obj: any = {};
      let hasVal = false;
      rawHeaders.forEach((h, colIdx) => {
        if (h) {
          const val = row[colIdx];
          obj[h] = val;
          if (val !== null && val !== undefined && val !== '') hasVal = true;
        }
      });
      if (hasVal) {
        // Exclude Styrax cluster & units (S1U1, S1U2, S1U3, S1U4, Styrax) at row collection level
        const rawUnitLine = safeStr(getField(obj, 'Unit-Line', 'Unit_Line', 'Unit Line', 'Line', 'line', 'Line Name'));
        const lineName = (rawUnitLine || '').toUpperCase();
        const rawUnit = safeStr(getField(obj, 'Unit', 'unit', 'Unit Code'));
        const unitCode = normalizeUnitCode(rawUnit || '', lineName);
        const cluster = detectCluster(safeStr(getField(obj, 'Cluster', 'cluster')), unitCode, lineName);

        if (!isStyrax(cluster, unitCode, lineName, rawUnit, rawUnitLine)) {
          rows.push(obj);
        }
      }
    }

    if (rows.length === 0) {
      throw new Error('No valid actual data rows found in sheet.');
    }

    // ===== 2. DATE & MONTH VALIDATION AGAINST PARENT PRODUCTION PLAN =====
    const childDatesSet = new Set<string>();
    const childMonthsSet = new Set<string>();

    for (const r of rows) {
      const rawDate = getField(r, 'Date', 'date', 'DATE');
      const dateInfo = parseActualDate(rawDate);
      if (dateInfo) {
        childDatesSet.add(dateInfo.dateStr);
        childMonthsSet.add(dateInfo.month);
      }
    }

    if (childMonthsSet.size === 0) {
      throw new Error('No valid production date columns or date values found in the uploaded actual file.');
    }

    const childMonthsArray = Array.from(childMonthsSet);
    const primaryChildMonth = childMonthsArray[0];

    // If no specific plan was selected or AUTO was passed, search for matching plan by month
    if (!planBatch && primaryChildMonth) {
      planBatch = await prisma.importBatch.findFirst({
        where: { batchType: 'PLAN', month: primaryChildMonth },
        orderBy: { createdAt: 'desc' }
      });
      if (planBatch) {
        planBatchId = planBatch.id;
      }
    }

    if (!planBatch) {
      const allPlans = await prisma.importBatch.findMany({
        where: { batchType: 'PLAN' },
        select: { month: true, fileName: true }
      });
      const availablePlansDesc = allPlans.map((p: any) => `"${p.fileName}" (Month: ${p.month})`).join(', ');

      const errorMsg = `No Parent Production Plan found for month "${childMonthsArray.join(', ')}". (Existing Plans in system: ${availablePlansDesc || 'None'}). You must upload a parent Production Plan for ${childMonthsArray.join(', ')} before importing actual floor data.`;
      
      return {
        success: false,
        totalRows: rows.length,
        importedRows: 0,
        skippedRows: rows.length,
        linesCount: 0,
        datesCount: 0,
        totalActualPcs: 0,
        totalActualSah: 0,
        totalClockHours: 0,
        overallEfficiency: 0,
        errors: [errorMsg],
        message: errorMsg
      };
    }

    // STRICT VALIDATION: Check if uploaded child dates match the parent plan's month/dates
    const parentPlanMonth = planBatch.month; // e.g. "2026-10"
    const mismatchedDates = Array.from(childDatesSet).filter(d => !d.startsWith(parentPlanMonth));

    if (mismatchedDates.length > 0) {
      const sampleMismatches = mismatchedDates.slice(0, 5).join(', ');
      const errorMsg = `Date Mismatch Error: The uploaded actual production file contains dates for month "${childMonthsArray.join(', ')}" (e.g. ${sampleMismatches}), which does NOT match the parent production plan "${planBatch.fileName}" (Plan Month: ${parentPlanMonth}). Actual production data was NOT extracted.`;


      return {
        success: false,
        totalRows: rows.length,
        importedRows: 0,
        skippedRows: rows.length,
        linesCount: 0,
        datesCount: 0,
        totalActualPcs: 0,
        totalActualSah: 0,
        totalClockHours: 0,
        overallEfficiency: 0,
        errors: [errorMsg],
        message: errorMsg
      };
    }

    // 3. Pre-fetch all Units, Lines, and Orders for fast in-memory matching
    const [allUnits, allLines, planOrders] = await Promise.all([
      prisma.unit.findMany(),
      prisma.productionLine.findMany(),
      planBatchId
        ? prisma.order.findMany({
            where: { importBatchId: planBatchId },
            include: { buyer: true }
          })
        : []
    ]);

    const unitByCode = new Map(allUnits.map(u => [u.code.toUpperCase(), u]));
    const lineByName = new Map(allLines.map(l => [l.name.toUpperCase(), l]));
    const lineByUnitAndName = new Map(allLines.map(l => [`${l.unitCode.toUpperCase()}::${l.name.toUpperCase()}`, l]));

    // Fast O(1) Plan Order Lookups
    const planOrderByOc = new Map<string, any>();
    const planOrderByStyleLine = new Map<string, any>();
    for (const po of planOrders) {
      if (po.ocs) planOrderByOc.set(po.ocs.toUpperCase(), po);
      if (po.orderCode) planOrderByOc.set(po.orderCode.toUpperCase(), po);
      if (po.styleRef && po.lineId) {
        planOrderByStyleLine.set(`${po.styleRef.toLowerCase()}::${po.lineId}`, po);
      }
    }

    // Batch creation
    const batchId = crypto.randomUUID();
    const defaultMonth = planBatch?.month || '2026-10';

    await prisma.importBatch.create({
      data: {
        id: batchId,
        batchType: 'ACTUAL',
        planBatchId: planBatchId || null,
        fileName,
        fileSize: buffer.length,
        month: defaultMonth,
        totalRows: rows.length,
        status: 'PROCESSING'
      }
    });

    const actualRecordsToInsert: any[] = [];
    const uniqueUnitsSet = new Set<string>();
    const uniqueLinesSet = new Set<string>();
    const uniqueDatesSet = new Set<string>();

    let totalActualPcs = 0;
    let totalActualSah = 0;
    let totalClockHours = 0;

    // Track line-level and date-level aggregates to update ProductionDaily
    // Map key: `${unitCode}::${lineName}::${dateStr}`
    const dailyLineAggMap = new Map<
      string,
      {
        unitCode: string;
        lineName: string;
        dateStr: string;
        date: Date;
        month: string;
        cluster: string;
        actualPcs: number;
        actualSah: number;
        clockHours: number;
        manpowerSum: number;
        manpowerCount: number;
        fobSum: number;
        vaSum: number;
      }
    >();

    // Track order-level actual pcs
    const orderActualPcsMap = new Map<string, number>();

    // 3. Process every row in the actual Excel file
    for (const r of rows) {
      const rawDate = getField(r, 'Date', 'date', 'DATE');
      const dateInfo = parseActualDate(rawDate);
      if (!dateInfo) continue;

      const rawUnitLine = safeStr(getField(r, 'Unit-Line', 'Unit_Line', 'Unit Line', 'Line', 'line', 'Line Name'));
      if (!rawUnitLine) continue;

      const lineName = rawUnitLine.toUpperCase();
      const rawUnit = safeStr(getField(r, 'Unit', 'unit', 'Unit Code'));
      const unitCode = normalizeUnitCode(rawUnit || '', lineName);
      const cluster = detectCluster(safeStr(getField(r, 'Cluster', 'cluster')), unitCode, lineName);

      // Exclude Styrax cluster & units (S1U1, S1U2, S1U3, S1U4, S1, Styrax, etc.) from actual production import
      if (isStyrax(cluster, unitCode, lineName, rawUnit, rawUnitLine)) {
        continue;
      }

      const actualPcs = safeInt(getField(r, 'Pcs', 'pcs', 'Actual', 'actual_qty', 'Actual Pcs', 'PROD. PCS'), 0);
      const manpower = safeFloat(getField(r, 'MO', 'mo', 'Manpower', 'manpower'), 0);
      const clockHours = safeFloat(getField(r, 'Clock Hrs', 'Clock_Hrs', 'clock_hrs', 'ClockHours', 'Clock Hours'), 0);
      const actualSah = safeFloat(getField(r, 'MC SAH', 'MC_SAH', 'mc_sah', 'Sah', 'sah', 'Actual SAH'), 0);
      const smv = safeFloat(getField(r, 'MC SMV', 'MC_SMV', 'mc_smv', 'SMV', 'smv'), 0);
      
      let effPercent = safeFloat(getField(r, 'Eff%', 'Eff_Percent', 'eff_percent', 'Efficiency', 'eff%'), 0);
      if (effPercent > 0 && effPercent <= 1.0) {
        effPercent = Number((effPercent * 100).toFixed(2));
      } else if (effPercent > 0) {
        effPercent = Number(effPercent.toFixed(2));
      }

      const fobPcs = safeFloat(getField(r, 'FOB Pcs', 'FOB_Pcs', 'fob_pcs'), 0);
      const vaPcs = safeFloat(getField(r, 'VA Pcs', 'VA_Pcs', 'va_pcs'), 0);
      const ttlFob = safeFloat(getField(r, 'TTL FOB', 'TTL_FOB', 'ttl_fob'), 0);
      const ttlVa = safeFloat(getField(r, 'TTL VA', 'TTL_VA', 'ttl_va'), 0);
      const buyerName = safeStr(getField(r, 'Buyer', 'buyer', 'Buyer Name'));
      const style = safeStr(getField(r, 'Style', 'style', 'Style Ref', 'Style '));
      const oc = safeStr(getField(r, 'OC', 'oc', 'Main OC'));
      const type = safeStr(getField(r, 'Type', 'type', 'P.Type', 'P type'));
      const productType = safeStr(getField(r, 'P.Type', 'Product_Type', 'product_type', 'ProductType'));
      const remarks = safeStr(getField(r, 'Remarks', 'remarks'));
      const code = safeStr(getField(r, 'Code', 'code')) || `${dateInfo.dateStr}-${lineName}`;

      uniqueUnitsSet.add(unitCode);
      uniqueLinesSet.add(lineName);
      uniqueDatesSet.add(dateInfo.dateStr);

      totalActualPcs += actualPcs;
      totalActualSah += actualSah;
      totalClockHours += clockHours;

      // Ensure Unit exists in DB
      let unit = unitByCode.get(unitCode);
      if (!unit) {
        const uDisplayName = CANONICAL_UNITS[unitCode] || `Unit ${unitCode}`;
        unit = await prisma.unit.upsert({
          where: { code: unitCode },
          create: {
            code: unitCode,
            name: uDisplayName,
            cluster: cluster || 'B1'
          },
          update: {}
        });
        unitByCode.set(unitCode, unit);
      }

      // Ensure Line exists in DB
      let line = lineByUnitAndName.get(`${unitCode}::${lineName}`);
      if (!line && lineByName.has(lineName)) {
        const match = lineByName.get(lineName);
        if (match && (match.unitCode === unitCode || (unitCode.startsWith('U') && match.unitCode.startsWith('U')))) {
          line = match;
        }
      }
      if (!line) {
        const aliases = normalizeLineAlias(lineName, unitCode);
        for (const al of aliases) {
          line = lineByUnitAndName.get(`${unitCode}::${al}`);
          if (line) break;
          const match = lineByName.get(al);
          if (match && (match.unitCode === unitCode || (unitCode.startsWith('U') && match.unitCode.startsWith('U')))) {
            line = match;
            break;
          }
        }
      }

      if (!line) {
        line = await prisma.productionLine.create({
          data: {
            id: crypto.randomUUID(),
            name: lineName,
            unitId: unit.id,
            unitCode: unit.code,
            cluster,
            manpower: Math.round(manpower) || 25,
            workingHours: clockHours > 0 && manpower > 0 ? Number((clockHours / manpower).toFixed(1)) : 10.0
          }
        });
        lineByName.set(lineName, line);
        lineByUnitAndName.set(`${unitCode}::${lineName}`, line);
      }

      // Fast O(1) Match against Plan Orders (by OC or style+line)
      let matchedOrderId: string | null = null;
      if (oc) {
        const match = planOrderByOc.get(oc.toUpperCase());
        if (match) matchedOrderId = match.id;
      }
      if (!matchedOrderId && style && line?.id) {
        const match = planOrderByStyleLine.get(`${style.toLowerCase()}::${line.id}`);
        if (match) matchedOrderId = match.id;
      }
      if (matchedOrderId) {
        orderActualPcsMap.set(matchedOrderId, (orderActualPcsMap.get(matchedOrderId) || 0) + actualPcs);
      }

      actualRecordsToInsert.push({
        id: crypto.randomUUID(),
        importBatchId: batchId,
        planBatchId: planBatchId || null,
        code,
        date: dateInfo.date,
        dateString: dateInfo.dateStr,
        month: dateInfo.month,
        cluster,
        unitId: unit.id,
        unitCode: unit.code,
        lineId: line.id,
        lineName: line.name,
        buyerName,
        style,
        oc,
        orderId: matchedOrderId,
        type,
        productType,
        fobPcs,
        vaPcs,
        smv,
        actualPcs,
        manpower,
        clockHours,
        actualSah,
        effPercent,
        ttlFob,
        ttlVa,
        remarks
      });

      // Aggregate daily line performance
      const aggKey = `${unit.code}::${line.name}::${dateInfo.dateStr}`;
      const existingAgg = dailyLineAggMap.get(aggKey);
      if (existingAgg) {
        existingAgg.actualPcs += actualPcs;
        existingAgg.actualSah += actualSah;
        existingAgg.clockHours = Math.max(existingAgg.clockHours, clockHours); // Avoid double-counting line clock hrs
        existingAgg.manpowerSum += manpower;
        existingAgg.manpowerCount += 1;
        existingAgg.fobSum += ttlFob;
        existingAgg.vaSum += ttlVa;
      } else {
        dailyLineAggMap.set(aggKey, {
          unitCode: unit.code,
          lineName: line.name,
          dateStr: dateInfo.dateStr,
          date: dateInfo.date,
          month: dateInfo.month,
          cluster,
          actualPcs,
          actualSah,
          clockHours,
          manpowerSum: manpower,
          manpowerCount: 1,
          fobSum: ttlFob,
          vaSum: ttlVa
        });
      }
    }

    // 4. Overwrite/Rewrite previous Actual Production Records for matching dates under this Plan
    if (planBatchId && uniqueDatesSet.size > 0) {
      const datesToOverwrite = Array.from(uniqueDatesSet);
      
      // Delete previous actual records for these dates to prevent duplication / rewrite old actuals
      await prisma.productionActualRecord.deleteMany({
        where: {
          planBatchId: planBatchId,
          dateString: { in: datesToOverwrite }
        }
      });

      // Reset existing ProductionDaily actual values for these dates so fresh values apply cleanly
      await prisma.productionDaily.updateMany({
        where: {
          importBatchId: planBatchId,
          dateString: { in: datesToOverwrite },
          orderId: null
        },
        data: {
          actualQty: 0,
          actualSah: 0,
          efficiency: 0,
          achievementRate: 0,
          ttlFob: 0,
          ttlVa: 0
        }
      });
    }

    // Bulk Insert new records into `ProductionActualRecord`
    const chunkSize = 75;
    for (let i = 0; i < actualRecordsToInsert.length; i += chunkSize) {
      await prisma.productionActualRecord.createMany({
        data: actualRecordsToInsert.slice(i, i + chunkSize)
      });
    }

    // 5. Update or Create `ProductionDaily` records for the Plan
    // Refresh all lines for fast in-memory matching
    const refreshedLines = await prisma.productionLine.findMany({
      include: { unit: true }
    });
    const lineByAliasMap = new Map<string, any>();
    for (const l of refreshedLines) {
      lineByAliasMap.set(l.name.toUpperCase(), l);
      lineByAliasMap.set(`${l.unitCode.toUpperCase()}-${l.name.toUpperCase()}`, l);
      lineByAliasMap.set(`${l.unitCode.toUpperCase()}::${l.name.toUpperCase()}`, l);
    }

    // Prefetch existing daily records for the plan
    const existingDailies = await prisma.productionDaily.findMany({
      where: {
        ...(planBatchId ? { importBatchId: planBatchId } : {}),
        orderId: null
      }
    });
    const dailyMap = new Map<string, any>(); // key: `${lineId}_${dateString}`
    for (const ed of existingDailies) {
      dailyMap.set(`${ed.lineId}_${ed.dateString}`, ed);
    }

    const newDailyRecords: any[] = [];
    const dailyUpdateItems: { id: string; data: any }[] = [];

    for (const agg of dailyLineAggMap.values()) {
      // Find matching ProductionLine
      const lineAliases = normalizeLineAlias(agg.lineName, agg.unitCode);
      let line: any = null;
      for (const alias of lineAliases) {
        line = lineByAliasMap.get(alias.toUpperCase());
        if (line) break;
      }
      if (!line) line = lineByName.get(agg.lineName);
      if (!line) continue;

      const calcEff =
        agg.clockHours > 0 && agg.actualSah > 0
          ? Number(((agg.actualSah / agg.clockHours) * 100).toFixed(2))
          : 0;

      // Find existing Line-level ProductionDaily record for this Plan
      const existingDaily = dailyMap.get(`${line.id}_${agg.dateStr}`);

      if (existingDaily) {
        const target = existingDaily.targetQty || 0;
        const gap = target - agg.actualPcs;
        const achRate = target > 0 ? Number(((agg.actualPcs / target) * 100).toFixed(2)) : 100;
        const finalClockHours = agg.clockHours > 0 ? agg.clockHours : existingDaily.clockHours;
        const finalEfficiency =
          finalClockHours && finalClockHours > 0 && agg.actualSah > 0
            ? Number(((agg.actualSah / finalClockHours) * 100).toFixed(2))
            : existingDaily.efficiency || 0;

        dailyUpdateItems.push({
          id: existingDaily.id,
          data: {
            actualQty: agg.actualPcs,
            actualSah: agg.actualSah,
            gap,
            achievementRate: achRate,
            clockHours: finalClockHours,
            efficiency: finalEfficiency,
            cluster: agg.cluster,
            fobPcs: agg.fobSum > 0 ? agg.fobSum : existingDaily.fobPcs,
            vaPcs: agg.vaSum > 0 ? agg.vaSum : existingDaily.vaPcs,
            ttlFob: agg.fobSum,
            ttlVa: agg.vaSum
          }
        });
      } else {
        // Create new ProductionDaily linked to the plan batch
        newDailyRecords.push({
          id: crypto.randomUUID(),
          date: agg.date,
          dateString: agg.dateStr,
          month: agg.month,
          cluster: agg.cluster,
          lineId: line.id,
          unitId: line.unitId,
          orderId: null,
          targetQty: 0,
          actualQty: agg.actualPcs,
          gap: -agg.actualPcs,
          targetSah: 0,
          actualSah: agg.actualSah,
          clockHours: agg.clockHours,
          efficiency: calcEff,
          plannedEfficiency: 0,
          achievementRate: 100,
          manpower: Math.round(agg.manpowerSum / agg.manpowerCount) || 25,
          ttlFob: agg.fobSum,
          ttlVa: agg.vaSum,
          importBatchId: planBatchId || batchId
        });
      }
    }

    // Bulk create new daily records
    if (newDailyRecords.length > 0) {
      for (let i = 0; i < newDailyRecords.length; i += 500) {
        await prisma.productionDaily.createMany({
          data: newDailyRecords.slice(i, i + 500)
        });
      }
    }

    // Execute daily updates with concurrency of 20 for fast parallel execution
    const poolConcurrency = 20;
    for (let i = 0; i < dailyUpdateItems.length; i += poolConcurrency) {
      const chunk = dailyUpdateItems.slice(i, i + poolConcurrency);
      await Promise.all(
        chunk.map(item => prisma.productionDaily.update({ where: { id: item.id }, data: item.data }))
      );
    }

    // 6. Update Orders actualQty with concurrency of 20
    const orderEntries = Array.from(orderActualPcsMap.entries());
    for (let i = 0; i < orderEntries.length; i += poolConcurrency) {
      const chunk = orderEntries.slice(i, i + poolConcurrency);
      await Promise.all(
        chunk.map(([orderId, pcs]) => prisma.order.update({ where: { id: orderId }, data: { actualQty: pcs } }))
      );
    }

    // 7. Calculate overall summary & verification metrics
    const overallEfficiency =
      totalClockHours > 0 ? Number(((totalActualSah / totalClockHours) * 100).toFixed(1)) : 0;

    const verification = {
      passed: true,
      batchId,
      planBatchId,
      planName: planBatch?.fileName || 'Auto-linked Active Plan',
      totalActualRows: actualRecordsToInsert.length,
      uniqueLines: uniqueLinesSet.size,
      uniqueUnits: uniqueUnitsSet.size,
      uniqueDates: uniqueDatesSet.size,
      totalActualPcs,
      totalActualSah: Number(totalActualSah.toFixed(2)),
      totalClockHours: Number(totalClockHours.toFixed(2)),
      overallEfficiency,
      importedAt: new Date().toISOString(),
      checks: [
        { name: 'Floor Actual Data Ingestion', status: 'Passed', actual: `${actualRecordsToInsert.length.toLocaleString()} Records` },
        { name: 'Physical Lines Matched', status: 'Passed', actual: `${uniqueLinesSet.size} Lines` },
        { name: 'Units & Clusters Identified', status: 'Passed', actual: `${uniqueUnitsSet.size} Units (${Array.from(uniqueUnitsSet).join(', ')})` },
        { name: 'Actual Production Output', status: 'Passed', actual: `${totalActualPcs.toLocaleString()} Pcs` },
        { name: 'Floor Average Efficiency', status: 'Passed', actual: `${overallEfficiency}% Eff` }
      ]
    };

    await prisma.importBatch.update({
      where: { id: batchId },
      data: {
        importedRows: actualRecordsToInsert.length,
        status: 'SUCCESS',
        summary: JSON.stringify(verification)
      }
    });

    return {
      success: true,
      batchId,
      planBatchId,
      planName: planBatch?.fileName || 'Active Plan',
      totalRows: rows.length,
      importedRows: actualRecordsToInsert.length,
      skippedRows: rows.length - actualRecordsToInsert.length,
      linesCount: uniqueLinesSet.size,
      datesCount: uniqueDatesSet.size,
      totalActualPcs,
      totalActualSah: Number(totalActualSah.toFixed(2)),
      totalClockHours: Number(totalClockHours.toFixed(2)),
      overallEfficiency,
      errors,
      message: `Successfully imported ${actualRecordsToInsert.length.toLocaleString()} floor records across ${uniqueLinesSet.size} lines (${totalActualPcs.toLocaleString()} Actual PCS, ${overallEfficiency}% Average Eff).`,
      verification
    };
  } catch (err: any) {
    errors.push(err.message || 'Failed to import actual production data');
    return {
      success: false,
      totalRows: 0,
      importedRows: 0,
      skippedRows: 0,
      linesCount: 0,
      datesCount: 0,
      totalActualPcs: 0,
      totalActualSah: 0,
      totalClockHours: 0,
      overallEfficiency: 0,
      errors,
      message: err.message || 'Failed to import actual production Excel'
    };
  }
}
