import { Stitch } from "@/components/stitch";
import { ArrowLeft, ChevronRight, Lock, MessageCircle, MessageSquareQuote, X } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getShareData, requestAccessAction } from "@/app/actions/partner";
import { ActionForm, CopyButton, SubmitButton } from "@/components/client";
import { CompanySheet } from "@/components/company-sheet";
import { ExpertCard } from "@/components/expert";
import { GoogleRating } from "@/components/google";
import { Rate } from "@/components/rate";
import { ReelTile } from "@/components/reel";
import { ServiceDetails } from "@/components/service-details";
import { factsOf, ServiceFacts } from "@/components/service-facts";
import { ClientHandoff } from "@/components/client-handoff";
import { StagePaths } from "@/components/share";
import { CompanyIcon, Notice } from "@/components/ui";
import { requirePartner } from "@/lib/auth";
import { displayRate } from "@/lib/commission";
import { companyInfo } from "@/lib/company";
import { env } from "@/lib/env";
import { expertOf } from "@/lib/expert";
import { getPartnerTerms, getPublishedAssets, getServiceBySlug } from "@/lib/queries";
import { recommendBlockLabel, recommendState } from "@/lib/tracking";
import { visibleVideo } from "@/lib/video";

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
  const reel = visibleVideo(service.reelUrl);
  const lockedAssets = state.can ? [] : await getPublishedAssets(service.id);

  return (
    // Pełnoekranowy widok „focus”: zakrywa nagłówek i dolną nawigację, wsuwa się z prawej jak otwierany artykuł.
    <div className="slide-in-right fixed inset-0 z-50 flex flex-col bg-cream" data-testid="service-screen">
      <div className="relative z-30 shrink-0 border-b border-line bg-white pt-[env(safe-area-inset-top)] shadow-[0_6px_18px_-12px_rgba(50,27,18,0.35)]">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-3 py-2">
          <Link href="/app/uslugi" className="press inline-flex min-h-11 items-center gap-1.5 rounded-full px-2.5 text-sm font-bold text-leather"><ArrowLeft className="size-4" aria-hidden />Portfel usług</Link>
          <p className="min-w-0 flex-1 truncate text-center text-[13px] font-bold text-muted">{company.name}</p>
          <Link href="/app/uslugi" aria-label="Zamknij usługę" className="press grid size-11 place-items-center rounded-full border border-line bg-white text-leather-dark" data-testid="close-service"><X className="size-5" aria-hidden /></Link>
        </div>
      </div>
    {/* przewija się tylko treść — pasek jest poza obszarem przewijania, więc nic nie może się nad nim pojawić */}
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" data-testid="service-scroll">
    <article className="mx-auto max-w-2xl px-5 pb-16 pt-4">
      {/* Karta usługi: co polecam i ile zarobię */}
      <header className="wallet wallet-sheen rounded-[28px] p-5">
<Stitch radius={19} />
        <div className="relative z-10 flex items-center gap-2.5">
          <CompanySheet company={companyInfo(company)} className="flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3 ring-1 ring-white/15">
            <CompanyIcon name={company.name} color={company.color} iconUrl={company.iconUrl} size={26} className="!rounded-full" />
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/90">{company.name}</span>
            <ChevronRight className="-ml-0.5 size-3.5 text-white/60" aria-hidden />
          </CompanySheet>
          <GoogleRating rating={company.googleRating} reviews={company.googleReviews} url={company.googleUrl} onDark className="ml-auto rounded-full bg-white/10 px-2.5 py-1" />
        </div>
        <h1 className="relative z-10 mt-3.5 text-[26px] font-extrabold leading-[1.12]">{service.name}</h1>
        {service.headline && (
          <div className="relative z-10 mt-3 flex items-start gap-2.5 rounded-2xl rounded-tl-md bg-white/10 px-3.5 py-2.5 ring-1 ring-white/10">
            <MessageCircle className="mt-0.5 size-[18px] shrink-0 text-gold-light" aria-hidden />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/60">Klient pyta</p>
              <p className="text-[15px] font-bold leading-snug" data-testid="service-headline">{service.headline}</p>
            </div>
          </div>
        )}
        <p className="relative z-10 mt-2.5 text-sm leading-snug text-white/80">{service.clientBenefit}</p>
        <div className="relative z-10 mt-4 border-t border-white/15 pt-3.5">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gold-light">Twoja prowizja</p>
          <div className="mt-0.5" data-testid="service-rate"><Rate rate={rate} size="lg" onDark /></div>
          {service.commissionCondition && <p className="mt-1 text-[13px] text-white/75">{service.commissionCondition}</p>}
        </div>
      </header>

      <ExpertCard expert={expertOf(service)} className="mt-4" />

      {reel && <div className="mt-4"><ReelTile src={reel} poster={service.reelPosterUrl} title={service.name} caption="Krótkie wideo, które wyjaśnia, komu i jak polecać tę usługę." /></div>}

      {/* Dymek: gotowe zdanie, którym partner zaczyna rozmowę */}
      {service.pitch && (
        <section className="mt-6" aria-labelledby="pitch" data-testid="pitch-bubble">
          <h2 id="pitch" className="flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-[0.1em] text-gold-deep"><MessageSquareQuote className="size-[18px]" aria-hidden />Jak to powiedzieć w 20 sekund</h2>
          <div className="relative mt-2.5">
            <div className="relative rounded-[26px] rounded-bl-md bg-linear-to-br from-[#fbedc0] to-[#ecd08a] px-5 pb-4 pt-5 shadow-[0_14px_30px_-16px_rgba(120,80,10,0.6)] ring-1 ring-gold/40">
              <span aria-hidden className="absolute -top-1 left-4 font-serif text-[64px] font-black leading-none text-leather-dark/20">“</span>
              <p className="relative text-[16px] font-semibold leading-relaxed text-[#3a2208]">{service.pitch}</p>
              <div className="mt-3 flex justify-end"><CopyButton small variant="primary" text={service.pitch} label="Kopiuj tekst" /></div>
            </div>
            {/* ogonek dymka */}
            <span aria-hidden className="absolute -bottom-2 left-6 size-5 rotate-45 rounded-[4px] bg-[#f0d898] ring-1 ring-gold/40 [clip-path:polygon(100%_0,100%_100%,0_100%)]" />
          </div>
        </section>
      )}

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

      <section className="mt-6" aria-labelledby="poznaj">
        <h2 id="poznaj" className="text-xl font-extrabold text-leather-dark">Poznaj usługę</h2>
        <div className="mt-3"><ServiceFacts facts={factsOf(service)} companyName={company.name} /></div>
        <div className="mt-4"><ServiceDetails service={service} company={company} collapsible /></div>
      </section>
    </article>
    </div>
    </div>
  );
}
