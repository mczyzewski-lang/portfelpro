import { CircleEllipsis } from "lucide-react";
import type { Profession } from "@/db/schema";
import { ProfessionIcon } from "./profession-icon";

const tile = "press flex min-h-[52px] cursor-pointer items-center gap-3 rounded-2xl border border-line bg-white px-3.5 text-[14px] font-semibold leading-tight text-ink has-checked:border-leather has-checked:bg-cream has-checked:ring-2 has-checked:ring-leather/15";
const ico = "grid size-9 shrink-0 place-items-center rounded-xl bg-sand text-leather";

/** Wybór branży: kafelki z ikonami, „Inne” zawsze na końcu. Używany w onboardingu i w koncie. */
export function ProfessionPicker({ professions, value }: { professions: Profession[]; value: string | null }) {
  return (
    <div role="radiogroup" aria-label="Czym się zajmujesz" className="grid gap-2 sm:grid-cols-2">
      {professions.map((p) => (
        <label key={p.slug} className={tile}>
          <input type="radio" name="profession" value={p.slug} defaultChecked={value === p.slug} className="sr-only" />
          <span className={ico}><ProfessionIcon name={p.icon} className="size-[18px]" /></span>{p.name}
        </label>
      ))}
      <label className={tile}>
        <input type="radio" name="profession" value="" defaultChecked={!value} className="sr-only" />
        <span className={ico}><CircleEllipsis className="size-[18px]" aria-hidden /></span>Inne
      </label>
    </div>
  );
}
