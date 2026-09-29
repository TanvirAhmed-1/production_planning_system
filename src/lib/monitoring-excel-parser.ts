import * as XLSX from "xlsx";
import crypto from "crypto";

export interface ParsedSheetInfo {
  sheetName: string;
  sheetIndex: number;
  rowCount: number;
  colCount: number;
  headerRowIndex: number;
  headers: string[];
  sampleRows: any[][];
}

export interface WorkbookInspectionResult {
  fileName: string;
  fileSize: number;
  fileHash: string;
  fileFormat: string;
  totalSheets: number;
  sheetNames: string[];
  sheets: ParsedSheetInfo[];
}

export interface ValidationResultRow {
  rowIndex: number;
  sourceRowIndex: number;
  sheetName: string;
  status: "VALID" | "WARNING" | "ERROR" | "PENDING";
  errors: string[];
  warnings: string[];
  raw: any[];
  parsed: Record<string, any>;
  isEdited?: boolean;
}

export interface ColumnMappingDefinition {
  sourceCol: number | string;
  targetField: string;
  required?: boolean;
  transform?: "string" | "number" | "date" | "percent" | "boolean";
  defaultValue?: any;
}

// Convert Excel date serial (e.g. 46266) to standard YYYY-MM-DD string
export function excelSerialToDateString(serial: any): string {
  if (!serial) return "";
  if (typeof serial === "string") {
    const trimmed = serial.trim();
    if (trimmed.match(/^\d{4}-\d{2}-\d{2}$/)) return trimmed;
    const parsed = Date.parse(trimmed);
    if (!isNaN(parsed)) {
      const d = new Date(parsed);
      return d.toISOString().split("T")[0];
    }
  }

  const num = Number(serial);
  if (!isNaN(num) && num > 30000 && num < 60000) {
    const utc_days = Math.floor(num - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    const year = date_info.getUTCFullYear();
    const month = String(date_info.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date_info.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return String(serial);
}

// Convert Excel serial to formatted display e.g. "26-Sep-26"
export function formatExcelDisplayDate(serial: any): string {
  const dateStr = excelSerialToDateString(serial);
  if (!dateStr || !dateStr.includes("-")) return String(serial || "");
  const [y, m, d] = dateStr.split("-");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mIndex = parseInt(m, 10) - 1;
  const shortYear = y.slice(-2);
  return `${parseInt(d, 10)}-${monthNames[mIndex] || m}-${shortYear}`;
}

export function parseSafeNumber(val: any, fallback = 0): number {
  if (val === null || val === undefined || val === "") return fallback;
  if (typeof val === "number") return isNaN(val) ? fallback : val;
  const cleaned = String(val).replace(/[^\d.-]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? fallback : parsed;
}

export function parseSafeInt(val: any, fallback = 0): number {
  return Math.round(parseSafeNumber(val, fallback));
}

// Inspect any workbook buffer
export function inspectWorkbookBuffer(buffer: Buffer, fileName: string): { wb: XLSX.WorkBook; inspection: WorkbookInspectionResult } {
  const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");
  const ext = fileName.split(".").pop()?.toLowerCase() || "xlsx";

  const wb = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const sheets: ParsedSheetInfo[] = [];

  for (let idx = 0; idx < wb.SheetNames.length; idx++) {
    const sheetName = wb.SheetNames[idx];
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    const rawRows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null });
    const rowCount = rawRows.length;
    let colCount = 0;
    let headerRowIndex = 0;
    let headers: string[] = [];

    // Detect header row by scanning first 10 rows for highest non-empty string count
    let maxValidCols = 0;
    for (let r = 0; r < Math.min(10, rawRows.length); r++) {
      const row = rawRows[r] || [];
      const validCols = row.filter((c) => c !== null && c !== undefined && String(c).trim() !== "").length;
      if (validCols > maxValidCols) {
        maxValidCols = validCols;
        headerRowIndex = r;
      }
    }

    if (rawRows[headerRowIndex]) {
      headers = rawRows[headerRowIndex].map((h, i) => (h !== null && h !== undefined && String(h).trim() !== "" ? String(h).trim() : `Column_${i + 1}`));
    }

    for (const r of rawRows) {
      if (r && r.length > colCount) colCount = r.length;
    }

    const sampleRows = rawRows.slice(headerRowIndex + 1, headerRowIndex + 6);

    sheets.push({
      sheetName,
      sheetIndex: idx,
      rowCount,
      colCount,
      headerRowIndex,
      headers,
      sampleRows,
    });
  }

  const inspection: WorkbookInspectionResult = {
    fileName,
    fileSize: buffer.length,
    fileHash,
    fileFormat: ext,
    totalSheets: wb.SheetNames.length,
    sheetNames: wb.SheetNames,
    sheets,
  };

  return { wb, inspection };
}

// =========================================================================
// SHEET-SPECIFIC EXTRACTORS FOR PRODUCTION MONITORING WORKBOOK
// =========================================================================

// 1. ACTUAL SHEET EXTRACTOR (5800+ lines)
export function parseActualSheetData(ws: XLSX.WorkSheet) {
  const rawRows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null });
  const records: any[] = [];
  const validationList: ValidationResultRow[] = [];

  let startRow = 3;
  for (let r = 0; r < rawRows.length; r++) {
    const row = rawRows[r] || [];
    const firstCell = String(row[0] || "").toLowerCase();
    const secondCell = String(row[1] || "").toLowerCase();
    if (firstCell.includes("code") || secondCell.includes("date")) {
      startRow = r + 1;
      break;
    }
  }

  for (let r = startRow; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const rawCode = row[0];
    const rawDate = row[1];
    const rawUnitLine = row[2];
    const rawBuyer = row[3];
    const rawStyle = row[4];
    const rawOc = row[5];
    const rawType = row[6];
    const rawFobPrice = row[7];
    const rawVaPrice = row[8];
    const rawSmv = row[9];
    const rawPcs = row[10];
    const rawMo = row[11];
    const rawClockHrs = row[12];
    const rawSah = row[13];
    const rawEff = row[14];
    const rawTtlFob = row[15];
    const rawTtlVa = row[16];
    const rawUnit = row[18];
    const rawCluster = row[19];
    const rawProductType = row[20];
    const rawRemarks = row[21];

    if (!rawUnitLine && !rawDate && !rawPcs) continue;

    const dateString = excelSerialToDateString(rawDate);
    const month = dateString ? dateString.substring(0, 7) : "2026-09";
    const unitLine = String(rawUnitLine || "").trim();
    const buyer = String(rawBuyer || "").trim();
    const style = String(rawStyle || "").trim();
    const oc = String(rawOc || "").trim();
    const smv = parseSafeNumber(rawSmv, 0);
    const actualQty = parseSafeInt(rawPcs, 0);
    const mo = parseSafeNumber(rawMo, 0);
    const clockHours = parseSafeNumber(rawClockHrs, 0);
    const actualSah = parseSafeNumber(rawSah, 0);
    let efficiency = parseSafeNumber(rawEff, 0);
    if (efficiency > 0 && efficiency <= 1.5) efficiency = efficiency * 100;

    const fobPrice = parseSafeNumber(rawFobPrice, 0);
    const vaPrice = parseSafeNumber(rawVaPrice, 0);
    const fobValue = parseSafeNumber(rawTtlFob, 0);
    const vaValue = parseSafeNumber(rawTtlVa, 0);

    const unitCode = String(rawUnit || (unitLine.includes("-") ? unitLine.split("-")[0] : "B1U2")).trim();
    const cluster = String(rawCluster || (unitCode.startsWith("B1") ? "B1" : unitCode.startsWith("B2") ? "B2" : "Styrax")).trim();

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!unitLine) errors.push("Unit-Line is required");
    if (!dateString) errors.push("Valid Date is required");
    if (actualQty < 0) errors.push("Pcs quantity cannot be negative");
    if (clockHours < 0) errors.push("Clock hours cannot be negative");

    if (!buyer) warnings.push("Buyer name is empty");
    if (!style) warnings.push("Style reference is empty");
    if (smv === 0 && actualQty > 0) warnings.push("SMV is 0 for produced pieces");

    const status = errors.length > 0 ? "ERROR" : warnings.length > 0 ? "WARNING" : "VALID";

    const parsed = {
      code: String(rawCode || `${rawDate}${unitLine}`),
      date: dateString ? new Date(dateString) : new Date(),
      dateString,
      month,
      unitLine,
      unitCode,
      cluster,
      buyer,
      style,
      oc,
      categoryType: String(rawType || "").trim(),
      productType: String(rawProductType || "").trim(),
      fobPrice,
      vaPrice,
      smv,
      actualQty,
      targetQty: 0,
      varianceQty: actualQty,
      mo,
      clockHours,
      actualSah,
      targetSah: 0,
      varianceSah: actualSah,
      efficiency,
      fobValue,
      vaValue,
      remarks: rawRemarks ? String(rawRemarks) : null,
    };

    records.push(parsed);
    validationList.push({
      rowIndex: validationList.length,
      sourceRowIndex: r + 1,
      sheetName: "Actual",
      status,
      errors,
      warnings,
      raw: row,
      parsed,
    });
  }

  return { records, validationList };
}

