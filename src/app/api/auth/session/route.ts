import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth/session";

export async function GET(request: Request) {
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
      },
      { status: 200 },
    );
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      email: session.email,
      role: session.role,
      displayName: "Dhaka Transit Admin",
      issuedAt: session.issuedAt,
      expiresAt: session.expiresAt,
    },
  });
}
