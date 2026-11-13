import { ServicePicker } from "@/components/service-picker";
import { requirePartner } from "@/lib/auth";
import { getPickerItems } from "@/lib/picker";

export const metadata = { title: "Usługi" };

export default async function ServicesPage() {
  const { partner } = await requirePartner();
  const items = await getPickerItems(partner);
  const available = items.filter((i) => !i.blocked).length;
  return (
    <>
      <h1 className="text-[26px] font-extrabold leading-tight text-leather-dark">Usługi</h1>
      <p className="mt-1 text-sm text-muted">
        {partner.status === "active" ? `Możesz już polecać ${available} z ${items.length} usług.` : "Przeglądaj katalog — linki aktywujemy po zatwierdzeniu konta."}
      </p>
      <div className="mt-4"><ServicePicker items={items} /></div>
    </>
  );
}
