import type { Partner } from "@/db/schema";
import type { PickerItem } from "@/components/service-list";
import { getCatalog, getPartnerTerms } from "./queries";
import { recommendBlockLabel, recommendState } from "./tracking";

export async function getPickerItems(partner: Partner): Promise<PickerItem[]> {
  const terms = await getPartnerTerms(partner.id);
  const items = await getCatalog(terms);
  return items.map((i) => {
    const st = recommendState(partner, { status: "published", access: i.access }, terms.find((t) => t.serviceId === i.id));
    return {
      ...i,
      blocked: st.can ? null : recommendBlockLabel[st.reason],
      recommended: !!partner.professionSlug && i.professions.some((p) => p.slug === partner.professionSlug),
    };
  });
}
