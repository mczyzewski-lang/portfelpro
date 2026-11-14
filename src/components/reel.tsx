"use client";

import { Play, X } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Pionowe wideo 9:16 na cały ekran (jak reels). `children` to element, który je otwiera.
 * Odtwarzanie startuje po otwarciu i zatrzymuje się po zamknięciu.
 */
export function ReelPlayer({ src, poster, title, children, className, testId, onOpen, onClose }: {
  src: string; poster?: string | null; title: string; children: ReactNode; className?: string; testId?: string; onOpen?: () => void; onClose?: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const open = () => { dialog.current?.showModal(); video.current?.play().catch(() => {}); onOpen?.(); };
  const close = () => { video.current?.pause(); dialog.current?.close(); };
  return (
    <>
      <button type="button" onClick={open} aria-label={`Odtwórz wideo: ${title}`} className={cn("press", className)} data-testid={testId}>{children}</button>
      <dialog ref={dialog} onClose={() => { video.current?.pause(); onClose?.(); }} onClick={(e) => { if (e.target === dialog.current) close(); }}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-black p-0 backdrop:bg-black" data-testid="reel-dialog">
        <div className="relative mx-auto flex h-full max-w-[calc(100dvh*9/16)] items-center justify-center">
          <video ref={video} src={src} poster={poster ?? undefined} controls playsInline preload="metadata" className="aspect-[9/16] max-h-full w-full bg-black object-contain" data-testid="reel-video">
            <track kind="captions" />
          </video>
          <p className="pointer-events-none absolute inset-x-0 top-0 bg-linear-to-b from-black/70 to-transparent px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))] pr-16 text-sm font-bold text-white">{title}</p>
          <button type="button" onClick={close} aria-label="Zamknij wideo" className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] grid size-11 place-items-center rounded-full bg-white/20 text-white backdrop-blur"><X className="size-6" /></button>
        </div>
      </dialog>
    </>
  );
}

/** Kafelek „reels” w karcie usługi: pionowa okładka z przyciskiem odtwarzania. */
export function ReelTile({ src, poster, title, caption }: { src: string; poster?: string | null; title: string; caption: string }) {
  return (
    <ReelPlayer src={src} poster={poster} title={title} testId="service-reel" className="group flex w-full items-center gap-4 rounded-3xl border border-line bg-white p-3 text-left shadow-(--shadow-card)">
      <span className="wallet relative block aspect-[9/16] w-[84px] shrink-0 overflow-hidden rounded-2xl !shadow-none">
        {/* eslint-disable-next-line @next/next/no-img-element -- okładka wideo ustawiana w panelu */}
        {poster && <img src={poster} alt="" className="absolute inset-0 size-full object-cover" />}
        <span className="absolute inset-0 grid place-items-center bg-black/20"><span className="gold-grad grid size-10 place-items-center rounded-full"><Play className="size-5 translate-x-px fill-current" aria-hidden /></span></span>
      </span>
      <span className="min-w-0">
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-gold-deep">Wideo · 9:16</span>
        <span className="mt-0.5 block text-[17px] font-extrabold leading-snug text-leather-dark">Zobacz usługę w minutę</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-muted">{caption}</span>
      </span>
    </ReelPlayer>
  );
}
