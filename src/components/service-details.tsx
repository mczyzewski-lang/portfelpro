"use client";

import { ChevronDown, CircleAlert } from "lucide-react";
import { createContext, useContext, type ReactNode } from "react";
import type { Company, Service } from "@/db/schema";
import { CopyButton } from "./client";

const Ctx = createContext(false);

function Section({ title, children }: { title: string; children: ReactNode }) {
  const collapsible = useContext(Ctx);
  if (collapsible) {
    return (
      <details className="group border-b border-line last:border-0">
        <summary className="flex min-h-14 items-center justify-between gap-3 px-4 py-3 text-[15px] font-bold text-leather-dark">
          {title}<ChevronDown className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="rise px-4 pb-4 text-[15px] leading-relaxed text-ink/85">{children}</div>
      </details>
    );
  }
  return (
    <section className="border-t border-line py-5 first:border-0 first:pt-0">
      <h2 className="text-[17px] font-extrabold text-leather-dark">{title}</h2>
      <div className="mt-2 text-[15px] leading-relaxed text-ink/85">{children}</div>
    </section>
  );
}
const List = ({ items }: { items: string[] }) => (
  <ul className="space-y-1.5">{items.map((t) => <li key={t} className="flex gap-2.5"><span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-gold" aria-hidden />{t}</li>)}</ul>
);

/** Treść merytoryczna karty usługi — odpowiada na pytania: co, komu, kiedy i jak polecać. */
export function ServiceDetails({ service, company, showPitchCopy = true, collapsible = false }: { service: Service; company: Company; showPitchCopy?: boolean; collapsible?: boolean }) {
  return (
    <Ctx.Provider value={collapsible}>
    <div className={collapsible ? "overflow-hidden rounded-3xl border border-line bg-white shadow-(--shadow-card)" : undefined}>
      {service.description && <Section title="Czym jest ta usługa?"><p>{service.description}</p></Section>}
      {service.problems.length > 0 && <Section title="Jakie problemy klienta rozwiązuje?"><List items={service.problems} /></Section>}
      {service.audience.length > 0 && <Section title="Dla kogo jest przeznaczona?"><List items={service.audience} /></Section>}
      {service.whenToRecommend.length > 0 && <Section title="Kiedy najlepiej ją polecać?"><List items={service.whenToRecommend} /></Section>}
      {service.signals.length > 0 && <Section title="Po czym poznasz, że klient może jej potrzebować?"><List items={service.signals} /></Section>}
      {service.arguments.length > 0 && <Section title="Najważniejsze argumenty"><List items={service.arguments} /></Section>}
      {service.pitch && !collapsible && (
        <Section title="Jak przedstawić ją w 15–30 sekund?">
          <blockquote className="rounded-2xl border-l-4 border-gold bg-cream px-4 py-3 text-[15px] italic">„{service.pitch}”</blockquote>
          {showPitchCopy && <div className="mt-3"><CopyButton small variant="secondary" text={service.pitch} label="Kopiuj tekst" /></div>}
        </Section>
      )}
      {service.faq.length > 0 && (
        <Section title="Jakie pytania może zadać klient?">
          <div className="divide-y divide-line rounded-2xl border border-line">
            {service.faq.map((f) => (
              <details key={f.q} className="group px-4">
                <summary className="flex min-h-12 items-center justify-between gap-3 py-2.5 font-bold text-leather-dark">{f.q}<ChevronDown className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden /></summary>
                <p className="pb-3 text-sm">{f.a}</p>
              </details>
            ))}
          </div>
        </Section>
      )}
      {service.doNotPromise.length > 0 && (
        <Section title="Czego nie należy obiecywać?">
          <ul className="space-y-1.5 rounded-2xl bg-danger-bg/60 p-4 text-[15px]">
            {service.doNotPromise.map((t) => <li key={t} className="flex gap-2.5"><CircleAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />{t}</li>)}
          </ul>
        </Section>
      )}
      <Section title="Kto realizuje usługę?"><p>{service.provider || `Usługę realizuje ${company.name}.`}</p></Section>
      {service.commissionTerms && <Section title="Warunki prowizji"><p className="text-sm text-muted">{service.commissionTerms}</p></Section>}
    </div>
    </Ctx.Provider>
  );
}
