import { Stitch } from "@/components/stitch";
import { Check, Gift, Lock } from "lucide-react";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { ConfettiBurst } from "@/components/confetti";
import { StarMark } from "@/components/star";
import { StarPath } from "@/components/star-path";
import { btn, btnSm } from "@/components/ui";
import { db } from "@/db";
import { partners } from "@/db/schema";
import { requirePartner } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { achievementsFor, GLASS_LEADS, ICE_MELT_WEEKS, iceMelt, levelFor, LEVELS, newSince } from "@/lib/gamification";
import { getMonthlyRank, getPartnerStats } from "@/lib/partner-data";

export const metadata = { title: "Poziomy i osiągnięcia" };

export default async function LevelsPage() {
  const { partner } = await requirePartner();
  const [stats, rank] = await Promise.all([getPartnerStats(partner), getMonthlyRank(partner.id)]);
  // Nowości od ostatniej wizyty: confetti i oznaczenie „Nowe”, po czym zapisujemy, że partner je zobaczył.
  const fresh = newSince(partner.gamificationSeen, stats);
  if (fresh.any) await db.update(partners).set({ gamificationSeen: { level: fresh.level, achievements: fresh.done } }).where(eq(partners.id, partner.id));
  const level = levelFor(stats.clients, stats.leads);
  const ice = level.index === 0 ? iceMelt(partner.createdAt) : null;
  // Zdobyte (zielone) zawsze na górze; w obrębie grup zachowujemy stałą kolejność.
  const all = achievementsFor(stats);
  const list = [...all.filter((a) => a.done), ...all.filter((a) => !a.done && !a.teaser)];
  const teasers = all.filter((a) => a.teaser && !a.done); // kolejne progi — tylko zasłonięta zapowiedź
  const doneCount = list.filter((a) => a.done).length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <ConfettiBurst fire={fresh.any} />
      <h1 className="text-[24px] font-extrabold leading-tight text-leather-dark">Poziomy i osiągnięcia</h1>

      <section className="wallet wallet-sheen rounded-[28px] p-5" aria-label="Twój poziom">
<Stitch radius={19} />
        <div className="relative z-10 flex items-center gap-4">
          <span className="orb pop" data-testid="level-orb"><StarMark tier={level.current.tier} size={54} melt={ice?.melt ?? 0} className="relative" /><span aria-hidden className="orb-glint" /></span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gold-light">Twój poziom</p>
            <p className="text-3xl font-extrabold leading-tight" data-testid="level-name">{level.current.name}{fresh.levelUp && <span className="pop ml-2 inline-block whitespace-nowrap rounded-full px-2 py-0.5 align-middle text-[11px] font-bold success-grad">Nowy poziom</span>}</p>
          </div>
        </div>
        <div className="relative z-10 mt-5">
          <div className="h-2.5 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level.progress * 100)} aria-label="Postęp do kolejnej gwiazdy">
            <div className="h-full rounded-full bg-linear-to-r from-[#3fb37e] to-[#a8e6c4] transition-[width] duration-700" style={{ width: `${Math.max(4, level.progress * 100)}%` }} />
          </div>
          <p className="mt-2 text-sm text-white/80">
            {ice
              ? <>Następna gwiazda: <b className="text-white">Szklana</b> — wystarczy 1 klient, który zapłacił, albo {GLASS_LEADS} polecenia{level.missingLeads < GLASS_LEADS && <> (brakuje {level.missingLeads})</>}.</>
              : level.next
                ? <>Następna gwiazda: <b className="text-white">{level.next.name}</b> — brakuje {level.missing} {level.missing === 1 ? "potwierdzonego klienta" : "potwierdzonych klientów"}.</>
                : "Masz Złotą gwiazdę — najwyższą. Gratulacje!"}
          </p>
          {ice && (
            <p className="mt-2 rounded-2xl bg-white/10 px-3 py-2 text-[13px] leading-snug text-white/85" data-testid="ice-melt">
              {ice.melt >= 1
                ? "Lodowa gwiazda już się roztopiła — została po niej woda. Zdobądź Szklaną, żeby mieć gwiazdę z powrotem."
                : <>Lodowa gwiazda topnieje. Za <b className="text-white">{ice.weeksLeft} {ice.weeksLeft === 1 ? "tydzień" : ice.weeksLeft < 5 ? "tygodnie" : "tygodni"}</b> zostanie po niej tylko woda — zdobądź Szklaną wcześniej.</>}
            </p>
          )}
        </div>
        {/* wszystkie gwiazdy w jednym rzędzie: dotknięcie pokazuje, co trzeba zrobić, żeby zdobyć daną gwiazdę */}
        <StarPath steps={LEVELS.map((l, i) => ({
          tier: l.tier, name: l.name, reached: i <= level.index, current: i === level.index,
          melt: l.tier === "ice" && i === level.index ? ice?.melt ?? 0 : 0,
          short: l.min === 0 ? "start" : l.tier === "glass" ? "1 kl. / 3 pol." : `${l.min}+`,
          requirement: l.tier === "ice" ? `Dostajesz ją na start. Topnieje przez ${ICE_MELT_WEEKS} tygodni, więc warto szybko zdobyć Szklaną.`
            : l.tier === "glass" ? `Wystarczy 1 klient, który zapłacił, albo ${GLASS_LEADS} polecenia (klienci, którzy zostawili kontakt).`
            : `Potrzebujesz ${l.min} potwierdzonych klientów — czyli sprzedaży z Twoich poleceń.${l.tier === "gold" ? " To najwyższa gwiazda." : ""}`,
        }))} />
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
          <p className="tabular rounded-full px-2.5 py-0.5 text-sm font-bold success-grad">{doneCount} / {list.length}</p>
        </div>
        <ul className="stagger mt-3 grid gap-2.5 sm:grid-cols-2">
          {list.map((a, n) => (
            <li key={a.id} style={{ "--i": Math.min(n, 8) } as React.CSSProperties} data-done={a.done}
              className={cn("flex gap-3 rounded-3xl border p-4", a.done ? "success-soft shadow-(--shadow-card)" : "border-line bg-white/60")}>
              <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl", a.done ? "success-grad" : "bg-sand text-muted")}>
                {a.done ? <Check className="size-5" aria-hidden /> : <Lock className="size-4" aria-hidden />}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("font-extrabold leading-snug", a.done ? "text-[#14553c]" : "text-ink/70")}>{a.title}{fresh.newAchievements.includes(a.id) && <span className="pop ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold success-grad" data-testid="new-badge">Nowe</span>}</p>
                <p className="text-[13px] leading-snug text-muted">{a.description}</p>
                {!a.done && a.id === "photo" && <Link href="/app/konto" className={btnSm("gold", "press mt-2")}>Dodaj zdjęcie</Link>}
                {!a.done && a.id === "starter-pack" && <Link href="/app" className={btnSm("gold", "press mt-2")}>Wpisz kod z pakietu</Link>}
                {a.id === "ten-clients" && <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-gold-light/50 px-2.5 py-1 text-[11px] font-bold text-leather-dark"><Gift className="size-3.5" aria-hidden />{a.done ? "Niespodzianka czeka — napisz do opiekuna" : "Niespodzianka po zdobyciu"}</p>}
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

      {/* Dalsze progi są celowo zasłonięte: widać, że coś jest dalej, ale nie co. Przycisk leży na nich. */}
      <div className="relative" data-testid="levels-teaser">
        {teasers.length > 0 && (
          <ul aria-hidden className="-mt-3.5 max-h-[150px] select-none space-y-2.5 overflow-hidden">
            {teasers.map((a) => (
              <li key={a.id} className="flex gap-3 rounded-3xl border border-line bg-white/60 p-4 blur-[1.5px]">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sand text-muted"><Lock className="size-4" /></span>
                <div><p className="font-extrabold text-ink/60">{a.title}</p><p className="text-[13px] text-muted">{a.description}</p></div>
              </li>
            ))}
          </ul>
        )}
        <div className={teasers.length > 0 ? "absolute inset-x-0 bottom-0 flex h-[150px] flex-col justify-end bg-linear-to-b from-cream/0 via-cream/85 to-cream" : undefined}>
          {teasers.length > 0 && <p className="mb-2 text-center text-xs font-semibold text-muted">Kolejne progi odkryjesz po drodze</p>}
          <Link href="/app/uslugi" className={btn("primary", "press w-full")}>Poleć kolejną usługę</Link>
        </div>
      </div>
      <p className="px-1 text-xs text-muted">Poziomy i osiągnięcia liczymy z faktycznych danych: otwartych linków, poleceń i potwierdzonych sprzedaży. Mają charakter informacyjny i nie zmieniają stawek prowizji.</p>
    </div>
  );
}
