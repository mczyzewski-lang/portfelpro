import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicWalletView } from "@/components/public-wallet-view";
import { Logo } from "@/components/ui";
import { getPublicWallet } from "@/lib/public-wallet";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const w = await getPublicWallet((await params).slug);
  return { title: w ? `${w.name} — polecane usługi` : "Portfel", robots: { index: false } };
}

/** Portfel Publiczny: strona, którą profesjonalista wysyła klientowi — wszystko, co poleca, w jednym ekranie. */
export default async function PublicWallet({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const w = await getPublicWallet(slug);
  if (!w) notFound();
  return (
    <>
      <PublicWalletView wallet={w} photoUrl={w.hasPhoto ? `/p/${slug}/photo?v=${w.photoVersion}` : null} />
      <footer className="mx-auto flex w-full max-w-xl flex-col items-center gap-2 px-5 pb-28 pt-6 text-center text-xs text-muted">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-leather-dark"><Logo size={22} />Portfel.pro</Link>
        <p className="max-w-xs">Usługi realizują wskazane firmy. Linki na tej stronie są linkami polecającymi — {w.name.split(" ")[0]} może otrzymać wynagrodzenie za polecenie.</p>
        <Link href="/prywatnosc" className="underline">Prywatność i cookies</Link>
      </footer>
    </>
  );
}
