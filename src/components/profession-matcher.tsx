"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import type { CatalogItem } from "@/lib/queries";
import { ProfessionIcon } from "./profession-icon";
import { Rate } from "./rate";
import { btn, CompanyMark } from "./ui";

type P = { slug: string; label: string; name: string; icon: string };

export function ProfessionMatcher({ professions, items }: { professions: P[]; items: CatalogItem[] }) {
  const [sel, setSel] = useState(professions[0]?.slug ?? "");
  const matched = items
    .map((i) => ({ i, m: i.professions.find((p) => p.slug === sel) }))
    .filter((x) => x.m);
  const current = professions.find((p) => p.slug === sel);
  return (
    <div>
      <div role="radiogroup" aria-label="Wybierz, czym się zajmujesz" className="no-scrollbar -mx-5 flex snap-x gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {professions.map((p) => (
          <button key={p.slug} type="button" role="radio" aria-checked={sel === p.slug} onClick={() => setSel(p.slug)}
            className={cn("inline-flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors",
              sel === p.slug ? "border-leather bg-leather text-white" : "border-line bg-white text-ink hover:bg-sand")}>
            <ProfessionIcon name={p.icon} className="size-4" />{p.label}
          </button>
        ))}
      </div>

      <div aria-live="polite" className="mt-5 rounded-(--radius-card) border border-line bg-white p-5 shadow-(--shadow-card)">
        <p className="text-sm text-muted">{current?.name} — najlepiej dopasowane usługi:</p>
        {matched.length === 0 ? (
          <p className="mt-3 text-sm">Dla tej grupy przygotowujemy rekomendacje. Już teraz możesz przejrzeć cały katalog.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {matched.map(({ i, m }) => (
              <li key={i.id} className="flex items-start justify-between gap-4 py-3.5">
                <div className="min-w-0">
                  <CompanyMark {...i.company} />
                  <p className="mt-0.5 font-bold leading-snug text-leather-dark">{i.name}</p>
                  <p className="mt-0.5 text-sm text-muted">{m!.reason}</p>
                </div>
                <div className="shrink-0 text-right"><Rate rate={i.rate} size="sm" /></div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted">To propozycje dopasowania. Niektóre usługi wymagają dodatkowego zatwierdzenia współpracy.</p>
        <Link href="/rejestracja" className={btn("primary", "mt-4 w-full sm:w-auto")}>Załóż bezpłatny Portfel</Link>
      </div>
    </div>
  );
}
