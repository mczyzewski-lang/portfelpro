import { BadgeCheck, ChevronDown, Link2, Search, Star, Wallet } from "lucide-react";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { ProfessionMatcher } from "@/components/profession-matcher";
import { Rate } from "@/components/rate";
import { ServiceCard } from "@/components/service-card";
import { SiteFooter } from "@/components/site";
import { CompanyIcon, LinkButton, Logo, Wordmark } from "@/components/ui";
import { db } from "@/db";
import { companies, landingFaqs } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getCatalog, getProfessions } from "@/lib/queries";

export const dynamic = "force-dynamic";

const steps = [
  { icon: Search, title: "Wybierz usługę", text: "Przeglądaj dostępne rozwiązania, sprawdź prowizję i zobacz, dla kogo jest przeznaczona." },
  { icon: Link2, title: "Udostępnij swój link", text: "Otrzymujesz unikalne linki partnerskie. Możesz wysłać klientowi materiał edukacyjny, zaproszenie na konsultację lub ofertę konkretnej usługi." },
  { icon: Wallet, title: "Odbierz prowizję", text: "Gdy polecenie spełni warunki rozliczenia, otrzymujesz wynagrodzenie. Postęp i historię rozliczeń widzisz w panelu." },
];

export default async function Landing() {
  const [cu, items, professions, faqs, brands] = await Promise.all([
    getCurrentUser(), getCatalog(), getProfessions(),
    db.select().from(landingFaqs).where(eq(landingFaqs.published, true)).orderBy(asc(landingFaqs.sort)),
    db.select().from(companies).where(eq(companies.published, true)).orderBy(asc(companies.sort)),
  ]);
  const appHref = cu ? (cu.user.role === "admin" ? "/admin" : "/app") : "/logowanie";

  return (
    <>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4">
        <Wordmark />
        <Link href={appHref} className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-bold text-leather hover:bg-sand">
          {cu ? "Mój Portfel" : "Zaloguj się"}
        </Link>
      </header>

      <main id="tresc">
        {/* HERO */}
        <section className="mx-auto grid w-full max-w-6xl gap-8 px-5 pb-10 pt-2 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-12 lg:pb-16 lg:pt-8">
          <div>
            <div className="mb-4 lg:mb-6"><Logo size={72} animated priority /></div>
            <h1 className="text-[32px] font-extrabold leading-[1.08] text-leather-dark sm:text-5xl lg:text-[56px]">
              Poszerz swój portfel usług. <span className="text-gold-deep">Zarabiaj na poleceniach.</span>
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink/80 sm:text-lg">
              Twoi klienci potrzebują więcej niż jednej usługi. Zyskaj dostęp do sprawdzonych specjalistów, polecaj ich rozwiązania i otrzymuj prowizję za skuteczne polecenia. Bez zatrudniania zespołu i realizowania usług samodzielnie.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <LinkButton href="/rejestracja" className="min-h-12 px-7">Załóż bezpłatny Portfel</LinkButton>
              <LinkButton href="#uslugi" variant="secondary" className="min-h-12">Zobacz dostępne usługi</LinkButton>
            </div>
            <p className="mt-4 flex items-start gap-2 text-sm text-ink/80" data-testid="google-criteria">
              <BadgeCheck className="mt-0.5 size-[18px] shrink-0 text-gold-deep" aria-hidden />
              <span>Polecasz wyłącznie firmy ocenione w Google: <b className="text-leather-dark">min. 100 opinii</b> i średnia <b className="text-leather-dark">powyżej 4,7/5</b>.</span>
            </p>
          </div>

          {/* Podgląd usług i stawek — widoczny bez wchodzenia głębiej */}
          <div aria-label="Usługi i prowizje" className="wallet rounded-[28px] p-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gold-light">Usługi i Twoja prowizja</p>
              <span className="text-xs text-white/60">{items.length} w katalogu</span>
            </div>
            <ul className="relative z-10 mt-3 divide-y divide-white/10">
              {items.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <CompanyIcon {...i.company} size={30} />
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold leading-tight">{i.name}</p>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/55">{i.company.name}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right"><Rate rate={i.rate} size="sm" onDark /></div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* JAK TO DZIAŁA */}
        <section className="border-y border-line bg-white/60 px-5 py-12 lg:py-16" aria-labelledby="jak">
          <div className="mx-auto max-w-6xl">
            <h2 id="jak" className="text-2xl font-extrabold text-leather-dark sm:text-3xl">Jak to działa?</h2>
            <ol className="mt-6 grid gap-4 md:grid-cols-3">
              {steps.map((s, n) => (
                <li key={s.title} className="rounded-(--radius-card) border border-line bg-white p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-leather text-white"><s.icon className="size-5" aria-hidden /></span>
                    <span className="text-sm font-bold text-gold-deep">Krok {n + 1}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-extrabold text-leather-dark">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink/80">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* KATALOG */}
        <section id="uslugi" className="scroll-mt-4 px-5 py-12 lg:py-16" aria-labelledby="katalog">
          <div className="mx-auto max-w-6xl">
            <h2 id="katalog" className="text-2xl font-extrabold text-leather-dark sm:text-3xl">Katalog usług</h2>
            <p className="mt-2 max-w-2xl text-[15px] text-muted">Każda usługa ma jasno opisaną prowizję i warunek jej naliczenia. Nie musisz być ekspertem — wystarczy wiedzieć, komu ją polecić.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((i) => <div key={i.id} className="relative"><ServiceCard item={i} href={`/uslugi/${i.slug}`} /></div>)}
            </div>
          </div>
        </section>

        {/* DLA KOGO */}
        <section className="border-y border-line bg-white/60 px-5 py-12 lg:py-16" aria-labelledby="dla-kogo">
          <div className="mx-auto max-w-6xl">
            <h2 id="dla-kogo" className="text-2xl font-extrabold text-leather-dark sm:text-3xl">Dla kogo jest Portfel.pro?</h2>
            <p className="mt-2 max-w-2xl text-[15px] text-muted">Dla osób, które już mają relacje z klientami. Wybierz, czym się zajmujesz — pokażemy usługi, które mają u Ciebie najwięcej sensu.</p>
            <div className="mt-6"><ProfessionMatcher professions={professions} items={items} /></div>
          </div>
        </section>

        {/* JEDEN PORTFEL */}
        <section className="px-5 py-12 lg:py-16" aria-labelledby="jeden">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 id="jeden" className="text-2xl font-extrabold text-leather-dark sm:text-3xl">Jeden Portfel — wiele możliwości</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ink/80">Różne marki i specjalizacje, ale jedno konto, jeden numer partnera i jeden system prowizji. Polecasz to, co pasuje do Twoich klientów — a wszystkie rozliczenia widzisz w jednym miejscu.</p>
              <ul className="mt-5 space-y-2.5 text-[15px]">
                {["Jedno konto dla wszystkich marek", "Jeden identyfikator partnera", "Jedna historia poleceń i wypłat"].map((t) => (
                  <li key={t} className="flex items-center gap-2.5"><span className="size-1.5 rounded-full bg-gold" aria-hidden />{t}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="rounded-(--radius-card) border border-gold/40 bg-white p-5">
                <div className="flex items-center gap-1 text-gold" aria-hidden>{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="size-5 fill-current" />)}</div>
                <p className="mt-2 text-lg font-extrabold leading-snug text-leather-dark">Tylko firmy sprawdzone przez klientów</p>
                <p className="mt-1 text-sm leading-relaxed text-ink/80">Do katalogu trafiają wyłącznie usługi firm ocenionych w Google: co najmniej <b>100 opinii</b> i średnia ocena <b>powyżej 4,7/5</b>. Polecasz marki, którym klienci już zaufali.</p>
              </div>
              <ul className="mt-3 grid grid-cols-2 gap-3">
                {brands.map((b) => (
                  <li key={b.id} className="rounded-(--radius-card) border border-line bg-white p-4">
                    <div className="flex h-9 items-center gap-2">
                      {b.logoUrl
                        // eslint-disable-next-line @next/next/no-img-element -- logo spółki (SVG / adres ustawiany w panelu)
                        ? <img src={b.logoUrl} alt={b.name} className="max-h-7 w-auto max-w-full" />
                        : <><CompanyIcon name={b.name} color={b.color} iconUrl={b.iconUrl} size={32} /><span className="text-base font-extrabold tracking-wide text-leather-dark">{b.name}</span></>}
                    </div>
                    <p className="mt-2 text-sm leading-snug text-ink/80">{b.tagline}</p>
                    <p className="mt-2 text-xs font-semibold text-muted">{items.filter((i) => i.company.slug === b.slug).length} usł. w katalogu</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-line bg-white/60 px-5 py-12 lg:py-16" aria-labelledby="faq">
          <div className="mx-auto max-w-3xl">
            <h2 id="faq" className="text-2xl font-extrabold text-leather-dark sm:text-3xl">Najczęstsze pytania</h2>
            <div className="mt-6 divide-y divide-line rounded-(--radius-card) border border-line bg-white">
              {faqs.map((f) => (
                <details key={f.id} className="group px-5">
                  <summary className="flex min-h-14 items-center justify-between gap-4 py-3 text-[15px] font-bold text-leather-dark">
                    {f.question}<ChevronDown className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <p className="pb-4 text-sm leading-relaxed text-ink/80">{f.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-5 py-12 lg:py-16">
          <div className="wallet mx-auto max-w-3xl rounded-[28px] px-6 py-10 text-center">
            <h2 className="relative z-10 text-2xl font-extrabold sm:text-3xl">Twoi klienci już pytają o te usługi.</h2>
            <p className="relative z-10 mx-auto mt-2 max-w-md text-[15px] text-white/80">Załóż konto, odbierz numer partnera i zobacz, co możesz polecić już dziś.</p>
            <LinkButton href="/rejestracja" variant="gold" className="relative z-10 mt-6 min-h-12 px-7">Załóż bezpłatny Portfel</LinkButton>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
