import { ServiceList } from "@/components/service-list";
import { requirePartner } from "@/lib/auth";
import { getPickerItems } from "@/lib/picker";

export const metadata = { title: "Portfel usług" };

export default async function ServicesPage() {
  const { partner } = await requirePartner();
  const items = await getPickerItems(partner);
  const available = items.filter((i) => !i.blocked).length;
  return (
    <>
      <h1 className="text-[24px] font-extrabold leading-tight text-leather-dark">Portfel usług</h1>
      <p className="mt-1 text-sm text-muted">
        {partner.status === "active" ? `Wybierz usługę — w środku dobierzesz link do etapu klienta. Dostępne: ${available} z ${items.length}.` : "Przeglądaj katalog — linki aktywujemy po zatwierdzeniu konta."}
      </p>
      <div className="mt-4"><ServiceList items={items} /></div>
    </>
  );
}
