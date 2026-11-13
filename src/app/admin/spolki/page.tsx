import { asc } from "drizzle-orm";
import { saveCompanyAction } from "@/app/actions/admin";
import { PageHeader, Panel, textareaCls } from "@/components/admin";
import { ActionForm, SubmitButton } from "@/components/client";
import { Badge, CompanyMark, Field, inputCls } from "@/components/ui";
import { db } from "@/db";
import { companies, type Company } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

function CompanyForm({ c }: { c?: Company }) {
  return (
    <ActionForm action={saveCompanyAction} resetOnOk={!c} className="pb-4">
      <input type="hidden" name="id" value={c?.id ?? ""} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nazwa"><input name="name" defaultValue={c?.name} required className={inputCls} /></Field>
        <Field label="Hasło (tagline)"><input name="tagline" defaultValue={c?.tagline} className={inputCls} /></Field>
        <Field label="Logo (URL https:// lub ścieżka /…)" hint="Puste = znak kolorystyczny z nazwą"><input name="logoUrl" defaultValue={c?.logoUrl ?? ""} className={inputCls} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kolor"><input name="color" type="color" defaultValue={c?.color ?? "#713B20"} className={`${inputCls} p-1`} /></Field>
          <Field label="Kolejność"><input name="sort" type="number" defaultValue={c?.sort ?? 0} className={inputCls} /></Field>
        </div>
        <Field label="Opis" className="sm:col-span-2"><textarea name="description" rows={2} defaultValue={c?.description} className={textareaCls} /></Field>
      </div>
      <label className="mt-3 flex items-center gap-2.5 text-sm font-semibold"><input type="checkbox" name="published" defaultChecked={c?.published ?? true} className="size-4 accent-leather" />Widoczna w katalogu</label>
      <SubmitButton small className="mt-3">{c ? "Zapisz spółkę" : "Dodaj spółkę"}</SubmitButton>
    </ActionForm>
  );
}

export default async function CompaniesPage() {
  await requireAdmin();
  const rows = await db.select().from(companies).orderBy(asc(companies.sort));
  return (
    <>
      <PageHeader title="Spółki" sub="Marki, których usługi są w katalogu." />
      <div className="space-y-2.5">
        {rows.map((c) => (
          <details key={c.id} className="rounded-2xl border border-line bg-white px-4">
            <summary className="flex min-h-14 items-center justify-between gap-3"><CompanyMark name={c.name} color={c.color} logoUrl={c.logoUrl} /><span className="flex items-center gap-2 text-sm text-muted">{c.tagline}{!c.published && <Badge tone="warn">Ukryta</Badge>}</span></summary>
            <CompanyForm c={c} />
          </details>
        ))}
      </div>
      <Panel title="Dodaj spółkę" className="mt-5"><CompanyForm /></Panel>
    </>
  );
}
