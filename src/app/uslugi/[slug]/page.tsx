import { notFound } from "next/navigation";
import { GoogleRating } from "@/components/google";
import { Rate } from "@/components/rate";
import { ServiceDetails } from "@/components/service-details";
import { SiteFooter } from "@/components/site";
import { Card, CompanyMark, LinkButton, Wordmark } from "@/components/ui";
import { displayRate } from "@/lib/commission";
import { env } from "@/lib/env";
import { stageLabel, STAGES } from "@/lib/labels";
import { getPublishedAssets, getServiceBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const found = await getServiceBySlug((await params).slug);
  return { title: found?.service.status === "published" ? found.service.name : "Usługa" };
}

/** Publiczna karta usługi — pełna informacja o prowizji bez logowania. */
export default async function PublicService({ params }: { params: Promise<{ slug: string }> }) {
  const found = await getServiceBySlug((await params).slug);
  if (!found || found.service.status !== "published" || !found.company.published) notFound();
  const { service, company } = found;
  const assets = await getPublishedAssets(service.id);
  return (
    <>
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-4"><Wordmark /><LinkButton href="/rejestracja" className="min-h-10 px-4 text-sm">Załóż Portfel</LinkButton></header>
      <main id="tresc" className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1"><CompanyMark name={company.name} color={company.color} iconUrl={company.iconUrl} /><GoogleRating rating={company.googleRating} reviews={company.googleReviews} url={company.googleUrl} /></div>
        <h1 className="mt-1 text-[30px] font-extrabold leading-tight text-leather-dark">{service.name}</h1>
        <p className="mt-2 text-[15px] text-ink/85">{service.clientBenefit}</p>
        <div className="wallet mt-5 rounded-[24px] p-5">
          <p className="relative z-10 text-[11px] font-bold uppercase tracking-[0.12em] text-gold-light">Prowizja partnera</p>
          <div className="relative z-10 mt-1"><Rate rate={displayRate(service, null, env.demoMode)} size="lg" onDark /></div>
          {service.commissionCondition && <p className="relative z-10 mt-1.5 text-sm text-white/80"><span className="font-semibold text-white">Warunek:</span> {service.commissionCondition}</p>}
          {service.access === "approval_required" && <p className="relative z-10 mt-2 text-xs text-white/65">Polecanie tej usługi wymaga zatwierdzenia formy współpracy.</p>}
        </div>
        <Card className="mt-5 p-5">
          <h2 className="text-[17px] font-extrabold text-leather-dark">Jak możesz ją polecać</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {STAGES.map((s) => (
              <div key={s} className="rounded-2xl bg-cream p-3.5">
                <p className="text-xs font-extrabold uppercase tracking-wide text-leather">{stageLabel[s]}</p>
                <ul className="mt-1.5 space-y-1 text-sm text-ink/85">{assets.filter((a) => a.stage === s).map((a) => <li key={a.id}>{a.title}</li>)}</ul>
              </div>
            ))}
          </div>
          <LinkButton href="/rejestracja" className="mt-4 w-full sm:w-auto">Załóż konto i odbierz swoje linki</LinkButton>
        </Card>
        <Card className="mt-5 p-5"><ServiceDetails service={service} company={company} showPitchCopy={false} /></Card>
      </main>
      <SiteFooter />
    </>
  );
}
