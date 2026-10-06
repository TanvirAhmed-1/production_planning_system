import { NextRequest, NextResponse } from 'next/server';
import { parseAndImportActualExcel } from '@/lib/actual-importer';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const planBatchId = (formData.get('planBatchId') as string) || undefined;

    if (!file) {
      return NextResponse.json({ error: 'No Excel file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await parseAndImportActualExcel(buffer, file.name, planBatchId);

    if (!result.success) {
      return NextResponse.json({ error: result.message, details: result.errors }, { status: 422 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Actual Import API Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to process actual production import' }, { status: 500 });
  }
}
