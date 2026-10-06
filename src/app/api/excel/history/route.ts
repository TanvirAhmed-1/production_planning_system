import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const db = prisma as any;
    const batches = await db.importBatch.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        parentPlan: {
          select: { id: true, fileName: true, month: true }
        },
        actualBatches: {
          select: { id: true, fileName: true, importedRows: true, createdAt: true }
        },
        _count: {
          select: {
            orders: true,
            dailyRecords: true
          }
        }
      }
    });
    return NextResponse.json(batches);
  } catch (err: any) {
    console.error('History API Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch import history' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = prisma as any;
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get('id');

    if (!batchId) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
    }

    const targetBatch = await db.importBatch.findUnique({
      where: { id: batchId },
      include: { actualBatches: true }
    });

    if (!targetBatch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // 1. If deleting a PLAN batch (Parent):
    if (targetBatch.batchType !== 'ACTUAL') {
      // Find all child actual batches
      const extraChildBatches = await db.importBatch.findMany({
        where: { planBatchId: batchId },
        select: { id: true }
      });
      const childBatchIds = Array.from(
        new Set([...(targetBatch.actualBatches || []).map((b: any) => b.id), ...extraChildBatches.map((b: any) => b.id)])
      );

      // Delete child actual records
      if (childBatchIds.length > 0) {
        await db.productionActualRecord.deleteMany({
          where: { importBatchId: { in: childBatchIds } }
        });
        await db.importBatch.deleteMany({
          where: { id: { in: childBatchIds } }
        });
      }

      // Delete all actual records pointing directly to this plan batch
      await db.productionActualRecord.deleteMany({
        where: {
          OR: [
            { planBatchId: batchId },
            { importBatchId: batchId }
          ]
        }
      });

      // Delete all daily records linked to this batch or orders in this batch
      await db.productionDaily.deleteMany({
        where: {
          OR: [
            { importBatchId: batchId },
            { order: { importBatchId: batchId } }
          ]
        }
      });

      // Delete orders of this plan batch
      await db.order.deleteMany({ where: { importBatchId: batchId } });

      // Delete the plan batch record
      await db.importBatch.delete({ where: { id: batchId } });

      return NextResponse.json({
        success: true,
        message: `Plan "${targetBatch.fileName}" and all its ${childBatchIds.length} linked actual production batches and records were deleted successfully.`
      });
    }

    // 2. If deleting an ACTUAL batch (Child):
    const planBatchId = targetBatch.planBatchId;

    // Delete raw actual records
    await db.productionActualRecord.deleteMany({ where: { importBatchId: batchId } });

    // Reset daily records associated with the parent plan batch back to 0 actual output in 1 fast query
    if (planBatchId) {
      await db.productionDaily.updateMany({
        where: { importBatchId: planBatchId },
        data: {
          actualQty: 0,
          actualSah: 0,
          achievementRate: 0
        }
      });
    }

    // Delete standalone actual daily records created by this actual batch
    await db.productionDaily.deleteMany({ where: { importBatchId: batchId } });

    // Finally delete the actual batch record
    await db.importBatch.delete({ where: { id: batchId } });

    return NextResponse.json({
      success: true,
      message: `Actual production batch "${targetBatch.fileName}" deleted and plan metrics were reset.`
    });
  } catch (err: any) {
    console.error('Batch Delete Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete batch' }, { status: 500 });
  }
}
