"use client";

import { PackageCheck } from "lucide-react";
import { useActionState, useState } from "react";
import { confirmStarterAction } from "@/app/actions/partner";
import type { FormState } from "./client";
import { toast } from "./client";
import { ConfettiBurst } from "./confetti";

/** „Wiszące” okienko na pulpicie: potwierdzenie odbioru pakietu startowego kodem z przesyłki. */
export function StarterCard() {
  const [done, setDone] = useState(false);
  const [state, action, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const res = await confirmStarterAction(prev, fd);
    if (res?.ok) { setDone(true); toast(res.ok); }
    return res;
  }, null);
  if (done) return <ConfettiBurst />;
  return (
    <section className="rise relative rounded-3xl border border-gold/60 bg-white p-4 shadow-[0_18px_40px_-18px_rgba(50,27,18,0.45)]" aria-labelledby="starter-h" data-testid="starter-card">
      <div className="flex items-start gap-3">
        <span className="gold-grad grid size-11 shrink-0 place-items-center rounded-2xl"><PackageCheck className="size-5" aria-hidden /></span>
        <div>
          <h2 id="starter-h" className="font-extrabold leading-snug text-leather-dark">Potwierdzenie odbioru pakietu startowego</h2>
          <p className="mt-0.5 text-[13px] leading-snug text-muted">Wpisz kod z karty, którą znajdziesz w pakiecie.</p>
        </div>
      </div>
      <form action={action} className="mt-3 flex gap-2">
        <input name="code" required autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={14} placeholder="KOD" aria-label="Kod z pakietu startowego"
          className="tabular min-h-12 min-w-0 flex-1 rounded-2xl border border-line bg-cream px-4 text-center text-lg font-extrabold uppercase tracking-[0.3em] text-leather-dark placeholder:tracking-[0.2em] placeholder:text-muted/50 focus:border-leather focus:outline-none focus:ring-2 focus:ring-leather/20" />
        <button disabled={pending} className="leather-grad press min-h-12 shrink-0 rounded-2xl px-5 font-bold" data-testid="starter-submit">{pending ? "…" : "Potwierdź"}</button>
      </form>
      {state?.error && <p role="alert" className="mt-2 rounded-xl bg-danger-bg px-3 py-2 text-sm font-medium text-danger">{state.error}</p>}
    </section>
  );
}
