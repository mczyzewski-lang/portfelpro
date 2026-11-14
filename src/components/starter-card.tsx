"use client";

import { Check, Lock, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useRef, useState } from "react";
import { confirmStarterAction, markStarterVideoSeenAction, removeAvatarAction, saveAvatarAction } from "@/app/actions/partner";
import { AvatarEditor } from "./avatar";
import type { FormState } from "./client";
import { toast } from "./client";
import { ConfettiBurst } from "./confetti";
import type { StarTier } from "@/lib/gamification";
import { ReelPlayer } from "./reel";
import { StarMark } from "./star";

/**
 * „Wiszące” okienko na pulpicie: potwierdzenie odbioru pakietu startowego.
 * Krok 1 — zdjęcie profilowe, krok 2 — kod z przesyłki. Po poprawnym kodzie gwiazdka leci do awatara w nagłówku.
 */
export function StarterCard({ hasPhoto, avatarSrc, initials, tier, tierName, melt = 0, videoUrl, confirmed: confirmedInitially }: {
  hasPhoto: boolean; avatarSrc: string | null; initials: string; tier: StarTier; tierName: string; melt?: number;
  /** nagranie odblokowywane poprawnym kodem; null = brak kroku z nagraniem */
  videoUrl: string | null; confirmed: boolean;
}) {
  const [confirmed, setConfirmed] = useState(confirmedInitially);
  const [watched, setWatched] = useState(false);
  const [burst, setBurst] = useState(false);
  const codeReady = hasPhoto && !confirmed;
  const active = !hasPhoto ? 1 : !confirmed ? 2 : 3; // krok do wykonania teraz — pulsuje i ma znacznik
  const now = <span className="gold-grad now-badge ml-auto rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide">Teraz</span>;
  const router = useRouter();
  const star = useRef<HTMLSpanElement>(null);
  const [done, setDone] = useState(false);
  const [hidden, setHidden] = useState(false);

  /** Gwiazdka zmniejsza się i leci do awatara w prawym górnym rogu. */
  const fly = async () => {
    const from = star.current?.getBoundingClientRect();
    const to = document.querySelector("[data-avatar-target]")?.getBoundingClientRect();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!from || !to || reduced || !star.current) return;
    // Leci kopia przypięta do ekranu (nad nagłówkiem), oryginał w karcie znika.
    const clone = star.current.cloneNode(true) as HTMLElement;
    Object.assign(clone.style, { position: "fixed", left: `${from.left}px`, top: `${from.top}px`, zIndex: "80", pointerEvents: "none", margin: "0" });
    document.body.appendChild(clone);
    star.current.style.visibility = "hidden";
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    await clone.animate([
      { transform: "translate(0,0) scale(1) rotate(0deg)", offset: 0 },
      { transform: `translate(${dx * 0.2}px, ${dy * 0.1 + 30}px) scale(1.5) rotate(140deg)`, offset: 0.35 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.3) rotate(540deg)`, offset: 1 },
    ], { duration: 1100, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" }).finished.catch(() => {});
    clone.remove();
    const target = document.querySelector<HTMLElement>("[data-avatar-target]");
    target?.animate([{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(1)" }], { duration: 450, easing: "ease-out" });
  };

  const [state, action, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const res = await confirmStarterAction(prev, fd);
    if (res?.ok) {
      await fly();
      setConfirmed(true); setBurst(true); toast(res.ok);
      if (!videoUrl) { setDone(true); setHidden(true); } // bez nagrania okienko znika od razu
      router.refresh();
    }
    return res;
  }, null);

  if (hidden) return done ? <ConfettiBurst /> : null;
  const confetti = burst ? <ConfettiBurst /> : null;
  const step = (n: number, ok: boolean) => (
    <span className={ok ? "success-grad grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold" : "grid size-6 shrink-0 place-items-center rounded-full bg-sand text-xs font-bold text-leather-dark"}>
      {ok ? <Check className="size-3.5" aria-hidden /> : n}
    </span>
  );

  return (
    <>{confetti}
    {/* brązowy pas tła strony na całą szerokość — jasne okienko leży na nim */}
    <div className="leather-band -mx-5 -mt-4 rounded-b-[32px] px-5 pb-6 pt-5 sm:mx-0 sm:mt-0 sm:rounded-[32px]" data-testid="starter-band">
    <section className="rise relative rounded-3xl bg-white p-4 shadow-[0_20px_44px_-18px_rgba(0,0,0,0.6)]" aria-labelledby="starter-h" data-testid="starter-card">
      <div className="flex items-start gap-3">
        <span ref={star} className="relative block shrink-0" data-testid="starter-star"><StarMark size={56} tier={tier} melt={melt} /></span>
        <div>
          <h2 id="starter-h" className="font-extrabold leading-snug text-leather-dark">Potwierdzenie odbioru pakietu startowego</h2>
          <p className="mt-0.5 text-[13px] leading-snug text-muted">{videoUrl ? "Trzy kroki" : "Dwa kroki"}: po kodzie Twoja pierwsza gwiazda — <b className="text-leather-dark">{tierName}</b> — trafia do profilu.</p>
        </div>
      </div>

      <div className="mt-3.5 rounded-2xl bg-cream/70 p-3" data-testid="starter-photo-step">
        <p className="mb-2 flex items-center gap-2 text-sm font-bold text-leather-dark">{step(1, hasPhoto)}<span className={active === 1 ? "step-now" : undefined} data-active={active === 1}>Dodaj swoje zdjęcie</span>{active === 1 && now}</p>
        <AvatarEditor light src={avatarSrc} initials={initials} onSave={saveAvatarAction} onRemove={removeAvatarAction} />
      </div>

      <form action={action} className="mt-2.5 rounded-2xl bg-cream/70 p-3">
        <p className="mb-2 flex items-center gap-2 text-sm font-bold text-leather-dark">{step(2, confirmed)}<span className={active === 2 ? "step-now" : undefined} data-active={active === 2}>Wpisz kod z karty w pakiecie</span>{active === 2 && now}</p>
        <div className="flex gap-2">
          <input name="code" required disabled={!codeReady} autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={14} placeholder="KOD" aria-label="Kod z pakietu startowego"
            className="tabular min-h-12 min-w-0 flex-1 rounded-2xl border border-line bg-white px-4 text-center text-lg font-extrabold uppercase tracking-[0.3em] text-leather-dark placeholder:tracking-[0.2em] placeholder:text-muted/50 focus:border-leather focus:outline-none focus:ring-2 focus:ring-leather/20 disabled:opacity-50" />
          <button disabled={pending || !codeReady} className="leather-grad press min-h-12 shrink-0 rounded-2xl px-5 font-bold disabled:opacity-50" data-testid="starter-submit">{pending ? "…" : "Potwierdź"}</button>
        </div>
        {!hasPhoto && !confirmed && <p className="mt-2 text-xs text-muted">Najpierw dodaj zdjęcie — potem odblokuje się pole kodu.</p>}
        {confirmed && <p className="mt-2 text-xs font-semibold text-ok">Kod potwierdzony.</p>}
        {state?.error && <p role="alert" className="mt-2 rounded-xl bg-danger-bg px-3 py-2 text-sm font-medium text-danger">{state.error}</p>}
      </form>
      {videoUrl && confirmed && (
        <div className="mt-2.5 rounded-2xl bg-cream/70 p-3" data-testid="starter-video-step">
          <p className="mb-2 flex items-center gap-2 text-sm font-bold text-leather-dark">{step(3, watched)}<span className={active === 3 ? "step-now" : undefined} data-active={active === 3}>Obejrzyj krótkie nagranie</span>{active === 3 && now}</p>
          <ReelPlayer src={videoUrl} title="Pakiet startowy — co dalej" testId="starter-video" onOpen={() => { setWatched(true); void markStarterVideoSeenAction(); }} onClose={() => { setHidden(true); router.refresh(); }}
            className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-gold bg-white px-3 text-left ring-2 ring-gold-light/60">
            <span className="gold-grad grid size-9 shrink-0 place-items-center rounded-full"><Play className="size-4 translate-x-px fill-current" aria-hidden /></span>
            <span className="text-sm font-bold text-leather-dark">{watched ? "Obejrzyj ponownie" : "Odtwórz nagranie"}<span className="block text-xs font-medium text-muted">Pół minuty na cały ekran</span></span>
          </ReelPlayer>
        </div>
      )}

      {videoUrl && !confirmed && (
        <div className="mt-2.5 rounded-2xl bg-cream/70 p-3 opacity-60" data-testid="starter-video-locked">
          <p className="flex items-center gap-2 text-sm font-bold text-leather-dark">{step(3, false)}Obejrzyj krótkie nagranie<Lock className="ml-auto size-4 text-muted" aria-hidden /></p>
          <p className="mt-1 pl-8 text-xs text-muted">Odblokuje się po wpisaniu kodu.</p>
        </div>
      )}
    </section>
    </div></>
  );
}
