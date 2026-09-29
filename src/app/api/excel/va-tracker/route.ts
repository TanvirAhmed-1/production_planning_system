import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import prisma from "@/lib/prisma";
import {
  parseFullMonitoringWorkbook,
  inspectWorkbookBuffer,
} from "@/lib/monitoring-excel-parser";
import {
  processWorkbookUpload,
  confirmDatabaseImport,
  importReferenceWorkbookDirectly,
} from "@/lib/monitoring-import-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId") || searchParams.get("fileUploadId");
    const action = searchParams.get("action");
    const isReferenceExplicit = searchParams.get("reference") === "true";

    // Action: Seed/Import the default Reference Workbook into Database
    if (action === "seed-reference") {
      const seedResult = await importReferenceWorkbookDirectly("System Admin");
      return NextResponse.json({
        success: true,
        message: "Reference workbook successfully imported into database!",
        seedResult,
      });
    }

    // Fetch all uploaded files currently existing in the database
    const fileUploads = await prisma.fileUpload.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        sheets: {
          select: {
            id: true,
            sheetName: true,
            sheetIndex: true,
            rowCount: true,
            colCount: true,
          },
        },
        _count: {
          select: {
            monitoringRecords: true,
            sheets: true,
            rows: true,
            errors: true,
          },
        },
      },
    });

    const [totalRecordCount, totalFileUploadCount, totalClockHourCount] = await Promise.all([
      prisma.productionMonitoringRecord.count(),
      prisma.fileUpload.count(),
      prisma.lineClockHourRecord.count(),
    ]);

    const dbStats = {
      recordCount: totalRecordCount,
      fileUploadCount: totalFileUploadCount,
      clockHourCount: totalClockHourCount,
    };

    // If NO files exist in database and user has not explicitly requested reference preview
    if (fileUploads.length === 0 && !isReferenceExplicit) {
      return NextResponse.json({
        success: true,
        hasFiles: false,
        activeFileUpload: null,
        fileUploads: [],
        fileName: null,
        data: null,
        dbStats: {
          recordCount: 0,
          fileUploadCount: 0,
          clockHourCount: 0,
        },
      });
    }

    // Determine the active file upload
    let activeFileUpload = null;
    let fileName = "Production Monitoring  VA Tracker September'26 Birichina & Styrax.xlsb";

    if (fileUploads.length > 0) {
      if (fileId && fileId !== "all" && fileId !== "reference") {
        activeFileUpload = fileUploads.find((f) => f.id === fileId) || fileUploads[0];
      } else {
        activeFileUpload = fileUploads[0];
      }
      fileName = activeFileUpload.fileName;
    }

    // Load workbook data for the active file
    const filePath = path.join(process.cwd(), fileName);
    let parsedData = null;

    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      const { wb } = inspectWorkbookBuffer(fileBuffer, fileName);
      parsedData = parseFullMonitoringWorkbook(wb);
    } else {
      // If specific file not directly on server root, fallback to reference workbook structure
      const refPath = path.join(
        process.cwd(),
        "Production Monitoring  VA Tracker September'26 Birichina & Styrax.xlsb"
      );
      if (fs.existsSync(refPath)) {
        const fileBuffer = fs.readFileSync(refPath);
        const { wb } = inspectWorkbookBuffer(fileBuffer, "Production Monitoring  VA Tracker September'26 Birichina & Styrax.xlsb");
        parsedData = parseFullMonitoringWorkbook(wb);
      }
    }

    return NextResponse.json({
      success: true,
      hasFiles: fileUploads.length > 0,
      activeFileUpload,
      fileUploads,
      fileName,
      data: parsedData,
      dbStats,
    });
  } catch (err: any) {
    console.error("GET error in va-tracker API:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryAction = searchParams.get("action");

    if (queryAction === "seed-reference") {
      const seedResult = await importReferenceWorkbookDirectly("System Admin");
      return NextResponse.json({
        success: true,
        message: "Reference workbook successfully imported into database!",
        seedResult,
      });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const action = (formData.get("action") as string) || "preview"; // "preview" or "import"
    const importMode = ((formData.get("importMode") as string) || "INSERT_UPDATE") as any;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process upload through import service
    const uploadResult = await processWorkbookUpload(buffer, file.name, "Active User");

    if (action === "import") {
      const importResult = await confirmDatabaseImport(
        {
          fileUploadId: uploadResult.fileUploadId,
          importMode,
        },
        buffer
      );

      return NextResponse.json({
        success: true,
        fileName: file.name,
        fileUploadId: uploadResult.fileUploadId,
        data: uploadResult.parsedData,
        importResult,
      });
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileUploadId: uploadResult.fileUploadId,
      data: uploadResult.parsedData,
      validationSummary: uploadResult.validationSummary,
      sheets: uploadResult.sheets,
    });
  } catch (err: any) {
    console.error("POST error in va-tracker API:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
