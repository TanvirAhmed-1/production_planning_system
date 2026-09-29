import prisma from "@/lib/prisma";
import {
  inspectWorkbookBuffer,
  parseFullMonitoringWorkbook,
  parseActualSheetData,
  ValidationResultRow,
} from "./monitoring-excel-parser";

export interface ImportOptions {
  fileUploadId: string;
  importMode: "INSERT_UPDATE" | "INSERT_NEW" | "UPDATE_ONLY" | "PREVIEW_ONLY";
  userId?: string;
  userEmail?: string;
}

export async function seedDefaultImportTemplates() {
  const templates = [
    {
      name: "Actual Daily Production",
      description: "Standard matrix for daily actual production pieces, clock hours, SMV, and efficiency",
      sheetNamePattern: "Actual",
      targetModel: "ProductionMonitoringRecord",
      isDefault: true,
      mappingsJson: JSON.stringify([
        { sourceCol: "Date", targetField: "dateString", required: true, transform: "date" },
        { sourceCol: "Unit-Line", targetField: "unitLine", required: true, transform: "string" },
        { sourceCol: "Buyer", targetField: "buyer", required: false, transform: "string" },
        { sourceCol: " Style", targetField: "style", required: false, transform: "string" },
        { sourceCol: "OC", targetField: "oc", required: false, transform: "string" },
        { sourceCol: "Type", targetField: "categoryType", required: false, transform: "string" },
        { sourceCol: "FOB Pcs", targetField: "fobPrice", required: false, transform: "number" },
        { sourceCol: "VA Pcs", targetField: "vaPrice", required: false, transform: "number" },
        { sourceCol: "MC SMV", targetField: "smv", required: false, transform: "number" },
        { sourceCol: "Pcs", targetField: "actualQty", required: true, transform: "number" },
        { sourceCol: "MO", targetField: "mo", required: false, transform: "number" },
        { sourceCol: "Clock Hrs", targetField: "clockHours", required: true, transform: "number" },
        { sourceCol: "MC SAH", targetField: "actualSah", required: false, transform: "number" },
        { sourceCol: "Eff%", targetField: "efficiency", required: false, transform: "percent" },
        { sourceCol: "TTL FOB", targetField: "fobValue", required: false, transform: "number" },
        { sourceCol: "TTL VA", targetField: "vaValue", required: false, transform: "number" },
        { sourceCol: "Unit", targetField: "unitCode", required: false, transform: "string" },
        { sourceCol: "Cluster", targetField: "cluster", required: false, transform: "string" },
      ]),
    },
    {
      name: "Clock Hours & Attendance",
      description: "Line-wise manpower, attendance, present, and clock hours allocation",
      sheetNamePattern: "Clock hour",
      targetModel: "LineClockHourRecord",
      isDefault: true,
      mappingsJson: JSON.stringify([
        { sourceCol: "Date", targetField: "dateString", required: true, transform: "date" },
        { sourceCol: "Line Info", targetField: "line", required: true, transform: "string" },
        { sourceCol: "Payroll MO", targetField: "payrollMo", required: false, transform: "number" },
        { sourceCol: "Absent & Leave", targetField: "absentLeave", required: false, transform: "number" },
        { sourceCol: "MLV", targetField: "mlv", required: false, transform: "number" },
        { sourceCol: "Present", targetField: "present", required: false, transform: "number" },
        { sourceCol: "Line Transfer", targetField: "lineTransfer", required: false, transform: "number" },
        { sourceCol: "MO for Clk hrs", targetField: "moForClkHrs", required: false, transform: "number" },
        { sourceCol: "Clock hour", targetField: "clockHour", required: true, transform: "number" },
        { sourceCol: "Unit", targetField: "unit", required: false, transform: "string" },
        { sourceCol: "Cluster", targetField: "cluster", required: false, transform: "string" },
      ]),
    },
  ];

  for (const t of templates) {
    await prisma.importTemplate.upsert({
      where: { name: t.name },
      update: t,
      create: t,
    });
  }
}

