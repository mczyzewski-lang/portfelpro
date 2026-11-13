"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { registerAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/client";
import { Field, inputCls } from "@/components/ui";
import { cn } from "@/lib/cn";

const kinds = [
  { v: "individual", l: "Osoba fizyczna" },
  { v: "sole_trader", l: "Jednoosobowa działalność" },
  { v: "company", l: "Spółka / firma" },
];

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, null);
  const [kind, setKind] = useState("sole_trader");
  const fe = state?.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Imię" error={fe.firstName}><input name="firstName" autoComplete="given-name" required className={inputCls} /></Field>
        <Field label="Nazwisko" error={fe.lastName}><input name="lastName" autoComplete="family-name" required className={inputCls} /></Field>
      </div>
      <Field label="E-mail" error={fe.email}><input name="email" type="email" inputMode="email" autoComplete="email" required className={inputCls} /></Field>
      <Field label="Hasło" hint="Co najmniej 10 znaków" error={fe.password}><input name="password" type="password" autoComplete="new-password" required minLength={10} className={inputCls} /></Field>

      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold">Jak działasz?</legend>
        <div className="grid gap-2">
          {kinds.map((k) => (
            <label key={k.v} className={cn("flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3.5 text-[15px] font-medium", kind === k.v ? "border-leather bg-white ring-2 ring-leather/15" : "border-line bg-white")}>
              <input type="radio" name="activityType" value={k.v} checked={kind === k.v} onChange={() => setKind(k.v)} className="accent-leather size-4" />
              {k.l}
            </label>
          ))}
        </div>
        {fe.activityType && <p className="mt-1 text-xs font-medium text-danger">{fe.activityType}</p>}
      </fieldset>

      {kind !== "individual" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nazwa firmy" error={fe.companyName}><input name="companyName" autoComplete="organization" className={inputCls} /></Field>
          <Field label="NIP" error={fe.nip}><input name="nip" inputMode="numeric" className={inputCls} /></Field>
        </div>
      )}

      <div className="space-y-2.5 pt-1 text-sm">
        <label className="flex gap-3">
          <input type="checkbox" name="terms" required className="mt-0.5 size-5 shrink-0 accent-leather" />
          <span>Akceptuję <Link href="/regulamin" target="_blank" className="font-semibold text-leather underline">regulamin</Link> i zapoznałem(-am) się z <Link href="/prywatnosc" target="_blank" className="font-semibold text-leather underline">polityką prywatności</Link>. <span className="text-danger">*</span></span>
        </label>
        {fe.terms && <p className="text-xs font-medium text-danger">{fe.terms}</p>}
        <label className="flex gap-3 text-muted">
          <input type="checkbox" name="marketing" className="mt-0.5 size-5 shrink-0 accent-leather" />
          <span>Chcę otrzymywać e-mailem informacje o nowych usługach w katalogu (opcjonalnie).</span>
        </label>
      </div>

      {state?.error && <p role="alert" className="rounded-xl bg-danger-bg px-3 py-2 text-sm font-medium text-danger">{state.error}</p>}
      <SubmitButton className="w-full">Załóż bezpłatny Portfel</SubmitButton>
      <p className="text-center text-sm text-muted">Masz już konto? <Link href="/logowanie" className="font-semibold text-leather underline">Zaloguj się</Link></p>
    </form>
  );
}
