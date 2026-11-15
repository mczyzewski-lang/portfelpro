import { ArrowLeft, ChevronDown, ChevronRight, ExternalLink, MessageCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { PublicWalletData } from "@/lib/public-wallet";
import { CompanySheet } from "./company-sheet";
import { ExpertCard } from "./expert";
import { GoogleRating } from "./google";
import { PublicContactForm } from "./public-contact-form";
import { ServiceFacts } from "./service-facts";
import { CompanyIcon, Logo } from "./ui";

/*
 * Portfel Publiczny — celowo najprostsza możliwa budowa: zwykłe strony renderowane na serwerze,
 * zwykłe linki między listą a usługą, nic przypiętego do ekranu i żadnego kodu sterującego przewijaniem.
 * Przewijaniem i przyciskiem „wstecz” zajmuje się wyłącznie przeglądarka.
 */
type Item = PublicWalletData["items"][number];
type Wallet = Omit<PublicWalletData, "partnerId">;

function Photo({ url, initials, size, className }: { url: string | null; initials: string; size: number; className?: string }) {
  return url
    // eslint-disable-next-line @next/next/no-img-element -- zdjęcie udostępnione przez partnera w Portfelu Publicznym
    ? <img src={url} alt="" width={size} height={size} style={{ width: size, height: size }} className={cn("shrink-0 rounded-full object-cover", className)} />
    : <span aria-hidden style={{ width: size, height: size, fontSize: size * 0.36 }} className={cn("gold-grad grid shrink-0 place-items-center rounded-full font-extrabold", className)}>{initials}</span>;
}

function Buttons({ item, big = false }: { item: Item; big?: boolean }) {
  const h = big ? "min-h-12 text-[15px]" : "min-h-11 text-[13px]";
  return (
    <div className="grid grid-cols-2 gap-2">
      {item.learn && <a href={item.learn} className={`flex ${h} items-center justify-center whitespace-nowrap rounded-full border border-line bg-cream px-2 font-bold text-leather-dark`}>Dowiedz się więcej</a>}
      {item.talk && <a href={item.talk} className={`leather-grad flex ${h} items-center justify-center gap-1.5 rounded-full px-2 font-bold ${item.learn ? "" : "col-span-2"}`}><MessageCircle className="size-4" aria-hidden />Porozmawiaj</a>}
    </div>
  );
}

export function PublicFooter({ firstName, single = false }: { firstName: string; single?: boolean }) {
  return (
    <footer className="mx-auto flex w-full max-w-xl flex-col items-center gap-2 px-5 pb-10 pt-6 text-center text-xs text-muted">
      <Link href="/" className="inline-flex items-center gap-2 font-bold text-leather-dark"><Logo size={22} />Portfel.pro</Link>
      <p className="max-w-xs">{single ? "Usługę realizuje wskazana firma." : "Usługi realizują wskazane firmy."} Linki na tej stronie są linkami polecającymi — {firstName} może otrzymać wynagrodzenie za polecenie.</p>
      <Link href="/prywatnosc" className="underline">Prywatność i cookies</Link>
      <p className="text-[10px] opacity-60" data-testid="public-version">wersja strony: 3</p>
    </footer>
  );
}

/** Strona główna profilu: zdjęcie i nazwisko, pod spodem lista usług. Każda usługa to zwykły link do własnej strony. */
export function PublicList({ wallet, slug, photoUrl }: { wallet: Wallet; slug: string; photoUrl: string | null }) {
  return (
    <main id="tresc" className="mx-auto w-full max-w-xl" data-testid="public-wallet">
      <header className="px-5 pb-6 pt-10 text-center" data-testid="public-hero">
        <Photo url={photoUrl} initials={wallet.initials} size={132} className="mx-auto ring-4 ring-gold-light" />
        <h1 className="mt-4 text-[30px] font-extrabold leading-tight text-leather-dark">{wallet.name}</h1>
        {wallet.companyName && <p className="text-sm font-semibold text-muted">{wallet.companyName}</p>}
        {wallet.bio && <p className="mx-auto mt-1.5 max-w-sm text-[15px] leading-relaxed text-ink/85">{wallet.bio}</p>}
        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-gold-deep">Polecam sprawdzonych specjalistów</p>
      </header>
      <ul className="border-t border-line" data-testid="public-list">
        {wallet.items.map((i) => (
          <li key={i.id} className="border-b border-line bg-white">
            <a href={`/p/${slug}/${i.slug}?z=lista`} className="flex items-start gap-3.5 px-5 pb-3 pt-4" data-testid={`public-item-${i.slug}`}>
              <CompanyIcon name={i.company.name} color={i.company.color} iconUrl={i.company.iconUrl} size={46} />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">{i.company.name}<GoogleRating rating={i.company.googleRating} reviews={i.company.googleReviews} compact className="normal-case tracking-normal" /></span>
                <span className="block text-[17px] font-extrabold leading-snug text-leather-dark">{i.name}</span>
                <span className="mt-0.5 block text-[13px] leading-snug text-muted">{i.benefit}</span>
              </span>
              <ChevronRight className="mt-3 size-5 shrink-0 text-muted" aria-hidden />
            </a>
            <div className="flex items-center gap-2 px-5 pb-4">
              <div className="min-w-0 flex-1"><Buttons item={i} /></div>
              <a href={`/p/${slug}/${i.slug}`} target="_blank" rel="noopener" aria-label={`Otwórz w nowym oknie: ${i.name}`} title="Otwórz samą usługę w nowym oknie"
                className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-white text-leather-dark" data-testid={`public-single-${i.slug}`}><ExternalLink className="size-[18px]" aria-hidden /></a>
            </div>
          </li>
        ))}
        {wallet.items.length === 0 && <li className="px-5 py-12 text-center text-sm text-muted">Lista polecanych usług jest w przygotowaniu.</li>}
      </ul>
    </main>
  );
}

/** Strona jednej usługi. `fromList` = klient przyszedł z listy, więc pokazujemy powrót; link wysłany osobno go nie ma. */
export function PublicDetail({ wallet, item, slug, photoUrl, fromList }: { wallet: Wallet; item: Item; slug: string; photoUrl: string | null; fromList: boolean }) {
  const dot = <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-gold" aria-hidden />;
  return (
    <main id="tresc" className="mx-auto w-full max-w-xl bg-white" data-testid="public-wallet">
      {/* Nagłówek z partnerem — zwykły element na górze strony, przewija się razem z treścią */}
      <div className="flex items-center gap-2.5 border-b border-line px-3 py-3" data-testid="public-bar">
        {fromList && <a href={`/p/${slug}`} aria-label="Wszystkie usługi" className="grid size-11 shrink-0 place-items-center rounded-full text-leather" data-testid="public-back"><ArrowLeft className="size-5" aria-hidden /></a>}
        <Photo url={photoUrl} initials={wallet.initials} size={40} className={cn("ring-2 ring-gold-light", !fromList && "ml-2")} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-extrabold leading-tight text-leather-dark">{wallet.name}</p>
          {(wallet.bio || wallet.companyName) && <p className="truncate text-xs text-muted">{wallet.bio || wallet.companyName}</p>}
        </div>
      </div>

      <article className="px-5 pb-10 pt-5" data-testid="public-detail">
        <div className="flex items-center gap-2.5">
          <CompanySheet company={item.company.info} className="flex items-center gap-2.5">
            <CompanyIcon name={item.company.name} color={item.company.color} iconUrl={item.company.iconUrl} size={36} />
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted underline decoration-line underline-offset-4">{item.company.name}</span>
          </CompanySheet>
          <GoogleRating rating={item.company.googleRating} reviews={item.company.googleReviews} className="ml-auto" />
        </div>
        <h1 className="mt-3 text-[26px] font-extrabold leading-[1.15] text-leather-dark">{item.name}</h1>
        <p className="mt-2 text-[16px] leading-relaxed text-ink/90">{item.description || item.benefit}</p>
        <ExpertCard expert={item.expert} label="Twoją sprawą zajmie się" className="mt-4 shadow-none" />
        <div className="mt-4"><Buttons item={item} big /></div>

        {item.problems.length > 0 && (
          <section className="mt-6"><h2 className="text-[17px] font-extrabold text-leather-dark">W czym pomaga</h2>
            <ul className="mt-2 space-y-1.5 text-[15px] text-ink/85">{item.problems.map((t) => <li key={t} className="flex gap-2.5">{dot}{t}</li>)}</ul></section>
        )}
        {item.audience.length > 0 && (
          <section className="mt-6"><h2 className="text-[17px] font-extrabold text-leather-dark">Dla kogo</h2>
            <ul className="mt-2 space-y-1.5 text-[15px] text-ink/85">{item.audience.map((t) => <li key={t} className="flex gap-2.5">{dot}{t}</li>)}</ul></section>
        )}

        <div className="mt-6"><ServiceFacts facts={item.facts} companyName={item.company.name} /></div>

        <PublicContactForm slug={slug} serviceId={item.id} serviceName={item.name} companyName={item.company.name} sensitive={item.sensitive} partnerFirstName={wallet.name.split(" ")[0]} />

        {item.faq.length > 0 && (
          <section className="mt-7"><h2 className="text-[17px] font-extrabold text-leather-dark">Najczęstsze pytania</h2>
            <div className="mt-2 divide-y divide-line rounded-2xl border border-line">
              {item.faq.map((f) => (
                <details key={f.q} className="group px-4">
                  <summary className="flex min-h-12 items-center justify-between gap-3 py-2.5 text-[15px] font-bold text-leather-dark">{f.q}<ChevronDown className="size-4 shrink-0 text-muted group-open:rotate-180" aria-hidden /></summary>
                  <p className="pb-3 text-sm text-ink/85">{f.a}</p>
                </details>
              ))}
            </div></section>
        )}
        {item.provider && <p className="mt-6 text-sm text-muted">{item.provider}</p>}
        {fromList && <a href={`/p/${slug}`} className="mt-6 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-cream px-4 text-sm font-bold text-leather-dark"><ArrowLeft className="size-4" aria-hidden />Wszystkie usługi</a>}
      </article>
    </main>
  );
}
