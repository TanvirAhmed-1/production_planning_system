import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

export const dynamic = "force-dynamic";

function formatExcelDate(serial: any): string {
  if (typeof serial === "number" && serial > 40000 && serial < 55000) {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    const d = date_info.getDate();
    const m = date_info.toLocaleString("en-US", { month: "short" });
    const y = String(date_info.getFullYear()).slice(-2);
    return `${d}-${m}-${y}`;
  }
  return String(serial || "");
}

function parseSummarySheet(rawData: any[][]) {
  const company = rawData[1]?.[1] || "SQ Birichina Ltd.";
  const title = rawData[2]?.[1] || "Snap Shot of Unitwise Performance & Efficiency Trend";
  const dateSerial = rawData[3]?.[2];
  const dateStr = formatExcelDate(dateSerial) || "26-Sep-26";

  const parseTableBlock = (startRow: number, groupName: string) => {
    const planRow = rawData[startRow + 2] || [];
    const revPlanRow = rawData[startRow + 3] || [];
    const actualRow = rawData[startRow + 4] || [];
    const varRow = rawData[startRow + 5] || [];

    const mapMetricRow = (r: any[], label: string) => {
      return {
        label,
        day: {
          mds: Number(r[2] || 0),
          clkHrs: Number(r[3] || 0),
          pcs: Number(r[4] || 0),
          sah: Number(r[5] || 0),
          eff: Number(r[6] || 0),
          epmd: Number(r[7] || 0),
        },
        mtd: {
          mds: Number(r[9] || 0),
          clkHrs: Number(r[10] || 0),
          pcs: Number(r[11] || 0),
          sah: Number(r[12] || 0),
          eff: Number(r[13] || 0),
          epmd: Number(r[14] || 0),
        },
      };
    };

    return {
      groupName,
      dateStr,
      rows: [
        mapMetricRow(planRow, "Sign Off - Plan"),
        mapMetricRow(revPlanRow, "Rev. Sign off Plan"),
        mapMetricRow(actualRow, "Actual"),
        mapMetricRow(varRow, "Variance (Actual vs Rev.Sign off)"),
      ],
    };
  };

  // Main factory 4 blocks
  const mainBlocks = [
    parseTableBlock(5, "Birichina"),
    parseTableBlock(12, "Styrax"),
    parseTableBlock(19, "Birichina - 1"),
    parseTableBlock(26, "Birichina - 2"),
  ];

  // Unit-wise blocks
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

  // Efficiency Trend Day-by-Day Bars (rows 113 to 144)
  const trendDays: any[] = [];
  for (let r = 114; r <= 144; r++) {
    const row = rawData[r] || [];
    const daySerial = row[21];
    if (!daySerial) continue;
    const dayLabel = formatExcelDate(daySerial);

    trendDays.push({
      dateStr: dayLabel,
      b1u2: Number(row[22] || 0),
      b1u3: Number(row[23] || 0),
      b1u4: Number(row[24] || 0),
      b2u1: Number(row[25] || 0),
      b2u2: Number(row[26] || 0),
      b2u3: Number(row[27] || 0),
      b1: Number(row[28] || 0),
      b2: Number(row[29] || 0),
      birichina: Number(row[30] || 0),
      s1u1: Number(row[31] || 0),
      s1u2: Number(row[32] || 0),
      s1u3: Number(row[33] || 0),
      s1u4: Number(row[34] || 0),
      styrax: Number(row[35] || 0),
    });
  }

  return {
    company,
    title,
    dateStr,
    mainBlocks,
    unitBlocks,
    trendDays,
  };
}

