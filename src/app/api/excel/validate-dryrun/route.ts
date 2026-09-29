import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import prisma from "@/lib/prisma";
import { inspectWorkbookBuffer } from "@/lib/monitoring-excel-parser";
import { validateAndSanitizeActualRecords } from "@/lib/excel-validation-engine";
import { executeSafeDatabaseImport } from "@/lib/safe-database-importer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const targetSheet = (formData.get("targetSheet") as string) || "Actual";

    if (!file) {
      return NextResponse.json({ error: "No file provided for validation." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Inspect workbook
    const { wb, inspection } = inspectWorkbookBuffer(buffer, file.name);

    // Pick target sheet or fallback to first available sheet with production rows
    let ws = wb.Sheets[targetSheet];
    if (!ws) {
      const actualKey = Object.keys(wb.Sheets).find(
        (k) => k.toLowerCase().includes("actual") || k.toLowerCase().includes("report")
      );
      if (actualKey) ws = wb.Sheets[actualKey];
      else ws = wb.Sheets[Object.keys(wb.Sheets)[0]];
    }

    const rawRows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null });

    // Run deterministic validation & auto-correction
    const validationReport = validateAndSanitizeActualRecords(rawRows, targetSheet);

    // Create FileUpload record in database with PENDING status for preview
    const fileUpload = await prisma.fileUpload.create({
      data: {
        fileName: file.name,
        originalName: file.name,
        fileSize: inspection.fileSize,
        fileFormat: inspection.fileFormat,
        fileHash: inspection.fileHash,
        status: "READY_FOR_PREVIEW",
        totalSheets: inspection.totalSheets,
        totalRows: validationReport.totalRows,
        errorRows: validationReport.errorCount,
        importMode: "PREVIEW_ONLY",
        meta: JSON.stringify({
          sheetNames: inspection.sheetNames,
          subtotalIntegrity: validationReport.subtotalIntegrity,
        }),
      },
    });

    // Run dry-run simulation
    const dryRunResult = await executeSafeDatabaseImport(validationReport, {
      fileUploadId: fileUpload.id,
      isDryRun: true,
      importMode: "PREVIEW_ONLY",
    });

    return NextResponse.json({
      success: true,
      fileUploadId: fileUpload.id,
      fileName: file.name,
      inspection,
      validationReport: {
        ...validationReport,
        // Send first 200 sanitized records for fast preview rendering
        sanitizedRecords: validationReport.sanitizedRecords.slice(0, 200),
        totalSanitizedCount: validationReport.sanitizedRecords.length,
      },
      dryRunResult,
    });
  } catch (err: any) {
    console.error("Dry-run validation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to validate workbook." },
      { status: 500 }
    );
  }
}
