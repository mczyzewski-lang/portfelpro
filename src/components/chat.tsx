"use client";

import { Check, CheckCheck, SendHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import type { FormState } from "./client";

export type ChatItem = { id: string; mine: boolean; body: string; at: string; day: string; author: string | null; read: boolean };

/**
 * Wątek rozmowy z polem wysyłki. Odświeża się co kilka sekund, gdy karta jest widoczna.
 * variant "page": rozmowa na całą stronę, bez ramek, z polem pisania przypiętym nad dolną nawigacją.
 */
export function Chat({ items, action, hidden, emptyText, placeholder = "Napisz wiadomość…", variant = "card" }: {
  items: ChatItem[]; action: (prev: FormState, fd: FormData) => Promise<FormState>;
  hidden?: Record<string, string>; emptyText: string; placeholder?: string; variant?: "card" | "page";
}) {
  const page = variant === "page";
  const router = useRouter();
  const end = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const res = await action(prev, fd);
    if (!res?.error) form.current?.reset();
    return res;
  }, null);

  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, 8000);
    return () => clearInterval(t);
  }, [router]);
  useEffect(() => {
    if (page) window.scrollTo({ top: document.documentElement.scrollHeight });
    else end.current?.scrollIntoView({ block: "end" });
  }, [items.length, page]);

  return (
    <div className={page ? undefined : "overflow-hidden rounded-3xl border border-line bg-white shadow-(--shadow-card)"}>
      <div className={page ? "space-y-1.5 pb-24 pt-3" : "max-h-[52dvh] min-h-48 space-y-1.5 overflow-y-auto px-3.5 py-4"} data-testid="chat-thread" aria-live="polite">
        {items.length === 0 && <p className="px-4 py-10 text-center text-sm text-muted">{emptyText}</p>}
        {items.map((m, i) => (
          <div key={m.id}>
            {(i === 0 || items[i - 1].day !== m.day) && <p className="py-2 text-center text-[11px] font-semibold text-muted">{m.day}</p>}
            <div className={cn("flex", m.mine ? "justify-end" : "justify-start")}>
              <div className={cn("rise max-w-[82%] rounded-[20px] px-3.5 py-2 text-[15px] leading-snug",
                m.mine ? "rounded-br-md bg-leather text-white" : page ? "rounded-bl-md bg-white text-ink shadow-(--shadow-card)" : "rounded-bl-md bg-sand text-ink")}>
                {!m.mine && m.author && <p className="text-[11px] font-bold text-gold-deep">{m.author}</p>}
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={cn("mt-0.5 flex items-center justify-end gap-1 text-[10px]", m.mine ? "text-white/70" : "text-muted")}>
                  {m.at}{m.mine && (m.read ? <CheckCheck className="size-3" aria-label="Przeczytane" /> : <Check className="size-3" aria-label="Wysłane" />)}
                </p>
              </div>
            </div>
          </div>
        ))}
        <div ref={end} />
      </div>
      <form ref={form} action={formAction} className={page
        ? "fixed inset-x-0 bottom-[calc(4.9rem+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-2xl items-end gap-2 bg-cream/90 px-4 py-2 backdrop-blur lg:bottom-0 lg:pb-4"
        : "flex items-end gap-2 border-t border-line bg-cream/60 p-2.5"}>
        {Object.entries(hidden ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        <textarea name="body" rows={1} required maxLength={2000} placeholder={placeholder} aria-label="Treść wiadomości"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia("(pointer: fine)").matches) { e.preventDefault(); form.current?.requestSubmit(); } }}
          className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-line bg-white px-3.5 py-2.5 text-base shadow-(--shadow-card) focus:border-leather focus:outline-none focus:ring-2 focus:ring-leather/20" />
        <button type="submit" disabled={pending} aria-label="Wyślij" data-testid="chat-send" className="leather-grad press grid size-11 shrink-0 place-items-center rounded-full disabled:opacity-50"><SendHorizontal className="size-5" aria-hidden /></button>
      </form>
      {state?.error && <p role="alert" className={page ? "fixed inset-x-4 bottom-40 z-30 mx-auto max-w-md rounded-xl bg-danger-bg px-4 py-2 text-sm font-medium text-danger" : "bg-danger-bg px-4 py-2 text-sm font-medium text-danger"}>{state.error}</p>}
    </div>
  );
}
