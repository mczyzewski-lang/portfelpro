"use client";

import { ChevronDown, UserPlus } from "lucide-react";
import { useActionState } from "react";
import { submitClientAction } from "@/app/actions/partner";
import { SubmitButton } from "./client";
import { Field, inputCls } from "./ui";

/** Partner rozmawia z klientem i od razu przekazuje jego kontakt do konsultacji — bez wysyłania linku. */
export function ClientHandoff({ serviceId, sensitive = false }: { serviceId: string; sensitive?: boolean }) {
  const [state, action] = useActionState(submitClientAction, null);
  return (
    <details className="group rounded-3xl border border-gold/50 bg-white shadow-(--shadow-card)" data-testid="handoff" open={!!state?.error}>
      <summary className="press flex min-h-16 items-center gap-3 px-4 py-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gold-light/50 text-leather-dark"><UserPlus className="size-5" aria-hidden /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-extrabold leading-snug text-leather-dark">Przekaż kontakt klienta</span>
          <span className="block text-[13px] leading-snug text-muted">Klient jest obok? Zostaw jego dane — specjalista oddzwoni.</span>
        </span>
        <ChevronDown className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <form action={action} className="space-y-3 px-4 pb-4">
        <input type="hidden" name="serviceId" value={serviceId} />
        <Field label="Imię i nazwisko klienta"><input name="name" autoComplete="off" required className={inputCls} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Telefon"><input name="phone" type="tel" inputMode="tel" autoComplete="off" className={inputCls} /></Field>
          <Field label="E-mail"><input name="email" type="email" inputMode="email" autoComplete="off" className={inputCls} /></Field>
        </div>
        <p className="text-xs text-muted">Wystarczy telefon albo e-mail. Nie zapisujemy opisu sprawy — klient omówi ją ze specjalistą.</p>
        {sensitive && <p className="rounded-xl bg-warn-bg px-3 py-2 text-xs font-medium text-warn">To usługa dotycząca spraw prywatnych. Przekaż kontakt tylko wtedy, gdy klient sam o to poprosił — nie pytaj go o szczegóły sytuacji.</p>}
        <label className="flex gap-3 text-sm">
          <input type="checkbox" name="consent" required className="mt-0.5 size-5 shrink-0 accent-leather" />
          <span>
            Klient zgodził się, żebym przekazał(a) jego dane i żeby specjalista skontaktował się z nim w sprawie tej usługi.
            {sensitive && " Wie też, że zobaczę etap jego zgłoszenia (np. czy rozpoczął współpracę)."}
          </span>
        </label>
        {state?.error && <p role="alert" className="rounded-xl bg-danger-bg px-3 py-2 text-sm font-medium text-danger">{state.error}</p>}
        <SubmitButton className="press w-full" data-testid="handoff-submit">Przekaż do konsultacji</SubmitButton>
      </form>
    </details>
  );
}
