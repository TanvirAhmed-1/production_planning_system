import { NextRequest, NextResponse } from 'next/server';
import { getFilterOptions } from '@/lib/analytics-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get('batchId') || undefined;
    const unitCode = searchParams.get('unitCode') || undefined;
    const filters = await getFilterOptions(batchId, unitCode);
    return NextResponse.json(filters);
  } catch (err: any) {
    console.error('Filters API Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch filters' }, { status: 500 });
  }
}

