import Link from "next/link";
import { PageHeader } from "@/components/admin";
import { timeAgo } from "@/components/feed";
import { Badge } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { partnerId } from "@/lib/labels";
import { getInbox } from "@/lib/messages";

export default async function AdminInbox() {
  await requireAdmin();
  const rows = await getInbox();
  return (
    <>
      <PageHeader title="Wiadomości" sub="Rozmowy partnerów z opiekunami. Nieprzeczytane są na górze." />
      {rows.length === 0 ? <p className="rounded-2xl border border-dashed border-line bg-white/60 px-5 py-10 text-center text-sm text-muted">Brak rozmów. Rozmowę możesz też zacząć z widoku partnera.</p> : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {rows.map((r) => (
            <li key={r.partnerId}>
              <Link href={`/admin/wiadomosci/${r.partnerId}`} className="flex items-center gap-3 px-4 py-3 hover:bg-cream/60" data-testid="inbox-row">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-leather-dark">{r.firstName} {r.lastName} <span className="tabular text-xs font-medium text-muted">{partnerId(r.number)}</span></p>
                  <p className="truncate text-sm text-muted">{r.last}</p>
                </div>
                {r.unread > 0 && <Badge tone="danger">{r.unread} nowe</Badge>}
                <time className="shrink-0 text-xs text-muted">{timeAgo(r.lastAt)}</time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
