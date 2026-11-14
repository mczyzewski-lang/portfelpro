import { ChevronRight, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { CatalogItem } from "@/lib/queries";
import { GoogleRating } from "./google";
import { Rate } from "./rate";
import { CompanyIcon } from "./ui";

export type PickerItem = CatalogItem & { blocked: string | null; recommended: boolean };

/**
 * Portfel usług. Karta zaczyna się od pytania klienta („Jak wyjść z długów osobistych?”),
 * pod nim nazwa usługi; w prawym górnym rogu twarz eksperta. Cała karta otwiera usługę.
 */
export function ServiceList({ items }: { items: PickerItem[] }) {
  const list = [...items].sort((a, b) => Number(b.recommended) - Number(a.recommended) || Number(!!a.blocked) - Number(!!b.blocked));
  return (
    <ul className="stagger grid gap-3 md:grid-cols-2">
      {list.map((i, n) => (
        <li key={i.id} style={{ "--i": Math.min(n, 8) } as CSSProperties}>
          <Link href={`/app/uslugi/${i.slug}`} data-testid={`service-${i.slug}`}
            className="press group relative block h-full overflow-hidden rounded-3xl border border-line bg-white p-4 shadow-(--shadow-card) hover:border-gold/60">
            <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ background: i.company.color }} />
            <span className="flex items-start gap-3">
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
                  <CompanyIcon {...i.company} size={22} />{i.company.name}
                  {i.recommended && <span className="inline-flex items-center gap-1 normal-case tracking-normal text-gold-deep"><Sparkles className="size-3" aria-hidden />dla Ciebie</span>}
                </span>
                <span className="mt-2 block text-[19px] font-extrabold leading-[1.2] text-leather-dark" data-testid="service-headline">{i.headline ?? i.name}</span>
                {i.headline && <span className="mt-1 block text-[11px] font-extrabold uppercase tracking-[0.1em] text-gold-deep">{i.name}</span>}
              </span>
              {i.expert?.photoUrl
                // eslint-disable-next-line @next/next/no-img-element -- zdjęcie eksperta ustawiane w panelu
                ? <img src={i.expert.photoUrl} alt="" width={60} height={60} title={i.expert.name} className="size-[60px] shrink-0 rounded-full object-cover shadow-md ring-2 ring-gold-light" />
                : <CompanyIcon {...i.company} size={46} />}
            </span>
            <span className="mt-1.5 block text-[13px] leading-snug text-muted">{i.audienceShort}</span>
            <span className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-xl bg-cream px-2.5 py-1"><Rate rate={i.rate} size="sm" /></span>
              <GoogleRating rating={i.company.googleRating} reviews={i.company.googleReviews} compact />
              {i.blocked && <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1 text-[11px] font-bold text-muted"><Lock className="size-3" aria-hidden />{i.access === "approval_required" ? "Wymaga zgody" : "Wkrótce"}</span>}
              <span className="leather-grad ml-auto grid size-8 shrink-0 place-items-center rounded-full transition-transform group-active:translate-x-1"><ChevronRight className="size-4" aria-hidden /></span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
