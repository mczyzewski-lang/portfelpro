"use client";

import { ArrowLeft, ChevronDown, ChevronRight, ExternalLink, MessageCircle, PhoneCall } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { submitPublicLeadAction } from "@/app/actions/public";
import { cn } from "@/lib/cn";
import type { PublicWalletData } from "@/lib/public-wallet";
import { SubmitButton } from "./client";
import { ExpertCard } from "./expert";
import { GoogleRating } from "./google";
import { ServiceFacts } from "./service-facts";
import { CompanyIcon, inputCls } from "./ui";

type Item = PublicWalletData["items"][number];
type Wallet = Omit<PublicWalletData, "partnerId">;

function Buttons({ item, big = false }: { item: Item; big?: boolean }) {
  const h = big ? "min-h-12 text-[15px]" : "min-h-11 text-[13px]";
  return (
    <div className="grid grid-cols-2 gap-2">
      {item.learn && <a href={item.learn} className={`press flex ${h} items-center justify-center whitespace-nowrap rounded-full border border-line bg-cream px-2 font-bold text-leather-dark`}>Dowiedz się więcej</a>}
      {item.talk && <a href={item.talk} className={`leather-grad press flex ${h} items-center justify-center gap-1.5 rounded-full px-2 font-bold ${item.learn ? "" : "col-span-2"}`}><MessageCircle className="size-4" aria-hidden />Porozmawiaj</a>}
    </div>
  );
}

/** Formularz „zostaw kontakt” — zawsze w szczegółach usługi. Bez pytań o opis sprawy. */
function ContactForm({ slug, item, partnerFirstName }: { slug: string; item: Item; partnerFirstName: string }) {
  const [state, action] = useActionState(submitPublicLeadAction, null);
  return (
    <section id="kontakt" className="mt-7 scroll-mt-28 rounded-3xl border border-gold/50 bg-cream/60 p-4" aria-labelledby="kontakt-h" data-testid="public-form">
      <h3 id="kontakt-h" className="flex items-center gap-2 text-[17px] font-extrabold text-leather-dark"><PhoneCall className="size-[18px] text-gold-deep" aria-hidden />Zostaw kontakt — specjalista oddzwoni</h3>
      <p className="mt-0.5 text-[13px] leading-snug text-muted">Bezpłatnie i bez zobowiązań. {item.company.name} odezwie się w sprawie: {item.name}.</p>
      {state?.ok ? (
        <p role="status" className="success-grad mt-3 rounded-2xl px-4 py-4 text-center font-bold" data-testid="public-form-success">{state.ok}</p>
      ) : (
        <form action={action} className="mt-3 space-y-2.5">
          <input type="hidden" name="slug" value={slug} /><input type="hidden" name="serviceId" value={item.id} />
          <div className="hidden" aria-hidden><label>Strona www<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
          <input name="name" required autoComplete="given-name" placeholder="Imię" aria-label="Imię" className={inputCls} />
          <div className="grid gap-2.5 sm:grid-cols-2">
            <input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="Telefon" aria-label="Telefon" className={inputCls} />
            <input name="email" type="email" inputMode="email" autoComplete="email" placeholder="E-mail" aria-label="E-mail" className={inputCls} />
          </div>
          <p className="text-xs text-muted">Wystarczy telefon albo e-mail.{item.sensitive && " Nie pytamy tu o szczegóły sytuacji — omówisz je poufnie ze specjalistą."}</p>
          <label className="flex gap-3 text-[13px] leading-snug">
            <input type="checkbox" name="consent" required className="mt-0.5 size-5 shrink-0 accent-leather" />
            <span>Zgadzam się na kontakt w sprawie tej usługi i przetwarzanie moich danych w tym celu. <Link href="/prywatnosc" target="_blank" className="font-semibold text-leather underline">Polityka prywatności</Link></span>
          </label>
          {state?.error && <p role="alert" className="rounded-xl bg-danger-bg px-3 py-2 text-sm font-medium text-danger">{state.error}</p>}
          <SubmitButton className="press w-full" data-testid="public-form-submit">Poproszę o kontakt</SubmitButton>
          <p className="text-center text-[11px] text-muted">Zgłoszenie z polecenia: {partnerFirstName}</p>
        </form>
      )}
    </section>
  );
}

