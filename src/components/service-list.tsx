import { ChevronRight, Lock, MessageCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { CatalogItem } from "@/lib/queries";
import { GoogleRating } from "./google";
import { Rate } from "./rate";
import { CompanyIcon } from "./ui";

export type PickerItem = CatalogItem & { blocked: string | null; recommended: boolean };

/**
 * Portfel usług — karta w trzech czytelnych strefach:
 * 1) kto i co: ekspert, firma i NAZWA USŁUGI (największa), 2) dymek z pytaniem klienta, 3) stopka: prowizja i wejście.
 */
export function ServiceList({ items }: { items: PickerItem[] }) {
  const list = [...items].sort((a, b) => Number(b.recommended) - Number(a.recommended) || Number(!!a.blocked) - Number(!!b.blocked));
  return (
    <ul className="stagger grid gap-3.5 md:grid-cols-2">
      {list.map((i, n) => (
        <li key={i.id} style={{ "--i": Math.min(n, 8) } as CSSProperties}>
          <Link href={`/app/uslugi/${i.slug}`} data-testid={`service-${i.slug}`}
            className="press group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-(--shadow-card) hover:border-gold/60">
            {i.recommended && <span className="gold-grad absolute right-0 top-0 inline-flex items-center gap-1 rounded-bl-2xl px-2.5 py-1 text-[11px] font-bold"><Sparkles className="size-3" aria-hidden />dla Ciebie</span>}

            {/* 1. kto i co */}
            <span className="flex items-center gap-3.5 px-4 pt-4">
              {i.expert?.photoUrl
                // eslint-disable-next-line @next/next/no-img-element -- zdjęcie eksperta ustawiane w panelu
                ? <span className="relative shrink-0"><img src={i.expert.photoUrl} alt="" width={60} height={60} title={i.expert.name} className="size-[60px] rounded-full object-cover ring-2 ring-gold-light" /><CompanyIcon {...i.company} size={24} className="absolute -bottom-1 -right-1 ring-2 ring-white" /></span>
                : <CompanyIcon {...i.company} size={56} />}
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
                  {i.company.name}<GoogleRating rating={i.company.googleRating} reviews={i.company.googleReviews} compact className="normal-case tracking-normal" />
                </span>
                <span className="mt-0.5 block text-[20px] font-extrabold leading-[1.15] text-leather-dark">{i.name}</span>
              </span>
            </span>

            {/* 2. pytanie klienta */}
            {i.headline && (
              <span className="mx-4 mt-3 flex items-start gap-2.5 rounded-2xl rounded-tl-md bg-cream px-3.5 py-2.5">
                <MessageCircle className="mt-0.5 size-[18px] shrink-0 text-gold-deep" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Klient pyta</span>
                  <span className="block text-[15px] font-bold leading-snug text-ink" data-testid="service-headline">{i.headline}</span>
                </span>
              </span>
            )}

            {/* 3. prowizja i wejście */}
            <span className="mt-3.5 flex flex-1 items-end">
              <span className="flex w-full items-center justify-between gap-3 border-t border-line bg-cream/50 px-4 py-3">
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Twoja prowizja</span>
                  <Rate rate={i.rate} size="sm" />
                </span>
                {i.blocked
                  ? <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-sand px-3 py-2 text-xs font-bold text-muted"><Lock className="size-3.5" aria-hidden />{i.access === "approval_required" ? "Wymaga zgody" : "Wkrótce"}</span>
                  : <span className="leather-grad inline-flex shrink-0 items-center gap-1 rounded-full py-2 pl-4 pr-2.5 text-sm font-bold">Poleć<ChevronRight className="size-4 transition-transform group-active:translate-x-1" aria-hidden /></span>}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
