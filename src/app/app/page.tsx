import { ChevronRight, MousePointerClick, Sparkles, UserCheck, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { dismissFirstSuccessAction } from "@/app/actions/partner";
import { CountUp } from "@/components/client";
import { ServiceList } from "@/components/service-list";
import { btn } from "@/components/ui";
import { requirePartner } from "@/lib/auth";
import { partnerId } from "@/lib/labels";
import { getWalletSummary, hasFirstSuccess } from "@/lib/partner-data";
import { getPickerItems } from "@/lib/picker";

export default async function Dashboard() {
  const { user, partner } = await requirePartner();
  if (!partner.onboardedAt) redirect("/app/onboarding");
  const [sum, items, success] = await Promise.all([getWalletSummary(partner.id), getPickerItems(partner), hasFirstSuccess(partner.id)]);
  const showSuccess = success && !partner.firstSuccessSeenAt;
  const stats = [
    { label: "Kliknięcia", value: sum.clicks, icon: MousePointerClick, test: "stat-clicks" },
    { label: "Polecenia", value: sum.leads, icon: Users, test: "stat-leads" },
    { label: "Klienci", value: sum.clients, icon: UserCheck, test: "stat-clients" },
  ];

  return (
    <div className="space-y-6">
      {showSuccess && (
        <section className="wallet pop rounded-[28px] p-6 text-center" data-testid="first-success">
          <Sparkles className="relative z-10 mx-auto size-8 text-gold-light" aria-hidden />
          <h2 className="relative z-10 mt-2 text-2xl font-extrabold">Pierwsze potwierdzone polecenie!</h2>
          <p className="relative z-10 mx-auto mt-1.5 max-w-sm text-sm text-white/80">Twoje polecenie zostało potwierdzone, a prowizja naliczona. Jej status znajdziesz w zakładce Polecenia.</p>
          <form action={dismissFirstSuccessAction} className="relative z-10 mt-4"><button className={btn("gold", "press")}>Świetnie, dalej</button></form>
        </section>
      )}

      <section aria-labelledby="portfel">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted">Dzień dobry, {user.firstName}</p>
            <h1 id="portfel" className="text-[24px] font-extrabold leading-tight text-leather-dark">Twój Portfel Profesjonalisty</h1>
          </div>
        </div>

        <Link href="/app/polecenia?tab=prowizje" aria-label="Zobacz prowizje" className="wallet wallet-sheen press mt-4 block rounded-[28px] p-5 sm:p-6">
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gold-light">Zatwierdzone do wypłaty</p>
              <CountUp value={sum.approved} testId="sum-approved" className="tabular mt-1 block text-[42px] font-extrabold leading-none tracking-tight" />
            </div>
            <p className="tabular flex items-center gap-1 text-right text-xs font-semibold text-white/60">{partnerId(partner.number)}<ChevronRight className="size-4" aria-hidden /></p>
          </div>
          <dl className="relative z-10 mt-5 grid grid-cols-2 gap-x-4 border-t border-white/15 pt-4">
            <div><dt className="text-xs text-white/65">Oczekujące</dt><dd><CountUp value={sum.pending} testId="sum-pending" className="tabular text-lg font-bold" /></dd></div>
            <div><dt className="text-xs text-white/65">Już wypłacone</dt><dd><CountUp value={sum.paid} testId="sum-paid" className="tabular text-lg font-bold" /></dd></div>
          </dl>
        </Link>

        <div className="stagger mt-3 grid grid-cols-3 gap-2.5">
          {stats.map((s, n) => (
            <Link key={s.label} href={`/app/polecenia?tab=${s.label === "Kliknięcia" ? "linki" : "polecenia"}`} style={{ "--i": n } as React.CSSProperties}
              className="press rounded-2xl border border-line bg-white px-3 py-3">
              <s.icon className="size-4 text-gold-deep" aria-hidden />
              <p className="mt-1"><CountUp value={s.value} format="int" testId={s.test} className="tabular text-2xl font-extrabold leading-none text-leather-dark" /></p>
              <p className="mt-0.5 text-xs leading-tight text-muted">{s.label}</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="polec" className="scroll-mt-20" aria-labelledby="polec-h">
        <h2 id="polec-h" className="text-xl font-extrabold text-leather-dark">Co chcesz dziś polecić?</h2>
        <p className="mt-0.5 text-sm text-muted">Wybierz usługę — w środku dobierzesz link do etapu, na którym jest klient.</p>
        <div className="mt-3"><ServiceList items={items} /></div>
      </section>
    </div>
  );
}
