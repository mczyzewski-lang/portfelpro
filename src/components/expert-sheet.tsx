"use client";

import { X } from "lucide-react";
import { useRef, type ReactNode } from "react";
import type { Expert } from "@/lib/expert";
import { cn } from "@/lib/cn";

/** Dotknięcie eksperta otwiera arkusz z większym zdjęciem i krótkim opisem. */
export function ExpertSheet({ expert, children, className }: { expert: Expert; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const initials = expert.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} aria-label={`Więcej o ekspercie: ${expert.name}`} className={cn("press w-full text-left", className)} data-testid="expert-open">{children}</button>
      <dialog ref={ref} onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}
        className="m-0 mt-auto max-h-[88dvh] w-full max-w-none overflow-y-auto rounded-t-3xl bg-cream p-0 text-ink sm:m-auto sm:max-w-lg sm:rounded-3xl" data-testid="expert-sheet">
        <div className="flex justify-end px-3 pt-3"><button type="button" onClick={() => ref.current?.close()} aria-label="Zamknij" className="grid size-10 place-items-center rounded-full hover:bg-sand"><X className="size-5" /></button></div>
        <div className="px-6 pb-8 text-center">
          {expert.photoUrl
            // eslint-disable-next-line @next/next/no-img-element -- zdjęcie eksperta ustawiane w panelu
            ? <img src={expert.photoUrl} alt="" width={128} height={128} className="mx-auto size-32 rounded-full object-cover shadow-(--shadow-wallet) ring-4 ring-gold-light" />
            : <span aria-hidden className="gold-grad mx-auto grid size-32 place-items-center rounded-full text-4xl font-extrabold">{initials}</span>}
          <p className="mt-4 text-2xl font-extrabold leading-tight text-leather-dark">{expert.name}</p>
          {expert.title && <p className="mt-0.5 text-sm font-semibold text-gold-deep">{expert.title}</p>}
          {expert.bio
            ? <p className="mx-auto mt-4 max-w-sm whitespace-pre-line text-left text-[15px] leading-relaxed text-ink/90">{expert.bio}</p>
            : <p className="mt-4 text-sm text-muted">Opis eksperta pojawi się wkrótce.</p>}
        </div>
      </dialog>
    </>
  );
}
