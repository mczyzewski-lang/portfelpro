import { ArrowRight, ChevronRight, MousePointerClick, Sparkles, UserCheck, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { dismissFirstSuccessAction } from "@/app/actions/partner";
import { CountUp } from "@/components/client";
import { StarMark } from "@/components/star";
import { StarterCard } from "@/components/starter-card";
import { Feed } from "@/components/feed";
import { btn } from "@/components/ui";
import { requirePartner } from "@/lib/auth";
import { avatarSrc, initialsOf } from "@/lib/avatar";
import { levelFor } from "@/lib/gamification";
import { partnerId } from "@/lib/labels";
import { getActivity, getServiceStats, getWalletSummary, hasFirstSuccess } from "@/lib/partner-data";

/** Pulpit: liczby i dziennik zdarzeń. Usługi są w zakładce „Portfel”. */
export default async function Dashboard() {
  const { user, partner } = await requirePartner();
  if (!partner.onboardedAt) redirect("/app/onboarding");
  const [sum, feed, success, perService] = await Promise.all([getWalletSummary(partner.id), getActivity(partner.id, 12), hasFirstSuccess(partner.id), getServiceStats(partner.id)]);
  const maxActivity = Math.max(1, ...perService.map((s) => s.clicks + s.leads));
  const showSuccess = success && !partner.firstSuccessSeenAt;
  const level = levelFor(sum.clients);
  const stats = [
    { label: "Kliknięcia", value: sum.clicks, icon: MousePointerClick, test: "stat-clicks", href: "/app/polecenia" },
    { label: "Polecenia", value: sum.leads, icon: Users, test: "stat-leads", href: "/app/polecenia" },
    { label: "Klienci", value: sum.clients, icon: UserCheck, test: "stat-clients", href: "/app/polecenia" },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {showSuccess && (
        <section className="success-grad pop rounded-[28px] p-6 text-center" data-testid="first-success">
          <Sparkles className="relative z-10 mx-auto size-8 text-white" aria-hidden />
          <h2 className="relative z-10 mt-2 text-2xl font-extrabold">Pierwsze potwierdzone polecenie!</h2>
          <p className="relative z-10 mx-auto mt-1.5 max-w-sm text-sm text-white/80">Twoje polecenie zostało potwierdzone, a prowizja naliczona. Jej status znajdziesz w zakładce Polecenia.</p>
          <form action={dismissFirstSuccessAction} className="relative z-10 mt-4"><button className={btn("secondary", "press")}>Świetnie, dalej</button></form>
        </section>
      )}

      {partner.starterCode && !partner.starterConfirmedAt && <StarterCard hasPhoto={!!partner.avatar} avatarSrc={avatarSrc(partner)} initials={initialsOf(user)} tier={level.current.tier} tierName={level.current.name} />}

      <section aria-labelledby="pulpit">
        <p className="text-sm text-muted">Dzień dobry, {user.firstName}</p>
        <h1 id="pulpit" className="text-[24px] font-extrabold leading-tight text-leather-dark">Pulpit</h1>

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
            <div><dt className="text-xs text-white/65">Już wypłacone</dt><dd><CountUp value={sum.paid} testId="sum-paid" className={sum.paid > 0 ? "tabular text-lg font-bold text-[#8fe0b6]" : "tabular text-lg font-bold"} /></dd></div>
          </dl>
        </Link>

        <div className="stagger mt-3 grid grid-cols-3 gap-2.5">
          {stats.map((s, n) => (
            <Link key={s.label} href={s.href} style={{ "--i": n } as React.CSSProperties} className="press rounded-2xl border border-line bg-white px-3 py-3">
              <s.icon className="size-4 text-gold-deep" aria-hidden />
              <p className="mt-1"><CountUp value={s.value} format="int" testId={s.test} className="tabular text-2xl font-extrabold leading-none text-leather-dark" /></p>
              <p className="mt-0.5 text-xs leading-tight text-muted">{s.label}</p>
            </Link>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-[1fr_auto] gap-2.5">
          <Link href="/app/uslugi" className="leather-grad press flex min-h-14 items-center justify-between gap-3 rounded-2xl px-5 font-bold" data-testid="go-wallet">
            Poleć usługę<ArrowRight className="size-5" aria-hidden />
          </Link>
          <Link href="/app/poziomy" className="press flex min-h-14 flex-col justify-center rounded-2xl border border-line bg-white px-4" data-testid="dash-star">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Poziom</span>
            <span className="flex items-center gap-1.5 text-sm font-extrabold text-leather-dark"><StarMark tier={level.current.tier} size={20} />{level.current.name}</span>
          </Link>
        </div>
      </section>

      <section aria-labelledby="log">
        <h2 id="log" className="text-xl font-extrabold text-leather-dark">Co się wydarzyło</h2>
        <div className="mt-3">
          {feed.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-line bg-white/60 px-6 py-9 text-center">
              <p className="font-bold text-leather-dark">Tu zobaczysz każdy ruch</p>
              <p className="mx-auto mt-1 max-w-xs text-sm text-muted">Otwarcia Twoich linków, nowe polecenia, kolejne etapy obsługi klienta i prowizje.</p>
              <Link href="/app/uslugi" className={btn("secondary", "press mt-4")}>Otwórz Portfel usług</Link>
            </div>
          ) : <Feed items={feed} />}
        </div>
      </section>

      {perService.length > 0 && (
        <section aria-labelledby="per-service" data-testid="service-stats">
          <h2 id="per-service" className="text-xl font-extrabold text-leather-dark">Twoje usługi w liczbach</h2>
          <p className="mt-0.5 text-sm text-muted">Linki, otwarcia i polecenia dla każdej usługi, którą polecasz.</p>
          <ul className="stagger mt-3 space-y-2.5">
            {perService.map((s, n) => (
              <li key={s.slug} style={{ "--i": Math.min(n, 8) } as React.CSSProperties}>
                <Link href={`/app/uslugi/${s.slug}`} className="press block rounded-3xl border border-line bg-white p-4 shadow-(--shadow-card)">
                  <p className="font-extrabold leading-snug text-leather-dark">{s.name}</p>
                  <dl className="mt-2.5 grid grid-cols-4 gap-2 text-center">
                    {[["Linki", s.links], ["Otwarcia", s.clicks], ["Polecenia", s.leads], ["Klienci", s.won]].map(([l, v]) => (
                      <div key={l} className={l === "Klienci" && Number(v) > 0 ? "success-grad rounded-xl py-1.5" : "rounded-xl bg-cream py-1.5"}>
                        <dd className="tabular text-lg font-extrabold leading-tight">{v}</dd>
                        <dt className={l === "Klienci" && Number(v) > 0 ? "text-[11px] text-white/85" : "text-[11px] text-muted"}>{l}</dt>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-sand" role="img" aria-label={`Otwarcia: ${s.clicks}, polecenia: ${s.leads}`}>
                    <div className="h-full rounded-full bg-gold" style={{ width: `${Math.max(s.clicks || s.leads ? 6 : 0, ((s.clicks + s.leads) / maxActivity) * 100)}%` }} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
