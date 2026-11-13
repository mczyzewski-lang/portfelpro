"use client";

import { ArrowLeft, ChevronDown, ChevronRight, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { PublicWalletData } from "@/lib/public-wallet";
import { GoogleRating } from "./google";
import { CompanyIcon } from "./ui";

type Item = PublicWalletData["items"][number];

function Buttons({ item, big = false }: { item: Item; big?: boolean }) {
  const h = big ? "min-h-12 text-[15px]" : "min-h-11 text-[13px]";
  return (
    <div className="grid grid-cols-2 gap-2">
      {item.learn && <a href={item.learn} className={`press flex ${h} items-center justify-center whitespace-nowrap rounded-full border border-line bg-cream px-2 font-bold text-leather-dark`}>Dowiedz się więcej</a>}
      {item.talk && <a href={item.talk} className={`leather-grad press flex ${h} items-center justify-center gap-1.5 rounded-full px-2 font-bold ${item.learn ? "" : "col-span-2"}`}><MessageCircle className="size-4" aria-hidden />Porozmawiaj</a>}
    </div>
  );
}

/**
 * Portfel Publiczny w jednym ekranie: partner w przypiętym pasku, lista usług na całą szerokość,
 * a po wybraniu usługi lista odjeżdża w lewo i w jej miejsce wsuwają się szczegóły.
 */
export function PublicWalletView({ wallet, photoUrl }: { wallet: PublicWalletData; photoUrl: string | null }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [dir, setDir] = useState<"in" | "back">("in");
  const item = wallet.items.find((i) => i.id === openId) ?? null;

  // Przycisk „wstecz” przeglądarki zamyka szczegóły zamiast opuszczać stronę.
  useEffect(() => {
    const onPop = () => { setDir("back"); setOpenId(null); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const open = (id: string) => { history.pushState({ service: id }, ""); setDir("in"); setOpenId(id); window.scrollTo({ top: 0, behavior: "instant" }); };
  const back = () => history.back();

  return (
    <div className="flex min-h-dvh flex-col" data-testid="public-wallet">
      <header className="sticky top-0 z-20">
        <div className="wallet"><div className="relative z-10 mx-auto flex h-[84px] max-w-xl items-center gap-3 px-5">
          {photoUrl
            // eslint-disable-next-line @next/next/no-img-element -- zdjęcie udostępnione przez partnera w Portfelu Publicznym
            ? <img src={photoUrl} alt="" width={56} height={56} className="size-14 shrink-0 rounded-full object-cover ring-2 ring-gold-light" />
            : <span aria-hidden className="gold-grad grid size-14 shrink-0 place-items-center rounded-full text-xl font-extrabold">{wallet.initials}</span>}
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold leading-tight">{wallet.name}</h1>
            {(wallet.bio || wallet.companyName) && <p className="truncate text-[13px] text-white/80">{wallet.bio || wallet.companyName}</p>}
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-light">Polecam sprawdzonych specjalistów</p>
          </div>
        </div></div>
      </header>

      <main id="tresc" className="mx-auto w-full max-w-xl flex-1 overflow-x-clip">
        {!item ? (
          <ul key="list" className={dir === "back" ? "slide-in-left" : "page-enter"} data-testid="public-list">
            {wallet.items.map((i) => (
              <li key={i.id} className="border-b border-line bg-white">
                <button type="button" onClick={() => open(i.id)} className="press flex w-full items-start gap-3.5 px-5 pb-3 pt-4 text-left" data-testid={`public-item-${i.slug}`}>
                  <CompanyIcon name={i.company.name} color={i.company.color} iconUrl={i.company.iconUrl} size={46} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">{i.company.name}<GoogleRating rating={i.company.googleRating} reviews={i.company.googleReviews} compact className="normal-case tracking-normal" /></span>
                    <span className="block text-[17px] font-extrabold leading-snug text-leather-dark">{i.name}</span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-muted">{i.benefit}</span>
                  </span>
                  <ChevronRight className="mt-3 size-5 shrink-0 text-muted" aria-hidden />
                </button>
                <div className="px-5 pb-4"><Buttons item={i} /></div>
              </li>
            ))}
            {wallet.items.length === 0 && <li className="px-5 py-12 text-center text-sm text-muted">Lista polecanych usług jest w przygotowaniu.</li>}
          </ul>
        ) : (
          <article key={item.id} className="slide-in-right bg-white pb-28" data-testid="public-detail">
            <div className="sticky top-[84px] z-10 border-b border-line bg-white/95 px-3 py-1.5 backdrop-blur">
              <button type="button" onClick={back} className="press inline-flex min-h-11 items-center gap-1.5 rounded-full px-2.5 text-sm font-bold text-leather" data-testid="public-back"><ArrowLeft className="size-4" aria-hidden />Wszystkie usługi</button>
            </div>
            <div className="px-5 pt-5">
              <div className="flex items-center gap-2.5">
                <CompanyIcon name={item.company.name} color={item.company.color} iconUrl={item.company.iconUrl} size={36} />
                <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">{item.company.name}</span>
                <GoogleRating rating={item.company.googleRating} reviews={item.company.googleReviews} className="ml-auto" />
              </div>
              <h2 className="mt-3 text-[26px] font-extrabold leading-[1.15] text-leather-dark">{item.name}</h2>
              <p className="mt-2 text-[16px] leading-relaxed text-ink/90">{item.description || item.benefit}</p>

              {item.problems.length > 0 && (
                <section className="mt-6"><h3 className="text-[17px] font-extrabold text-leather-dark">W czym pomaga</h3>
                  <ul className="mt-2 space-y-1.5 text-[15px] text-ink/85">{item.problems.map((t) => <li key={t} className="flex gap-2.5"><span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-gold" aria-hidden />{t}</li>)}</ul></section>
              )}
              {item.audience.length > 0 && (
                <section className="mt-6"><h3 className="text-[17px] font-extrabold text-leather-dark">Dla kogo</h3>
                  <ul className="mt-2 space-y-1.5 text-[15px] text-ink/85">{item.audience.map((t) => <li key={t} className="flex gap-2.5"><span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-gold" aria-hidden />{t}</li>)}</ul></section>
              )}
              {item.faq.length > 0 && (
                <section className="mt-6"><h3 className="text-[17px] font-extrabold text-leather-dark">Najczęstsze pytania</h3>
                  <div className="mt-2 divide-y divide-line rounded-2xl border border-line">
                    {item.faq.map((f) => (
                      <details key={f.q} className="group px-4">
                        <summary className="flex min-h-12 items-center justify-between gap-3 py-2.5 text-[15px] font-bold text-leather-dark">{f.q}<ChevronDown className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden /></summary>
                        <p className="pb-3 text-sm text-ink/85">{f.a}</p>
                      </details>
                    ))}
                  </div></section>
              )}
              {item.provider && <p className="mt-6 text-sm text-muted">{item.provider}</p>}
            </div>
            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 backdrop-blur">
              <div className="mx-auto max-w-xl px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3"><Buttons item={item} big /></div>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
