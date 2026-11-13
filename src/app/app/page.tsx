import { Sparkles } from "lucide-react";
import { dismissFirstSuccessAction } from "@/app/actions/partner";
import { ServicePicker } from "@/components/service-picker";
import { EmptyState, LinkButton, btn } from "@/components/ui";
import { requirePartner } from "@/lib/auth";
import { formatPLN } from "@/lib/commission";
import { partnerId } from "@/lib/labels";
import { getWalletSummary, hasFirstSuccess } from "@/lib/partner-data";
import { getPickerItems } from "@/lib/picker";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const { user, partner } = await requirePartner();
  if (!partner.onboardedAt) redirect("/app/onboarding");
  const [sum, items, success] = await Promise.all([getWalletSummary(partner.id), getPickerItems(partner), hasFirstSuccess(partner.id)]);
  const showSuccess = success && !partner.firstSuccessSeenAt;
  const nothingYet = sum.clicks === 0 && sum.leads === 0;

  return (
    <div className="space-y-7">
      {showSuccess && (
        <section className="wallet rise rounded-[28px] p-6 text-center" data-testid="first-success">
          <Sparkles className="relative z-10 mx-auto size-8 text-gold-light" aria-hidden />
          <h2 className="relative z-10 mt-2 text-2xl font-extrabold">Pierwsze potwierdzone polecenie!</h2>
          <p className="relative z-10 mx-auto mt-1.5 max-w-sm text-sm text-white/80">Twoje polecenie zostało potwierdzone, a prowizja naliczona. Jej status znajdziesz w zakładce Polecenia.</p>
          <form action={dismissFirstSuccessAction} className="relative z-10 mt-4"><button className={btn("gold")}>Świetnie, dalej</button></form>
        </section>
      )}

      <section aria-labelledby="portfel">
        <p className="text-sm text-muted">Dzień dobry, {user.firstName}</p>
        <h1 id="portfel" className="text-[26px] font-extrabold leading-tight text-leather-dark">Twój Portfel Profesjonalisty</h1>

        <div className="wallet mt-4 rounded-[28px] p-5 sm:p-6">
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gold-light">Zatwierdzone do wypłaty</p>
              <p className="tabular mt-1 text-[40px] font-extrabold leading-none tracking-tight" data-testid="sum-approved">{formatPLN(sum.approved)}</p>
            </div>
            <p className="tabular text-right text-xs font-semibold text-white/60">{partnerId(partner.number)}</p>
          </div>
          <dl className="relative z-10 mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/15 pt-4">
            <div><dt className="text-xs text-white/65">Oczekujące</dt><dd className="tabular text-lg font-bold" data-testid="sum-pending">{formatPLN(sum.pending)}</dd></div>
            <div><dt className="text-xs text-white/65">Już wypłacone</dt><dd className="tabular text-lg font-bold" data-testid="sum-paid">{formatPLN(sum.paid)}</dd></div>
          </dl>
        </div>

        <dl className="mt-3 grid grid-cols-3 gap-3">
          {[["Pozyskani klienci", sum.clients, "stat-clients"], ["Polecenia", sum.leads, "stat-leads"], ["Kliknięcia w linki", sum.clicks, "stat-clicks"]].map(([l, v, t]) => (
            <div key={l} className="rounded-2xl border border-line bg-white px-3 py-3">
              <dd className="tabular text-2xl font-extrabold text-leather-dark" data-testid={t as string}>{v}</dd>
              <dt className="text-xs leading-tight text-muted">{l}</dt>
            </div>
          ))}
        </dl>
      </section>

      {nothingYet && partner.status === "active" && (
        <EmptyState title="Tu pojawią się Twoje polecenia" action={<LinkButton href="#polec" variant="secondary">Wybierz pierwszą usługę</LinkButton>}>
          Wybierz usługę poniżej, skopiuj swój link i wyślij go klientowi. Kliknięcia i polecenia zobaczysz od razu.
        </EmptyState>
      )}

      <section id="polec" className="scroll-mt-20" aria-labelledby="polec-h">
        <h2 id="polec-h" className="text-xl font-extrabold text-leather-dark">Co możesz dziś polecić?</h2>
        <div className="mt-3"><ServicePicker items={items} /></div>
      </section>
    </div>
  );
}