function parseReportSheet(rawData: any[][]) {
  const company = rawData[0]?.[2] || rawData[0]?.[1] || "SQ Birichina Ltd.";
  const title = rawData[1]?.[2] || rawData[1]?.[1] || "Daily Production Monitoring Report";
  const dateSerial = rawData[2]?.[3] || rawData[2]?.[2];
  const dateStr = formatExcelDate(dateSerial) || "26-Sep-26";

  const rows: any[] = [];
  for (let r = 5; r < rawData.length; r++) {
    const row = rawData[r] || [];
    const line = row[2];
    if (!line || typeof line !== "string") continue;
    if (line.trim() === "Unit-Line") continue;

    const isSubtotal = !row[3] || line.length <= 6 || line.toLowerCase().includes("total") || line.toLowerCase().includes("birichina");

    rows.push({
      id: r,
      unitLine: line.trim(),
      isSubtotal,
      buyer: row[3] || "",
      style: row[4] || "",
      type: row[5] || "",
      status: row[6] !== undefined && row[6] !== null ? (typeof row[6] === "number" && row[6] < 1 ? Number(row[6]).toFixed(2) : String(row[6])) : "",
      runDays: row[7] !== undefined && row[7] !== null ? (typeof row[7] === "number" && row[7] < 1 ? Number(row[7]).toFixed(2) : String(row[7])) : "",
      smv: row[8] !== undefined && row[8] !== null && row[8] !== "" ? Number(row[8]) : null,
      dayPlan: {
        md: Number(row[9] || 0),
        availHrs: Number(row[10] || 0),
        sah: Number(row[11] || 0),
        pcs: Number(row[12] || 0),
        eff: Number(row[13] || 0),
      },
      dayActual: {
        md: Number(row[14] || 0),
        availHrs: Number(row[15] || 0),
        sah: Number(row[16] || 0),
        pcs: Number(row[17] || 0),
        eff: Number(row[18] || 0),
      },
      dayVar: {
        md: Number(row[19] || 0),
        availHrs: Number(row[20] || 0),
        sah: Number(row[21] || 0),
        pcs: Number(row[22] || 0),
        eff: Number(row[23] || 0),
      },
      planMtd: {
        md: Number(row[24] || 0),
        availHrs: Number(row[25] || 0),
        sah: Number(row[26] || 0),
        pcs: Number(row[27] || 0),
        eff: Number(row[28] || 0),
      },
      actMtd: {
        md: Number(row[29] || 0),
        availHrs: Number(row[30] || 0),
        sah: Number(row[31] || 0),
        pcs: Number(row[32] || 0),
        eff: Number(row[33] || 0),
      },
      varMtd: {
        md: Number(row[34] || 0),
        availHrs: Number(row[35] || 0),
        sah: Number(row[36] || 0),
        pcs: Number(row[37] || 0),
        eff: Number(row[38] || 0),
      },
    });
  }

  return {
    company,
    title,
    dateStr,
    rows,
  };
}

