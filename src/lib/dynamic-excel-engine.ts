import * as XLSX from "xlsx";
import crypto from "crypto";

export interface ColumnSchemaField {
  key: string;
  label: string;
  type: "string" | "number" | "date" | "percent" | "boolean";
  required?: boolean;
  aliases: string[];
}

// Standard Schema Fields for Garments Production Monitoring
export const PRODUCTION_SCHEMA_FIELDS: ColumnSchemaField[] = [
  { key: "dateString", label: "Date (YYYY-MM-DD)", type: "date", required: true, aliases: ["date", "prod date", "production date", "dt", "start date"] },
  { key: "unitLine", label: "Unit-Line / Line", type: "string", required: true, aliases: ["unit-line", "unit line", "line", "line name", "line info", "team no", "team", "line #"] },
  { key: "buyer", label: "Buyer Name", type: "string", required: false, aliases: ["buyer", "buyer name", "customer", "brand", "client"] },
  { key: "style", label: "Style Reference", type: "string", required: false, aliases: ["style", "style no", "style ref", "style name", "item"] },
  { key: "oc", label: "OC / Order Code", type: "string", required: false, aliases: ["oc", "order code", "oc no", "main oc", "po", "po no", "order #"] },
  { key: "categoryType", label: "Category / Type", type: "string", required: false, aliases: ["type", "category", "p type", "p.type", "category type", "item type"] },
  { key: "productType", label: "Product Type", type: "string", required: false, aliases: ["product type", "product", "garment type", "p.type"] },
  { key: "smv", label: "Standard Minute Value (SMV)", type: "number", required: false, aliases: ["smv", "mc smv", "m/c smv", "sam", "standard min"] },
  { key: "actualQty", label: "Actual Quantity (Pcs)", type: "number", required: true, aliases: ["pcs", "actual pcs", "act pcs", "actual qty", "production", "produced pcs", "output", "day actual pcs"] },
  { key: "targetQty", label: "Plan / Target Quantity (Pcs)", type: "number", required: false, aliases: ["plan pcs", "target pcs", "plan qty", "target qty", "target", "plan", "day plan pcs"] },
  { key: "mo", label: "Manpower (MO)", type: "number", required: false, aliases: ["mo", "manpower", "operators", "operator count", "payroll mo", "mo for clk hrs"] },
  { key: "clockHours", label: "Clock Hours / Available Hours", type: "number", required: true, aliases: ["clock hrs", "clock hour", "clock hours", "clk hrs", "avail hrs", "working hours", "available hours"] },
  { key: "actualSah", label: "Actual SAH", type: "number", required: false, aliases: ["mc sah", "m/c sah", "actual sah", "act sah", "produced sah", "sah"] },
  { key: "targetSah", label: "Plan / Target SAH", type: "number", required: false, aliases: ["plan sah", "target sah", "planned sah"] },
  { key: "efficiency", label: "Efficiency %", type: "percent", required: false, aliases: ["eff%", "eff", "efficiency", "efficiency %", "line eff", "act eff"] },
  { key: "fobPrice", label: "FOB Price ($)", type: "number", required: false, aliases: ["fob", "fob price", "fob pcs", "fob $", "unit price"] },
  { key: "vaPrice", label: "VA Price ($)", type: "number", required: false, aliases: ["va", "va price", "va pcs", "va $", "value addition"] },
  { key: "fobValue", label: "Total FOB ($)", type: "number", required: false, aliases: ["ttl fob", "total fob", "fob value", "sales value"] },
  { key: "vaValue", label: "Total VA ($)", type: "number", required: false, aliases: ["ttl va", "total va", "va value", "plan $va"] },
  { key: "unitCode", label: "Unit Code", type: "string", required: false, aliases: ["unit", "unit code", "unit name", "factory"] },
  { key: "cluster", label: "Cluster / Factory", type: "string", required: false, aliases: ["cluster", "factory", "company", "division"] },
  { key: "remarks", label: "Remarks / Notes", type: "string", required: false, aliases: ["remarks", "notes", "comments", "reason"] },
];

