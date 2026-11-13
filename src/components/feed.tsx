import { CircleDollarSign, MousePointerClick, Route, UserPlus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { FeedItem } from "@/lib/partner-data";

const icon = { click: MousePointerClick, lead: UserPlus, status: Route, money: CircleDollarSign };
const tone = { neutral: "bg-sand text-leather", gold: "bg-gold-light/50 text-leather-dark", ok: "bg-ok-bg text-ok", danger: "bg-danger-bg text-danger" };
const rel = new Intl.RelativeTimeFormat("pl", { numeric: "auto" });

export function timeAgo(d: Date): string {
  const s = Math.round((d.getTime() - Date.now()) / 1000);
  if (Math.abs(s) < 60) return "przed chwilą";
  if (Math.abs(s) < 3600) return rel.format(Math.round(s / 60), "minute");
  if (Math.abs(s) < 86400) return rel.format(Math.round(s / 3600), "hour");
  if (Math.abs(s) < 86400 * 30) return rel.format(Math.round(s / 86400), "day");
  return new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Warsaw" }).format(d);
}

/** Dziennik zdarzeń partnera: co się wydarzyło z jego linkami, poleceniami i prowizjami. */
export function Feed({ items }: { items: FeedItem[] }) {
  return (
    <ol className="stagger divide-y divide-line overflow-hidden rounded-3xl border border-line bg-white shadow-(--shadow-card)" data-testid="activity">
      {items.map((it, n) => {
        const Icon = icon[it.kind];
        const body = (
          <>
            <span className={cn("grid size-10 shrink-0 place-items-center rounded-2xl", tone[it.tone])}><Icon className="size-[18px]" aria-hidden /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold leading-snug text-leather-dark">{it.title}</span>
              <span className="block truncate text-[13px] text-muted">{it.detail}</span>
            </span>
            <time dateTime={it.at.toISOString()} className="shrink-0 text-xs text-muted">{timeAgo(it.at)}</time>
          </>
        );
        return (
          <li key={it.key} style={{ "--i": Math.min(n, 8) } as React.CSSProperties}>
            {it.leadId
              ? <Link href={`/app/polecenia/${it.leadId}`} className="press flex items-center gap-3 px-4 py-3 hover:bg-cream/60">{body}</Link>
              : <div className="flex items-center gap-3 px-4 py-3">{body}</div>}
          </li>
        );
      })}
    </ol>
  );
}
