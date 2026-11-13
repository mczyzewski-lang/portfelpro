import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProcessBar } from "@/components/process";
import { CommissionStatusBadge, LeadStatusBadge } from "@/components/status";
import { requirePartner } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { formatPLN } from "@/lib/commission";
import { fmtDateTime, leadRef, leadSourceLabel, PROCESS_STEPS, stageLabel } from "@/lib/labels";
import { getReferralDetail } from "@/lib/partner-data";

export const metadata = { title: "Przebieg polecenia" };
const dot = { neutral: "bg-leather", gold: "bg-gold", ok: "success-grad", danger: "bg-danger" };

export default async function ReferralDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ nowe?: string }> }) {
  const { partner } = await requirePartner();
  const r = await getReferralDetail(partner.id, (await params).id); // zawężone do partnera — cudzy lead = 404
  if (!r) notFound();
  const fresh = (await searchParams).nowe === "1";
  const closed = r.status === "rejected" || r.status === "cancelled";
  const step = PROCESS_STEPS.find((s) => s.status === r.status);
  const live = r.commissions.filter((c) => c.status !== "cancelled");
  const main = r.commissions.find((c) => c.kind === "commission" && c.status !== "cancelled") ?? r.commissions.find((c) => c.kind === "commission");

  return (
    <article className="mx-auto max-w-2xl">
      <Link href="/app/polecenia" className="press -ml-2 inline-flex min-h-10 items-center gap-1.5 rounded-full px-2 text-sm font-bold text-leather"><ArrowLeft className="size-4" aria-hidden />Polecenia</Link>

      {fresh && (
        <p role="status" className="pop mb-3 flex items-center gap-2 rounded-2xl bg-ok-bg px-4 py-3 text-sm font-semibold text-ok" data-testid="handoff-success">
          <CheckCircle2 className="size-5 shrink-0" aria-hidden />Kontakt przekazany. Specjalista odezwie się do klienta, a Ty zobaczysz tu każdy kolejny krok.
        </p>
      )}

      <header className="rounded-3xl border border-line bg-white p-5 shadow-(--shadow-card)">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="tabular text-xs font-bold uppercase tracking-wider text-muted">{leadRef(r.number)}</p>
            <h1 className="mt-0.5 text-[22px] font-extrabold leading-tight text-leather-dark">{r.clientName ?? r.serviceName}</h1>
            {r.clientName && <p className="text-sm text-muted">{r.serviceName}</p>}
          </div>
          <LeadStatusBadge status={r.status} />
        </div>
        <div className="mt-5" data-testid="process"><ProcessBar status={r.status} reached={r.reached} labels /></div>
        <p className={cn("mt-4 rounded-2xl px-4 py-3 text-sm leading-snug", closed ? "bg-danger-bg text-danger" : "bg-cream text-ink/85")}>
          {closed ? "Proces został zakończony bez sprzedaży. Prowizja za to polecenie nie zostanie naliczona." : step?.hint}
        </p>
      </header>

      <section className={cn("mt-4 rounded-3xl border p-5", main && (main.status === "paid" || main.status === "approved") ? "success-soft" : "border-line bg-white")} aria-labelledby="prow">
        <h2 id="prow" className="text-[17px] font-extrabold text-leather-dark">Prowizja</h2>
        {main ? (
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="tabular text-2xl font-extrabold text-leather-dark">{formatPLN(live.reduce((s, c) => s + c.amount, 0))}</p>
            <CommissionStatusBadge status={main.status} />
          </div>
        ) : <p className="mt-1 text-sm text-muted">Jeszcze nienaliczona. Pojawi się, gdy polecenie spełni warunek rozliczenia tej usługi.</p>}
        {r.commissions.some((c) => c.kind === "correction") && <p className="mt-1 text-xs font-medium text-danger">Uwzględniono korektę po zwrocie.</p>}
      </section>

      <section className="mt-4 rounded-3xl border border-line bg-white p-5" aria-labelledby="hist">
        <h2 id="hist" className="text-[17px] font-extrabold text-leather-dark">Historia krok po kroku</h2>
        <ol className="mt-3 space-y-0" data-testid="timeline">
          {r.timeline.map((e, i) => (
            <li key={e.id} className="relative flex gap-3 pb-4 last:pb-0">
              {i < r.timeline.length - 1 && <span aria-hidden className="absolute left-[5px] top-4 h-full w-0.5 bg-line" />}
              <span aria-hidden className={cn("relative mt-1.5 size-3 shrink-0 rounded-full ring-4 ring-white", dot[e.tone])} />
              <div><p className="text-[15px] font-bold leading-snug text-leather-dark">{e.title}</p><p className="tabular text-xs text-muted">{fmtDateTime(e.at)}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-3xl border border-line bg-white p-5 text-sm">
        <dt className="text-muted">Źródło</dt><dd className="font-semibold">{leadSourceLabel[r.source] ?? r.source}{r.stage && ` · ${stageLabel[r.stage]}`}</dd>
        {r.viaAsset && <><dt className="text-muted">Link</dt><dd className="font-semibold">{r.viaAsset}</dd></>}
        <dt className="text-muted">Usługa</dt><dd><Link href={`/app/uslugi/${r.serviceSlug}`} className="font-semibold text-leather underline">{r.serviceName}</Link></dd>
      </dl>
      {!r.clientName && <p className="mt-3 px-1 text-xs text-muted">Ze względu na poufność nie pokazujemy danych klienta, który zgłosił się sam przez link.</p>}
    </article>
  );
}
