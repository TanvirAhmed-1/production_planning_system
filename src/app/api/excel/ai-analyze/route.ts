import { NextRequest, NextResponse } from "next/server";
import { inspectWorkbookBuffer } from "@/lib/monitoring-excel-parser";
import { analyzeWorkbookWithGemini } from "@/lib/gemini-ai-analyzer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided for AI analysis." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Inspect workbook structure
    const { wb, inspection } = inspectWorkbookBuffer(buffer, file.name);

    // Prepare sheets summary for AI prompt
    const sheetsSummary = inspection.sheets.map((s) => ({
      sheetName: s.sheetName,
      sheetIndex: s.sheetIndex,
      rowCount: s.rowCount,
      colCount: s.colCount,
      sampleHeaders: s.headers,
      sampleRows: s.sampleRows.slice(0, 5),
    }));

    // Run Gemini AI Analysis
    const aiAnalysis = await analyzeWorkbookWithGemini(file.name, sheetsSummary);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileSize: inspection.fileSize,
      fileFormat: inspection.fileFormat,
      totalSheets: inspection.totalSheets,
      sheets: inspection.sheets,
      aiAnalysis,
    });
  } catch (err: any) {
    console.error("AI Analysis error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to analyze workbook with AI." },
      { status: 500 }
    );
  }
}
