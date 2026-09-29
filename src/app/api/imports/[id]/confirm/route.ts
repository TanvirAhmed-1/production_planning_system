import { NextRequest, NextResponse } from "next/server";
import { confirmDatabaseImport } from "@/lib/monitoring-import-service";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const importMode = body.importMode || "INSERT_UPDATE";

    const result = await confirmDatabaseImport({
      fileUploadId: id,
      importMode,
      userId: body.userId,
      userEmail: body.userEmail,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err: any) {
    console.error("POST error in /api/imports/[id]/confirm:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
