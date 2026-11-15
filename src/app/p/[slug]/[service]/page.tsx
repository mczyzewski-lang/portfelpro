import { notFound } from "next/navigation";
import { PublicDetail, PublicFooter } from "@/components/public-wallet";
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
export default async function PublicSingleService({ params, searchParams }: { params: Promise<{ slug: string; service: string }>; searchParams: Promise<{ z?: string }> }) {
  const { slug, service } = await params;
  const found = await load(slug, service);
  if (!found) notFound();
  const { partnerId: _internal, ...rest } = found.w; // wewnętrzny identyfikator nie trafia do przeglądarki
  void _internal;
  const wallet = { ...rest, items: [found.item] };   // do przeglądarki idzie tylko ta jedna usługa
  return (
    <>
      <PublicDetail wallet={wallet} item={found.item} slug={slug} fromList={(await searchParams).z === "lista"} photoUrl={found.w.hasPhoto ? `/p/${slug}/photo?v=${found.w.photoVersion}` : null} />
      <PublicFooter firstName={found.w.name.split(" ")[0]} single />
    </>
  );
}
