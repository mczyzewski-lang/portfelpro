import { Check, Lock, Trophy } from "lucide-react";
import Link from "next/link";
import { btn } from "@/components/ui";
import { requirePartner } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { achievementsFor, levelFor, LEVELS } from "@/lib/gamification";
import { getMonthlyRank, getPartnerStats } from "@/lib/partner-data";

export const metadata = { title: "Poziomy i osiągnięcia" };

export default async function LevelsPage() {
  const { partner } = await requirePartner();
  const [stats, rank] = await Promise.all([getPartnerStats(partner.id), getMonthlyRank(partner.id)]);
  const level = levelFor(stats.clients);
  const list = achievementsFor(stats);
  const doneCount = list.filter((a) => a.done).length;
  const plural = (n: number) => (n === 1 ? "klienta" : "klientów");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-[24px] font-extrabold leading-tight text-leather-dark">Poziomy i osiągnięcia</h1>

      <section className="wallet wallet-sheen rounded-[28px] p-5" aria-label="Twój poziom">
        <div className="relative z-10 flex items-center gap-4">
          <span className="pop grid size-16 shrink-0 place-items-center rounded-full bg-gold-light text-leather-dark shadow-lg"><Trophy className="size-8" aria-hidden /></span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gold-light">Twój poziom</p>
            <p className="text-3xl font-extrabold leading-tight" data-testid="level-name">{level.current.name}</p>
          </div>
        </div>
        <div className="relative z-10 mt-5">
          <div className="h-2.5 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level.progress * 100)} aria-label="Postęp do kolejnego poziomu">
            <div className="h-full rounded-full bg-gold-light transition-[width] duration-700" style={{ width: `${Math.max(4, level.progress * 100)}%` }} />
          </div>
          <p className="mt-2 text-sm text-white/80">
            {level.next
              ? <>Do poziomu <b className="text-white">{level.next.name}</b> brakuje {level.missing} potwierdzonego {plural(level.missing)}.</>
              : "To najwyższy poziom. Gratulacje!"}
          </p>
        </div>
        <ol className="relative z-10 mt-4 flex justify-between gap-1 border-t border-white/15 pt-3">
          {LEVELS.map((l, i) => (
            <li key={l.name} className={cn("flex-1 text-center text-[11px] font-bold leading-tight", i <= level.index ? "text-gold-light" : "text-white/45")}>
              {l.name}<span className="block font-medium opacity-80">{l.min}+</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid grid-cols-2 gap-2.5" aria-label="Ten miesiąc">
        <div className="rounded-2xl border border-line bg-white px-4 py-3.5">
          <p className="text-xs text-muted">Polecenia w tym miesiącu</p>
          <p className="tabular text-2xl font-extrabold text-leather-dark">{rank.mine}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white px-4 py-3.5">
          <p className="text-xs text-muted">Miejsce wśród partnerów</p>
          <p className="tabular text-2xl font-extrabold text-leather-dark">{rank.position ? `${rank.position}.` : "—"}<span className="ml-1 text-sm font-semibold text-muted">{rank.position ? `z ${rank.active}` : "brak poleceń"}</span></p>
        </div>
      </section>

      <section aria-labelledby="osiagniecia">
        <div className="flex items-baseline justify-between">
          <h2 id="osiagniecia" className="text-xl font-extrabold text-leather-dark">Osiągnięcia</h2>
          <p className="tabular text-sm font-bold text-gold-deep">{doneCount} / {list.length}</p>
        </div>
        <ul className="stagger mt-3 grid gap-2.5 sm:grid-cols-2">
          {list.map((a, n) => (
            <li key={a.id} style={{ "--i": Math.min(n, 8) } as React.CSSProperties} data-done={a.done}
              className={cn("flex gap-3 rounded-3xl border p-4", a.done ? "border-gold/50 bg-white shadow-(--shadow-card)" : "border-line bg-white/60")}>
              <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl", a.done ? "bg-gold-light text-leather-dark" : "bg-sand text-muted")}>
                {a.done ? <Check className="size-5" aria-hidden /> : <Lock className="size-4" aria-hidden />}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("font-extrabold leading-snug", a.done ? "text-leather-dark" : "text-ink/70")}>{a.title}</p>
                <p className="text-[13px] leading-snug text-muted">{a.description}</p>
                {!a.done && a.target > 1 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand"><div className="h-full rounded-full bg-gold" style={{ width: `${(a.current / a.target) * 100}%` }} /></div>
                    <span className="tabular text-[11px] font-bold text-muted">{a.current}/{a.target}</span>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <p className="px-1 text-xs text-muted">Poziomy i osiągnięcia liczymy z faktycznych danych: otwartych linków, poleceń i potwierdzonych sprzedaży. Mają charakter informacyjny i nie zmieniają stawek prowizji.</p>
      <Link href="/app/uslugi" className={btn("primary", "press w-full")}>Poleć kolejną usługę</Link>
    </div>
  );
}
