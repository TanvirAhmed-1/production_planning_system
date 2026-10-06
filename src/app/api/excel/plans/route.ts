import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const plans = await prisma.importBatch.findMany({
      where: {
        batchType: { not: 'ACTUAL' }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        month: true,
        totalRows: true,
        importedRows: true,
        status: true,
        summary: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            dailyRecords: true
          }
        }
      }
    });

    const formattedPlans = plans.map(p => {
      let totalPlanQty = 0;
      let totalSah = 0;
      if (p.summary) {
        try {
          const s = JSON.parse(p.summary);
          totalPlanQty = s.totalPlanQty || s.dbPlannedQty || 0;
          totalSah = s.totalSah || 0;
        } catch (e) {
          // ignore
        }
      }

      return {
        id: p.id,
        fileName: p.fileName,
        month: p.month,
        ordersCount: p._count.orders || p.importedRows,
        totalPlanQty,
        totalSah,
        createdAt: p.createdAt
      };
    });

    return NextResponse.json(formattedPlans);
  } catch (err: any) {
    console.error('Plans API Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch plan files' }, { status: 500 });
  }
}
