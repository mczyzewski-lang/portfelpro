import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { setProspectFlagAction } from "@/app/actions/admin";
import { PageHeader } from "@/components/admin";
import { ActionForm } from "@/components/client";
import { db } from "@/db";
import { partners, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { levelFor } from "@/lib/gamification";
import { fmtDate, partnerId } from "@/lib/labels";
import { contactOf } from "@/lib/phone";

export const metadata = { title: "Lejek prospektów" };

const STAGES = ["Rejestracja", "Płatność", "Wysłano pakiet", "Dodał zdjęcie", "Wpisał kod", "Obejrzał wideo", "Onboarding", "Pierwszy lead", "Pierwszy klient", "Pierwsza wypłata", "Szklana", "Brązowa", "Srebrna", "Złota"] as const;
const STAR_FROM = 10; // od tego etapu zaczynają się kolory gwiazd
const starDot = ["bg-sky-300", "bg-amber-700", "bg-slate-400", "bg-gold"];

/** Każdy partner jako prospekt: które etapy ma za sobą i jaki jest jego następny krok. */
export default async function FunnelPage({ searchParams }: { searchParams: Promise<{ etap?: string }> }) {
  await requireAdmin();
  const { etap } = await searchParams;
  const rows = await db.select({
    p: { id: partners.id, number: partners.number, createdAt: partners.createdAt, paidAt: partners.paidAt, packSentAt: partners.packSentAt, starterConfirmedAt: partners.starterConfirmedAt,
      starterVideoSeenAt: partners.starterVideoSeenAt, onboardedAt: partners.onboardedAt, hasPhoto: sql<boolean>`"partners"."avatar" is not null` },
    u: { firstName: users.firstName, lastName: users.lastName, email: users.email, loginPhone: users.loginPhone },
    leads: sql<number>`(select count(*)::int from leads l where l.partner_id = "partners"."id")`,
    clients: sql<number>`(select count(*)::int from conversions c join leads l on l.id = c.lead_id where l.partner_id = "partners"."id" and c.status = 'confirmed')`,
    payouts: sql<number>`(select count(*)::int from payouts po where po.partner_id = "partners"."id")`,
  }).from(partners).innerJoin(users, eq(users.id, partners.userId)).orderBy(desc(partners.createdAt)).limit(500);

  const prospects = rows.map(({ p, u, leads, clients, payouts }) => {
    const level = levelFor(clients, leads).index;
    const done = [true, !!p.paidAt, !!p.packSentAt, p.hasPhoto, !!p.starterConfirmedAt, !!p.starterVideoSeenAt, !!p.onboardedAt, leads > 0, clients > 0, payouts > 0, level >= 1, level >= 2, level >= 3, level >= 4];
    const next = done.indexOf(false); // -1 = wszystkie etapy za nim
    return { p, u, done, next };
  });
  const filter = etap !== undefined && /^\d+$/.test(etap) ? Number(etap) : null;
  const shown = filter === null ? prospects : prospects.filter((x) => x.next === filter);

  return (
    <>
      <PageHeader title="Lejek prospektów" sub="Każdy partner z etapami od rejestracji do złotej gwiazdy. „Płatność” i „Wysłano pakiet” oznacza administrator — pozostałe etapy liczą się same." />
      <ol className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7" data-testid="funnel-stages">
        {STAGES.map((s, i) => {
          const count = prospects.filter((x) => x.done[i]).length, waiting = prospects.filter((x) => x.next === i).length;
          return (
            <li key={s}>
              <Link href={filter === i ? "/admin/lejek" : `/admin/lejek?etap=${i}`} className={cn("block h-full rounded-2xl border p-2.5", filter === i ? "border-leather bg-cream ring-2 ring-leather/15" : "border-line bg-white hover:bg-cream")}>
                <span className="flex items-center gap-1.5 text-[11px] font-bold leading-tight text-muted">{i >= STAR_FROM && <i className={cn("size-2.5 shrink-0 rounded-full", starDot[i - STAR_FROM])} />}{i + 1}. {s}</span>
                <span className="tabular mt-1 block text-xl font-extrabold text-leather-dark">{count}</span>
                <span className="block text-[11px] text-muted">{i === 0 ? "wszyscy" : `czeka: ${waiting}`}</span>
              </Link>
            </li>
          );
        })}
      </ol>
      {filter !== null && <p className="mb-3 text-sm text-muted">Prospekci, których następny krok to <b className="text-ink">{STAGES[filter]}</b> ({shown.length}). <Link href="/admin/lejek" className="font-semibold text-leather underline">Pokaż wszystkich</Link></p>}

      <ul className="space-y-2.5">
        {shown.map(({ p, u, done, next }) => (
          <li key={p.id} className="rounded-2xl border border-line bg-white p-3.5" data-testid="prospect-row">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div className="min-w-0">
                <Link href={`/admin/partnerzy/${p.id}`} className="font-bold hover:underline">{u.firstName} {u.lastName}</Link>
                <span className="block text-xs text-muted"><span className="tabular">{partnerId(p.number)}</span> · {contactOf(u)} · od {fmtDate(p.createdAt)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", next === -1 ? "success-soft" : "bg-sand text-leather-dark")} data-testid="prospect-next">{next === -1 ? "Wszystkie etapy" : `Następny krok: ${STAGES[next]}`}</span>
                {(["paid", "pack"] as const).map((flag) => {
                  const on = flag === "paid" ? !!p.paidAt : !!p.packSentAt;
                  return (
                    <ActionForm key={flag} action={setProspectFlagAction}>
                      <input type="hidden" name="partnerId" value={p.id} /><input type="hidden" name="flag" value={flag} /><input type="hidden" name="value" value={on ? "" : "on"} />
                      <button className={cn("min-h-9 rounded-full border px-3 text-xs font-bold", on ? "border-line bg-white text-muted" : "border-leather bg-leather text-white")} data-testid={`flag-${flag}`}>
                        {flag === "paid" ? (on ? "Cofnij płatność" : "Oznacz płatność") : (on ? "Cofnij wysyłkę" : "Oznacz wysyłkę pakietu")}
                      </button>
                    </ActionForm>
                  );
                })}
              </div>
            </div>
            <ol className="mt-3 flex gap-1" aria-label="Etapy">
              {STAGES.map((s, i) => (
                <li key={s} title={`${s}${done[i] ? " — zrobione" : ""}`} className="min-w-0 flex-1">
                  <span className={cn("block h-2 rounded-full", done[i] ? (i >= STAR_FROM ? starDot[i - STAR_FROM] : "bg-ok") : i === next ? "bg-gold/50" : "bg-line")} />
                  <span className={cn("mt-1 hidden truncate text-[10px] xl:block", done[i] ? "font-semibold text-ink" : "text-muted")}>{s}</span>
                </li>
              ))}
            </ol>
          </li>
        ))}
        {shown.length === 0 && <li className="py-8 text-center text-muted">Brak prospektów na tym etapie.</li>}
      </ul>
    </>
  );
}
