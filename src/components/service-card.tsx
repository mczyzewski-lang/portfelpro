import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { CatalogItem } from "@/lib/queries";
import { GoogleRating } from "./google";
import { Rate } from "./rate";
import { Card, CompanyMark } from "./ui";

export function ServiceCard({ item, href, cta = "Poznaj usługę", reason }: { item: CatalogItem; href: string; cta?: string; reason?: string }) {
  return (
    <Card className="flex h-full flex-col p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1"><CompanyMark {...item.company} /><GoogleRating rating={item.company.googleRating} reviews={item.company.googleReviews} compact /></div>
      <h3 className="mt-2 text-lg font-extrabold leading-snug text-leather-dark">
        <Link href={href} className="after:absolute after:inset-0 hover:underline">{item.name}</Link>
      </h3>
      <p className="mt-1.5 text-sm text-ink/85">{item.clientBenefit}</p>
      <p className="mt-2 text-xs text-muted"><span className="font-semibold text-ink">Dla kogo:</span> {reason ?? item.audienceShort}</p>
      <div className="mt-4 flex-1" />
      <div className="rounded-2xl bg-cream px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">Twoja prowizja</p>
        <div className="mt-0.5"><Rate rate={item.rate} /></div>
        {item.commissionCondition && <p className="mt-0.5 text-xs text-muted">{item.commissionCondition}</p>}
      </div>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-leather" aria-hidden>{cta} <ArrowRight className="size-4" /></span>
    </Card>
  );
}
