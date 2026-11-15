"use client";

import { PhoneCall } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { submitPublicLeadAction } from "@/app/actions/public";
import { SubmitButton } from "./client";
import { inputCls } from "./ui";

/** Formularz „zostaw kontakt” w szczegółach usługi. Bez pytań o opis sprawy. */
export function PublicContactForm({ slug, serviceId, serviceName, companyName, sensitive, partnerFirstName }: {
  slug: string; serviceId: string; serviceName: string; companyName: string; sensitive: boolean; partnerFirstName: string;
}) {
  const [state, action] = useActionState(submitPublicLeadAction, null);
  return (
    <section id="kontakt" className="mt-7 rounded-3xl border border-gold/50 bg-cream/60 p-4" aria-labelledby="kontakt-h" data-testid="public-form">
      <h3 id="kontakt-h" className="flex items-center gap-2 text-[17px] font-extrabold text-leather-dark"><PhoneCall className="size-[18px] text-gold-deep" aria-hidden />Zostaw kontakt — specjalista oddzwoni</h3>
      <p className="mt-0.5 text-[13px] leading-snug text-muted">Bezpłatnie i bez zobowiązań. {companyName} odezwie się w sprawie: {serviceName}.</p>
      {state?.ok ? (
        <p role="status" className="success-grad mt-3 rounded-2xl px-4 py-4 text-center font-bold" data-testid="public-form-success">{state.ok}</p>
      ) : (
        <form action={action} className="mt-3 space-y-2.5">
          <input type="hidden" name="slug" value={slug} /><input type="hidden" name="serviceId" value={serviceId} />
          <div className="hidden" aria-hidden><label>Strona www<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
          <input name="name" required autoComplete="given-name" placeholder="Imię" aria-label="Imię" className={inputCls} />
          <div className="grid gap-2.5 sm:grid-cols-2">
            <input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="Telefon" aria-label="Telefon" className={inputCls} />
            <input name="email" type="email" inputMode="email" autoComplete="email" placeholder="E-mail" aria-label="E-mail" className={inputCls} />
          </div>
          <p className="text-xs text-muted">Wystarczy telefon albo e-mail.{sensitive && " Nie pytamy tu o szczegóły sytuacji — omówisz je poufnie ze specjalistą."}</p>
          <label className="flex gap-3 text-[13px] leading-snug">
            <input type="checkbox" name="consent" required className="mt-0.5 size-5 shrink-0 accent-leather" />
            <span>Zgadzam się na kontakt w sprawie tej usługi i przetwarzanie moich danych w tym celu. <Link href="/prywatnosc" target="_blank" className="font-semibold text-leather underline">Polityka prywatności</Link></span>
          </label>
          {state?.error && <p role="alert" className="rounded-xl bg-danger-bg px-3 py-2 text-sm font-medium text-danger">{state.error}</p>}
          <SubmitButton className="w-full" data-testid="public-form-submit">Poproszę o kontakt</SubmitButton>
          <p className="text-center text-[11px] text-muted">Zgłoszenie z polecenia: {partnerFirstName}</p>
        </form>
      )}
    </section>
  );
}
