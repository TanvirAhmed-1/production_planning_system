import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date"); // YYYY-MM-DD
    const month = searchParams.get("month"); // YYYY-MM
    const unit = searchParams.get("unit");
    const cluster = searchParams.get("cluster");
    const line = searchParams.get("line");
    const buyer = searchParams.get("buyer");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (date) where.dateString = date;
    if (month) where.month = month;
    if (unit) where.unitCode = { contains: unit, mode: "insensitive" };
    if (cluster) where.cluster = cluster;
    if (line) where.unitLine = { contains: line, mode: "insensitive" };
    if (buyer) where.buyer = { contains: buyer, mode: "insensitive" };

    if (search) {
      where.OR = [
        { unitLine: { contains: search, mode: "insensitive" } },
        { buyer: { contains: search, mode: "insensitive" } },
        { style: { contains: search, mode: "insensitive" } },
        { oc: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, records] = await Promise.all([
      prisma.productionMonitoringRecord.count({ where }),
      prisma.productionMonitoringRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ date: "desc" }, { unitLine: "asc" }],
      }),
    ]);

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      records,
    });
  } catch (err: any) {
    console.error("GET error in /api/production/records:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      dateString,
      unitLine,
      buyer,
      style,
      oc,
      categoryType,
      productType,
      fobPrice,
      vaPrice,
      smv,
      actualQty,
      targetQty,
      mo,
      clockHours,
      actualSah,
      targetSah,
      efficiency,
      remarks,
      userEmail,
    } = body;

    if (!dateString || !unitLine) {
      return NextResponse.json(
        { error: "dateString and unitLine are required" },
        { status: 400 }
      );
    }

    const unitCode = unitLine.includes("-") ? unitLine.split("-")[0] : "B1U2";
    const cluster = unitCode.startsWith("B1") ? "B1" : unitCode.startsWith("B2") ? "B2" : "Styrax";
    const month = dateString.substring(0, 7);

    const record = await prisma.productionMonitoringRecord.create({
      data: {
        date: new Date(dateString),
        dateString,
        month,
        unitLine,
        unitCode,
        cluster,
        buyer,
        style,
        oc,
        categoryType,
        productType,
        fobPrice: Number(fobPrice) || 0,
        vaPrice: Number(vaPrice) || 0,
        smv: Number(smv) || 0,
        actualQty: Number(actualQty) || 0,
        targetQty: Number(targetQty) || 0,
        varianceQty: (Number(actualQty) || 0) - (Number(targetQty) || 0),
        mo: Number(mo) || 0,
        clockHours: Number(clockHours) || 0,
        actualSah: Number(actualSah) || 0,
        targetSah: Number(targetSah) || 0,
        varianceSah: (Number(actualSah) || 0) - (Number(targetSah) || 0),
        efficiency: Number(efficiency) || 0,
        remarks,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        entityType: "ProductionMonitoringRecord",
        entityId: record.id,
        userEmail: userEmail || "system@garments.local",
        details: `Created new production record for Line ${unitLine} on ${dateString}`,
        newValueJson: JSON.stringify(record),
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (err: any) {
    console.error("POST error in /api/production/records:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, userEmail, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Record ID is required" }, { status: 400 });
    }

    const oldRecord = await prisma.productionMonitoringRecord.findUnique({
      where: { id },
    });

    if (!oldRecord) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    const updated = await prisma.productionMonitoringRecord.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        entityType: "ProductionMonitoringRecord",
        entityId: id,
        userEmail: userEmail || "system@garments.local",
        details: `Updated production record for Line ${updated.unitLine} on ${updated.dateString}`,
        oldValueJson: JSON.stringify(oldRecord),
        newValueJson: JSON.stringify(updated),
      },
    });

    return NextResponse.json({ success: true, record: updated });
  } catch (err: any) {
    console.error("PATCH error in /api/production/records:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userEmail = searchParams.get("userEmail") || "system@garments.local";

    if (!id) {
      return NextResponse.json({ error: "Record ID is required" }, { status: 400 });
    }

    const oldRecord = await prisma.productionMonitoringRecord.findUnique({
      where: { id },
    });

    if (!oldRecord) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    await prisma.productionMonitoringRecord.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        action: "DELETE",
        entityType: "ProductionMonitoringRecord",
        entityId: id,
        userEmail,
        details: `Deleted production record for Line ${oldRecord.unitLine} on ${oldRecord.dateString}`,
        oldValueJson: JSON.stringify(oldRecord),
      },
    });

    return NextResponse.json({ success: true, message: "Record deleted successfully" });
  } catch (err: any) {
    console.error("DELETE error in /api/production/records:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
