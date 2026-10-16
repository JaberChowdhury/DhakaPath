import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth/session";
import { getKeyPoolSnapshot, MODEL_NAME } from "@/lib/ai/keyPool";

export async function GET(request: Request) {
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { success: false, message: "Unauthorized. Admin session required." },
      { status: 401 },
    );
  }

  const pool = getKeyPoolSnapshot();

  return NextResponse.json({
    success: true,
    model: MODEL_NAME,
    totalKeys: pool.length,
    activeKeysCount: pool.filter((k) => k.status === "healthy").length,
    cooldownKeysCount: pool.filter((k) => k.status === "cooldown").length,
    pool: pool.map((k) => ({
      id: k.id,
      maskedKey: k.maskedKey,
      status: k.status,
      totalRequests: k.totalRequests,
      totalSuccesses: k.totalSuccesses,
      consecutiveErrors: k.consecutiveErrors,
      cooldownRemainingSec:
        k.status === "cooldown" && k.cooldownUntil > Date.now()
          ? Math.round((k.cooldownUntil - Date.now()) / 1000)
          : 0,
      lastUsedAt: k.lastUsedAt ? new Date(k.lastUsedAt).toISOString() : null,
      lastStatusCode: k.lastStatusCode,
      lastErrorMessage: k.lastErrorMessage,
    })),
  });
}