// 2. SUMMARY SHEET EXTRACTOR
export function parseSummarySheetData(ws: XLSX.WorkSheet) {
  const rawData = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null });
  const company = rawData[1]?.[1] || "SQ Birichina Ltd.";
  const title = rawData[2]?.[1] || "Snap Shot of Unitwise Performance & Efficiency Trend";
  const dateSerial = rawData[3]?.[2];
  const dateStr = formatExcelDisplayDate(dateSerial) || "26-Sep-26";
  const isoDate = excelSerialToDateString(dateSerial) || "2026-09-26";

  const parseTableBlock = (startRow: number, groupName: string) => {
    const planRow = rawData[startRow + 2] || [];
    const revPlanRow = rawData[startRow + 3] || [];
    const actualRow = rawData[startRow + 4] || [];
    const varRow = rawData[startRow + 5] || [];

    const mapMetricRow = (r: any[], label: string) => {
      let dayEff = parseSafeNumber(r[6] || 0);
      let mtdEff = parseSafeNumber(r[13] || 0);
      if (dayEff > 0 && dayEff <= 1.5) dayEff = dayEff * 100;
      if (mtdEff > 0 && mtdEff <= 1.5) mtdEff = mtdEff * 100;

      return {
        label,
        day: {
          mds: parseSafeNumber(r[2] || 0),
          clkHrs: parseSafeNumber(r[3] || 0),
          pcs: parseSafeNumber(r[4] || 0),
          sah: parseSafeNumber(r[5] || 0),
          eff: dayEff,
          epmd: parseSafeNumber(r[7] || 0),
        },
        mtd: {
          mds: parseSafeNumber(r[9] || 0),
          clkHrs: parseSafeNumber(r[10] || 0),
          pcs: parseSafeNumber(r[11] || 0),
          sah: parseSafeNumber(r[12] || 0),
          eff: mtdEff,
          epmd: parseSafeNumber(r[14] || 0),
        },
      };
    };

    return {
      groupName,
      dateStr,
      isoDate,
      rows: [
        mapMetricRow(planRow, "Sign Off - Plan"),
        mapMetricRow(revPlanRow, "Rev. Sign off Plan"),
        mapMetricRow(actualRow, "Actual"),
        mapMetricRow(varRow, "Variance (Actual vs Rev.Sign off)"),
      ],
    };
  };

  const mainBlocks = [
    parseTableBlock(5, "Birichina"),
    parseTableBlock(12, "Styrax"),
    parseTableBlock(19, "Birichina - 1"),
    parseTableBlock(26, "Birichina - 2"),
  ];

  const unitBlocks = {
    birichina01: [
      parseTableBlock(37, "B1U2"),
      parseTableBlock(44, "B1U3"),
      parseTableBlock(51, "B1U4"),
    ],
    birichina02: [
      parseTableBlock(66, "B2U2"),
      parseTableBlock(73, "B2U3"),
    ],
    styrax: [
      parseTableBlock(82, "S1U1"),
      parseTableBlock(89, "S1U2"),
      parseTableBlock(96, "S1U3"),
      parseTableBlock(103, "S1U4"),
    ],
  };

  const trendDays: any[] = [];
  for (let r = 114; r <= 144; r++) {
    const row = rawData[r] || [];
    const daySerial = row[21];
    if (!daySerial) continue;
    const dayLabel = formatExcelDisplayDate(daySerial);
    const dayIso = excelSerialToDateString(daySerial);

    const normEff = (val: any) => {
      if (val === null || val === undefined || val === "" || val === "-") return null;
      let num = parseSafeNumber(val, null as any);
      if (num === null || isNaN(num)) return null;
      if (num > 0 && num <= 1.5) num = num * 100;
      return Math.round(num * 10) / 10;
    };

    trendDays.push({
      dateStr: dayLabel,
      isoDate: dayIso,
      b1u2: normEff(row[22]),
      b1u3: normEff(row[23]),
      b1u4: normEff(row[24]),
      b2u1: normEff(row[25]),
      b2u2: normEff(row[26]),
      b2u3: normEff(row[27]),
      b1: normEff(row[28]),
      b2: normEff(row[29]),
      birichina: normEff(row[30]),
      s1u1: normEff(row[31]),
      s1u2: normEff(row[32]),
      s1u3: normEff(row[33]),
      s1u4: normEff(row[34]),
      styrax: normEff(row[35]),
    });
  }

  // Calculate quick summary metrics for charts
  const calcStats = (key: string) => {
    const validVals = trendDays.map((d) => d[key]).filter((v) => typeof v === "number" && v > 0);
    if (validVals.length === 0) return { avg: 0, min: 0, max: 0, count: 0, latest: 0 };
    const sum = validVals.reduce((a, b) => a + b, 0);
    const avg = Math.round((sum / validVals.length) * 10) / 10;
    const min = Math.min(...validVals);
    const max = Math.max(...validVals);
    const latest = validVals[validVals.length - 1];
    return { avg, min, max, count: validVals.length, latest };
  };

  const trendStats = {
    birichina: calcStats("birichina"),
    b1: calcStats("b1"),
    b2: calcStats("b2"),
    styrax: calcStats("styrax"),
    b1u2: calcStats("b1u2"),
    b1u3: calcStats("b1u3"),
    b1u4: calcStats("b1u4"),
    b2u2: calcStats("b2u2"),
    b2u3: calcStats("b2u3"),
    s1u1: calcStats("s1u1"),
    s1u2: calcStats("s1u2"),
    s1u3: calcStats("s1u3"),
    s1u4: calcStats("s1u4"),
  };

  return {
    company,
    title,
    dateStr,
    isoDate,
    mainBlocks,
    unitBlocks,
    trendDays,
    trendStats,
  };
}

