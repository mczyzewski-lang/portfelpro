"use client";

import { Check, ChevronDown, CircleEllipsis } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { ProfessionIcon } from "./profession-icon";

type P = { slug: string; name: string; icon: string };

/** Lista rozwijana branży: zawsze widać wybraną pozycję z ikoną; „Inne” na końcu. Wybór zapisuje się od razu. */
export function ProfessionSelect({ professions, value, autoSubmit = false, placeholder }: {
  professions: P[]; value: string | null;
  /** zapis od razu po wyborze — z pytaniem o potwierdzenie zmiany */
  autoSubmit?: boolean; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(value ?? "");
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const options: (P | null)[] = [...professions, null]; // null = „Inne”
  const current = professions.find((p) => p.slug === sel);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", close); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", esc); };
  }, [open]);

  const [touched, setTouched] = useState(false);
  const nameOf = (slug: string) => professions.find((p) => p.slug === slug)?.name ?? "Inne";
  const choose = (slug: string) => {
    setOpen(false);
    if (slug === sel && (touched || !placeholder)) return;
    if (autoSubmit && !window.confirm(`Zmienić branżę z „${nameOf(sel)}” na „${nameOf(slug)}”? Od tego zależą usługi oznaczone „dla Ciebie”.`)) return;
    setSel(slug); setTouched(true);
    if (input.current) { input.current.value = slug; if (autoSubmit) input.current.form?.requestSubmit(); }
  };
  const empty = !!placeholder && !touched && !value;
  const icon = (p: P | null | undefined) => (
    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sand text-leather">
      {p ? <ProfessionIcon name={p.icon} className="size-[18px]" /> : <CircleEllipsis className="size-[18px]" aria-hidden />}
    </span>
  );

  return (
    <div ref={root} className="relative" data-testid="profession-select">
      <input ref={input} type="hidden" name="profession" defaultValue={sel} />
      <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((v) => !v)}
        className="press flex min-h-14 w-full items-center gap-3 rounded-2xl border border-leather/40 bg-cream px-3.5 text-left text-[15px] font-bold text-leather-dark ring-2 ring-leather/10">
        {!empty && icon(current)}<span className={cn("min-w-0 flex-1 truncate", empty && "font-medium text-muted")}>{empty ? placeholder : current?.name ?? "Inne"}</span>
        <ChevronDown className={cn("size-5 shrink-0 text-muted transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <ul role="listbox" aria-label="Czym się zajmujesz" className="rise absolute inset-x-0 top-[calc(100%+6px)] z-30 max-h-[52dvh] overflow-y-auto rounded-2xl border border-line bg-white p-1.5 shadow-[0_18px_40px_-12px_rgba(50,27,18,0.35)]">
          {options.map((p) => {
            const slug = p?.slug ?? ""; const on = slug === sel && !empty;
            return (
              <li key={slug || "inne"} role="option" aria-selected={on}>
                <button type="button" onClick={() => choose(slug)} className={cn("flex min-h-12 w-full items-center gap-3 rounded-xl px-2.5 text-left text-[14px] font-semibold", on ? "bg-cream text-leather-dark" : "text-ink hover:bg-sand/60")}>
                  {icon(p)}<span className="flex-1">{p?.name ?? "Inne"}</span>{on && <Check className="size-4 text-ok" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
