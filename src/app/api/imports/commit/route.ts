import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileUploadId, rows, importMode = "INSERT_UPDATE", userEmail = "admin@garments.local" } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No records to import" }, { status: 400 });
    }

    const cleanRecords = rows
      .filter((r: any) => r && (r.parsed?.unitLine || r.unitLine) && (r.parsed?.dateString || r.dateString))
      .map((r: any) => {
        const p = r.parsed || r;
        return {
          code: p.code || `${p.dateString}_${p.unitLine}`,
          date: p.dateString ? new Date(p.dateString) : new Date(),
          dateString: p.dateString,
          month: p.month || (p.dateString ? p.dateString.substring(0, 7) : "2026-09"),
          unitLine: p.unitLine,
          unitCode: p.unitCode || (p.unitLine?.includes("-") ? p.unitLine.split("-")[0] : "B1U2"),
          cluster: p.cluster || "B1",
          buyer: p.buyer || null,
          style: p.style || null,
          oc: p.oc || null,
          categoryType: p.categoryType || null,
          productType: p.productType || null,
          fobPrice: Number(p.fobPrice) || 0,
          vaPrice: Number(p.vaPrice) || 0,
          smv: Number(p.smv) || 0,
          actualQty: Number(p.actualQty) || 0,
          targetQty: Number(p.targetQty) || 0,
          varianceQty: (Number(p.actualQty) || 0) - (Number(p.targetQty) || 0),
          mo: Number(p.mo) || 0,
          clockHours: Number(p.clockHours) || 0,
          actualSah: Number(p.actualSah) || 0,
          targetSah: Number(p.targetSah) || 0,
          varianceSah: (Number(p.actualSah) || 0) - (Number(p.targetSah) || 0),
          efficiency: Number(p.efficiency) || 0,
          fobValue: Number(p.fobValue) || 0,
          vaValue: Number(p.vaValue) || 0,
          remarks: p.remarks || null,
          fileUploadId: fileUploadId || null,
        };
      });

    let importedCount = 0;
    const BATCH_SIZE = 1000;

    for (let i = 0; i < cleanRecords.length; i += BATCH_SIZE) {
      const batch = cleanRecords.slice(i, i + BATCH_SIZE);
      const res = await prisma.productionMonitoringRecord.createMany({
        data: batch,
        skipDuplicates: true,
      });
      importedCount += res.count;
    }

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        action: "IMPORT",
        entityType: "ProductionMonitoringRecord",
        entityId: fileUploadId || "MANUAL_COMMIT",
        userEmail,
        details: `Imported ${importedCount} records to PostgreSQL using mode ${importMode}. Total payload: ${rows.length} rows.`,
        newValueJson: JSON.stringify({ importedCount, totalPayload: rows.length }),
      },
    });

    if (fileUploadId) {
      await prisma.fileUpload.update({
        where: { id: fileUploadId },
        data: {
          status: "COMPLETED",
          importedRows: importedCount,
          completedAt: new Date(),
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      importedRows: importedCount,
      totalPayload: rows.length,
      skippedRows: rows.length - importedCount,
      message: `Successfully saved ${importedCount} records into PostgreSQL.`,
    });
  } catch (err: any) {
    console.error("Error in /api/imports/commit:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
