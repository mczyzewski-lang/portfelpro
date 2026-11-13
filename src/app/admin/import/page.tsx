import { importCsvAction } from "@/app/actions/admin";
import { PageHeader, Panel, textareaCls } from "@/components/admin";
import { ActionForm, SubmitButton } from "@/components/client";
import { Field, btnSm, inputCls } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";

const sample = `type;service;external_id;partner_id;name;email;net_amount;status
lead;znak-towarowy;CRM-1001;PP-000101;Jan Kowalski;jan@example.com;;
sale;znak-towarowy;CRM-1001;;;;2500,00;
lead;domy-modulowe;CRM-1002;;Anna Nowak;anna@example.com;;qualified`;

export default async function ImportPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Import / eksport" sub="Import jest idempotentny — ten sam external_id nie utworzy drugiego leada ani drugiej sprzedaży." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Import CSV (leady, statusy, sprzedaż)">
          <ActionForm action={importCsvAction} className="space-y-3">
            <Field label="Plik CSV"><input type="file" name="file" accept=".csv,text/csv" className={`${inputCls} py-2`} /></Field>
            <Field label="…albo wklej dane"><textarea name="csv" rows={6} className={`${textareaCls} font-mono text-xs`} placeholder={sample} /></Field>
            <SubmitButton>Importuj</SubmitButton>
          </ActionForm>
        </Panel>
        <Panel title="Format pliku">
          <ul className="space-y-1.5 text-sm text-ink/85">
            <li><b>type</b> — <code>lead</code> (domyślnie) lub <code>sale</code></li>
            <li><b>service</b> — adres (slug) usługi, np. <code>znak-towarowy</code></li>
            <li><b>external_id</b> — identyfikator w systemie spółki (wymagany)</li>
            <li><b>partner_id</b> — opcjonalnie <code>PP-000101</code> (ręczne przypisanie), <b>ref</b> — token <code>pp_ref</code></li>
            <li><b>name, email, phone</b> — dane kontaktowe (opcjonalne)</li>
            <li><b>net_amount</b> — wartość netto sprzedaży w zł (dla <code>sale</code>)</li>
            <li><b>status</b> — registered / contacted / qualified / in_progress / rejected / cancelled</li>
          </ul>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-cream p-3 text-xs">{sample}</pre>
        </Panel>
        <Panel title="Eksport raportów (CSV)">
          <div className="flex flex-wrap gap-2">
            <a href="/admin/eksport/leady" className={btnSm()}>Leady</a>
            <a href="/admin/eksport/prowizje" className={btnSm()}>Prowizje</a>
            <a href="/admin/eksport/partnerzy" className={btnSm()}>Partnerzy</a>
          </div>
        </Panel>
      </div>
    </>
  );
}
