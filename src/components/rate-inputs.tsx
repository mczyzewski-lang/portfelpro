import { modelLabel } from "@/lib/labels";
import { Field, inputCls } from "./ui";

/** Wspólne pola stawki: model + kwota + procent. */
export function RateInputs({ model, amount, bps }: { model?: string | null; amount?: number | null; bps?: number | null }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Field label="Model prowizji">
        <select name="model" defaultValue={model ?? "fixed"} className={inputCls}>
          {Object.entries(modelLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </Field>
      <Field label="Kwota (zł)" hint="Dla stałej kwoty / kwoty za lead"><input name="amount" inputMode="decimal" defaultValue={amount != null ? (amount / 100).toString().replace(".", ",") : ""} className={inputCls} /></Field>
      <Field label="Procent (%)" hint="Dla modelu procentowego"><input name="percent" inputMode="decimal" defaultValue={bps != null ? (bps / 100).toString().replace(".", ",") : ""} className={inputCls} /></Field>
    </div>
  );
}
