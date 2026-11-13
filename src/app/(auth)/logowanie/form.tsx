"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/client";
import { Field, inputCls } from "@/components/ui";

export function LoginForm({ next, demo }: { next: string; demo: { email: string; password: string } | null }) {
  const [state, action] = useActionState(loginAction, null);
  return (
    <>
    {demo && (
      <form action={action} className="mb-6 rounded-2xl border border-gold/50 bg-white p-4" data-testid="demo-login">
        <input type="hidden" name="email" value={demo.email} /><input type="hidden" name="password" value={demo.password} />
        <p className="text-sm font-extrabold text-leather-dark">Chcesz tylko zobaczyć, jak to działa?</p>
        <p className="mt-1 text-sm text-muted">Konto demonstracyjne partnera: <b className="text-ink">{demo.email}</b> · hasło: <b className="text-ink">{demo.password}</b></p>
        <SubmitButton variant="gold" className="mt-3 w-full">Zaloguj na konto demo</SubmitButton>
      </form>
    )}
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="E-mail"><input name="email" type="email" inputMode="email" autoComplete="email" required className={inputCls} /></Field>
      <Field label="Hasło"><input name="password" type="password" autoComplete="current-password" required className={inputCls} /></Field>
      {state?.error && <p role="alert" className="rounded-xl bg-danger-bg px-3 py-2 text-sm font-medium text-danger">{state.error}</p>}
      <SubmitButton className="w-full">Zaloguj się</SubmitButton>
      <p className="text-center text-sm text-muted">Nie masz konta? <Link href="/rejestracja" className="font-semibold text-leather underline">Załóż bezpłatny Portfel</Link></p>
    </form>
    </>
  );
}
