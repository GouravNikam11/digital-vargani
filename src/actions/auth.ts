"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { loginUser, registerUser, updateLanguage } from "@/services/auth.service";
import { loginSchema, registerSchema } from "@/lib/validations";
import { LANGUAGE_COOKIE, SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth/session";
import { isAppError } from "@/lib/errors";
import type { Locale } from "@/config/constants";
import { getSession } from "@/lib/auth/tenant";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function setSessionCookie(token: string) {
  const jar = await cookies();
  const options = sessionCookieOptions();
  jar.set(options.name, token, options);
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, error: "VALIDATION" };

  let session;
  try {
    const requestHeaders = await headers();
    session = await loginUser({
      ...parsed.data,
      ip: requestHeaders.get("x-forwarded-for") ?? "local",
    });
    await setSessionCookie(await signSession(session));
    const jar = await cookies();
    jar.set(LANGUAGE_COOKIE, session.language, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  } catch (error) {
    if (isAppError(error) && error.code === "TOO_MANY") return { ok: false, error: "TOO_MANY" };
    return { ok: false, error: "UNAUTHORIZED" };
  }

  if (session.isSuperAdmin && !session.mandalId) redirect("/admin");
  if (!session.mandalId) redirect("/onboarding");
  redirect("/dashboard");
}

export async function registerAction(formData: FormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    mobile: formData.get("mobile"),
    email: formData.get("email") || "",
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { ok: false, error: "VALIDATION" };

  try {
    const session = await registerUser({
      name: parsed.data.name,
      mobile: parsed.data.mobile,
      email: parsed.data.email || undefined,
      password: parsed.data.password,
    });
    await setSessionCookie(await signSession(session));
  } catch {
    return { ok: false, error: "DUPLICATE" };
  }

  redirect("/onboarding");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function setLanguageAction(locale: Locale) {
  const jar = await cookies();
  jar.set(LANGUAGE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  const session = await getSession();
  if (session) {
    await updateLanguage(session.userId, locale);
    await setSessionCookie(await signSession({ ...session, language: locale }));
  }
}
