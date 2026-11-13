import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GoogleRating } from "@/components/google";
import { CompanyIcon, Logo } from "@/components/ui";
import { getPublicWallet } from "@/lib/public-wallet";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const w = await getPublicWallet((await params).slug);
  return { title: w ? `${w.name} — polecane usługi` : "Portfel", robots: { index: false } };
}

/** Portfel Publiczny: strona, którą profesjonalista wysyła klientowi — wszystko, co poleca, w jednym miejscu. */
export default async function PublicWallet({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const w = await getPublicWallet(slug);
  if (!w) notFound();
  return (
    <main id="tresc" className="mx-auto w-full max-w-xl flex-1 px-5 pb-14 pt-10" data-testid="public-wallet">
      <header className="text-center">
        {w.hasPhoto
          // eslint-disable-next-line @next/next/no-img-element -- zdjęcie udostępnione przez partnera w Portfelu Publicznym
          ? <img src={`/p/${slug}/photo?v=${w.photoVersion}`} alt="" width={112} height={112} className="mx-auto size-28 rounded-full object-cover shadow-(--shadow-wallet) ring-4 ring-gold-light" />
          : <span aria-hidden className="gold-grad mx-auto grid size-28 place-items-center rounded-full text-4xl font-extrabold">{w.initials}</span>}
        <h1 className="mt-4 text-[28px] font-extrabold leading-tight text-leather-dark">{w.name}</h1>
        {w.companyName && <p className="text-sm font-semibold text-muted">{w.companyName}</p>}
        {w.bio && <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-ink/85">{w.bio}</p>}
        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-gold-deep">Polecam sprawdzonych specjalistów</p>
      </header>

      <ul className="stagger mt-5 space-y-3">
        {w.items.map((i, n) => (
          <li key={i.id} style={{ "--i": Math.min(n, 8) } as React.CSSProperties} className="rounded-3xl border border-line bg-white p-4 shadow-(--shadow-card)">
            <div className="flex gap-3.5">
              <CompanyIcon name={i.company.name} color={i.company.color} iconUrl={i.company.iconUrl} size={46} />
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-x-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">{i.company.name}<GoogleRating rating={i.company.googleRating} reviews={i.company.googleReviews} compact className="normal-case tracking-normal" /></p>
                <h2 className="text-[17px] font-extrabold leading-snug text-leather-dark">{i.name}</h2>
                <p className="mt-0.5 text-[13px] leading-snug text-muted">{i.benefit}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {i.learn && <a href={i.learn} className="press flex min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-line bg-cream px-2 text-[13px] font-bold text-leather-dark">Dowiedz się więcej</a>}
              {i.talk && <a href={i.talk} className={`leather-grad press flex min-h-11 items-center justify-center gap-1.5 rounded-full px-2 text-[13px] font-bold ${i.learn ? "" : "col-span-2"}`}><MessageCircle className="size-4" aria-hidden />Porozmawiaj</a>}
            </div>
          </li>
        ))}
        {w.items.length === 0 && <li className="rounded-3xl border border-dashed border-line px-5 py-10 text-center text-sm text-muted">Lista polecanych usług jest w przygotowaniu.</li>}
      </ul>

      <footer className="mt-8 flex flex-col items-center gap-2 text-center text-xs text-muted">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-leather-dark"><Logo size={22} />Portfel.pro</Link>
        <p className="max-w-xs">Usługi realizują wskazane firmy. Linki na tej stronie są linkami polecającymi — {w.name.split(" ")[0]} może otrzymać wynagrodzenie za polecenie.</p>
        <Link href="/prywatnosc" className="underline">Prywatność i cookies</Link>
      </footer>
    </main>
  );
}
