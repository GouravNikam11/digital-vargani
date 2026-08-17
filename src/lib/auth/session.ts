import { SignJWT, jwtVerify } from "jose";
import type { MandalRole } from "@/lib/permissions";

export const SESSION_COOKIE = "dv_session";
export const LANGUAGE_COOKIE = "dv_lang";
const SESSION_DAYS = 14;

export type SessionPayload = {
  userId: string;
  name: string;
  email: string | null;
  mobile: string | null;
  language: "mr" | "en";
  isSuperAdmin: boolean;
  mandalId: string | null;
  mandalName: string | null;
  role: MandalRole | null;
  onboardingCompleted: boolean;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: String(payload.userId ?? payload.sub),
      name: String(payload.name ?? ""),
      email: (payload.email as string | null) ?? null,
      mobile: (payload.mobile as string | null) ?? null,
      language: payload.language === "en" ? "en" : "mr",
      isSuperAdmin: Boolean(payload.isSuperAdmin),
      mandalId: (payload.mandalId as string | null) ?? null,
      mandalName: (payload.mandalName as string | null) ?? null,
      role: (payload.role as MandalRole | null) ?? null,
      onboardingCompleted: Boolean(payload.onboardingCompleted),
    };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  const secure = process.env.NODE_ENV === "production";
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}
