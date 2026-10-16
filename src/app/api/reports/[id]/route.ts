import { NextResponse } from "next/server";
import { updateAlertStatus, deleteAlert } from "@/lib/db/repository";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, lifecycleStage } = body;

    if (!status && !lifecycleStage) {
      return NextResponse.json(
        { success: false, error: "Status or lifecycleStage required." },
        { status: 400 },
      );
    }

    const updated = updateAlertStatus(
      id,
      status || "pending",
      lifecycleStage || "active",
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Alert not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Alert ${id} updated to ${status} (${lifecycleStage})`,
      alert: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const deleted = deleteAlert(id);
    return NextResponse.json({
      success: deleted,
      message: `Alert ${id} purged from system.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
