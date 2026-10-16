import { NextResponse } from "next/server";
import {
  validateAdminCredentials,
  createSessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required." },
        { status: 400 },
      );
    }

    const isValid = validateAdminCredentials(email, password);

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid administrative credentials. Access restricted to authorized transit personnel.",
        },
        { status: 401 },
      );
    }

    const token = createSessionToken(email, "super_admin");

    const response = NextResponse.json({
      success: true,
      message: "Admin session authenticated successfully.",
      user: {
        email: email.trim().toLowerCase(),
        role: "super_admin",
        displayName: "Dhaka Transit Admin",
      },
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || "Internal authentication error.",
      },
      { status: 500 },
    );
  }
}
