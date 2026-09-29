import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { analyzeWorksheet, PRODUCTION_SCHEMA_FIELDS } from "@/lib/dynamic-excel-engine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const uploadedBy = (formData.get("uploadedBy") as string) || "Active User";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");
    const ext = file.name.split(".").pop()?.toLowerCase() || "xlsx";

    const wb = XLSX.read(buffer, { type: "buffer", cellDates: false });
    const sheetsAnalysis = wb.SheetNames.map((sheetName) => {
      const ws = wb.Sheets[sheetName];
      return ws ? analyzeWorksheet(ws, sheetName) : null;
    }).filter(Boolean);

    // Create a FileUpload record in PostgreSQL
    const fileUpload = await prisma.fileUpload.create({
      data: {
        fileName: file.name,
        originalName: file.name,
        fileSize: buffer.length,
        fileFormat: ext,
        fileHash,
        status: "PROCESSING",
        totalSheets: wb.SheetNames.length,
        totalRows: sheetsAnalysis.reduce((acc: number, s: any) => acc + (s?.rowCount || 0), 0),
        uploadedBy,
        startedAt: new Date(),
        meta: JSON.stringify({
          sheetNames: wb.SheetNames,
        }),
      },
    });

    // Save FileSheet records
    for (const s of sheetsAnalysis) {
      if (!s) continue;
      await prisma.fileSheet.create({
        data: {
          fileUploadId: fileUpload.id,
          sheetName: s.sheetName,
          rowCount: s.rowCount,
          colCount: s.colCount,
          headerRowIndex: s.headerRowIndex,
          headersJson: JSON.stringify(s.headers),
          sampleDataJson: JSON.stringify(s.sampleRows),
          status: "DETECTED",
        },
      });
    }

    return NextResponse.json({
      success: true,
      fileUploadId: fileUpload.id,
      fileName: file.name,
      fileSize: buffer.length,
      totalSheets: wb.SheetNames.length,
      sheetNames: wb.SheetNames,
      sheets: sheetsAnalysis,
      schemaFields: PRODUCTION_SCHEMA_FIELDS,
    });
  } catch (err: any) {
    console.error("Error in /api/imports/analyze:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