// 3. REPORT SHEET EXTRACTOR (Daily Production Monitoring by Unit-Line)
export function parseReportSheetData(ws: XLSX.WorkSheet) {
  const rawData = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null });
  const company = rawData[0]?.[2] || rawData[0]?.[1] || "SQ Birichina Ltd.";
  const title = rawData[1]?.[2] || rawData[1]?.[1] || "Daily Production Monitoring Report";
  const dateSerial = rawData[2]?.[3] || rawData[2]?.[2];
  const dateStr = formatExcelDisplayDate(dateSerial) || "26-Sep-26";
  const isoDate = excelSerialToDateString(dateSerial) || "2026-09-26";

  const rows: any[] = [];
  for (let r = 5; r < rawData.length; r++) {
    const row = rawData[r] || [];
    const line = row[2];
    if (!line || typeof line !== "string") continue;
    if (line.trim() === "Unit-Line") continue;

    const isSubtotal = !row[3] || line.length <= 6 || line.toLowerCase().includes("total") || line.toLowerCase().includes("birichina");

    const normEff = (val: any) => {
      let num = parseSafeNumber(val, 0);
      if (num > 0 && num <= 1.5) num = num * 100;
      return num;
    };

    rows.push({
      id: r,
      unitLine: line.trim(),
      isSubtotal,
      buyer: row[3] || "",
      style: row[4] || "",
      type: row[5] || "",
      status: row[6] !== undefined && row[6] !== null ? (typeof row[6] === "number" && row[6] < 1 ? Number(row[6]).toFixed(2) : String(row[6])) : "",
      runDays: row[7] !== undefined && row[7] !== null ? (typeof row[7] === "number" && row[7] < 1 ? Number(row[7]).toFixed(2) : String(row[7])) : "",
      smv: row[8] !== undefined && row[8] !== null && row[8] !== "" ? parseSafeNumber(row[8]) : null,
      dayPlan: {
        md: parseSafeNumber(row[9] || 0),
        availHrs: parseSafeNumber(row[10] || 0),
        sah: parseSafeNumber(row[11] || 0),
        pcs: parseSafeInt(row[12] || 0),
        eff: normEff(row[13]),
      },
      dayActual: {
        md: parseSafeNumber(row[14] || 0),
        availHrs: parseSafeNumber(row[15] || 0),
        sah: parseSafeNumber(row[16] || 0),
        pcs: parseSafeInt(row[17] || 0),
        eff: normEff(row[18]),
      },
      dayVar: {
        md: parseSafeNumber(row[19] || 0),
        availHrs: parseSafeNumber(row[20] || 0),
        sah: parseSafeNumber(row[21] || 0),
        pcs: parseSafeInt(row[22] || 0),
        eff: normEff(row[23]),
      },
      planMtd: {
        md: parseSafeNumber(row[24] || 0),
        availHrs: parseSafeNumber(row[25] || 0),
        sah: parseSafeNumber(row[26] || 0),
        pcs: parseSafeInt(row[27] || 0),
        eff: normEff(row[28]),
      },
      actMtd: {
        md: parseSafeNumber(row[29] || 0),
        availHrs: parseSafeNumber(row[30] || 0),
        sah: parseSafeNumber(row[31] || 0),
        pcs: parseSafeInt(row[32] || 0),
        eff: normEff(row[33]),
      },
      varMtd: {
        md: parseSafeNumber(row[34] || 0),
        availHrs: parseSafeNumber(row[35] || 0),
        sah: parseSafeNumber(row[36] || 0),
        pcs: parseSafeInt(row[37] || 0),
        eff: normEff(row[38]),
      },
    });
  }

  return {
    company,
    title,
    dateStr,
    isoDate,
    rows,
  };
}

