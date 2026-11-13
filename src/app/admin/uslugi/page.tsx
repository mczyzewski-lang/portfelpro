import { asc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { createServiceAction } from "@/app/actions/admin";
import { PageHeader, Panel, Table } from "@/components/admin";
import { ActionForm, SubmitButton } from "@/components/client";
import { Rate } from "@/components/rate";
import { PublishBadge } from "@/components/status";
import { Badge, Field, btnSm, inputCls } from "@/components/ui";
import { db } from "@/db";
import { companies, services } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { displayRate } from "@/lib/commission";
import { env } from "@/lib/env";
import { rateStatusLabel } from "@/lib/labels";

export default async function AdminServices() {
  await requireAdmin();
  const rows = await db.select({
    s: services, company: companies.name,
    assets: sql<number>`(select count(*)::int from content_assets a where a.service_id = "services"."id")`,
  }).from(services).innerJoin(companies, eq(companies.id, services.companyId)).orderBy(asc(services.sort), asc(services.name));
  const comps = await db.select().from(companies).orderBy(asc(companies.sort));
  return (
    <>
      <PageHeader title="Usługi i materiały" sub="Treści, stawki, dostęp i materiały polecające — bez zmian w kodzie." />
      <Table head={["Usługa", "Status", "Dostęp", "Prowizja (widok partnera)", "Stawka", "Materiały", ""]}>
        {rows.map(({ s, company, assets }) => (
          <tr key={s.id}>
            <td><Link href={`/admin/uslugi/${s.id}`} className="font-semibold hover:underline">{s.name}</Link><span className="block text-xs text-muted">{company} · {s.category}</span></td>
            <td><PublishBadge status={s.status} /></td>
            <td>{s.access === "open" ? <Badge>Otwarta</Badge> : <Badge tone="warn">Wymaga zatwierdzenia</Badge>}</td>
            <td><Rate rate={displayRate(s, null, env.demoMode)} size="sm" /></td>
            <td className="text-xs">{rateStatusLabel[s.rateStatus]}</td>
            <td className="tabular">{assets}</td>
            <td><Link href={`/admin/uslugi/${s.id}`} className={btnSm()}>Edytuj</Link></td>
          </tr>
        ))}
      </Table>
      <Panel title="Dodaj usługę" className="mt-5">
        <ActionForm action={createServiceAction} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <Field label="Nazwa usługi"><input name="name" required className={inputCls} /></Field>
          <Field label="Spółka"><select name="companyId" className={inputCls}>{comps.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <SubmitButton>Utwórz szkic</SubmitButton>
        </ActionForm>
        <p className="mt-2 text-xs text-muted">Nowa usługa powstaje jako szkic — jest niewidoczna dla partnerów do czasu publikacji.</p>
      </Panel>
    </>
  );
}
