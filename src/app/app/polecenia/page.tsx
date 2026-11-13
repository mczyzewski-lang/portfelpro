import Link from "next/link";
import { CopyButton } from "@/components/client";
import { CommissionStatusBadge, LeadStatusBadge } from "@/components/status";
import { ProcessBar } from "@/components/process";
import { Badge, EmptyState, LinkButton } from "@/components/ui";
import { requirePartner } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { formatPLN } from "@/lib/commission";
import { fmtDate, leadRef, PROCESS_STEPS, stageLabel } from "@/lib/labels";
import { getPartnerCommissions, getPartnerLinks, getPartnerReferrals, getWalletSummary } from "@/lib/partner-data";
import { linkUrl } from "@/lib/tracking";

export const metadata = { title: "Polecenia" };
const tabs = [["polecenia", "Polecenia"], ["prowizje", "Prowizje"], ["linki", "Linki"]] as const;

export default async function ReferralsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { partner } = await requirePartner();
  const wanted = (await searchParams).tab;
  const tab = tabs.find(([t]) => t === wanted)?.[0] ?? "polecenia";
  const sum = await getWalletSummary(partner.id);

  return (
    <>
      <h1 className="text-[26px] font-extrabold leading-tight text-leather-dark">Polecenia i prowizje</h1>
      <dl className="mt-4 grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl border border-line bg-white px-3 py-3"><dt className="text-xs text-muted">Oczekujące</dt><dd className="tabular text-[17px] font-extrabold text-warn">{formatPLN(sum.pending)}</dd></div>
        <div className={cn("rounded-2xl border px-3 py-3", sum.approved > 0 ? "success-soft" : "border-line bg-white")}><dt className="text-xs text-muted">Zatwierdzone</dt><dd className="tabular text-[17px] font-extrabold text-ok">{formatPLN(sum.approved)}</dd></div>
        <div className={cn("rounded-2xl px-3 py-3", sum.paid > 0 ? "success-grad" : "border border-line bg-white")} data-testid="tile-paid"><dt className={cn("text-xs", sum.paid > 0 ? "text-white/85" : "text-muted")}>Wypłacone</dt><dd className={cn("tabular text-[17px] font-extrabold", sum.paid > 0 ? "text-white" : "text-ok")}>{formatPLN(sum.paid)}</dd></div>
      </dl>

      <nav aria-label="Widok" className="mt-5 flex gap-1 rounded-full bg-sand p-1">
        {tabs.map(([t, l]) => (
          <Link key={t} href={`/app/polecenia?tab=${t}`} aria-current={tab === t ? "page" : undefined}
            className={cn("flex min-h-10 flex-1 items-center justify-center rounded-full text-sm font-bold", tab === t ? "bg-white text-leather-dark shadow-sm" : "text-muted")}>{l}</Link>
        ))}
      </nav>

      <div className="mt-4">
        {tab === "polecenia" && <Referrals partnerId={partner.id} />}
        {tab === "prowizje" && <Commissions partnerId={partner.id} />}
        {tab === "linki" && <Links partnerId={partner.id} />}
      </div>
    </>
  );
}

