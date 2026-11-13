import Link from "next/link";
import { CopyButton } from "@/components/client";
import { CommissionStatusBadge, LeadStatusBadge } from "@/components/status";
import { Badge, Card, EmptyState, LinkButton } from "@/components/ui";
import { requirePartner } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { formatPLN } from "@/lib/commission";
import { fmtDate, leadRef, stageLabel } from "@/lib/labels";
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
        {[["Oczekujące", sum.pending, "text-warn"], ["Zatwierdzone", sum.approved, "text-gold-deep"], ["Wypłacone", sum.paid, "text-ok"]].map(([l, v, c]) => (
          <div key={l} className="rounded-2xl border border-line bg-white px-3 py-3">
            <dt className="text-xs text-muted">{l}</dt>
            <dd className={cn("tabular text-[17px] font-extrabold", c as string)}>{formatPLN(v as number)}</dd>
          </div>
        ))}
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
    <EmptyState title="Nie masz jeszcze poleceń" action={<LinkButton href="/app/uslugi">Zobacz, co możesz polecić</LinkButton>}>
      Gdy klient skorzysta z Twojego linku i zostawi kontakt, polecenie pojawi się tutaj wraz ze statusem.
    </EmptyState>
  );
  return (
    <Card className="overflow-hidden">
      <p className="border-b border-line bg-cream/60 px-4 py-2 text-xs text-muted">Ze względu na poufność nie pokazujemy danych klientów — tylko numer i status polecenia.</p>
      <table className="w-full text-sm" data-testid="referrals-table">
        <thead className="text-left text-xs text-muted">
          <tr><th className="px-4 py-2.5 font-semibold">Data</th><th className="px-2 py-2.5 font-semibold">Usługa</th><th className="px-2 py-2.5 font-semibold">Status</th><th className="px-4 py-2.5 text-right font-semibold">Prowizja</th></tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => (
            <tr key={r.id} className="align-top">
              <td className="tabular whitespace-nowrap px-4 py-3 text-muted">{fmtDate(r.createdAt).slice(0, 5)}<span className="block text-[11px]">{leadRef(r.number)}</span></td>
              <td className="px-2 py-3 font-semibold leading-snug text-leather-dark">{r.serviceName}{r.stage && <span className="block text-[11px] font-medium text-muted">{stageLabel[r.stage]}</span>}</td>
              <td className="px-2 py-3"><LeadStatusBadge status={r.status} /></td>
              <td className="tabular px-4 py-3 text-right font-bold">
                {r.commissionStatus ? formatPLN(r.commissionAmount) : <span className="font-medium text-muted">0 zł</span>}
                {r.commissionStatus && <span className="mt-0.5 block"><CommissionStatusBadge status={r.commissionStatus} /></span>}
                {r.hasCorrection && <span className="mt-0.5 block text-[11px] font-medium text-danger">z korektą</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

async function Commissions({ partnerId }: { partnerId: string }) {
  const rows = await getPartnerCommissions(partnerId);
  if (!rows.length) return <EmptyState title="Brak prowizji">Prowizja pojawi się, gdy polecenie spełni warunek rozliczenia danej usługi.</EmptyState>;
  return (
    <ul className="space-y-2.5">
      {rows.map((c) => (
        <li key={c.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-bold text-leather-dark">{c.serviceName}</p>
            <p className="text-xs text-muted">{leadRef(c.leadNumber)} · naliczono {fmtDate(c.createdAt)}{c.paidAt && ` · wypłacono ${fmtDate(c.paidAt)}`}{c.kind === "correction" && " · korekta"}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className={cn("tabular font-extrabold", c.amount < 0 ? "text-danger" : "text-leather-dark", c.status === "cancelled" && "line-through opacity-60")}>{formatPLN(c.amount)}</p>
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
