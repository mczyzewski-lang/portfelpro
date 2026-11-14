"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitLeadAction } from "@/app/actions/public";
import { SubmitButton } from "@/components/client";
import { Field, inputCls } from "@/components/ui";

export function LeadForm({ assetId, refToken, iqid, cta, sensitive }: { assetId: string; refToken: string; iqid: string; cta: string; sensitive: boolean }) {
  const [state, action] = useActionState(submitLeadAction, null);
  const fe = state?.fieldErrors ?? {};
  if (state?.ok) {
    return <div role="status" data-testid="lead-success" className="rounded-2xl bg-ok-bg px-5 py-6 text-center font-semibold text-ok">{state.ok}</div>;
  }
  return (
    <form action={action} className="space-y-3.5" noValidate>
      <input type="hidden" name="assetId" value={assetId} />
      <input type="hidden" name="pp_ref" value={refToken} />
      <input type="hidden" name="iqid" value={iqid} />
      <div className="hidden" aria-hidden><label>Strona www<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <Field label="Imię" error={fe.name}><input name="name" autoComplete="given-name" required className={inputCls} /></Field>
      <Field label="E-mail" error={fe.email}><input name="email" type="email" inputMode="email" autoComplete="email" required className={inputCls} /></Field>
      <Field label="Telefon (opcjonalnie)" error={fe.phone}><input name="phone" type="tel" inputMode="tel" autoComplete="tel" className={inputCls} /></Field>
      {sensitive && <p className="rounded-xl bg-sand px-3 py-2 text-xs text-muted">Nie pytamy tutaj o szczegóły Twojej sytuacji. Omówisz je poufnie bezpośrednio ze specjalistą.</p>}
      <label className="flex gap-3 text-sm">
        <input type="checkbox" name="consent" required className="mt-0.5 size-5 shrink-0 accent-leather" />
        <span>Zgadzam się na kontakt w sprawie tej usługi i przetwarzanie moich danych w tym celu. <Link href="/prywatnosc" target="_blank" className="font-semibold text-leather underline">Polityka prywatności</Link></span>
      </label>
      {fe.consent && <p className="text-xs font-medium text-danger">{fe.consent}</p>}
      {state?.error && <p role="alert" className="rounded-xl bg-danger-bg px-3 py-2 text-sm font-medium text-danger">{state.error}</p>}
      <SubmitButton className="w-full" data-testid="lead-submit">{cta}</SubmitButton>
    </form>
  );
}
