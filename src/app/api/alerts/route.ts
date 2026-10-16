import { NextResponse } from "next/server";
import {
  getActiveAlerts,
  getDemoDisruptions,
  getAllAlertsForAdmin,
} from "@/lib/db/repository";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDemos = searchParams.get("includeDemos") === "true";
    const forAdmin = searchParams.get("forAdmin") === "true";
    const scenarioId = searchParams.get("scenarioId");

    if (forAdmin || includeDemos) {
      const all = getAllAlertsForAdmin();
      return NextResponse.json({
        success: true,
        alerts: all,
        timestamp: new Date().toISOString(),
      });
    }

    const active = getActiveAlerts(scenarioId);

    return NextResponse.json({
      success: true,
      alerts: active,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
