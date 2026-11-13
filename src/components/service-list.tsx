import { ChevronRight, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { CatalogItem } from "@/lib/queries";
import { GoogleRating } from "./google";
import { Rate } from "./rate";
import { CompanyIcon } from "./ui";

export type PickerItem = CatalogItem & { blocked: string | null; recommended: boolean };

/** Portfel usług: prosta lista. Cała karta otwiera usługę — tam partner wybiera etap i konkretny link. */
export function ServiceList({ items }: { items: PickerItem[] }) {
  const list = [...items].sort((a, b) => Number(b.recommended) - Number(a.recommended) || Number(!!a.blocked) - Number(!!b.blocked));
  return (
    <ul className="stagger grid gap-3 md:grid-cols-2">
      {list.map((i, n) => (
        <li key={i.id} style={{ "--i": Math.min(n, 8) } as CSSProperties}>
          <Link href={`/app/uslugi/${i.slug}`} data-testid={`service-${i.slug}`}
            className="press group relative flex h-full gap-3.5 overflow-hidden rounded-3xl border border-line bg-white p-4 shadow-(--shadow-card) hover:border-gold/60">
            <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ background: i.company.color }} />
            <CompanyIcon {...i.company} size={46} className="mt-0.5" />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-x-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
                {i.company.name}
                {i.recommended && <span className="inline-flex items-center gap-1 normal-case tracking-normal text-gold-deep"><Sparkles className="size-3" aria-hidden />dla Ciebie</span>}
              </span>
              <span className="mt-0.5 block text-[17px] font-extrabold leading-snug text-leather-dark">{i.name}</span>
              <span className="mt-0.5 block text-[13px] leading-snug text-muted">{i.audienceShort}</span>
              <span className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="rounded-xl bg-cream px-2.5 py-1"><Rate rate={i.rate} size="sm" /></span>
                <GoogleRating rating={i.company.googleRating} reviews={i.company.googleReviews} compact />
                {i.blocked && <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1 text-[11px] font-bold text-muted"><Lock className="size-3" aria-hidden />{i.access === "approval_required" ? "Wymaga zgody" : "Wkrótce"}</span>}
              </span>
            </span>
            <span className="leather-grad mt-2 grid size-8 shrink-0 place-items-center rounded-full transition-transform group-active:translate-x-1"><ChevronRight className="size-4" aria-hidden /></span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
