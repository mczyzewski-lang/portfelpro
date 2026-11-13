"use client";

import { Check, CheckCheck, SendHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import type { FormState } from "./client";

export type ChatItem = { id: string; mine: boolean; body: string; at: string; day: string; author: string | null; read: boolean };

/** Wątek rozmowy z polem wysyłki. Odświeża się co kilka sekund, gdy karta jest widoczna. */
export function Chat({ items, action, hidden, emptyText, placeholder = "Napisz wiadomość…" }: {
  items: ChatItem[]; action: (prev: FormState, fd: FormData) => Promise<FormState>;
  hidden?: Record<string, string>; emptyText: string; placeholder?: string;
}) {
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
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [items.length]);

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-(--shadow-card)">
      <div className="max-h-[52dvh] min-h-48 space-y-1.5 overflow-y-auto px-3.5 py-4" data-testid="chat-thread" aria-live="polite">
        {items.length === 0 && <p className="px-4 py-10 text-center text-sm text-muted">{emptyText}</p>}
        {items.map((m, i) => (
          <div key={m.id}>
            {(i === 0 || items[i - 1].day !== m.day) && <p className="py-2 text-center text-[11px] font-semibold text-muted">{m.day}</p>}
            <div className={cn("flex", m.mine ? "justify-end" : "justify-start")}>
              <div className={cn("rise max-w-[82%] rounded-[20px] px-3.5 py-2 text-[15px] leading-snug", m.mine ? "rounded-br-md bg-leather text-white" : "rounded-bl-md bg-sand text-ink")}>
                {!m.mine && m.author && <p className="text-[11px] font-bold text-gold-deep">{m.author}</p>}
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={cn("mt-0.5 flex items-center justify-end gap-1 text-[10px]", m.mine ? "text-white/65" : "text-muted")}>
                  {m.at}{m.mine && (m.read ? <CheckCheck className="size-3" aria-label="Przeczytane" /> : <Check className="size-3" aria-label="Wysłane" />)}
                </p>
              </div>
            </div>
          </div>
        ))}
        <div ref={end} />
      </div>
      <form ref={form} action={formAction} className="flex items-end gap-2 border-t border-line bg-cream/60 p-2.5">
        {Object.entries(hidden ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        <textarea name="body" rows={1} required maxLength={2000} placeholder={placeholder} aria-label="Treść wiadomości"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia("(pointer: fine)").matches) { e.preventDefault(); form.current?.requestSubmit(); } }}
          className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-line bg-white px-3.5 py-2.5 text-base focus:border-leather focus:outline-none focus:ring-2 focus:ring-leather/20" />
        <button type="submit" disabled={pending} aria-label="Wyślij" data-testid="chat-send" className="press grid size-11 shrink-0 place-items-center rounded-full bg-leather text-white disabled:opacity-50"><SendHorizontal className="size-5" aria-hidden /></button>
      </form>
      {state?.error && <p role="alert" className="bg-danger-bg px-4 py-2 text-sm font-medium text-danger">{state.error}</p>}
    </div>
  );
}