function parseLossTimeSheet(rawData: any[][], title: string) {
  const blocks: { unitName: string; days: any[]; rows: any[] }[] = [];
  let currentUnitName = String(rawData[0]?.[2] || rawData[0]?.[1] || "Main").trim();

  let r = 0;
  while (r < rawData.length) {
    const row = rawData[r] || [];
    const val2 = String(row[2] || "").trim();
    
    // Check if it's a unit header block (e.g. "B1U2", "Birichina 01")
    if (val2 && !val2.toLowerCase().includes("department") && !val2.toLowerCase().includes("date") && !val2.toLowerCase().includes("lost") && row.filter(c => c !== null && c !== undefined && c !== "").length <= 3) {
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
        const formatted = formatExcelDate(cell);
        days.push({ colIdx: c, label: formatted || `Day ${c - 3}`, dateStr: String(cell) });
      }
      
      const blockRows = [];
      r++;
      while (r < rawData.length) {
        const bRow = rawData[r] || [];
        const dept = bRow[2] || bRow[1];
        const code = bRow[3] || bRow[2];
        
        if (!dept && !code) break;
        
        const dayValues = days.map(d => Number(bRow[d.colIdx] || 0));
        const total = totalColIdx !== -1 ? Number(bRow[totalColIdx] || 0) : dayValues.reduce((a, b) => a + b, 0);
        const percentage = totalColIdx !== -1 ? Number(bRow[totalColIdx + 1] || 0) * 100 : 0;
        
        blockRows.push({
          id: r,
          department: String(dept || "").trim(),
          code: String(code || "").trim(),
          dayValues,
          total,
          percentage
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

  // To be compatible with current UI or single view mode, we keep days/rows of first block at top level
  // and pass blocks array too.
  const mainDays = blocks.length > 0 ? blocks[0].days : [];
  const mainRows = blocks.length > 0 ? blocks[0].rows : [];

  return { title, blocks, days: mainDays, rows: mainRows };
}

function parseLossHrAnalysis(rawData: any[][], title: string) {
  const tables: any[] = [];
  let r = 0;
  
  while (r < rawData.length) {
    const row = rawData[r] || [];
    const strValues = row.filter(c => typeof c === 'string' && c.trim() !== '');
    
    // Detect table title
    if (strValues.length === 1 && !strValues[0].toLowerCase().includes('total') && !strValues[0].toLowerCase().includes('birichina 01')) {
      const tableTitle = strValues[0].trim();
      r++;
      
      // Find header row
      while (r < rawData.length && (!rawData[r] || rawData[r].filter(c => c !== null && c !== undefined && c !== '').length === 0)) {
        r++;
      }
      
      if (r >= rawData.length) break;
      
      const headerRow = rawData[r];
      const startCol = headerRow.findIndex(c => typeof c === 'string' && c.trim() !== '');
      if (startCol === -1) {
        r++;
        continue;
      }
      
      const headers = [];
      for(let c = startCol; c < headerRow.length; c++) {
        if(headerRow[c]) headers.push({ colIdx: c, label: String(headerRow[c]).trim() });
      }
      
      r++;
      const dataRows = [];
      while (r < rawData.length) {
        const dRow = rawData[r] || [];
        const firstCell = String(dRow[startCol] || '').trim();
        const secondCell = String(dRow[startCol+1] || '').trim();
        
        if (!firstCell && !secondCell) break; // End of table
        
        const rowData: any = {};
        let isTotal = false;
        headers.forEach(h => {
          let val = dRow[h.colIdx];
          if (typeof val === 'number' && (h.label === '%' || h.label === 'Share')) val = val * 100;
          rowData[h.label] = val;
          if (String(val).toLowerCase() === 'total') isTotal = true;
        });
        
        dataRows.push({ ...rowData, isTotal });
        
        if (isTotal) {
          r++;
          break; // Total marks end of table usually
        }
        r++;
      }
      
      tables.push({ title: tableTitle, headers: headers.map(h => h.label), rows: dataRows });
    } else {
      r++;
    }
  }

  return { title, tables };
}



function parseWorkbook(wb: XLSX.WorkBook) {
  const result: any = {
    sheetNames: wb.SheetNames,
    tabs: {},
  };

  if (wb.Sheets["Summary"]) {
    const rawData = XLSX.utils.sheet_to_json<any[]>(wb.Sheets["Summary"], { header: 1 });
    result.tabs["Summary"] = parseSummarySheet(rawData);
  }

  if (wb.Sheets["Report"]) {
    const rawData = XLSX.utils.sheet_to_json<any[]>(wb.Sheets["Report"], { header: 1 });
    result.tabs["Report"] = parseReportSheet(rawData);
  }

  if (wb.Sheets["B1 - Loss Time"]) {
    const rawData = XLSX.utils.sheet_to_json<any[]>(wb.Sheets["B1 - Loss Time"], { header: 1 });
    result.tabs["B1 - Loss Time"] = parseLossTimeSheet(rawData, "Birichina 01 - Unit 2, 3, 4");
  }

  if (wb.Sheets["B2 - Loss Time"]) {
    const rawData = XLSX.utils.sheet_to_json<any[]>(wb.Sheets["B2 - Loss Time"], { header: 1 });
    result.tabs["B2 - Loss Time"] = parseLossTimeSheet(rawData, "Birichina 02");
  }

  const styraxLossKey = wb.SheetNames.find(s => s.toLowerCase().includes("styrax") && s.toLowerCase().includes("loss time"));
  if (styraxLossKey && wb.Sheets[styraxLossKey]) {
    const rawData = XLSX.utils.sheet_to_json<any[]>(wb.Sheets[styraxLossKey], { header: 1 });
    result.tabs["Styrax- Loss Time"] = parseLossTimeSheet(rawData, "Styrax Apparels");
  }

  if (wb.Sheets["B1 - Loss Hr. Analysis"]) {
    const rawData = XLSX.utils.sheet_to_json<any[]>(wb.Sheets["B1 - Loss Hr. Analysis"], { header: 1 });
    result.tabs["B1 - Loss Hr. Analysis"] = parseLossHrAnalysis(rawData, "B1 Unit Breakdown");
  }

  if (wb.Sheets["B2 - Loss Hr. Analysis"]) {
    const rawData = XLSX.utils.sheet_to_json<any[]>(wb.Sheets["B2 - Loss Hr. Analysis"], { header: 1 });
    result.tabs["B2 - Loss Hr. Analysis"] = parseLossHrAnalysis(rawData, "B2 Unit Breakdown");
  }

  const styraxAnalysisKey = wb.SheetNames.find(s => s.toLowerCase().includes("styrax") && s.toLowerCase().includes("loss hr"));
  if (styraxAnalysisKey && wb.Sheets[styraxAnalysisKey]) {
    const rawData = XLSX.utils.sheet_to_json<any[]>(wb.Sheets[styraxAnalysisKey], { header: 1 });
    result.tabs["Styrax - Loss Hr. Analysis"] = parseLossHrAnalysis(rawData, "Styrax Analysis");
  }

  return result;
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "Production Monitoring  VA Tracker September'26 Birichina & Styrax.xlsb");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const wb = XLSX.read(fileBuffer, { type: "buffer" });
    const parsedData = parseWorkbook(wb);

    return NextResponse.json({
      success: true,
      fileName: "Production Monitoring  VA Tracker September'26 Birichina & Styrax.xlsb",
      data: parsedData,
    });
  } catch (err: any) {
    console.error("GET error in va-tracker API:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const wb = XLSX.read(buffer, { type: "buffer" });
    const parsedData = parseWorkbook(wb);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      data: parsedData,
    });
  } catch (err: any) {
    console.error("POST error in va-tracker API:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