/**
 * Portfel Publiczny w jednym ekranie.
 * Na górze duże, wycentrowane zdjęcie partnera; przy przewijaniu (i w szczegółach usługi) zwija się do białego paska u góry.
 * Po wybraniu usługi lista odjeżdża w lewo, a w jej miejsce wsuwają się szczegóły z formularzem kontaktowym.
 */
export function PublicWalletView({ wallet, photoUrl, slug, singleId = null }: {
  wallet: Wallet; photoUrl: string | null; slug: string;
  /** strona pojedynczej usługi (do wysłania klientowi bez całego katalogu) — bez listy i bez powrotu */
  singleId?: string | null;
}) {
  const [openId, setOpenId] = useState<string | null>(singleId);
  const [dir, setDir] = useState<"in" | "back">("in");
  const [scrolled, setScrolled] = useState(false);
  const hero = useRef<HTMLElement>(null);
  const item = wallet.items.find((i) => i.id === openId) ?? null;
  const compact = scrolled || !!item;

  // Przycisk „wstecz” przeglądarki zamyka szczegóły zamiast opuszczać stronę.
  useEffect(() => {
    const onPop = () => { setDir("back"); setOpenId(null); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  // Pasek pojawia się, gdy duży nagłówek wyjedzie poza ekran.
  useEffect(() => {
    const el = hero.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting), { rootMargin: "-64px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [openId]);
  const listScroll = useRef(0);
  const open = (id: string) => {
    listScroll.current = window.scrollY; // wrócimy dokładnie w to miejsce listy
    history.pushState({ service: id }, ""); setDir("in"); setOpenId(id);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  // Po powrocie do listy przywracamy pozycję przewijania sprzed wejścia w usługę.
  useEffect(() => {
    if (openId === null && dir === "back") {
      const y = listScroll.current;
      requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "instant" }));
    }
  }, [openId, dir]);
  const back = () => history.back();

  const photo = (size: number, cls: string) => photoUrl
    // eslint-disable-next-line @next/next/no-img-element -- zdjęcie udostępnione przez partnera w Portfelu Publicznym
    ? <img src={photoUrl} alt="" width={size} height={size} style={{ width: size, height: size }} className={cn("shrink-0 rounded-full object-cover", cls)} />
    : <span aria-hidden style={{ width: size, height: size, fontSize: size * 0.36 }} className={cn("gold-grad grid shrink-0 place-items-center rounded-full font-extrabold", cls)}>{wallet.initials}</span>;

  return (
    <div data-testid="public-wallet">
      {/* Jeden biały pasek u góry: zwinięty partner + (w szczegółach) powrót do listy */}
      <div className={cn("top-0 z-30 border-b border-line bg-white shadow-[0_6px_18px_-12px_rgba(50,27,18,0.35)]",
        item ? "sticky" : cn("fixed inset-x-0 transition-transform duration-300", compact ? "translate-y-0" : "-translate-y-full"))}
        aria-hidden={!compact} data-testid="public-bar">
        <div className="mx-auto flex h-16 max-w-xl items-center gap-2.5 px-3">
          {item && !singleId && <button type="button" onClick={back} aria-label="Wszystkie usługi" className="press grid size-11 shrink-0 place-items-center rounded-full text-leather" data-testid="public-back"><ArrowLeft className="size-5" aria-hidden /></button>}
          {photo(40, cn("ring-2 ring-gold-light", (!item || singleId) && "ml-2"))}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-extrabold leading-tight text-leather-dark">{wallet.name}</p>
            {(wallet.bio || wallet.companyName) && <p className="truncate text-xs text-muted">{wallet.bio || wallet.companyName}</p>}
          </div>
        </div>
      </div>

      <main id="tresc" className="mx-auto w-full max-w-xl overflow-x-clip">
        {!item ? (
          <div key="list" className={dir === "back" ? "slide-in-left" : "fade-in"}>
            <header ref={hero} className="px-5 pb-6 pt-10 text-center" data-testid="public-hero">
              {photo(132, "mx-auto shadow-(--shadow-wallet) ring-4 ring-gold-light")}
              <h1 className="mt-4 text-[30px] font-extrabold leading-tight text-leather-dark">{wallet.name}</h1>
              {wallet.companyName && <p className="text-sm font-semibold text-muted">{wallet.companyName}</p>}
              {wallet.bio && <p className="mx-auto mt-1.5 max-w-sm text-[15px] leading-relaxed text-ink/85">{wallet.bio}</p>}
              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-gold-deep">Polecam sprawdzonych specjalistów</p>
            </header>
            <ul className="border-t border-line" data-testid="public-list">
              {wallet.items.map((i) => (
                <li key={i.id} className="border-b border-line bg-white">
                  <button type="button" onClick={() => open(i.id)} className="flex w-full touch-manipulation items-start gap-3.5 px-5 pb-3 pt-4 text-left [-webkit-tap-highlight-color:transparent] active:bg-cream/70" data-testid={`public-item-${i.slug}`}>
                    <CompanyIcon name={i.company.name} color={i.company.color} iconUrl={i.company.iconUrl} size={46} />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">{i.company.name}<GoogleRating rating={i.company.googleRating} reviews={i.company.googleReviews} compact className="normal-case tracking-normal" /></span>
                      <span className="block text-[17px] font-extrabold leading-snug text-leather-dark">{i.name}</span>
                      <span className="mt-0.5 block text-[13px] leading-snug text-muted">{i.benefit}</span>
                    </span>
                    <ChevronRight className="mt-3 size-5 shrink-0 text-muted" aria-hidden />
                  </button>
                  <div className="flex items-center gap-2 px-5 pb-4">
                    <div className="min-w-0 flex-1"><Buttons item={i} /></div>
                    <a href={`/p/${slug}/${i.slug}`} target="_blank" rel="noopener" aria-label={`Otwórz w nowym oknie: ${i.name}`} title="Otwórz samą usługę w nowym oknie"
                      className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-white text-leather-dark active:bg-cream" data-testid={`public-single-${i.slug}`}><ExternalLink className="size-[18px]" aria-hidden /></a>
                  </div>
                </li>
              ))}
              {wallet.items.length === 0 && <li className="px-5 py-12 text-center text-sm text-muted">Lista polecanych usług jest w przygotowaniu.</li>}
            </ul>
          </div>
        ) : (
          <article key={item.id} className={cn("bg-white pb-10", singleId ? "fade-in" : "slide-in-right")} data-testid="public-detail">
            <div className="px-5 pt-5">
              <div className="flex items-center gap-2.5">
                <CompanyIcon name={item.company.name} color={item.company.color} iconUrl={item.company.iconUrl} size={36} />
                <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">{item.company.name}</span>
                <GoogleRating rating={item.company.googleRating} reviews={item.company.googleReviews} className="ml-auto" />
                {!singleId && <a href={`/p/${slug}/${item.slug}`} target="_blank" rel="noopener" aria-label="Otwórz tę usługę w nowym oknie" title="Otwórz samą usługę w nowym oknie"
                  className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-white text-leather-dark active:bg-cream"><ExternalLink className="size-4" aria-hidden /></a>}
              </div>
              <h2 className="mt-3 text-[26px] font-extrabold leading-[1.15] text-leather-dark">{item.name}</h2>
              <p className="mt-2 text-[16px] leading-relaxed text-ink/90">{item.description || item.benefit}</p>
              <ExpertCard expert={item.expert} label="Twoją sprawą zajmie się" className="mt-4 shadow-none" />
              <div className="mt-4"><Buttons item={item} big /></div>

              {item.problems.length > 0 && (
                <section className="mt-6"><h3 className="text-[17px] font-extrabold text-leather-dark">W czym pomaga</h3>
                  <ul className="mt-2 space-y-1.5 text-[15px] text-ink/85">{item.problems.map((t) => <li key={t} className="flex gap-2.5"><span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-gold" aria-hidden />{t}</li>)}</ul></section>
              )}
              {item.audience.length > 0 && (
                <section className="mt-6"><h3 className="text-[17px] font-extrabold text-leather-dark">Dla kogo</h3>
                  <ul className="mt-2 space-y-1.5 text-[15px] text-ink/85">{item.audience.map((t) => <li key={t} className="flex gap-2.5"><span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-gold" aria-hidden />{t}</li>)}</ul></section>
              )}

              <div className="mt-6"><ServiceFacts facts={item.facts} companyName={item.company.name} /></div>

              <ContactForm slug={slug} item={item} partnerFirstName={wallet.name.split(" ")[0]} />

              {item.faq.length > 0 && (
                <section className="mt-7"><h3 className="text-[17px] font-extrabold text-leather-dark">Najczęstsze pytania</h3>
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
              {!singleId && <button type="button" onClick={back} className="press mt-6 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-cream px-4 text-sm font-bold text-leather-dark"><ArrowLeft className="size-4" aria-hidden />Wszystkie usługi</button>}
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
