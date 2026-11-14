import { Building2, Check, ListChecks, Minus, Scale } from "lucide-react";
import type { Service } from "@/db/schema";
import { env } from "@/lib/env";
import { Badge } from "./ui";

export type FactsData = { serviceFacts: string[]; companyFacts: string[]; comparison: { label: string; us: string; others: string }[]; demo: boolean };

/** Fakty i porównanie dla usługi. Treści startowe (do potwierdzenia) są zwracane wyłącznie w trybie demo. */
export function factsOf(s: Pick<Service, "serviceFacts" | "companyFacts" | "comparison" | "factsDemo">): FactsData | null {
  if (s.factsDemo && !env.demoMode) return null;
  if (!s.serviceFacts.length && !s.companyFacts.length && !s.comparison.length) return null;
  return { serviceFacts: s.serviceFacts, companyFacts: s.companyFacts, comparison: s.comparison, demo: s.factsDemo };
}

/** Trzy bloki: najważniejsze o usłudze, firma w kontekście tej usługi, tabela „my vs inni”. */
export function ServiceFacts({ facts, companyName }: { facts: FactsData | null; companyName: string }) {
  if (!facts) return null;
  const h = "flex items-center gap-2 text-[17px] font-extrabold text-leather-dark";
  return (
    <div className="space-y-4" data-testid="service-facts">
      {facts.serviceFacts.length > 0 && (
        <section className="rounded-3xl border border-line bg-white p-4 shadow-(--shadow-card)">
          <h3 className={h}><ListChecks className="size-5 text-gold-deep" aria-hidden />Najważniejsze o usłudze</h3>
          <ul className="mt-2.5 space-y-2 text-[15px] leading-snug text-ink/90">
            {facts.serviceFacts.map((t) => <li key={t} className="flex gap-2.5"><span className="success-grad mt-0.5 grid size-5 shrink-0 place-items-center rounded-full"><Check className="size-3" aria-hidden /></span>{t}</li>)}
          </ul>
        </section>
      )}

      {facts.companyFacts.length > 0 && (
        <section className="rounded-3xl border border-line bg-white p-4 shadow-(--shadow-card)">
          <h3 className={h}><Building2 className="size-5 text-gold-deep" aria-hidden />{companyName} przy tej usłudze{facts.demo && <Badge tone="warn" className="ml-auto">do potwierdzenia</Badge>}</h3>
          <ul className="mt-2.5 space-y-2 text-[15px] leading-snug text-ink/90">
            {facts.companyFacts.map((t) => <li key={t} className="flex gap-2.5"><span aria-hidden className="mt-[7px] size-2 shrink-0 rounded-full bg-gold" />{t}</li>)}
          </ul>
        </section>
      )}

      {facts.comparison.length > 0 && (
        <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-(--shadow-card)">
          <h3 className={`${h} px-4 pt-4`}><Scale className="size-5 text-gold-deep" aria-hidden />{companyName} a inni{facts.demo && <Badge tone="warn" className="ml-auto">przykład</Badge>}</h3>
          <table className="mt-3 w-full table-fixed text-[13px] leading-snug" data-testid="comparison-table">
            <thead>
              <tr className="text-left text-[11px] font-bold uppercase tracking-wide">
                <th scope="col" className="w-[30%] px-4 py-2 text-muted"><span className="sr-only">Kryterium</span></th>
                <th scope="col" className="leather-grad w-[37%] rounded-t-xl px-3 py-2">{companyName}</th>
                <th scope="col" className="w-[33%] px-3 py-2 text-muted">Inni</th>
              </tr>
            </thead>
            <tbody>
              {facts.comparison.map((r, i) => (
                <tr key={r.label} className="border-t border-line align-top">
                  <th scope="row" className="px-4 py-3 text-left font-bold text-leather-dark">{r.label}</th>
                  <td className={`bg-ok-bg/70 px-3 py-3 font-semibold text-[#14553c] ${i === facts.comparison.length - 1 ? "" : ""}`}><Check className="mb-0.5 mr-1 inline size-3.5" aria-hidden />{r.us}</td>
                  <td className="px-3 py-3 text-muted"><Minus className="mb-0.5 mr-1 inline size-3.5" aria-hidden />{r.others}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
