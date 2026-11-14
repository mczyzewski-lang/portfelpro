import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicWalletView } from "@/components/public-wallet-view";
import { Logo } from "@/components/ui";
import { getPublicWallet } from "@/lib/public-wallet";

export const dynamic = "force-dynamic";

async function load(slug: string, service: string) {
  const w = await getPublicWallet(slug);
  const item = w?.items.find((i) => i.slug === service);
  return w && item ? { w, item } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; service: string }> }) {
  const { slug, service } = await params;
  const found = await load(slug, service);
  return { title: found ? `${found.item.name} — poleca ${found.w.name}` : "Portfel", robots: { index: false } };
}

/** Pojedyncza usługa z Portfela Publicznego — link do wysłania klientowi bez całego katalogu. */
export default async function PublicSingleService({ params }: { params: Promise<{ slug: string; service: string }> }) {
  const { slug, service } = await params;
  const found = await load(slug, service);
  if (!found) notFound();
  const { partnerId: _internal, ...rest } = found.w; // wewnętrzny identyfikator nie trafia do przeglądarki
  void _internal;
  const wallet = { ...rest, items: [found.item] };   // do przeglądarki idzie tylko ta jedna usługa
  return (
    <>
      <PublicWalletView wallet={wallet} slug={slug} singleId={found.item.id} photoUrl={found.w.hasPhoto ? `/p/${slug}/photo?v=${found.w.photoVersion}` : null} />
      <footer className="mx-auto flex w-full max-w-xl flex-col items-center gap-2 px-5 pb-10 pt-6 text-center text-xs text-muted">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-leather-dark"><Logo size={22} />Portfel.pro</Link>
        <p className="max-w-xs">Usługę realizuje wskazana firma. Linki na tej stronie są linkami polecającymi — {found.w.name.split(" ")[0]} może otrzymać wynagrodzenie za polecenie.</p>
        <Link href="/prywatnosc" className="underline">Prywatność i cookies</Link>
      </footer>
    </>
  );
}
