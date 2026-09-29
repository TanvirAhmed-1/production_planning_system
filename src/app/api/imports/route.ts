import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const skip = (page - 1) * limit;

    const [total, imports] = await Promise.all([
      prisma.fileUpload.count(),
      prisma.fileUpload.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          sheets: true,
          _count: {
            select: {
              errors: true,
              monitoringRecords: true,
              sheets: true,
              rows: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      imports,
    });
  } catch (err: any) {
    console.error("GET error in /api/imports:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const clearAll = searchParams.get("all") === "true" || searchParams.get("clearAll") === "true";

    if (clearAll) {
      // Clear all file uploads and all monitoring records
      const [records, clock, loss, uploads] = await prisma.$transaction([
        prisma.productionMonitoringRecord.deleteMany({}),
        prisma.lineClockHourRecord.deleteMany({}),
        prisma.lossAnalysisRecord.deleteMany({}),
        prisma.importRow.deleteMany({}),
        prisma.importError.deleteMany({}),
        prisma.fileSheet.deleteMany({}),
        prisma.fileUpload.deleteMany({}),
      ]);

      await prisma.auditLog.create({
        data: {
          action: "DELETE_ALL",
          entityType: "FileUpload",
          userEmail: "admin@garments.local",
          details: "Cleared all file uploads and associated production records.",
        },
      });

      return NextResponse.json({
        success: true,
        message: "All file uploads and associated records have been completely deleted.",
      });
    }

    if (!id) {
      return NextResponse.json({ error: "Import ID or all=true is required" }, { status: 400 });
    }

    const fileUpload = await prisma.fileUpload.findUnique({
      where: { id },
      include: {
        _count: {
          select: { monitoringRecords: true },
        },
      },
    });

    if (!fileUpload) {
      return NextResponse.json({ error: "File upload not found" }, { status: 404 });
    }

    const recordsCount = fileUpload._count.monitoringRecords;
    const fileName = fileUpload.fileName;

    await prisma.$transaction([
      prisma.productionMonitoringRecord.deleteMany({ where: { fileUploadId: id } }),
      prisma.lineClockHourRecord.deleteMany({ where: { fileUploadId: id } }),
      prisma.lossAnalysisRecord.deleteMany({ where: { fileUploadId: id } }),
      prisma.importRow.deleteMany({ where: { fileUploadId: id } }),
      prisma.importError.deleteMany({ where: { fileUploadId: id } }),
      prisma.fileSheet.deleteMany({ where: { fileUploadId: id } }),
      prisma.fileUpload.delete({ where: { id } }),
    ]);

    await prisma.auditLog.create({
      data: {
        action: "DELETE",
        entityType: "FileUpload",
        entityId: id,
        userEmail: "admin@garments.local",
        details: `Deleted file '${fileName}' (ID: ${id}) and removed ${recordsCount} associated records.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `File '${fileName}' and all its associated records were successfully deleted.`,
      deletedId: id,
    });
  } catch (err: any) {
    console.error("DELETE error in /api/imports:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
