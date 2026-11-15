import { notFound } from "next/navigation";
import { PublicFooter, PublicList } from "@/components/public-wallet";
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
  const { partnerId: _internal, ...publicData } = w; // wewnętrzny identyfikator nie trafia do przeglądarki
  void _internal;
  return (
    <>
      <PublicList wallet={publicData} slug={slug} photoUrl={w.hasPhoto ? `/p/${slug}/photo?v=${w.photoVersion}` : null} />
      <PublicFooter firstName={w.name.split(" ")[0]} />
    </>
  );
}