// Helper to convert Excel Date Serial or text to YYYY-MM-DD
export function normalizeDate(val: any): string {
  if (!val) return "";
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const parsed = Date.parse(trimmed);
    if (!isNaN(parsed)) {
      const d = new Date(parsed);
      return d.toISOString().split("T")[0];
    }
  }
  const num = Number(val);
  if (!isNaN(num) && num > 30000 && num < 60000) {
    const utc_days = Math.floor(num - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    const y = date_info.getUTCFullYear();
    const m = String(date_info.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date_info.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(val || "");
}

export function normalizeNumber(val: any, fallback = 0): number {
  if (val === null || val === undefined || val === "") return fallback;
  if (typeof val === "number") return isNaN(val) ? fallback : val;
  const str = String(val).replace(/[$,]/g, "").trim();
  const num = parseFloat(str);
  return isNaN(num) ? fallback : num;
}

export function normalizePercent(val: any, fallback = 0): number {
  const num = normalizeNumber(val, fallback);
  if (num > 0 && num <= 1.5) return num * 100;
  return num;
}

// Auto-Suggest Column Mapping based on column name similarity
export function autoSuggestColumnMappings(sheetHeaders: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}; // { [sourceColName]: targetFieldKey }

  sheetHeaders.forEach((header) => {
    if (!header) return;
    const cleanHeader = header.toLowerCase().replace(/[^a-z0-9]/g, "");

    let bestMatchKey = "";
    let bestScore = 0;

    for (const field of PRODUCTION_SCHEMA_FIELDS) {
      for (const alias of field.aliases) {
        const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (cleanHeader === cleanAlias) {
          bestMatchKey = field.key;
          bestScore = 100;
          break;
        }
        if (cleanHeader.includes(cleanAlias) || cleanAlias.includes(cleanHeader)) {
          if (bestScore < 80) {
            bestMatchKey = field.key;
            bestScore = 80;
          }
        }
      }
      if (bestScore === 100) break;
    }

    if (bestMatchKey) {
      mapping[header] = bestMatchKey;
    }
  });

  return mapping;
}

// Inspect any workbook worksheet dynamically
export function analyzeWorksheet(ws: XLSX.WorkSheet, sheetName: string) {
  const rawData = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null });
  const rowCount = rawData.length;

  let headerRowIndex = 0;
  let maxCols = 0;

  // Detect header row by finding row with highest number of non-empty text strings
  for (let r = 0; r < Math.min(15, rawData.length); r++) {
    const row = rawData[r] || [];
    const textCols = row.filter((c) => typeof c === "string" && c.trim() !== "").length;
    if (textCols > maxCols) {
      maxCols = textCols;
      headerRowIndex = r;
    }
  }

  const rawHeaders = (rawData[headerRowIndex] || []).map((h, i) =>
    h !== null && h !== undefined && String(h).trim() !== "" ? String(h).trim() : `Col_${i + 1}`
  );

  const suggestedMappings = autoSuggestColumnMappings(rawHeaders);
  const sampleRows = rawData.slice(headerRowIndex + 1, headerRowIndex + 11);

  return {
    sheetName,
    rowCount,
    colCount: maxCols,
    headerRowIndex,
    headers: rawHeaders,
    suggestedMappings,
    sampleRows,
  };
}