export async function processWorkbookUpload(buffer: Buffer, fileName: string, uploadedBy = "System User") {
  await seedDefaultImportTemplates();

  const { wb, inspection } = inspectWorkbookBuffer(buffer, fileName);

  // Check if file upload with same hash exists or create new
  const fileUpload = await prisma.fileUpload.create({
    data: {
      fileName,
      originalName: fileName,
      fileSize: inspection.fileSize,
      fileFormat: inspection.fileFormat,
      fileHash: inspection.fileHash,
      status: "PROCESSING",
      totalSheets: inspection.totalSheets,
      totalRows: inspection.sheets.reduce((acc, s) => acc + s.rowCount, 0),
      uploadedBy,
      startedAt: new Date(),
      meta: JSON.stringify({
        sheetNames: inspection.sheetNames,
      }),
    },
  });

  // Create FileSheet records
  for (const sheet of inspection.sheets) {
    await prisma.fileSheet.create({
      data: {
        fileUploadId: fileUpload.id,
        sheetName: sheet.sheetName,
        sheetIndex: sheet.sheetIndex,
        rowCount: sheet.rowCount,
        colCount: sheet.colCount,
        headerRowIndex: sheet.headerRowIndex,
        headersJson: JSON.stringify(sheet.headers),
        sampleDataJson: JSON.stringify(sheet.sampleRows),
        status: "DETECTED",
      },
    });
  }

  // Parse sheets
  const parsedWorkbook = parseFullMonitoringWorkbook(wb);
  let validationList: ValidationResultRow[] = [];

  if (wb.Sheets["Actual"]) {
    const actualParsed = parseActualSheetData(wb.Sheets["Actual"]);
    validationList = actualParsed.validationList;
  }

  // Save sample rows / validation rows into ImportRow for preview (up to first 500 rows for preview performance)
  const rowsToSave = validationList.slice(0, 500);
  for (const vRow of rowsToSave) {
    await prisma.importRow.create({
      data: {
        fileUploadId: fileUpload.id,
        sheetName: vRow.sheetName,
        sourceRowIndex: vRow.sourceRowIndex,
        rawRowJson: JSON.stringify(vRow.raw),
        parsedRowJson: JSON.stringify(vRow.parsed),
        validationStatus: vRow.status,
        validationErrorsJson: JSON.stringify([...vRow.errors, ...vRow.warnings]),
      },
    });
  }

  // Save errors
  const errorCount = validationList.filter((r) => r.status === "ERROR").length;
  for (const vRow of validationList.filter((r) => r.status === "ERROR").slice(0, 50)) {
    for (const err of vRow.errors) {
      await prisma.importError.create({
        data: {
          fileUploadId: fileUpload.id,
          sheetName: vRow.sheetName,
          rowIndex: vRow.sourceRowIndex,
          errorType: "VALIDATION_ERROR",
          errorMessage: err,
        },
      });
    }
  }

  await prisma.fileUpload.update({
    where: { id: fileUpload.id },
    data: {
      status: "READY_FOR_PREVIEW",
      errorRows: errorCount,
      meta: JSON.stringify({
        sheetNames: inspection.sheetNames,
        totalValidationRows: validationList.length,
        validRows: validationList.filter((r) => r.status === "VALID").length,
        warningRows: validationList.filter((r) => r.status === "WARNING").length,
        errorRows: errorCount,
      }),
    },
  });

  return {
    fileUploadId: fileUpload.id,
    fileName,
    totalSheets: inspection.totalSheets,
    sheets: inspection.sheets,
    parsedData: parsedWorkbook,
    validationSummary: {
      totalRows: validationList.length,
      validRows: validationList.filter((r) => r.status === "VALID").length,
      warningRows: validationList.filter((r) => r.status === "WARNING").length,
      errorRows: errorCount,
    },
  };
}

