"use client";

import { Lock, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type { CatalogItem } from "@/lib/queries";
import { Rate } from "./rate";
import { QuickShare } from "./share";
import { Badge, CompanyMark, inputCls } from "./ui";

export type PickerItem = CatalogItem & { blocked: string | null; recommended: boolean };

/** Lista usług z wyszukiwarką, filtrem kategorii i natychmiastowym udostępnianiem. */
export function ServicePicker({ items, showRecommendedFirst = true }: { items: PickerItem[]; showRecommendedFirst?: boolean }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const cats = useMemo(() => [...new Set(items.map((i) => i.category))].sort(), [items]);
  const hasRecommended = items.some((i) => i.recommended);
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const f = items.filter((i) =>
      (cat === "" || (cat === "__rec" ? i.recommended : i.category === cat)) &&
      (!needle || `${i.name} ${i.company.name} ${i.category} ${i.clientBenefit} ${i.audienceShort}`.toLowerCase().includes(needle)));
    return showRecommendedFirst ? [...f].sort((a, b) => Number(b.recommended) - Number(a.recommended)) : f;
  }, [items, q, cat, showRecommendedFirst]);
  const chip = (active: boolean) => cn("min-h-9 shrink-0 rounded-full border px-3.5 text-sm font-semibold", active ? "border-leather bg-leather text-white" : "border-line bg-white hover:bg-sand");

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Szukaj usługi, marki lub branży" aria-label="Szukaj usługi" className={cn(inputCls, "pl-10")} />
      </div>
      <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Filtr kategorii">
        <button type="button" className={chip(cat === "")} aria-pressed={cat === ""} onClick={() => setCat("")}>Wszystkie</button>
        {hasRecommended && <button type="button" className={chip(cat === "__rec")} aria-pressed={cat === "__rec"} onClick={() => setCat("__rec")}>Polecane dla Ciebie</button>}
        {cats.map((c) => <button key={c} type="button" className={chip(cat === c)} aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>)}
      </div>

      <ul className="mt-4 space-y-3">
        {list.map((i) => (
          <li key={i.id} className="rounded-(--radius-card) border border-line bg-white p-4 shadow-(--shadow-card)">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <CompanyMark {...i.company} />
                  {i.recommended && <Badge tone="gold">Polecane dla Ciebie</Badge>}
                </div>
                <Link href={`/app/uslugi/${i.slug}`} className="mt-1 block text-[17px] font-extrabold leading-snug text-leather-dark hover:underline">{i.name}</Link>
                <p className="mt-0.5 text-sm text-muted">{i.audienceShort}</p>
              </div>
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div>
                <Rate rate={i.rate} />
                {i.commissionCondition && <p className="text-xs text-muted">{i.commissionCondition}</p>}
              </div>
              {i.blocked
                ? <Link href={`/app/uslugi/${i.slug}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-sand px-3 text-xs font-bold text-muted"><Lock className="size-3.5" aria-hidden />Szczegóły</Link>
                : <QuickShare serviceId={i.id} serviceName={i.name} slug={i.slug} />}
            </div>
            {i.blocked && <p className="mt-2 text-xs font-medium text-warn">{i.blocked}</p>}
          </li>
        ))}
        {list.length === 0 && <li className="rounded-(--radius-card) border border-dashed border-line px-5 py-8 text-center text-sm text-muted">Nie znaleźliśmy usług dla tych kryteriów.</li>}
      </ul>
    </div>
  );
}