// 4. CLOCK HOUR EXTRACTOR (4500+ rows)
export function parseClockHourSheetData(ws: XLSX.WorkSheet) {
  const rawRows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null });
  const records: any[] = [];

  let startRow = 3;
  for (let r = 0; r < rawRows.length; r++) {
    const row = rawRows[r] || [];
    if (String(row[0] || "").toLowerCase().includes("date") && String(row[1] || "").toLowerCase().includes("line")) {
      startRow = r + 1;
      break;
    }
  }

  for (let r = startRow; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const rawDate = row[0];
    const rawLine = row[1];
    if (!rawDate && !rawLine) continue;

    const dateString = excelSerialToDateString(rawDate);
    const line = String(rawLine || "").trim();
    if (!line) continue;

    const payrollMo = parseSafeInt(row[3], 0);
    const absentLeave = parseSafeInt(row[4], 0);
    const mlv = parseSafeInt(row[5], 0);
    const present = parseSafeInt(row[6], 0);
    const lineTransfer = parseSafeInt(row[7], 0);
    const moForClkHrs = parseSafeInt(row[8], 0);
    const clockHour = parseSafeNumber(row[9], 0);
    const absentRate = parseSafeNumber(row[10], 0);
    const cluster = String(row[11] || (line.startsWith("B1") ? "B1" : line.startsWith("B2") ? "B2" : "Styrax")).trim();
    const unit = String(row[12] || (line.includes("-") ? line.split("-")[0] : "B1U2")).trim();

    records.push({
      date: dateString ? new Date(dateString) : new Date(),
      dateString,
      month: dateString ? dateString.substring(0, 7) : "2026-09",
      line,
      unit,
      cluster,
      payrollMo,
      absentLeave,
      mlv,
      present,
      lineTransfer,
      moForClkHrs,
      clockHour,
      absentRate,
    });
  }

  return records;
}

// 5. LOSS TIME SHEET EXTRACTOR
export function parseLossTimeSheetData(ws: XLSX.WorkSheet, defaultTitle: string) {
  const rawData = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null });
  const blocks: { unitName: string; days: any[]; rows: any[] }[] = [];
  let currentUnitName = String(rawData[0]?.[2] || rawData[0]?.[1] || defaultTitle).trim();

  let r = 0;
  while (r < rawData.length) {
    const row = rawData[r] || [];
    const val2 = String(row[2] || "").trim();

    if (val2 && !val2.toLowerCase().includes("department") && !val2.toLowerCase().includes("date") && !val2.toLowerCase().includes("lost") && row.filter((c) => c !== null && c !== undefined && c !== "").length <= 3) {
      currentUnitName = val2;
    }

    if (val2.toLowerCase() === "department" || val2.toLowerCase() === "department ") {
      const headerRow = rawData[r];
      const days = [];
      let totalColIdx = -1;
      for (let c = 4; c < headerRow.length; c++) {
        const cell = headerRow[c];
        if (cell === "Total" || cell === "%" || cell === "Date") {
          if (cell === "Total") totalColIdx = c;
          break;
        }
        const formatted = formatExcelDisplayDate(cell);
        const iso = excelSerialToDateString(cell);
        days.push({ colIdx: c, label: formatted || `Day ${c - 3}`, dateStr: String(cell), isoDate: iso });
      }

      const blockRows = [];
      r++;
      while (r < rawData.length) {
        const bRow = rawData[r] || [];
        const dept = bRow[2] || bRow[1];
        const code = bRow[3] || bRow[2];

        if (!dept && !code) break;

        const dayValues = days.map((d) => parseSafeNumber(bRow[d.colIdx] || 0));
        const total = totalColIdx !== -1 ? parseSafeNumber(bRow[totalColIdx] || 0) : dayValues.reduce((a, b) => a + b, 0);
        let percentage = totalColIdx !== -1 ? parseSafeNumber(bRow[totalColIdx + 1] || 0) : 0;
        if (percentage > 0 && percentage <= 1) percentage = percentage * 100;

        blockRows.push({
          id: r,
          department: String(dept || "").trim(),
          code: String(code || "").trim(),
          dayValues,
          total,
          percentage,
        });
        r++;
      }

      blocks.push({
        unitName: currentUnitName,
        days,
        rows: blockRows,
      });
    } else {
      r++;
    }
  }

  const mainDays = blocks.length > 0 ? blocks[0].days : [];
  const mainRows = blocks.length > 0 ? blocks[0].rows : [];

  return { title: defaultTitle, blocks, days: mainDays, rows: mainRows };
}

