import { NextResponse } from "next/server";
import { getActiveAlerts, getAllAlertsForAdmin } from "@/lib/db/repository";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDemos = searchParams.get("includeDemos") === "true";
    const forAdmin = searchParams.get("forAdmin") === "true";
    const scenarioId = searchParams.get("scenarioId");

    const alerts =
      forAdmin || includeDemos
        ? getAllAlertsForAdmin()
        : getActiveAlerts(scenarioId);

    const response = NextResponse.json({
      success: true,
      alerts,
      timestamp: new Date().toISOString(),
    });

    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
