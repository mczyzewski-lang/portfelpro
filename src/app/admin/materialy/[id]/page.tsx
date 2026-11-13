import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { saveAssetAction } from "@/app/actions/admin";
import { PageHeader, Panel } from "@/components/admin";
import { ActionForm, SubmitButton } from "@/components/client";
import { btnSm } from "@/components/ui";
import { db } from "@/db";
import { contentAssets, services } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { assetTargetUrl } from "@/lib/tracking";
import { AssetFields } from "../asset-fields";

export default async function EditAsset({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [row] = await db.select({ a: contentAssets, s: services }).from(contentAssets).innerJoin(services, eq(services.id, contentAssets.serviceId)).where(eq(contentAssets.id, id));
  if (!row) notFound();
  return (
    <>
      <PageHeader title="Edycja materiału" sub={<Link href={`/admin/uslugi/${row.s.id}`} className="underline">← {row.s.name}</Link>}>
        <a href={assetTargetUrl(row.a, row.s.slug)} target="_blank" rel="noopener noreferrer" className={btnSm()}>Podgląd strony docelowej</a>
      </PageHeader>
      <Panel>
        <ActionForm action={saveAssetAction}>
          <input type="hidden" name="id" value={row.a.id} />
          <AssetFields a={row.a} />
          <SubmitButton className="mt-4">Zapisz materiał</SubmitButton>
        </ActionForm>
      </Panel>
    </>
  );
}