// 6. LOSS HR ANALYSIS EXTRACTOR
export function parseLossHrAnalysisData(ws: XLSX.WorkSheet, defaultTitle: string) {
  const rawData = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null });
  const tables: any[] = [];
  let r = 0;

  while (r < rawData.length) {
    const row = rawData[r] || [];
    const strValues = row.filter((c) => typeof c === "string" && c.trim() !== "");

    if (strValues.length === 1 && !strValues[0].toLowerCase().includes("total") && !strValues[0].toLowerCase().includes("birichina 01")) {
      const tableTitle = strValues[0].trim();
      r++;

      while (r < rawData.length && (!rawData[r] || rawData[r].filter((c) => c !== null && c !== undefined && c !== "").length === 0)) {
        r++;
      }

      if (r >= rawData.length) break;

      const headerRow = rawData[r];
      const startCol = headerRow.findIndex((c) => typeof c === "string" && c.trim() !== "");
      if (startCol === -1) {
        r++;
        continue;
      }

      const headers = [];
      for (let c = startCol; c < headerRow.length; c++) {
        if (headerRow[c]) headers.push({ colIdx: c, label: String(headerRow[c]).trim() });
      }

      r++;
      const dataRows = [];
      while (r < rawData.length) {
        const dRow = rawData[r] || [];
        const firstCell = String(dRow[startCol] || "").trim();
        const secondCell = String(dRow[startCol + 1] || "").trim();

        if (!firstCell && !secondCell) break;

        const rowData: any = {};
        let isTotal = false;
        headers.forEach((h) => {
          let val = dRow[h.colIdx];
          if (typeof val === "number" && (h.label === "%" || h.label === "Share")) {
            if (val > 0 && val <= 1) val = val * 100;
          }
          rowData[h.label] = val;
          if (String(val).toLowerCase() === "total") isTotal = true;
        });

        dataRows.push({ ...rowData, isTotal });

        if (isTotal) {
          r++;
          break;
        }
        r++;
      }

      tables.push({ title: tableTitle, headers: headers.map((h) => h.label), rows: dataRows });
    } else {
      r++;
    }
  }

  return { title: defaultTitle, tables };
}

// 7. VA TRACKER EXTRACTOR
export function parseVaTrackerSheetData(ws: XLSX.WorkSheet) {
  const rawData = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null });
  const dateSerial = rawData[0]?.[1];
  const dateStr = formatExcelDisplayDate(dateSerial) || "26-Sep-26";
  const month = rawData[1]?.[2] || "September";
  const totalDays = parseSafeInt(rawData[2]?.[2], 26);
  const remainingDays = parseSafeInt(rawData[3]?.[2], 4);

  const lines: any[] = [];

  for (let r = 7; r < rawData.length; r++) {
    const row = rawData[r] || [];
    const line = row[1];
    if (!line || typeof line !== "string" || line.includes("Total") || line.includes("Unit")) continue;

    const normEff = (val: any) => {
      let num = parseSafeNumber(val, 0);
      if (num > 0 && num <= 1.5) num = num * 100;
      return num;
    };

    lines.push({
      line: line.trim(),
      buyer: row[2] || "",
      fullMonthPcs: parseSafeInt(row[3], 0),
      planMd: parseSafeNumber(row[4], 0),
      planVa: parseSafeNumber(row[5], 0),
      planClk: parseSafeNumber(row[6], 0),
      planSah: parseSafeNumber(row[7], 0),
      planEff: normEff(row[8]),
      spm: parseSafeNumber(row[9], 0),
      planEpm: parseSafeNumber(row[10], 0),
      dayPlan: {
        pcs: parseSafeInt(row[11], 0),
        sah: parseSafeNumber(row[12], 0),
      },
      cumPlan: {
        pcs: parseSafeInt(row[13], 0),
        sah: parseSafeNumber(row[14], 0),
      },
      dayActual: {
        pcs: parseSafeInt(row[15], 0),
        sah: parseSafeNumber(row[16], 0),
      },
      dayVar: {
        pcs: parseSafeInt(row[17], 0),
        sah: parseSafeNumber(row[18], 0),
      },
      cumActual: {
        pcs: parseSafeInt(row[19], 0),
        sah: parseSafeNumber(row[20], 0),
      },
      cumVar: {
        pcs: parseSafeInt(row[23], 0),
        sah: parseSafeNumber(row[24], 0),
      },
    });
  }

  return {
    dateStr,
    month,
    totalDays,
    remainingDays,
    lines,
  };
}

