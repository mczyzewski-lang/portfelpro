import { desc } from "drizzle-orm";
import { PageHeader, Table } from "@/components/admin";
import { db } from "@/db";
import { adminAuditLogs } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { fmtDateTime } from "@/lib/labels";

export default async function AuditPage() {
  await requireAdmin();
  const rows = await db.select().from(adminAuditLogs).orderBy(desc(adminAuditLogs.createdAt)).limit(300);
  const short = (v: unknown) => (v == null ? "" : JSON.stringify(v).slice(0, 160));
  return (
    <>
      <PageHeader title="Dziennik zmian" sub="Zmiany stawek, statusów, przypisań i rozliczeń wraz z powodami korekt." />
      <Table head={["Kiedy", "Kto", "Akcja", "Obiekt", "Przed → po", "Powód"]}>
        {rows.map((r) => (
          <tr key={r.id}>
            <td className="tabular whitespace-nowrap">{fmtDateTime(r.createdAt)}</td><td className="text-xs">{r.actorLabel}</td>
            <td className="font-semibold">{r.action}</td><td className="text-xs">{r.entity}{r.entityId && <span className="block text-muted">{r.entityId.slice(0, 8)}</span>}</td>
            <td className="max-w-[320px] break-words font-mono text-[11px] text-muted">{short(r.before)}{r.before != null && " → "}{short(r.after)}</td>
            <td className="text-xs">{r.reason ?? ""}</td>
          </tr>
        ))}
        {rows.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted">Brak wpisów.</td></tr>}
      </Table>
    </>
  );
}
