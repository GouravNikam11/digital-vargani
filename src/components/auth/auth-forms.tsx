"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, registerAction, type ActionResult } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useT } from "@/i18n/provider";

function errorMessage(t: (path: string) => string, error?: string) {
  if (error === "UNAUTHORIZED") return t("auth.invalidCredentials");
  if (error === "TOO_MANY") return t("auth.tooManyAttempts");
  if (error === "VALIDATION" || error === "DUPLICATE") return t("errors.validation");
  return t("errors.generic");
}

export function LoginForm() {
  const { t } = useT();
  const [state, action, pending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData) => loginAction(formData),
    null,
  );

  return (
    <AuthCard title={t("auth.loginTitle")} subtitle={t("auth.loginSubtitle")}>
      <form action={action} className="space-y-4">
        <div>
          <Label htmlFor="identifier">{t("auth.identifier")}</Label>
          <Input id="identifier" name="identifier" required autoComplete="username" />
        </div>
        <div>
          <Label htmlFor="password">{t("auth.password")}</Label>
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        {state && !state.ok ? <p className="text-sm text-danger">{errorMessage(t, state.error)}</p> : null}
        <Button className="w-full" disabled={pending} type="submit">
          {pending ? t("common.loading") : t("auth.loginCta")}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm">
        {t("auth.noAccount")}{" "}
        <Link className="font-semibold text-primary" href="/register">
          {t("auth.registerCta")}
        </Link>
      </p>
    </AuthCard>
  );
}

export function RegisterForm() {
  const { t } = useT();
  const [state, action, pending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData) => registerAction(formData),
    null,
  );

  return (
    <AuthCard title={t("auth.registerTitle")} subtitle={t("auth.registerSubtitle")}>
      <form action={action} className="space-y-4">
        <div>
          <Label htmlFor="name">{t("auth.yourName")}</Label>
          <Input id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="mobile">{t("common.mobile")}</Label>
          <Input id="mobile" name="mobile" inputMode="numeric" required />
        </div>
        <div>
          <Label htmlFor="email">{t("common.email")}</Label>
          <Input id="email" name="email" type="email" />
        </div>
        <div>
          <Label htmlFor="password">{t("auth.password")}</Label>
          <Input id="password" name="password" type="password" required />
        </div>
        <div>
          <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" required />
        </div>
        {state && !state.ok ? <p className="text-sm text-danger">{errorMessage(t, state.error)}</p> : null}
        <Button className="w-full" disabled={pending} type="submit">
          {pending ? t("common.loading") : t("auth.registerCta")}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm">
        {t("auth.hasAccount")}{" "}
        <Link className="font-semibold text-primary" href="/login">
          {t("auth.loginCta")}
        </Link>
      </p>
    </AuthCard>
  );
}

function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md rounded-[2rem] border border-border bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-accent">॥ श्री गणेशाय नमः ॥</p>
            <h1 className="mt-1 text-2xl font-bold text-primary">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <LanguageSwitcher />
        </div>
        {children}
      </div>
    </div>
  );
}