// 8. EPMD EXTRACTOR (B1, B2, Styrax)
export function parseEpmdSheetData(ws: XLSX.WorkSheet, clusterName: string) {
  const rawData = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null });
  const rows: any[] = [];

  for (let r = 4; r < rawData.length; r++) {
    const row = rawData[r] || [];
    const dateSerial = row[1];
    if (!dateSerial) continue;
    const dateStr = formatExcelDisplayDate(dateSerial);
    const isoDate = excelSerialToDateString(dateSerial);

    rows.push({
      dateStr,
      isoDate,
      signOffPlan: {
        b1u2Va: parseSafeNumber(row[4], 0),
        b1u2Mc: parseSafeNumber(row[5], 0),
        b1u3Va: parseSafeNumber(row[6], 0),
        b1u3Mc: parseSafeNumber(row[7], 0),
        b1u4Va: parseSafeNumber(row[8], 0),
        b1u4Mc: parseSafeNumber(row[9], 0),
        totalVa: parseSafeNumber(row[10], 0),
        totalMc: parseSafeNumber(row[11], 0),
      },
      revisedPlan: {
        b1u2Va: parseSafeNumber(row[16], 0),
        b1u2Mc: parseSafeNumber(row[17], 0),
        b1u3Va: parseSafeNumber(row[18], 0),
        b1u3Mc: parseSafeNumber(row[19], 0),
        b1u4Va: parseSafeNumber(row[20], 0),
        b1u4Mc: parseSafeNumber(row[21], 0),
        totalVa: parseSafeNumber(row[22], 0),
        totalMc: parseSafeNumber(row[23], 0),
      },
      actual: {
        b1u2Va: parseSafeNumber(row[27], 0),
        b1u3Va: parseSafeNumber(row[29], 0),
        b1u4Va: parseSafeNumber(row[31], 0),
        totalVa: parseSafeNumber(row[33], 0),
      },
      epmd: {
        plan: parseSafeNumber(row[36], 0),
        revised: parseSafeNumber(row[42], 0),
        actual: parseSafeNumber(row[48], 0),
      },
    });
  }

  return {
    clusterName,
    rows,
  };
}

// 9. LINE EFFICIENCY EXTRACTOR
export function parseLineEfficiencySheetData(ws: XLSX.WorkSheet, clusterName: string) {
  const rawData = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null });
  const linesMap: Record<string, any[]> = {};
  let currentLine = "";

  for (let r = 0; r < rawData.length; r++) {
    const row = rawData[r] || [];
    const c0 = String(row[0] || "").trim();
    const c1 = String(row[1] || "").trim();
    const c2 = String(row[2] || "").trim();

    if (
      c0.toLowerCase().includes("team no") ||
      c1.toLowerCase().includes("team no") ||
      c0.toLowerCase().includes("line") ||
      c1.toLowerCase().includes("line")
    ) {
      const lineCandidate = (c2 || c1 || c0).trim();
      const lowerCandidate = lineCandidate.toLowerCase();
      // Filter out sheet headers, titles, and non-line labels
      if (
        lineCandidate &&
        lineCandidate !== "Date:" &&
        lineCandidate !== "Date-" &&
        lineCandidate !== "Eff%" &&
        !lowerCandidate.includes("team no") &&
        !lowerCandidate.includes("graph") &&
        !lowerCandidate.includes("efficiency") &&
        !lowerCandidate.includes("birichina") &&
        !lowerCandidate.includes("styrax") &&
        lineCandidate.length >= 3
      ) {
        currentLine = lineCandidate;
        if (!linesMap[currentLine]) linesMap[currentLine] = [];
        continue;
      }
    }

    const rawDate = row[1];
    const rawEff = row[2];
    const rawType = row[3];
    const rawStyle = row[4];

    if (currentLine && rawDate && typeof rawDate === "number" && rawDate > 40000) {
      let eff = parseSafeNumber(rawEff, 0);
      if (eff > 0 && eff <= 1.5) eff = eff * 100;

      const typeStr = rawType && rawType !== "-" ? String(rawType).trim() : "";
      const styleStr = rawStyle && rawStyle !== "-" ? String(rawStyle).trim() : "";

      linesMap[currentLine].push({
        dateSerial: rawDate,
        dateStr: formatExcelDisplayDate(rawDate),
        isoDate: excelSerialToDateString(rawDate),
        efficiency: Math.round(eff * 10) / 10,
        type: typeStr,
        style: styleStr,
      });
    }
  }

  // Calculate comprehensive metrics for each line
  const linesSummary = Object.entries(linesMap).map(([lineName, points]) => {
    const validPoints = points.filter((p) => p.efficiency > 0);
    const validEffs = validPoints.map((p) => p.efficiency);
    const avgEff = validEffs.length > 0 ? Math.round((validEffs.reduce((a, b) => a + b, 0) / validEffs.length) * 10) / 10 : 0;
    const maxEff = validEffs.length > 0 ? Math.max(...validEffs) : 0;
    const minEff = validEffs.length > 0 ? Math.min(...validEffs) : 0;
    
    // Find latest active day with actual data
    const latestValidPoint = validPoints.length > 0 ? validPoints[validPoints.length - 1] : points[points.length - 1];
    const latestEff = latestValidPoint?.efficiency || 0;

    // Find dominant style and type from valid production days
    const stylesWithCount: Record<string, number> = {};
    const typesWithCount: Record<string, number> = {};
    for (const p of points) {
      if (p.style && p.style !== "-" && p.style !== "N/A") {
        stylesWithCount[p.style] = (stylesWithCount[p.style] || 0) + 1;
      }
      if (p.type && p.type !== "-" && p.type !== "N/A") {
        typesWithCount[p.type] = (typesWithCount[p.type] || 0) + 1;
      }
    }

    const dominantStyle = Object.entries(stylesWithCount).sort((a, b) => b[1] - a[1])[0]?.[0] || latestValidPoint?.style || "N/A";
    const dominantType = Object.entries(typesWithCount).sort((a, b) => b[1] - a[1])[0]?.[0] || latestValidPoint?.type || "N/A";

    // Extract Unit (e.g. "B1U2", "B1U3", "B2U1", "S1U1")
    let unit = "Unit 1";
    const unitMatch = lineName.match(/([A-Z0-9]+-U\d+|B\d+U\d+|S\d+U\d+|U\d+)/i);
    if (unitMatch) {
      unit = unitMatch[0].toUpperCase();
    }

    return {
      lineName,
      unit,
      clusterName,
      avgEff,
      maxEff,
      minEff,
      latestEff,
      latestDate: latestValidPoint?.dateStr || "",
      dominantStyle,
      dominantType,
      activeDays: validPoints.length,
      totalTrackedDays: points.length,
      points,
    };
  });

  // Calculate Factory Efficiency KPI & Distribution Bands
  const activeLines = linesSummary.filter((l) => l.avgEff > 0);
  const factoryAvgEff = activeLines.length > 0 ? Math.round((activeLines.reduce((acc, l) => acc + l.avgEff, 0) / activeLines.length) * 10) / 10 : 0;

  // Efficiency Bands for Donut / Pie Chart
  const bands = [
    { name: "Elite (≥80%)", range: ">=80%", count: 0, color: "#10b981", lines: [] as string[] },
    { name: "Target (70-79%)", range: "70-79%", count: 0, color: "#38bdf8", lines: [] as string[] },
    { name: "Developing (60-69%)", range: "60-69%", count: 0, color: "#f59e0b", lines: [] as string[] },
    { name: "Critical (<60%)", range: "<60%", count: 0, color: "#f43f5e", lines: [] as string[] },
  ];

  for (const l of linesSummary) {
    if (l.avgEff >= 80) {
      bands[0].count++;
      bands[0].lines.push(l.lineName);
    } else if (l.avgEff >= 70) {
      bands[1].count++;
      bands[1].lines.push(l.lineName);
    } else if (l.avgEff >= 60) {
      bands[2].count++;
      bands[2].lines.push(l.lineName);
    } else {
      bands[3].count++;
      bands[3].lines.push(l.lineName);
    }
  }

  // Daily cluster average trend
  const dailyDates = linesSummary[0]?.points?.map((p) => p.dateStr) || [];
  const dailyTrend = dailyDates.map((dStr, idx) => {
    const dayValues: number[] = [];
    for (const l of linesSummary) {
      const p = l.points[idx];
      if (p && p.efficiency > 0) {
        dayValues.push(p.efficiency);
      }
    }
    const avg = dayValues.length > 0 ? Math.round((dayValues.reduce((a, b) => a + b, 0) / dayValues.length) * 10) / 10 : 0;
    return {
      dateStr: dStr,
      avgEfficiency: avg,
      activeLines: dayValues.length,
    };
  });

  return {
    clusterName,
    factoryAvgEff,
    totalLines: linesSummary.length,
    activeLinesCount: activeLines.length,
    bands,
    dailyTrend,
    lines: linesMap,
    linesSummary,
  };
}

