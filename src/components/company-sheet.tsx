"use client";

import { ExternalLink, Play, X } from "lucide-react";
import { useRef, type ReactNode } from "react";
import type { CompanyInfo } from "@/lib/company";
import { cn } from "@/lib/cn";
import { GoogleRating } from "./google";
import { ReelPlayer } from "./reel";
import { CompanyIcon } from "./ui";

/** Dotknięcie nazwy lub ikony firmy otwiera arkusz: kim jest firma, ocena w Google, strona www i referencje wideo. */
export function CompanySheet({ company, children, className }: { company: CompanyInfo; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} aria-label={`Więcej o firmie ${company.name}`} className={cn("press text-left", className)} data-testid="company-open">{children}</button>
      <dialog ref={ref} onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}
        className="m-0 mt-auto max-h-[88dvh] w-full max-w-none overflow-y-auto rounded-t-3xl bg-cream p-0 text-ink sm:m-auto sm:max-w-lg sm:rounded-3xl" data-testid="company-sheet">
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-white px-5 py-3">
          <CompanyIcon name={company.name} color={company.color} iconUrl={company.iconUrl} size={40} />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-extrabold leading-tight text-leather-dark">{company.name}</p>
            {company.tagline && <p className="truncate text-xs text-muted">{company.tagline}</p>}
          </div>
          <button type="button" onClick={() => ref.current?.close()} aria-label="Zamknij" className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-sand"><X className="size-5" /></button>
        </div>
        <div className="space-y-5 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <GoogleRating rating={company.googleRating} reviews={company.googleReviews} url={company.googleUrl} className="rounded-full bg-white px-3 py-1.5 ring-1 ring-line" />
            {company.website && <a href={company.website} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white px-3 text-[13px] font-bold text-leather ring-1 ring-line">{company.website.replace(/^https?:\/\//, "")}<ExternalLink className="size-3.5" aria-hidden /></a>}
          </div>
          {company.description && <p className="text-[15px] leading-relaxed text-ink/90">{company.description}</p>}
          {company.videos.length > 0 && (
            <section>
              <h3 className="text-[17px] font-extrabold text-leather-dark">Referencje wideo</h3>
              <ul className="no-scrollbar -mx-5 mt-2.5 flex gap-3 overflow-x-auto px-5 pb-1">
                {company.videos.map((v) => (
                  <li key={v.url + v.title} className="w-[130px] shrink-0">
                    <ReelPlayer src={v.url} title={`${company.name} — ${v.title}`} testId="company-video" className="block w-full text-left">
                      <span className="leather-band relative grid aspect-[9/16] w-full place-items-center overflow-hidden rounded-2xl"><span className="gold-grad grid size-11 place-items-center rounded-full"><Play className="size-5 translate-x-px fill-current" aria-hidden /></span></span>
                      <span className="mt-1.5 block text-[13px] font-semibold leading-snug text-leather-dark">{v.title}</span>
                    </ReelPlayer>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </dialog>
    </>
  );
}
