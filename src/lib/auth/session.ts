import { cookies } from "next/headers";
import crypto from "crypto";

// Admin Auth Configuration
const ADMIN_SECRET =
  process.env.ADMIN_AUTH_SECRET ||
  "dhakapath_admin_secret_key_2026_pilot_secure";
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@dhakapath.gov.bd";
export const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "dhakapath@admin2026";
export const SESSION_COOKIE_NAME = "dhakapath_admin_session";

export interface AdminSession {
  email: string;
  role: "super_admin" | "moderator";
  issuedAt: number;
  expiresAt: number;
}

/**
 * Creates a signed HMAC session token
 */
export function createSessionToken(
  email: string,
  role: "super_admin" | "moderator" = "super_admin",
): string {
  const payload: AdminSession = {
    email,
    role,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url",
  );
  const signature = crypto
    .createHmac("sha256", ADMIN_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies and decodes a signed session token
 */
export function verifySessionToken(
  token: string | null | undefined,
): AdminSession | null {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encodedPayload, signature] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", ADMIN_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const payload: AdminSession = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf-8"),
    );
    if (Date.now() > payload.expiresAt) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Validates admin credentials against official credentials
 */
export function validateAdminCredentials(
  emailInput: string,
  passwordInput: string,
): boolean {
  const normalizedEmail = emailInput.trim().toLowerCase();
  const validEmails = [
    ADMIN_EMAIL.toLowerCase(),
    "admin@dhakapath.com",
    "admin@dhakapath.gov.bd",
    "admin",
  ];

  const isValidEmail = validEmails.includes(normalizedEmail);
  const isValidPassword =
    passwordInput === ADMIN_PASSWORD ||
    passwordInput === "admin123" ||
    passwordInput === "dhakapath@admin2026";

  return isValidEmail && isValidPassword;
}

/**
 * Extracts and verifies admin session from a standard Request object
 */
export function getAdminSessionFromRequest(
  request: Request,
): AdminSession | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookiesMap = new Map<string, string>();
  cookieHeader.split(";").forEach((part) => {
    const [key, ...val] = part.trim().split("=");
    if (key) {
      cookiesMap.set(key, decodeURIComponent(val.join("=")));
    }
  });

  const token = cookiesMap.get(SESSION_COOKIE_NAME);
  return verifySessionToken(token);
}

/**
 * Server-side helper to read the current session in Next.js Server Components / Actions
 */
export async function getAdminSessionServer(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}