// 10. UNIVERSAL 100% SHEET EXTRACTOR FOR ANY WORKSHEET
export function parseUniversalSheetData(ws: XLSX.WorkSheet, sheetName: string) {
  if (!ws) return null;
  const rawMatrix = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: "" });
  if (!rawMatrix || rawMatrix.length === 0) {
    return {
      sheetName,
      rowCount: 0,
      colCount: 0,
      headers: [],
      rows: [],
      rawMatrix: [],
    };
  }

  // Find header row with highest concentration of non-empty text
  let bestHeaderRowIdx = 0;
  let maxHeaders = 0;
  for (let r = 0; r < Math.min(10, rawMatrix.length); r++) {
    const row = rawMatrix[r] || [];
    const stringCount = row.filter((c) => typeof c === "string" && String(c).trim().length > 0).length;
    if (stringCount > maxHeaders) {
      maxHeaders = stringCount;
      bestHeaderRowIdx = r;
    }
  }

  const rawHeaderRow = rawMatrix[bestHeaderRowIdx] || [];
  const maxCols = Math.max(...rawMatrix.map((r) => (r ? r.length : 0)), 1);
  const headers: string[] = [];
  for (let c = 0; c < maxCols; c++) {
    const hVal = rawHeaderRow[c];
    let hName = hVal !== null && hVal !== undefined && String(hVal).trim() !== "" ? String(hVal).trim() : `Col_${c + 1}`;
    let uniqueName = hName;
    let counter = 1;
    while (headers.includes(uniqueName)) {
      uniqueName = `${hName}_${counter++}`;
    }
    headers.push(uniqueName);
  }

  const rows: any[] = [];
  for (let r = bestHeaderRowIdx + 1; r < rawMatrix.length; r++) {
    const row = rawMatrix[r] || [];
    if (!row || row.every((c) => c === null || c === undefined || String(c).trim() === "")) continue;

    const rowObj: Record<string, any> = { _rowIndex: r + 1 };
    for (let c = 0; c < headers.length; c++) {
      const cellVal = row[c];
      if (typeof cellVal === "number" && cellVal > 40000 && cellVal < 55000 && headers[c].toLowerCase().includes("date")) {
        rowObj[headers[c]] = formatExcelDisplayDate(cellVal) || excelSerialToDateString(cellVal) || cellVal;
        rowObj[`${headers[c]}_iso`] = excelSerialToDateString(cellVal);
      } else {
        rowObj[headers[c]] = cellVal !== undefined ? cellVal : "";
      }
    }
    rows.push(rowObj);
  }

  return {
    sheetName,
    rowCount: rawMatrix.length,
    colCount: maxCols,
    headers,
    rows,
    rawMatrix: rawMatrix.slice(0, 1000),
  };
}