async function Referrals({ partnerId }: { partnerId: string }) {
  const rows = await getPartnerReferrals(partnerId);
  if (!rows.length) return (
    <EmptyState title="Nie masz jeszcze poleceń" action={<LinkButton href="/app/uslugi">Otwórz Portfel usług</LinkButton>}>
      Gdy klient zostawi kontakt z Twojego linku albo przekażesz go do konsultacji, polecenie pojawi się tutaj z całym przebiegiem.
    </EmptyState>
  );
  return (
    <>
      <p className="mb-3 text-xs text-muted">Dotknij polecenia, żeby zobaczyć cały przebieg. Dane klienta widzisz tylko wtedy, gdy sam je przekazałeś.</p>
      <ul className="stagger space-y-3" data-testid="referrals-table">
        {rows.map((r, n) => {
          const closed = r.status === "rejected" || r.status === "cancelled";
          return (
            <li key={r.id} style={{ "--i": Math.min(n, 8) } as React.CSSProperties}>
              <Link href={`/app/polecenia/${r.id}`} className={cn("press block rounded-3xl border p-4 shadow-(--shadow-card)", r.status === "won" ? "success-soft" : "border-line bg-white")} data-testid="referral-row">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-extrabold leading-snug text-leather-dark">{r.clientName ?? r.serviceName}</p>
                    <p className="tabular text-xs text-muted">{r.clientName && `${r.serviceName} · `}{leadRef(r.number)} · {fmtDate(r.createdAt)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tabular font-extrabold text-leather-dark">{r.commissionStatus ? formatPLN(r.commissionAmount) : <span className="font-medium text-muted">0 zł</span>}</p>
                    {r.commissionStatus && <CommissionStatusBadge status={r.commissionStatus} />}
                  </div>
                </div>
                <div className="mt-3"><ProcessBar status={r.status} /></div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <LeadStatusBadge status={r.status} />
                  <span className="text-xs text-muted">{closed ? "Proces zakończony" : PROCESS_STEPS.find((s) => s.status === r.status)?.hint.split(".")[0]}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}

async function Commissions({ partnerId }: { partnerId: string }) {
  const rows = await getPartnerCommissions(partnerId);
  if (!rows.length) return <EmptyState title="Brak prowizji">Prowizja pojawi się, gdy polecenie spełni warunek rozliczenia danej usługi.</EmptyState>;
  return (
    <ul className="space-y-2.5">
      {rows.map((c) => (
        <li key={c.id} className={cn("flex items-center justify-between gap-3 rounded-2xl border px-4 py-3", c.status === "paid" || c.status === "approved" ? "success-soft" : "border-line bg-white")}>
          <div className="min-w-0">
            <p className="truncate font-bold text-leather-dark">{c.serviceName}</p>
            <p className="text-xs text-muted">{leadRef(c.leadNumber)} · naliczono {fmtDate(c.createdAt)}{c.paidAt && ` · wypłacono ${fmtDate(c.paidAt)}`}{c.kind === "correction" && " · korekta"}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className={cn("tabular font-extrabold", c.amount < 0 ? "text-danger" : c.status === "paid" || c.status === "approved" ? "text-ok" : "text-leather-dark", c.status === "cancelled" && "line-through opacity-60")}>{formatPLN(c.amount)}</p>
            <CommissionStatusBadge status={c.status} />
          </div>
        </li>
      ))}
    </ul>
  );
}

async function Links({ partnerId }: { partnerId: string }) {
  const rows = await getPartnerLinks(partnerId);
  if (!rows.length) return (
    <EmptyState title="Nie masz jeszcze linków" action={<LinkButton href="/app/uslugi">Wybierz usługę</LinkButton>}>
      Linki tworzą się automatycznie, gdy otworzysz kartę usługi. Tutaj zobaczysz ich wyniki.
    </EmptyState>
  );
  return (
    <ul className="space-y-2.5">
      {rows.map((l) => (
        <li key={l.id} className="rounded-2xl border border-line bg-white p-4">
          <div className="flex flex-wrap items-center gap-2"><Badge>{stageLabel[l.stage]}</Badge>{l.campaign && <Badge tone="gold">{l.campaign}</Badge>}<span className="text-xs text-muted">{l.serviceName}</span></div>
          <Link href={`/app/uslugi/${l.serviceSlug}`} className="mt-1 block font-bold leading-snug text-leather-dark hover:underline">{l.assetTitle}</Link>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="tabular text-sm"><b>{l.clicks}</b> <span className="text-muted">klik.</span> · <b>{l.leads}</b> <span className="text-muted">polec.</span></p>
            <CopyButton small variant="secondary" text={linkUrl(l.token)} label="Kopiuj link" />
          </div>
        </li>
      ))}
    </ul>
  );
}
