import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GoogleRating, GoogleTrustCard } from "@/components/google";
import { PhoneSignup } from "@/components/phone-signup";
import { ProfessionIcon } from "@/components/profession-icon";
import { Rate } from "@/components/rate";
import { SiteFooter } from "@/components/site";
import { CompanyIcon, Wordmark } from "@/components/ui";
import { db } from "@/db";
import { professions } from "@/db/schema";
import { getCatalog } from "@/lib/queries";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  const [p] = /^[a-z0-9-]{2,80}$/.test(slug) ? await db.select().from(professions).where(eq(professions.slug, slug)) : [];
  return p ?? null;
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await load((await params).slug);
  return { title: p ? `Portfel.pro dla: ${p.name}` : "Portfel.pro" };
}

/** Strona docelowa dla jednej branży: dopasowane usługi z prowizjami i rejestracja numerem telefonu. */
export default async function ProfessionLanding({ params }: { params: Promise<{ slug: string }> }) {
  const p = await load((await params).slug);
  if (!p) notFound();
  const items = (await getCatalog()).map((i) => ({ i, m: i.professions.find((x) => x.slug === p.slug) })).filter((x) => x.m);
  return (
    <>
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4"><Wordmark /><Link href="/telefon" className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-bold text-leather hover:bg-sand">Zaloguj się</Link></header>
      <main id="tresc" className="mx-auto grid w-full max-w-5xl gap-8 px-5 pb-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1.5 text-[13px] font-bold text-leather-dark"><ProfessionIcon name={p.icon} className="size-4" />{p.name}</p>
          <h1 className="mt-3 text-[32px] font-extrabold leading-[1.08] text-leather-dark sm:text-5xl">Twoi klienci już pytają. <span className="text-gold-deep">Zarabiaj na poleceniach.</span></h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink/80 sm:text-lg">W swojej pracy masz relacje z klientami, którzy potrzebują także innych usług. Polecaj sprawdzonych specjalistów i odbieraj prowizję — bez zatrudniania i bez realizowania usług samodzielnie.</p>
          <div className="mt-5 lg:hidden"><PhoneSignup profession={p.slug} /></div>

          <h2 className="mt-8 text-xl font-extrabold text-leather-dark">Usługi dopasowane do Twojej branży</h2>
          {items.length === 0 ? <p className="mt-2 text-sm text-muted">Dla tej branży przygotowujemy rekomendacje — po rejestracji zobaczysz cały katalog.</p> : (
            <ul className="mt-3 space-y-3" data-testid="profession-services">
              {items.map(({ i, m }) => (
                <li key={i.id} className="rounded-3xl border border-line bg-white p-4 shadow-(--shadow-card)">
                  <div className="flex items-start gap-3">
                    <CompanyIcon {...i.company} size={44} />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-x-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">{i.company.name}<GoogleRating rating={i.company.googleRating} reviews={i.company.googleReviews} compact className="normal-case tracking-normal" /></p>
                      <p className="text-[18px] font-extrabold leading-snug text-leather-dark">{i.name}</p>
                      <p className="mt-0.5 text-[13px] leading-snug text-muted">{m!.reason}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-cream px-3.5 py-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Twoja prowizja</span><Rate rate={i.rate} size="sm" />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <GoogleTrustCard compact className="mt-6" />
        </div>
        <aside className="hidden lg:sticky lg:top-6 lg:block"><p className="mb-2 text-sm font-bold text-leather-dark">Załóż konto w minutę</p><PhoneSignup profession={p.slug} /></aside>
        <div className="lg:hidden"><p className="mb-2 text-sm font-bold text-leather-dark">Załóż konto w minutę</p><PhoneSignup profession={p.slug} cta="Zaczynam" /></div>
      </main>
      <SiteFooter />
    </>
  );
}
