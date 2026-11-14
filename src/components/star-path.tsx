"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { StarTier } from "@/lib/gamification";
import { StarImage } from "./star-3d";

export type StarStep = { tier: StarTier; name: string; requirement: string; short: string; reached: boolean; current: boolean; melt: number };

/** Rząd gwiazd w karcie poziomu. Dotknięcie gwiazdy pokazuje dymek: co trzeba zrobić, żeby ją zdobyć. */
export function StarPath({ steps }: { steps: StarStep[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const tip = open != null ? steps[open] : null;
  return (
    <div className="relative z-10 mt-4 border-t border-white/15 pt-4" data-testid="star-path">
      <ol className="grid grid-cols-5 items-end gap-1">
        {steps.map((s, i) => (
          <li key={s.tier} data-reached={s.reached} aria-current={s.current ? "step" : undefined} className="flex justify-center">
            <button type="button" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} aria-label={`${s.name}: ${s.requirement}`} data-testid={`star-${s.tier}`}
              className={cn("press flex w-full flex-col items-center rounded-2xl px-0.5 pb-1.5 pt-2 text-center",
                s.current ? "-translate-y-1.5 bg-white/15 shadow-[0_10px_24px_-10px_rgba(0,0,0,0.7)] ring-2 ring-gold-light" : open === i && "bg-white/10")}>
              <span className={cn("grid place-items-center", s.current && "drop-shadow-[0_0_10px_rgba(225,189,106,0.75)]")}>
                <StarImage tier={s.tier} size={s.current ? 54 : 40} dimmed={!s.reached} melt={s.melt} />
              </span>
              <span className={cn("mt-1 font-extrabold leading-tight", s.current ? "text-[12px] text-gold-light" : s.reached ? "text-[11px] text-white" : "text-[11px] text-white/55")}>{s.name}</span>
              <span className={cn("tabular text-[10px] leading-tight", s.current ? "text-white/85" : "text-white/50")}>{s.current ? "Tu jesteś" : s.short}</span>
            </button>
          </li>
        ))}
      </ol>
      {tip && (
        <div role="tooltip" className="rise relative mt-3 rounded-2xl bg-white px-3.5 py-2.5 text-left text-[13px] leading-snug text-ink shadow-lg" data-testid="star-tip">
          <span aria-hidden className="absolute -top-1.5 size-3 rotate-45 bg-white" style={{ left: `calc(${(open! + 0.5) * 20}% - 6px)` }} />
          <b className="text-leather-dark">{tip.name}</b> — {tip.reached ? (tip.current ? "to Twoja obecna gwiazda. " : "już zdobyta. ") : ""}{tip.requirement}
        </div>
      )}
    </div>
  );
}
