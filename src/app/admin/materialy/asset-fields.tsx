import { textareaCls } from "@/components/admin";
import { Field, inputCls } from "@/components/ui";
import type { ContentAsset } from "@/db/schema";
import { assetTypeLabel, publishLabel, stageLabel } from "@/lib/labels";

export function AssetFields({ a }: { a?: ContentAsset }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Tytuł" className="sm:col-span-2"><input name="title" defaultValue={a?.title} required className={inputCls} /></Field>
      <Field label="Etap lejka"><select name="stage" defaultValue={a?.stage ?? "education"} className={inputCls}>{Object.entries(stageLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
      <Field label="Rodzaj"><select name="type" defaultValue={a?.type ?? "article"} className={inputCls}>{Object.entries(assetTypeLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
      <Field label="Status"><select name="status" defaultValue={a?.status ?? "draft"} className={inputCls}>{Object.entries(publishLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
      <Field label="Kolejność"><input name="sort" type="number" defaultValue={a?.sort ?? 0} className={inputCls} /></Field>
      <Field label="URL docelowy (https://…)" hint="Puste = wewnętrzna strona demonstracyjna. Do adresu dodamy ?pp_ref=<token atrybucji>." className="sm:col-span-2">
        <input name="targetUrl" type="url" defaultValue={a?.targetUrl ?? ""} placeholder="https://" className={inputCls} />
      </Field>
      <Field label="Opis dla partnera" className="sm:col-span-2"><textarea name="description" rows={2} defaultValue={a?.description} className={textareaCls} /></Field>
      <Field label="Gotowy tekst polecający" hint="Partner skopiuje go razem z linkiem." className="sm:col-span-2"><textarea name="shareText" rows={2} defaultValue={a?.shareText} className={textareaCls} /></Field>
      <Field label="Treść strony demo (materiały edukacyjne)" hint="Akapity oddziel pustą linią. Używane tylko, gdy nie podano URL docelowego." className="sm:col-span-2"><textarea name="body" rows={6} defaultValue={a?.body} className={textareaCls} /></Field>
    </div>
  );
}
