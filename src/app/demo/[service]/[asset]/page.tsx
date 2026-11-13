import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, CompanyMark, btn } from "@/components/ui";
import { db } from "@/db";
import { contentAssets } from "@/db/schema";
import { assetTypeLabel } from "@/lib/labels";
import { getPublishedAssets, getServiceBySlug } from "@/lib/queries";
import { REF_PARAM } from "@/lib/tracking";
import { LeadForm } from "./lead-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Materiał demonstracyjny", robots: { index: false } };

/**
 * Wewnętrzna strona docelowa (DEMO) — zastępuje strony spółek do czasu podłączenia integracji.
 * Token ?pp_ref= jest przenoszony do kolejnych kroków i do formularza, tak jak zrobi to docelowa strona spółki.
 */
export default async function DemoAsset({ params, searchParams }: {
  params: Promise<{ service: string; asset: string }>; searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { service: serviceSlug, asset: assetSlug } = await params;
  const sp = await searchParams;
  const ref = /^[A-Za-z0-9]{10,40}$/.test(sp[REF_PARAM] ?? "") ? sp[REF_PARAM]! : "";
  const found = await getServiceBySlug(serviceSlug);
  if (!found || found.service.status !== "published") notFound();
  const { service, company } = found;
  const [asset] = await db.select().from(contentAssets)
    .where(and(eq(contentAssets.serviceId, service.id), eq(contentAssets.slug, assetSlug), eq(contentAssets.status, "published")));
  if (!asset) notFound();
  const all = await getPublishedAssets(service.id);
  const next = (stage: "consultation" | "transaction") => {
    const a = all.find((x) => x.stage === stage && !x.targetUrl);
    return a ? `/demo/${service.slug}/${a.slug}${ref ? `?${REF_PARAM}=${ref}` : ""}` : null;
  };
  const consult = next("consultation");
  const offer = next("transaction");

  return (
    <>
      <div className="bg-sand px-4 py-1.5 text-center text-xs font-medium text-muted">Strona demonstracyjna Portfel.pro — docelowo materiał będzie na stronie {company.name}.</div>
      <main id="tresc" className="mx-auto w-full max-w-xl flex-1 px-5 py-8">
        <CompanyMark name={company.name} color={company.color} iconUrl={company.iconUrl} />
        <div className="mt-2"><Badge>{assetTypeLabel[asset.type]}</Badge></div>
        <h1 className="mt-2 text-[28px] font-extrabold leading-tight text-leather-dark">{asset.title}</h1>

        {asset.stage === "education" ? (
          <>
            <div className="mt-5 space-y-4 text-[16px] leading-relaxed text-ink/90">
              {(asset.body || asset.description).split(/\n{2,}/).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
            </div>
            <Card className="mt-8 p-5">
              <p className="font-extrabold text-leather-dark">Chcesz porozmawiać o swojej sytuacji?</p>
              <p className="mt-1 text-sm text-muted">{service.name} — {company.name}</p>
              <div className="mt-4 flex flex-col gap-2.5">
                {consult && <Link href={consult} className={btn("primary")} data-testid="go-consultation">Umów bezpłatną rozmowę</Link>}
                {offer && <Link href={offer} className={btn("secondary")}>Przejdź do oferty</Link>}
              </div>
            </Card>
          </>
        ) : (
          <>
            <p className="mt-3 text-[15px] text-ink/85">{asset.description}</p>
            <Card className="mt-6 p-5">
              <LeadForm assetId={asset.id} refToken={ref} sensitive={service.sensitive}
                cta={asset.stage === "consultation" ? "Poproszę o kontakt" : "Rozpocznij — wyślij zgłoszenie"} />
            </Card>
            {asset.stage === "consultation" && offer && (
              <p className="mt-4 text-center text-sm text-muted">Wiesz już, czego potrzebujesz? <Link href={offer} className="font-semibold text-leather underline">Przejdź do oferty</Link></p>
            )}
          </>
        )}
        <p className="mt-8 text-xs text-muted">Materiał ma charakter informacyjny i nie stanowi porady prawnej, podatkowej ani medycznej.</p>
      </main>
    </>
  );
}