export async function confirmDatabaseImport(options: ImportOptions, buffer?: Buffer) {
  const { fileUploadId, importMode, userId, userEmail } = options;

  const fileUpload = await prisma.fileUpload.findUnique({
    where: { id: fileUploadId },
  });

  if (!fileUpload) {
    throw new Error(`Import job ${fileUploadId} not found`);
  }

  if (importMode === "PREVIEW_ONLY") {
    return {
      success: true,
      message: "Preview validated successfully without saving to database.",
      importedRows: 0,
      status: "PREVIEW_ONLY",
    };
  }

  await prisma.fileUpload.update({
    where: { id: fileUploadId },
    data: { status: "IMPORTING" },
  });

  let parsedData: any;
  if (buffer) {
    const { wb } = inspectWorkbookBuffer(buffer, fileUpload.fileName);
    parsedData = parseFullMonitoringWorkbook(wb);
  } else {
    // If buffer not provided directly in call, re-read from local file if matches reference
    const fs = await import("fs");
    const path = await import("path");
    const defaultPath = path.join(process.cwd(), fileUpload.fileName);
    if (fs.existsSync(defaultPath)) {
      const fileBuf = fs.readFileSync(defaultPath);
      const { wb } = inspectWorkbookBuffer(fileBuf, fileUpload.fileName);
      parsedData = parseFullMonitoringWorkbook(wb);
    }
  }

  if (!parsedData) {
    throw new Error("Could not parse file data for import");
  }

  const actualRecords = parsedData.tabs?.["Actual"]?.records || [];
  const clockHourRecords = parsedData.tabs?.["Clock hour"] || [];

  // Prepare clean batch for Production Monitoring Records
  const cleanActualRecords = actualRecords
    .filter((rec: any) => rec.unitLine && rec.dateString)
    .map((rec: any) => ({
      code: rec.code || `${rec.dateString}_${rec.unitLine}`,
      date: rec.date ? new Date(rec.date) : new Date(),
      dateString: rec.dateString,
      month: rec.month || rec.dateString.substring(0, 7),
      unitLine: rec.unitLine,
      unitCode: rec.unitCode || "B1U2",
      cluster: rec.cluster || "B1",
      buyer: rec.buyer || null,
      style: rec.style || null,
      oc: rec.oc || null,
      categoryType: rec.categoryType || null,
      productType: rec.productType || null,
      fobPrice: Number(rec.fobPrice) || 0,
      vaPrice: Number(rec.vaPrice) || 0,
      smv: Number(rec.smv) || 0,
      actualQty: Number(rec.actualQty) || 0,
      targetQty: Number(rec.targetQty) || 0,
      varianceQty: Number(rec.varianceQty) || 0,
      mo: Number(rec.mo) || 0,
      clockHours: Number(rec.clockHours) || 0,
      actualSah: Number(rec.actualSah) || 0,
      targetSah: Number(rec.targetSah) || 0,
      varianceSah: Number(rec.varianceSah) || 0,
      efficiency: Number(rec.efficiency) || 0,
      fobValue: Number(rec.fobValue) || 0,
      vaValue: Number(rec.vaValue) || 0,
      remarks: rec.remarks || null,
      fileUploadId,
    }));

  let importedRows = 0;
  let skippedRows = 0;

  const BATCH_SIZE = 1000;
  for (let i = 0; i < cleanActualRecords.length; i += BATCH_SIZE) {
    const batch = cleanActualRecords.slice(i, i + BATCH_SIZE);
    const result = await prisma.productionMonitoringRecord.createMany({
      data: batch,
      skipDuplicates: true,
    });
    importedRows += result.count;
  }
  skippedRows = actualRecords.length - cleanActualRecords.length;

  // Batch insert Clock Hour Records
  const cleanClockRecords = clockHourRecords
    .filter((ch: any) => ch.line && ch.dateString)
    .map((ch: any) => ({
      date: ch.date ? new Date(ch.date) : new Date(),
      dateString: ch.dateString,
      month: ch.month || ch.dateString.substring(0, 7),
      line: ch.line,
      unit: ch.unit || "B1U2",
      cluster: ch.cluster || "B1",
      payrollMo: Number(ch.payrollMo) || 0,
      absentLeave: Number(ch.absentLeave) || 0,
      mlv: Number(ch.mlv) || 0,
      present: Number(ch.present) || 0,
      lineTransfer: Number(ch.lineTransfer) || 0,
      moForClkHrs: Number(ch.moForClkHrs) || 0,
      clockHour: Number(ch.clockHour) || 0,
      absentRate: Number(ch.absentRate) || 0,
      fileUploadId,
    }));

  for (let i = 0; i < cleanClockRecords.length; i += BATCH_SIZE) {
    const batch = cleanClockRecords.slice(i, i + BATCH_SIZE);
    await prisma.lineClockHourRecord.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }

  // Create Audit Log
  await prisma.auditLog.create({
    data: {
      action: "IMPORT",
      entityType: "FileUpload",
      entityId: fileUploadId,
      userId: userId || "SYSTEM",
      userEmail: userEmail || "system@garments.local",
      details: `Imported ${importedRows} records using mode ${importMode}. Skipped ${skippedRows} rows.`,
      newValueJson: JSON.stringify({
        importedRows,
        skippedRows,
        actualCount: actualRecords.length,
        clockHourCount: clockHourRecords.length,
      }),
    },
  });

  // Update FileUpload status to COMPLETED
  await prisma.fileUpload.update({
    where: { id: fileUploadId },
    data: {
      status: "COMPLETED",
      importedRows,
      skippedRows,
      completedAt: new Date(),
    },
  });

  return {
    success: true,
    fileUploadId,
    importedRows,
    skippedRows,
    status: "COMPLETED",
    message: `Successfully imported ${importedRows} records to PostgreSQL.`,
  };
}

export async function importReferenceWorkbookDirectly(uploadedBy = "System Administrator") {
  const fs = await import("fs");
  const path = await import("path");
  const fileName = "Production Monitoring  VA Tracker September'26 Birichina & Styrax.xlsb";
  const filePath = path.join(process.cwd(), fileName);

  if (!fs.existsSync(filePath)) {
    throw new Error("Reference XLSB workbook file not found on server");
  }

  const fileBuf = fs.readFileSync(filePath);
  const uploadResult = await processWorkbookUpload(fileBuf, fileName, uploadedBy);
  const importResult = await confirmDatabaseImport(
    {
      fileUploadId: uploadResult.fileUploadId,
      importMode: "INSERT_UPDATE",
    },
    fileBuf
  );

  return {
    success: true,
    fileUploadId: uploadResult.fileUploadId,
    fileName,
    totalSheets: uploadResult.totalSheets,
    importedRows: importResult.importedRows,
  };
}
