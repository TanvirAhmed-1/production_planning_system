import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const db = prisma as any;
    const rawBatches: any[] = await db.$queryRawUnsafe(`
      SELECT id, "batchType", "planBatchId", "fileName", "fileSize", "month", 
             "totalRows", "importedRows", "skippedRows", status, summary, "createdAt" 
      FROM import_batches 
      ORDER BY "createdAt" DESC 
      LIMIT 50
    `);

    let countMap = new Map<string, any>();
    try {
      const counts = await db.importBatch.findMany({
        select: {
          id: true,
          _count: {
            select: {
              orders: true,
              dailyRecords: true
            }
          }
        }
      });
      countMap = new Map(counts.map((c: any) => [c.id, c._count]));
    } catch {
      // ignore count lookup error if any
    }

    const batchMap = new Map(rawBatches.map(b => [b.id, b]));

    const result = rawBatches.map(b => {
      let planId = b.planBatchId;
      let planName = null;

      if (!planId && b.summary) {
        try {
          const s = JSON.parse(b.summary);
          if (s.planBatchId) planId = s.planBatchId;
          if (s.planName) planName = s.planName;
        } catch {
          // ignore
        }
      }

      const parent = planId
        ? batchMap.get(planId) || (planName ? { id: planId, fileName: planName, month: b.month } : null)
        : null;

      return {
        ...b,
        _count: countMap.get(b.id) || { orders: 0, dailyRecords: 0 },
        parentPlan: parent
          ? {
              id: parent.id,
              fileName: parent.fileName || planName || 'Production Plan',
              month: parent.month || b.month
            }
          : null,
        actualBatches: rawBatches
          .filter(child => {
            if (child.planBatchId === b.id) return true;
            try {
              const s = child.summary ? JSON.parse(child.summary) : {};
              return s.planBatchId === b.id;
            } catch {
              return false;
            }
          })
          .map(child => ({
            id: child.id,
            fileName: child.fileName,
            importedRows: child.importedRows,
            createdAt: child.createdAt
          }))
      };
    });

    return NextResponse.json(result);
  } catch (err: any) {
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
      where: { id: batchId }
    });

    if (!targetBatch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // 1. If deleting a PLAN batch (Parent):
    if (targetBatch.batchType !== 'ACTUAL') {
      // Find all child actual batches
      let childBatchIds: string[] = [];
      try {
        const childBatches = await db.importBatch.findMany({
          where: { planBatchId: batchId },
          select: { id: true }
        });
        childBatchIds = childBatches.map((b: any) => b.id);
      } catch {
        const rawChildren: any[] = await db.$queryRawUnsafe(
          'SELECT id FROM import_batches WHERE "planBatchId" = $1',
          batchId
        );
        childBatchIds = rawChildren.map(b => b.id);
      }

      // Delete child actual records
      if (childBatchIds.length > 0) {
        try {
          await db.productionActualRecord.deleteMany({
            where: { importBatchId: { in: childBatchIds } }
          });
        } catch {
          await db.$executeRawUnsafe(
            'DELETE FROM production_actual_records WHERE "importBatchId" = ANY($1)',
            childBatchIds
          );
        }
        await db.importBatch.deleteMany({
          where: { id: { in: childBatchIds } }
        });
      }

      // Delete all actual records pointing directly to this plan batch
      try {
        await db.productionActualRecord.deleteMany({
          where: {
            OR: [
              { planBatchId: batchId },
              { importBatchId: batchId }
            ]
          }
        });
      } catch {
        await db.$executeRawUnsafe(
          'DELETE FROM production_actual_records WHERE "planBatchId" = $1 OR "importBatchId" = $1',
          batchId
        );
      }

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
    // Delete actual records created by this batch
    try {
      await db.productionActualRecord.deleteMany({
        where: { importBatchId: batchId }
      });
    } catch {
      await db.$executeRawUnsafe(
        'DELETE FROM production_actual_records WHERE "importBatchId" = $1',
        batchId
      );
    }

    // Reset actualQty on daily records for target month/cluster if necessary
    // Then delete the actual batch itself
    await db.importBatch.delete({ where: { id: batchId } });

    return NextResponse.json({
      success: true,
      message: `Actual production batch "${targetBatch.fileName}" was deleted successfully.`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete import batch' }, { status: 500 });
  }
}
