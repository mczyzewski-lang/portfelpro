import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getShareData, requestAccessAction } from "@/app/actions/partner";
import { ActionForm, SubmitButton } from "@/components/client";
import { Rate } from "@/components/rate";
import { ServiceDetails } from "@/components/service-details";
import { StagePaths } from "@/components/share";
import { Card, CompanyMark, Notice } from "@/components/ui";
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
    <article>
      <Link href="/app/uslugi" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-bold text-leather"><ArrowLeft className="size-4" aria-hidden />Usługi</Link>

      <header className="mt-1">
        <CompanyMark name={company.name} color={company.color} logoUrl={company.logoUrl} />
        <h1 className="mt-1 text-[28px] font-extrabold leading-tight text-leather-dark">{service.name}</h1>
        <p className="mt-1.5 text-[15px] text-ink/85">{service.clientBenefit}</p>
      </header>

      <div className="wallet mt-4 rounded-[24px] p-5">
        <p className="relative z-10 text-[11px] font-bold uppercase tracking-[0.12em] text-gold-light">Twoja prowizja</p>
        <div className="relative z-10 mt-1" data-testid="service-rate"><Rate rate={rate} size="lg" onDark /></div>
        {service.commissionCondition && <p className="relative z-10 mt-1.5 text-sm text-white/80"><span className="font-semibold text-white">Warunek:</span> {service.commissionCondition}</p>}
      </div>

      <section className="mt-6" aria-labelledby="polecaj">
        <h2 id="polecaj" className="text-xl font-extrabold text-leather-dark">Trzy drogi polecenia</h2>
        <p className="mt-1 text-sm text-muted">Wybierz punkt wejścia pasujący do tego, na ile klient jest gotowy. To nie są obowiązkowe etapy.</p>
        <div className="mt-4">
          {share?.ok ? (
            <StagePaths assets={share.assets} serviceName={service.name} />
          ) : (
            <Card className="p-5">
              <p className="flex items-center gap-2 font-bold text-leather-dark"><Lock className="size-4" aria-hidden />{state.can ? "Linki chwilowo niedostępne" : recommendBlockLabel[state.reason]}</p>
              {!state.can && state.reason === "needs_access" && (
                <>
                  <p className="mt-1.5 text-sm text-muted">Ze względu na charakter tej usługi (regulacje prawne, finansowe lub zdrowotne) forma współpracy i warunki prowizji są zatwierdzane indywidualnie.</p>
                  <ActionForm action={requestAccessAction} className="mt-4">
                    <input type="hidden" name="serviceId" value={service.id} />
                    <SubmitButton>Poproś o dostęp do usługi</SubmitButton>
                  </ActionForm>
                </>
              )}
              {!state.can && state.reason === "access_requested" && <Notice tone="neutral" className="mt-3">Twój wniosek został przyjęty. Linki pojawią się tutaj po decyzji.</Notice>}
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted">Materiały, które będziesz mógł udostępniać</p>
              <ul className="mt-1.5 space-y-1 text-sm text-ink/85">{lockedAssets.map((a) => <li key={a.id}>• {a.title}</li>)}</ul>
            </Card>
          )}
        </div>
      </section>

      <Card className="mt-6 p-5"><ServiceDetails service={service} company={company} /></Card>
    </article>
  );
}
