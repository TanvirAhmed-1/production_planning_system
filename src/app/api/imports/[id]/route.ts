import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fileUpload = await prisma.fileUpload.findUnique({
      where: { id },
      include: {
        sheets: true,
        _count: {
          select: {
            monitoringRecords: true,
            sheets: true,
            errors: true,
            rows: true,
          },
        },
      },
    });

    if (!fileUpload) {
      return NextResponse.json({ error: "File upload not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, fileUpload });
  } catch (err: any) {
    console.error("GET error in /api/imports/[id]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fileUpload = await prisma.fileUpload.findUnique({
      where: { id },
      include: {
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

    if (!fileUpload) {
      return NextResponse.json({ error: "File upload not found" }, { status: 404 });
    }

    const recordsCount = fileUpload._count.monitoringRecords;
    const fileName = fileUpload.fileName;

    // Direct deletion with cascade
    await prisma.$transaction([
      prisma.productionMonitoringRecord.deleteMany({
        where: { fileUploadId: id },
      }),
      prisma.lineClockHourRecord.deleteMany({
        where: { fileUploadId: id },
      }),
      prisma.lossAnalysisRecord.deleteMany({
        where: { fileUploadId: id },
      }),
      prisma.importRow.deleteMany({
        where: { fileUploadId: id },
      }),
      prisma.importError.deleteMany({
        where: { fileUploadId: id },
      }),
      prisma.fileSheet.deleteMany({
        where: { fileUploadId: id },
      }),
      prisma.fileUpload.delete({
        where: { id },
      }),
    ]);

    // Audit Log entry
    await prisma.auditLog.create({
      data: {
        action: "DELETE",
        entityType: "FileUpload",
        entityId: id,
        userEmail: "admin@garments.local",
        details: `Deleted file '${fileName}' (ID: ${id}) and removed ${recordsCount} associated production monitoring records.`,
        oldValueJson: JSON.stringify(fileUpload),
      },
    });

    return NextResponse.json({
      success: true,
      message: `File '${fileName}' and all its associated records were successfully deleted.`,
      deletedId: id,
    });
  } catch (err: any) {
    console.error("DELETE error in /api/imports/[id]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
