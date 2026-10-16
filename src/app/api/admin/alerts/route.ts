import { NextResponse } from "next/server";
import { createAdminAlert } from "@/lib/db/repository";
import { getAdminSessionFromRequest } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const session = getAdminSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin session required." },
        { status: 401 },
      );
    }

    const body = await request.json();
    if (
      !body.title ||
      !body.affected_modes ||
      body.affected_modes.length === 0
    ) {
      return NextResponse.json(
        { success: false, error: "Title and affected modes are required." },
        { status: 400 },
      );
    }

    const alert = createAdminAlert({
      title: body.title,
      title_bn: body.title_bn,
      description: body.description || "Official administrative advisory.",
      severity: body.severity || "medium",
      affected_modes: body.affected_modes,
      affected_segment_ids: body.affected_segment_ids || [],
      delay_minutes: Number(body.delay_minutes) || 15,
      is_closed: Boolean(body.is_closed),
      expires_at: body.expires_at,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Official transit alert dispatched and published.",
        alert,
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
