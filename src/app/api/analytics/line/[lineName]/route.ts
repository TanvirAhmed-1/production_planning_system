import { NextRequest, NextResponse } from 'next/server';
import { getLineDetails } from '@/lib/analytics-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lineName: string }> }
) {
  try {
    const resolvedParams = await params;
    const rawLineName = resolvedParams.lineName;
    const lineName = decodeURIComponent(rawLineName);

    if (!lineName) {
      return NextResponse.json({ error: 'Line name is required' }, { status: 400 });
    }

    const data = await getLineDetails(lineName);
    if (!data) {
      return NextResponse.json({ error: `Line ${lineName} not found` }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Line Details API Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch line details' }, { status: 500 });
  }
}
