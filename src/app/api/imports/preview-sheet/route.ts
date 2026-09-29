import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { validateSheetRows, analyzeWorksheet } from "@/lib/dynamic-excel-engine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const sheetName = formData.get("sheetName") as string;
    const mappingJson = formData.get("columnMapping") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!sheetName) {
      return NextResponse.json({ error: "sheetName is required" }, { status: 400 });
    }

    const columnMapping = mappingJson ? JSON.parse(mappingJson) : {};
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const wb = XLSX.read(buffer, { type: "buffer", cellDates: false });
    const ws = wb.Sheets[sheetName];

    if (!ws) {
      return NextResponse.json({ error: `Sheet '${sheetName}' not found in workbook` }, { status: 404 });
    }

    const rawData = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null });
    const analysis = analyzeWorksheet(ws, sheetName);

    const validation = validateSheetRows(
      rawData,
      analysis.headerRowIndex,
      analysis.headers,
      columnMapping,
      sheetName
    );

    return NextResponse.json({
      success: true,
      sheetName,
      totalRows: validation.totalRows,
      validCount: validation.validCount,
      warningCount: validation.warningCount,
      errorCount: validation.errorCount,
      headers: analysis.headers,
      rows: validation.rows.slice(0, 1000), // Return up to 1000 preview rows for high UI performance
    });
  } catch (err: any) {
    console.error("Error in /api/imports/preview-sheet:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
