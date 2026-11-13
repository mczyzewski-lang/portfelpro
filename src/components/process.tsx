import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { PROCESS_STEPS } from "@/lib/labels";

/** Pasek procesu polecenia: Zgłoszenie → Kontakt → Kwalifikacja → Realizacja → Sprzedaż. */
export function ProcessBar({ status, reached, labels = false }: { status: string; reached?: Set<string>; labels?: boolean }) {
  const closed = status === "rejected" || status === "cancelled";
  const currentIdx = PROCESS_STEPS.findIndex((s) => s.status === status);
  // Bez historii zakładamy, że wcześniejsze kroki zostały zaliczone (np. sprzedaż z pominięciem etapów).
  const done = (i: number) => (reached ? reached.has(PROCESS_STEPS[i].status) || i < currentIdx : i <= currentIdx);
  return (
    <ol className="flex items-start" aria-label="Etap procesu">
      {PROCESS_STEPS.map((s, i) => {
        const isDone = done(i); const isCurrent = !closed && i === currentIdx;
        return (
          <li key={s.status} className="flex flex-1 flex-col items-center" aria-current={isCurrent ? "step" : undefined}>
            <div className="flex w-full items-center">
              <span className={cn("h-[3px] flex-1 rounded-full", i === 0 ? "opacity-0" : isDone ? (closed ? "bg-muted/40" : "bg-gold") : "bg-line")} />
              <span className={cn("grid shrink-0 place-items-center rounded-full", labels ? "size-6" : "size-3.5",
                isDone ? (closed ? "bg-muted/50 text-white" : "bg-leather text-white") : "bg-line", isCurrent && "ring-4 ring-gold-light/60")}>
                {labels && isDone && <Check className="size-3.5" aria-hidden />}
              </span>
              <span className={cn("h-[3px] flex-1 rounded-full", i === PROCESS_STEPS.length - 1 ? "opacity-0" : done(i + 1) ? (closed ? "bg-muted/40" : "bg-gold") : "bg-line")} />
            </div>
            {labels
              ? <span className={cn("mt-1.5 text-center text-[11px] font-bold leading-tight", isCurrent ? "text-leather-dark" : isDone ? "text-ink/70" : "text-muted/70")}>{s.label}</span>
              : <span className="sr-only">{s.label}{isDone ? " — zaliczone" : ""}</span>}
          </li>
        );
      })}
    </ol>
  );
}
