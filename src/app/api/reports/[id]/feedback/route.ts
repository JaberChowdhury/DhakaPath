import { NextResponse } from "next/server";
import { recordAlertFeedback } from "@/lib/db/repository";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const voteType = body.voteType; // 'confirm' | 'dispute' | 'resolved'

    const updated = recordAlertFeedback(id, voteType);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Alert not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Vote recorded for alert ${id}`,
      alert: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
