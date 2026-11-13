"use client";

import { Check, Copy, Mail, MessageCircle, Share2 } from "lucide-react";
import { useActionState, useEffect, useRef, useState, useSyncExternalStore, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";
import { btn, btnSm, type BtnVariant } from "./ui";

export type FormState = { error?: string; ok?: string; fieldErrors?: Record<string, string> } | null;

export function SubmitButton({ children, variant = "primary", small, className, ...p }: ComponentProps<"button"> & { variant?: BtnVariant; small?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" {...p} disabled={pending || p.disabled} aria-busy={pending} className={(small ? btnSm : btn)(variant, className)}>
      {pending ? "Chwileczkę…" : children}
    </button>
  );
}

const TOAST = "pp-toast";
type Toast = { tone: "ok" | "error"; text: string; id: number };

/**
 * Komunikaty po akcjach. Żyją poza formularzem — potwierdzenie nie znika,
 * gdy po zapisie widok się odświeży i formularz przestanie istnieć (np. po potwierdzeniu sprzedaży).
 */
export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    const on = (e: Event) => {
      const t = (e as CustomEvent<Toast>).detail;
      setToasts((list) => [...list.slice(-2), t]);
      setTimeout(() => setToasts((list) => list.filter((x) => x.id !== t.id)), t.tone === "ok" ? 6000 : 12000);
    };
    window.addEventListener(TOAST, on);
    return () => window.removeEventListener(TOAST, on);
  }, []);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6">
      {toasts.map((t) => (
        <p key={t.id} role={t.tone === "error" ? "alert" : "status"}
          className={cn("rise pointer-events-auto max-w-md rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg", t.tone === "ok" ? "bg-leather-dark text-white" : "bg-danger text-white")}>
          {t.text}
        </p>
      ))}
    </div>
  );
}

/** Formularz z akcją serwerową i komunikatem zwrotnym. */
export function ActionForm({ action, children, className, resetOnOk, confirm }: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  children: ReactNode; className?: string; resetOnOk?: boolean; confirm?: string;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(async (prev: FormState, fd: FormData) => {
    const res = await action(prev, fd);
    const text = res?.ok ?? res?.error;
    if (text) window.dispatchEvent(new CustomEvent<Toast>(TOAST, { detail: { tone: res?.ok ? "ok" : "error", text, id: Date.now() + Math.random() } }));
    if (res?.ok && resetOnOk) ref.current?.reset();
    return res;
  }, null);
  return (
    <form ref={ref} action={formAction} className={className}
      onSubmit={confirm ? (e) => { if (!window.confirm(confirm)) e.preventDefault(); } : undefined}>
      {children}
      {state?.error && <p className="mt-2 rounded-xl bg-danger-bg px-3 py-2 text-sm font-medium text-danger">{state.error}</p>}
    </form>
  );
}

async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* starsze przeglądarki */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand("copy"); ta.remove(); return ok;
  } catch { return false; }
}

export function CopyButton({ text, label, copiedLabel = "Skopiowano", variant = "primary", small, className, testId }: {
  text: string; label: string; copiedLabel?: string; variant?: BtnVariant; small?: boolean; className?: string; testId?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button" data-testid={testId} data-copy={text}
      onClick={async () => { if (await copyText(text)) { setCopied(true); setTimeout(() => setCopied(false), 2200); } }}
      className={(small ? btnSm : btn)(copied ? "gold" : variant, className)}>
      {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </button>
  );
}

/** WhatsApp, e-mail i natywne menu udostępniania telefonu. */
export function ShareRow({ url, text, title }: { url: string; text: string; title: string }) {
  const canShare = useSyncExternalStore(() => () => {}, () => !!navigator.share, () => false);
  const message = `${text} ${url}`.trim();
  const item = "inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-sm font-semibold text-leather-dark hover:bg-sand";
  return (
    <div className="flex flex-wrap gap-2">
      <a className={item} href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="size-4" aria-hidden />
        WhatsApp
      </a>
      <a className={item} href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(message)}`}>
        <Mail className="size-4" aria-hidden /> E-mail
      </a>
      {canShare && (
        <button type="button" className={item} onClick={() => navigator.share({ title, text, url }).catch(() => {})}>
          <Share2 className="size-4" aria-hidden /> Udostępnij
        </button>
      )}
      <CopyButton small variant="secondary" text={message} label="Kopiuj z tekstem" className="min-h-10" />
    </div>
  );
}

export function Tabs({ tabs, initial = 0 }: { tabs: { id: string; label: ReactNode; content: ReactNode }[]; initial?: number }) {
  const [active, setActive] = useState(initial);
  return (
    <div>
      <div role="tablist" className="flex gap-1 rounded-full bg-sand p-1">
        {tabs.map((t, i) => (
          <button key={t.id} role="tab" type="button" id={`tab-${t.id}`} aria-selected={i === active} aria-controls={`panel-${t.id}`}
            onClick={() => setActive(i)}
            className={cn("min-h-10 flex-1 rounded-full px-2 text-sm font-bold transition-colors", i === active ? "bg-white text-leather-dark shadow-sm" : "text-muted hover:text-ink")}>
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div key={t.id} role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} hidden={i !== active} className="pt-4">{t.content}</div>
      ))}
    </div>
  );
}
