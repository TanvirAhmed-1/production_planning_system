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
    const fileUploadId = (formData.get("fileUploadId") as string) || "";
    const targetSheet = (formData.get("targetSheet") as string) || "Actual";
    const userEmail = (formData.get("userEmail") as string) || "admin@sqbirichina.com";
    const userName = (formData.get("userName") as string) || "Active User";

    if (!file && !fileUploadId) {
      return NextResponse.json({ error: "No file or fileUploadId provided for commit." }, { status: 400 });
    }

    let buffer: Buffer;
    let fileName = "Uploaded_Workbook.xlsx";

    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      fileName = file.name;
    } else {
      const uploadRecord = await prisma.fileUpload.findUnique({ where: { id: fileUploadId } });
      if (!uploadRecord) {
        return NextResponse.json({ error: "FileUpload record not found." }, { status: 404 });
      }
      fileName = uploadRecord.fileName;
      // Read default reference or stored file
      const fs = await import("fs");
      const path = await import("path");
      const filePath = path.join(process.cwd(), fileName);
      if (fs.existsSync(filePath)) {
        buffer = fs.readFileSync(filePath);
      } else {
        const refPath = path.join(process.cwd(), "Production Monitoring  VA Tracker September'26 Birichina & Styrax.xlsb");
        buffer = fs.readFileSync(refPath);
      }
    }

    const { wb } = inspectWorkbookBuffer(buffer, fileName);
    let ws = wb.Sheets[targetSheet];
    if (!ws) {
      const actualKey = Object.keys(wb.Sheets).find(
        (k) => k.toLowerCase().includes("actual") || k.toLowerCase().includes("report")
      );
      if (actualKey) ws = wb.Sheets[actualKey];
      else ws = wb.Sheets[Object.keys(wb.Sheets)[0]];
    }

    const rawRows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null });
    const validationReport = validateAndSanitizeActualRecords(rawRows, targetSheet);

    // If fileUploadId exists update, else create new FileUpload record
    let targetUploadId = fileUploadId;
    if (!targetUploadId) {
      const newUpload = await prisma.fileUpload.create({
        data: {
          fileName,
          originalName: fileName,
          fileSize: buffer.length,
          fileFormat: fileName.split(".").pop() || "xlsx",
          status: "IMPORTING",
          totalSheets: Object.keys(wb.Sheets).length,
          totalRows: validationReport.totalRows,
          errorRows: validationReport.errorCount,
          uploadedBy: userName,
          startedAt: new Date(),
        },
      });
      targetUploadId = newUpload.id;
    }

    // Execute safe transactional database import
    const importResult = await executeSafeDatabaseImport(validationReport, {
      fileUploadId: targetUploadId,
      isDryRun: false,
      userId: userName,
      userEmail,
      importMode: "INSERT_UPDATE",
    });

    return NextResponse.json({
      success: importResult.success,
      fileUploadId: targetUploadId,
      fileName,
      importResult,
      validationReport: {
        totalRows: validationReport.totalRows,
        validCount: validationReport.validCount,
        errorCount: validationReport.errorCount,
        autoCorrectedCount: validationReport.autoCorrectedCount,
      },
    });
  } catch (err: any) {
    console.error("Database commit error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to commit data to database." },
      { status: 500 }
    );
  }
}
