import { Award, ChevronRight, Clock, Lightbulb } from "lucide-react";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { companies, services } from "@/db/schema";
import { getTrainings, PASS_SCORE, trainingOf, trainingState } from "@/lib/training";
import { fmtDate } from "@/lib/labels";
import { CompanyIcon } from "./ui";

const LABEL = { none: "Zacznij", started: "W trakcie", quiz: "Czas na test", certified: "Certyfikat" } as const;

/** Zakładka „Certyfikaty” w Koncie: po co to jest i lista obszarów z wejściem od razu w filmy i test. */
export async function CertificatesTab({ partnerId }: { partnerId: string }) {
  const [rows, mine] = await Promise.all([
    db.select({ s: services, c: companies }).from(services).innerJoin(companies, eq(companies.id, services.companyId)).where(eq(services.status, "published")).orderBy(services.sort),
    getTrainings(partnerId),
  ]);
  const items = rows.flatMap(({ s, c }) => { const t = trainingOf(s); return t && c.published ? [{ s, c, t, row: mine.find((m) => m.serviceId === s.id) }] : []; });
  const earned = items.filter((i) => i.row?.certifiedAt).length;
  return (
    <div className="space-y-4" data-testid="certificates-tab">
      <section className="rounded-3xl border border-line bg-white p-5 shadow-(--shadow-card)">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-leather-dark"><Award className="size-5 text-gold-deep" aria-hidden />Certyfikaty</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-ink/85">Certyfikat <b>„Certyfikowany Profesjonalista”</b> to dodatkowe odznaczenie za zgłębienie materiałów o usłudze i odpowiedź na 10 pytań. Każdy obszar ma osobny certyfikat.</p>
        <p className="mt-3 flex gap-2.5 rounded-2xl bg-cream px-3.5 py-3 text-[14px] leading-snug text-ink/90"><Lightbulb className="mt-0.5 size-[18px] shrink-0 text-gold-deep" aria-hidden /><span><b>Dlaczego warto?</b> Im lepiej rozumiesz usługę i jej niuanse, tym łatwiej wyłapiesz w rozmowie moment, w którym klient jej potrzebuje — i tym naturalniej ją zaproponujesz.</span></p>
        <p className="mt-3 flex items-start gap-2 text-[13px] leading-snug text-muted"><Clock className="mt-0.5 size-4 shrink-0" aria-hidden />Około 15 minut na certyfikat · filmy, potem 10 pytań · zalicza {PASS_SCORE} poprawnych · możesz podchodzić wielokrotnie</p>
        <p className="mt-3 text-sm font-bold text-leather-dark" data-testid="certificates-count">Twoje certyfikaty: {earned} z {items.length}</p>
      </section>
      <ul className="space-y-2.5">
        {items.map(({ s, c, t, row }) => {
          const state = trainingState(row, t.videos.length);
          return (
            <li key={s.id}>
              <Link href={`/app/certyfikaty/${s.slug}`} className="press flex items-center gap-3 rounded-3xl border border-line bg-white p-3.5" data-testid={`cert-row-${s.slug}`} data-state={state}>
                <CompanyIcon name={c.name} color={c.color} iconUrl={c.iconUrl} size={42} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-muted">obszar</span>
                  <span className="block text-[16px] font-extrabold leading-snug text-leather-dark first-letter:uppercase">{t.area}</span>
                  <span className="block text-[12px] text-muted">
                    {state === "certified" ? `Wydany ${fmtDate(row!.certifiedAt!)} · nr ${row!.certNumber}` : `${t.videos.length} ${t.videos.length === 1 ? "film" : "filmy"} · ${t.questions} pytań${row ? ` · obejrzane ${row.watched.length}/${t.videos.length}` : ""}`}
                  </span>
                </span>
                <span className={state === "certified" ? "success-grad rounded-full px-3 py-1.5 text-xs font-bold" : state === "none" ? "leather-grad rounded-full px-3 py-1.5 text-xs font-bold" : "rounded-full bg-sand px-3 py-1.5 text-xs font-bold text-leather-dark"}>{LABEL[state]}</span>
                <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
              </Link>
            </li>
          );
        })}
        {items.length === 0 && <li className="rounded-3xl border border-dashed border-line px-5 py-10 text-center text-sm text-muted">Szkolenia są w przygotowaniu.</li>}
      </ul>
    </div>
  );
}
