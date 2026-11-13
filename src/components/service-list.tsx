"use client";

import { ChevronRight, Lock, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import type { CatalogItem } from "@/lib/queries";
import { GoogleRating } from "./google";
import { Rate } from "./rate";
import { CompanyIcon } from "./ui";

export type PickerItem = CatalogItem & { blocked: string | null; recommended: boolean };

/**
 * Lista usług w portfelu. Cała karta prowadzi do usługi —
 * dopiero tam partner wybiera etap (edukacja / konsultacja / transakcja) i konkretny link.
 */
export function ServiceList({ items }: { items: PickerItem[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const cats = useMemo(() => [...new Set(items.map((i) => i.category))].sort(), [items]);
  const hasRecommended = items.some((i) => i.recommended);
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items
      .filter((i) => (cat === "" || (cat === "__rec" ? i.recommended : i.category === cat)) &&
        (!needle || `${i.name} ${i.company.name} ${i.category} ${i.clientBenefit} ${i.audienceShort}`.toLowerCase().includes(needle)))
      .sort((a, b) => Number(b.recommended) - Number(a.recommended) || Number(!!a.blocked) - Number(!!b.blocked));
  }, [items, q, cat]);
  const chip = (active: boolean) => cn("press min-h-9 shrink-0 rounded-full border px-3.5 text-sm font-semibold", active ? "border-leather bg-leather text-white" : "border-line bg-white text-ink");

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted" aria-hidden />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Szukaj usługi lub branży" aria-label="Szukaj usługi"
          className="block min-h-12 w-full rounded-2xl border border-line bg-white pl-11 pr-4 text-base shadow-(--shadow-card) placeholder:text-muted/70 focus:border-leather focus:outline-none focus:ring-2 focus:ring-leather/20" />
      </div>
      <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Filtr kategorii">
        <button type="button" className={chip(cat === "")} aria-pressed={cat === ""} onClick={() => setCat("")}>Wszystkie</button>
        {hasRecommended && <button type="button" className={chip(cat === "__rec")} aria-pressed={cat === "__rec"} onClick={() => setCat("__rec")}>Dla Ciebie</button>}
        {cats.map((c) => <button key={c} type="button" className={chip(cat === c)} aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>)}
      </div>

      <ul key={`${cat}|${q}`} className="stagger mt-4 grid gap-3 md:grid-cols-2">
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
              <ChevronRight className="mt-3 size-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-active:translate-x-1" aria-hidden />
            </Link>
          </li>
        ))}
        {list.length === 0 && <li className="rounded-3xl border border-dashed border-line px-5 py-8 text-center text-sm text-muted md:col-span-2">Nie znaleźliśmy usług dla tych kryteriów.</li>}
      </ul>
    </div>
  );
}
