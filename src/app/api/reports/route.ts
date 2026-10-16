import { NextResponse } from "next/server";
import { addPendingReport } from "@/lib/db/repository";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.title || !body.affectedModes || body.affectedModes.length === 0) {
      return NextResponse.json(
        { success: false, error: "Title and affectedModes are required." },
        { status: 400 },
      );
    }

    const report = addPendingReport({
      title: body.title,
      title_bn: body.title_bn,
      description: body.description || "",
      severity: body.severity || "medium",
      affected_modes: body.affectedModes,
      affected_segment_ids: body.affectedSegmentIds || [],
      delay_minutes: Number(body.delayMinutes) || 15,
      is_closed: Boolean(body.isClosed),
      reported_by_type: "guest",
      observed_at: body.observedAt || new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min TTL
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Report submitted successfully and placed in moderation queue.",
        report,
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
