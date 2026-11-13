import { setProfessionAction } from "@/app/actions/partner";
import { ProfessionIcon } from "@/components/profession-icon";
import { Rate } from "@/components/rate";
import { CompanyMark, LinkButton, btn } from "@/components/ui";
import { requirePartner } from "@/lib/auth";
import { partnerId } from "@/lib/labels";
import { getPickerItems } from "@/lib/picker";
import { getProfessions } from "@/lib/queries";

export const metadata = { title: "Witaj w Portfel.pro" };

export default async function Onboarding({ searchParams }: { searchParams: Promise<{ krok?: string }> }) {
  const { user, partner } = await requirePartner();
  const step2 = (await searchParams).krok === "2" && partner.onboardedAt;

  if (!step2) {
    const professions = await getProfessions();
    return (
      <div className="mx-auto max-w-xl">
        <div className="wallet rounded-[24px] p-5">
          <p className="relative z-10 text-sm text-white/80">Witaj, {user.firstName}! Twój numer partnera:</p>
          <p className="tabular relative z-10 mt-1 text-3xl font-extrabold tracking-wide" data-testid="onboarding-partner-id">{partnerId(partner.number)}</p>
        </div>
        <h1 className="mt-6 text-2xl font-extrabold text-leather-dark">Czym się zajmujesz?</h1>
        <p className="mt-1 text-sm text-muted">Dobierzemy usługi, które mają najwięcej sensu dla Twoich klientów.</p>
        <form action={setProfessionAction} className="mt-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {professions.map((p) => (
              <label key={p.slug} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-line bg-white px-4 text-[15px] font-semibold has-checked:border-leather has-checked:ring-2 has-checked:ring-leather/15">
                <input type="radio" name="profession" value={p.slug} className="accent-leather size-4" />
                <ProfessionIcon name={p.icon} className="size-4 text-leather" />{p.name}
              </label>
            ))}
            <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-line bg-white px-4 text-[15px] font-semibold has-checked:border-leather has-checked:ring-2 has-checked:ring-leather/15">
              <input type="radio" name="profession" value="" defaultChecked className="accent-leather size-4" />Inne
            </label>
          </div>
          <button className={btn("primary", "mt-5 w-full")}>Dalej</button>
        </form>
      </div>
    );
  }

  const items = await getPickerItems(partner);
  const rec = items.filter((i) => i.recommended);
  const show = rec.length ? rec : items.slice(0, 4);
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-extrabold text-leather-dark">{rec.length ? "Polecane dla Ciebie" : "Od tych usług warto zacząć"}</h1>
      <p className="mt-1 text-sm text-muted">
        {partner.status === "pending"
          ? "Twoje konto czeka na zatwierdzenie. W tym czasie możesz poznać usługi — linki aktywujemy po weryfikacji."
          : "Otwórz usługę, skopiuj link i wyślij go klientowi."}
      </p>
      <ul className="mt-4 space-y-3">
        {show.map((i) => (
          <li key={i.id} className="rounded-(--radius-card) border border-line bg-white p-4">
            <CompanyMark {...i.company} />
            <p className="mt-1 text-[17px] font-extrabold leading-snug text-leather-dark">{i.name}</p>
            <p className="mt-0.5 text-sm text-muted">{i.professions.find((p) => p.slug === partner.professionSlug)?.reason ?? i.audienceShort}</p>
            <div className="mt-2"><Rate rate={i.rate} /></div>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-col gap-2.5">
        <LinkButton href="/app">Przejdź do Portfela</LinkButton>
        <LinkButton href="/app/uslugi" variant="secondary">Zobacz cały katalog ({items.length})</LinkButton>
      </div>
    </div>
  );
}
