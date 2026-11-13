"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/client";
import { Field, inputCls } from "@/components/ui";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(loginAction, null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="E-mail"><input name="email" type="email" inputMode="email" autoComplete="email" required className={inputCls} /></Field>
      <Field label="Hasło"><input name="password" type="password" autoComplete="current-password" required className={inputCls} /></Field>
      {state?.error && <p role="alert" className="rounded-xl bg-danger-bg px-3 py-2 text-sm font-medium text-danger">{state.error}</p>}
      <SubmitButton className="w-full">Zaloguj się</SubmitButton>
      <p className="text-center text-sm text-muted">Nie masz konta? <Link href="/rejestracja" className="font-semibold text-leather underline">Załóż bezpłatny Portfel</Link></p>
    </form>
  );
}