// Dynamic Validation Engine
export function validateSheetRows(
  rawData: any[][],
  headerRowIndex: number,
  headers: string[],
  columnMapping: Record<string, string>, // { [sourceColName]: targetFieldKey }
  sheetName: string
) {
  const validationResults: any[] = [];

  // Inverse mapping: targetFieldKey -> sourceColIndex
  const fieldToColIndex: Record<string, number> = {};
  headers.forEach((header, idx) => {
    const targetField = columnMapping[header];
    if (targetField) {
      fieldToColIndex[targetField] = idx;
    }
  });

  const startRow = headerRowIndex + 1;

  for (let r = startRow; r < rawData.length; r++) {
    const row = rawData[r];
    if (!row || row.filter((c) => c !== null && c !== undefined && String(c).trim() !== "").length === 0) {
      continue; // Skip completely empty rows
    }

    const parsed: Record<string, any> = {};
    const errors: string[] = [];
    const warnings: string[] = [];

    // Map each schema field
    for (const field of PRODUCTION_SCHEMA_FIELDS) {
      const colIdx = fieldToColIndex[field.key];
      const rawVal = colIdx !== undefined ? row[colIdx] : undefined;

      if (rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== "") {
        if (field.type === "date") {
          const dateStr = normalizeDate(rawVal);
          parsed[field.key] = dateStr;
          if (!dateStr) errors.push(`Invalid date format in column '${headers[colIdx]}'`);
        } else if (field.type === "number") {
          const num = normalizeNumber(rawVal);
          parsed[field.key] = num;
        } else if (field.type === "percent") {
          parsed[field.key] = normalizePercent(rawVal);
        } else {
          parsed[field.key] = String(rawVal).trim();
        }
      } else {
        if (field.required) {
          errors.push(`Missing required field '${field.label}'`);
        }
        parsed[field.key] = field.type === "number" || field.type === "percent" ? 0 : null;
      }
    }

    // Sanity validations
    if (parsed.actualQty < 0) errors.push("Actual quantity cannot be negative");
    if (parsed.clockHours < 0) errors.push("Clock hours cannot be negative");
    if (parsed.efficiency > 200) warnings.push("Efficiency is exceptionally high (>200%)");
    if (!parsed.buyer) warnings.push("Buyer is empty");
    if (!parsed.style) warnings.push("Style is empty");

    // Compute derived metrics if missing
    if (!parsed.varianceQty && parsed.actualQty && parsed.targetQty) {
      parsed.varianceQty = parsed.actualQty - parsed.targetQty;
    }
    if (!parsed.actualSah && parsed.actualQty && parsed.smv) {
      parsed.actualSah = (parsed.actualQty * parsed.smv) / 60;
    }
    if (!parsed.efficiency && parsed.actualSah && parsed.clockHours && parsed.clockHours > 0) {
      parsed.efficiency = (parsed.actualSah / parsed.clockHours) * 100;
    }
    if (parsed.dateString) {
      parsed.month = parsed.dateString.substring(0, 7);
    }
    if (parsed.unitLine && !parsed.unitCode) {
      parsed.unitCode = parsed.unitLine.includes("-") ? parsed.unitLine.split("-")[0] : "B1U2";
    }
    if (parsed.unitCode && !parsed.cluster) {
      parsed.cluster = parsed.unitCode.startsWith("B1") ? "B1" : parsed.unitCode.startsWith("B2") ? "B2" : "Styrax";
    }

    const status = errors.length > 0 ? "ERROR" : warnings.length > 0 ? "WARNING" : "VALID";

    validationResults.push({
      rowIndex: validationResults.length,
      sourceRowIndex: r + 1,
      sheetName,
      status,
      errors,
      warnings,
      raw: row,
      parsed,
    });
  }

  const validCount = validationResults.filter((r) => r.status === "VALID").length;
  const warningCount = validationResults.filter((r) => r.status === "WARNING").length;
  const errorCount = validationResults.filter((r) => r.status === "ERROR").length;

  return {
    totalRows: validationResults.length,
    validCount,
    warningCount,
    errorCount,
    rows: validationResults,
  };
}

// Compute Dynamic Summary KPIs from any list of parsed production records
export function calculateDynamicKpis(records: any[]) {
  let totalActualPcs = 0;
  let totalPlanPcs = 0;
  let totalClockHours = 0;
  let totalActualSah = 0;
  let totalTargetSah = 0;
  let totalFobValue = 0;
  let totalVaValue = 0;
  const uniqueLines = new Set<string>();
  const uniqueBuyers = new Set<string>();
  const uniqueStyles = new Set<string>();
  const clusterCounts: Record<string, number> = {};

  records.forEach((rec) => {
    totalActualPcs += Number(rec.actualQty) || 0;
    totalPlanPcs += Number(rec.targetQty) || 0;
    totalClockHours += Number(rec.clockHours) || 0;
    totalActualSah += Number(rec.actualSah) || 0;
    totalTargetSah += Number(rec.targetSah) || 0;
    totalFobValue += Number(rec.fobValue) || 0;
    totalVaValue += Number(rec.vaValue) || 0;

    if (rec.unitLine) uniqueLines.add(rec.unitLine);
    if (rec.buyer) uniqueBuyers.add(rec.buyer);
    if (rec.style) uniqueStyles.add(rec.style);
    if (rec.cluster) {
      clusterCounts[rec.cluster] = (clusterCounts[rec.cluster] || 0) + 1;
    }
  });

  const overallEfficiency = totalClockHours > 0 ? (totalActualSah / totalClockHours) * 100 : 0;
  const overallAchievement = totalPlanPcs > 0 ? (totalActualPcs / totalPlanPcs) * 100 : 0;
  const variancePcs = totalActualPcs - totalPlanPcs;
  const varianceSah = totalActualSah - totalTargetSah;

  return {
    totalRecords: records.length,
    totalActualPcs,
    totalPlanPcs,
    variancePcs,
    totalClockHours,
    totalActualSah,
    totalTargetSah,
    varianceSah,
    overallEfficiency,
    overallAchievement,
    totalFobValue,
    totalVaValue,
    totalLines: uniqueLines.size,
    totalBuyers: uniqueBuyers.size,
    totalStyles: uniqueStyles.size,
    clusters: Object.keys(clusterCounts),
  };
}