// Full Workbook comprehensive parser extracting 100% of all sheets
export function parseFullMonitoringWorkbook(wb: XLSX.WorkBook) {
  const tabs: Record<string, any> = {};
  const allSheetsUniversal: Record<string, any> = {};

  // 1. Universal 100% extraction for every worksheet in the workbook
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (ws) {
      allSheetsUniversal[sheetName] = parseUniversalSheetData(ws, sheetName);
    }
  }

  // 2. Extract domain-specific rich structures for known monitoring tabs
  if (wb.Sheets["Summary"]) {
    tabs["Summary"] = {
      ...parseSummarySheetData(wb.Sheets["Summary"]),
      universal: allSheetsUniversal["Summary"],
    };
  }

  if (wb.Sheets["Report"]) {
    tabs["Report"] = {
      ...parseReportSheetData(wb.Sheets["Report"]),
      universal: allSheetsUniversal["Report"],
    };
  }

  if (wb.Sheets["Actual"]) {
    tabs["Actual"] = {
      ...parseActualSheetData(wb.Sheets["Actual"]),
      universal: allSheetsUniversal["Actual"],
    };
  }

  if (wb.Sheets["Clock hour"]) {
    tabs["Clock hour"] = {
      ...parseClockHourSheetData(wb.Sheets["Clock hour"]),
      universal: allSheetsUniversal["Clock hour"],
    };
  }

  if (wb.Sheets["VA Tracker"]) {
    tabs["VA Tracker"] = {
      ...parseVaTrackerSheetData(wb.Sheets["VA Tracker"]),
      universal: allSheetsUniversal["VA Tracker"],
    };
  }

  if (wb.Sheets["B1 - Loss Time"]) {
    tabs["B1 - Loss Time"] = parseLossTimeSheetData(wb.Sheets["B1 - Loss Time"], "Birichina 01 - Unit 2, 3, 4");
  }

  if (wb.Sheets["B2 - Loss Time"]) {
    tabs["B2 - Loss Time"] = parseLossTimeSheetData(wb.Sheets["B2 - Loss Time"], "Birichina 02");
  }

  const styraxLossKey = wb.SheetNames.find((s) => s.toLowerCase().includes("styrax") && s.toLowerCase().includes("loss time"));
  if (styraxLossKey && wb.Sheets[styraxLossKey]) {
    tabs["Styrax- Loss Time"] = parseLossTimeSheetData(wb.Sheets[styraxLossKey], "Styrax Apparels");
  }

  if (wb.Sheets["B1 - Loss Hr. Analysis"]) {
    tabs["B1 - Loss Hr. Analysis"] = parseLossHrAnalysisData(wb.Sheets["B1 - Loss Hr. Analysis"], "B1 Unit Breakdown");
  }

  if (wb.Sheets["B2 - Loss Hr. Analysis"]) {
    tabs["B2 - Loss Hr. Analysis"] = parseLossHrAnalysisData(wb.Sheets["B2 - Loss Hr. Analysis"], "B2 Unit Breakdown");
  }

  const styraxAnalysisKey = wb.SheetNames.find((s) => s.toLowerCase().includes("styrax") && s.toLowerCase().includes("loss hr"));
  if (styraxAnalysisKey && wb.Sheets[styraxAnalysisKey]) {
    tabs["Styrax - Loss Hr. Analysis"] = parseLossHrAnalysisData(wb.Sheets[styraxAnalysisKey], "Styrax Analysis");
  }

  if (wb.Sheets["B1 EPMD"]) {
    tabs["B1 EPMD"] = parseEpmdSheetData(wb.Sheets["B1 EPMD"], "Birichina-1");
  }
  if (wb.Sheets["B2 EPMD"]) {
    tabs["B2 EPMD"] = parseEpmdSheetData(wb.Sheets["B2 EPMD"], "Birichina-2");
  }
  if (wb.Sheets["Styrax EPMD"]) {
    tabs["Styrax EPMD"] = parseEpmdSheetData(wb.Sheets["Styrax EPMD"], "Styrax Apparels");
  }

  if (wb.Sheets["B-1 Line Efficiency"]) {
    tabs["B-1 Line Efficiency"] = parseLineEfficiencySheetData(wb.Sheets["B-1 Line Efficiency"], "Birichina-1");
  }
  if (wb.Sheets["B-2 Line Efficiency"]) {
    tabs["B-2 Line Efficiency"] = parseLineEfficiencySheetData(wb.Sheets["B-2 Line Efficiency"], "Birichina-2");
  }
  if (wb.Sheets["Styrax Line Efficiency"]) {
    tabs["Styrax Line Efficiency"] = parseLineEfficiencySheetData(wb.Sheets["Styrax Line Efficiency"], "Styrax Apparels");
  }

  // 3. For every other sheet not in the domain list, attach universal data directly to tabs
  for (const sheetName of wb.SheetNames) {
    if (!tabs[sheetName] && allSheetsUniversal[sheetName]) {
      tabs[sheetName] = allSheetsUniversal[sheetName];
    }
  }

  return {
    sheetNames: wb.SheetNames,
    tabs,
    allSheetsUniversal,
  };
}
