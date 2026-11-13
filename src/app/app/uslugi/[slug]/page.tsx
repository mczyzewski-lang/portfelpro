import { ArrowLeft, Lock, MessageSquareQuote, X } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getShareData, requestAccessAction } from "@/app/actions/partner";
import { ActionForm, CopyButton, SubmitButton } from "@/components/client";
import { GoogleRating, GoogleTrustCard } from "@/components/google";
import { Rate } from "@/components/rate";
import { ServiceDetails } from "@/components/service-details";
import { ClientHandoff } from "@/components/client-handoff";
import { StagePaths } from "@/components/share";
import { CompanyIcon, Notice } from "@/components/ui";
import { requirePartner } from "@/lib/auth";
import { displayRate } from "@/lib/commission";
import { env } from "@/lib/env";
import { getPartnerTerms, getPublishedAssets, getServiceBySlug } from "@/lib/queries";
import { recommendBlockLabel, recommendState } from "@/lib/tracking";

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { partner } = await requirePartner();
  const { slug } = await params;
  const found = await getServiceBySlug(slug);
  if (!found || found.service.status !== "published" || !found.company.published) notFound();
  const { service, company } = found;
  const term = (await getPartnerTerms(partner.id)).find((t) => t.serviceId === service.id);
  const state = recommendState(partner, service, term);
  const rate = displayRate(service, term, env.demoMode);
  const share = state.can ? await getShareData(service.id) : null;
  const lockedAssets = state.can ? [] : await getPublishedAssets(service.id);

  return (
    <article className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <Link href="/app/uslugi" className="press -ml-2 inline-flex min-h-10 items-center gap-1.5 rounded-full px-2 text-sm font-bold text-leather"><ArrowLeft className="size-4" aria-hidden />Portfel usług</Link>
        <Link href="/app/uslugi" aria-label="Zamknij usługę" className="press grid size-10 place-items-center rounded-full border border-line bg-white text-leather-dark" data-testid="close-service"><X className="size-5" aria-hidden /></Link>
      </div>

      {/* Karta usługi: co polecam i ile zarobię */}
      <header className="wallet wallet-sheen mt-1 rounded-[28px] p-5">
        <div className="relative z-10 flex items-center gap-2.5">
          <CompanyIcon name={company.name} color={company.color} iconUrl={company.iconUrl} size={34} />
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/75">{company.name}</span>
          <GoogleRating rating={company.googleRating} reviews={company.googleReviews} url={company.googleUrl} onDark className="ml-auto rounded-full bg-white/10 px-2.5 py-1" />
        </div>
        <h1 className="relative z-10 mt-3 text-[26px] font-extrabold leading-[1.12]">{service.name}</h1>
        <p className="relative z-10 mt-1.5 text-sm leading-snug text-white/80">{service.clientBenefit}</p>
        <div className="relative z-10 mt-4 border-t border-white/15 pt-3.5">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gold-light">Twoja prowizja</p>
          <div className="mt-0.5" data-testid="service-rate"><Rate rate={rate} size="lg" onDark /></div>
          {service.commissionCondition && <p className="mt-1 text-[13px] text-white/75">{service.commissionCondition}</p>}
        </div>
      </header>

      {/* Najważniejsza akcja: dobierz link do etapu klienta i wyślij */}
      <section className="mt-6" aria-labelledby="polecaj">
        <h2 id="polecaj" className="text-xl font-extrabold text-leather-dark">Wybierz link dla klienta</h2>
        <p className="mt-0.5 text-sm text-muted">Najpierw etap klienta, pod nim linki tylko dla tego etapu.</p>
        <div className="mt-3.5">
          {share?.ok ? (
            <StagePaths assets={share.assets} serviceName={service.name}
              consultationExtra={<ClientHandoff serviceId={service.id} sensitive={service.sensitive} />} />
          ) : (
            <div className="rounded-3xl border border-line bg-white p-5 shadow-(--shadow-card)">
              <p className="flex items-center gap-2 font-bold text-leather-dark"><Lock className="size-4" aria-hidden />{state.can ? "Linki chwilowo niedostępne" : recommendBlockLabel[state.reason]}</p>
              {!state.can && state.reason === "needs_access" && (
                <>
                  <p className="mt-1.5 text-sm text-muted">Ze względu na charakter tej usługi (regulacje prawne, finansowe lub zdrowotne) forma współpracy i warunki prowizji są zatwierdzane indywidualnie.</p>
                  <ActionForm action={requestAccessAction} className="mt-4">
                    <input type="hidden" name="serviceId" value={service.id} />
                    <SubmitButton className="press w-full">Poproś o dostęp do usługi</SubmitButton>
                  </ActionForm>
                </>
              )}
              {!state.can && state.reason === "access_requested" && <Notice tone="neutral" className="mt-3">Twój wniosek został przyjęty. Linki pojawią się tutaj po decyzji.</Notice>}
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted">Materiały, które będziesz mógł wysyłać</p>
              <ul className="mt-1.5 space-y-1 text-sm text-ink/85">{lockedAssets.map((a) => <li key={a.id}>• {a.title}</li>)}</ul>
            </div>
          )}
        </div>
      </section>

      {service.pitch && (
        <section className="mt-6 rounded-3xl border border-gold/40 bg-white p-5" aria-labelledby="pitch">
          <h2 id="pitch" className="flex items-center gap-2 text-[17px] font-extrabold text-leather-dark"><MessageSquareQuote className="size-5 text-gold-deep" aria-hidden />Jak to powiedzieć w 20 sekund</h2>
          <p className="mt-2 text-[15px] italic leading-relaxed text-ink/85">„{service.pitch}”</p>
          <div className="mt-3"><CopyButton small variant="secondary" text={service.pitch} label="Kopiuj tekst" /></div>
        </section>
      )}

      <section className="mt-6" aria-labelledby="poznaj">
        <h2 id="poznaj" className="text-xl font-extrabold text-leather-dark">Poznaj usługę</h2>
        <div className="mt-3"><ServiceDetails service={service} company={company} collapsible /></div>
      </section>
      <GoogleTrustCard compact className="mt-6" />
    </article>
  );
}
