import { ChevronRight, Ear } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Expert } from "@/lib/expert";
import { ExpertSheet } from "./expert-sheet";

/** Hasło skojarzeniowe nad nazwą usługi: co partner słyszy od klienta. */
export function Hook({ text, onDark = false, className }: { text: string | null | undefined; onDark?: boolean; className?: string }) {
  if (!text) return null;
  return (
    <span className={cn("block text-[13px] font-semibold leading-snug", onDark ? "text-gold-light" : "text-gold-deep", className)} data-testid="service-hook">
      <Ear className="mb-0.5 mr-1 inline size-4" aria-hidden />Słyszysz: <span className="italic">„{text}”</span>?
    </span>
  );
}

/** Ekspert-twarz usługi: zdjęcie, imię i nazwisko, rola. */
export function ExpertCard({ expert, label = "Ekspert tej usługi", className }: { expert: Expert | null; label?: string; className?: string }) {
  if (!expert) return null;
  const initials = expert.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <ExpertSheet expert={expert} className={cn("flex items-center gap-3.5 rounded-3xl border border-line bg-white p-3.5 shadow-(--shadow-card)", className)}>
      <span className="contents" data-testid="service-expert">
      {expert.photoUrl
        // eslint-disable-next-line @next/next/no-img-element -- zdjęcie eksperta ustawiane w panelu
        ? <img src={expert.photoUrl} alt="" width={64} height={64} className="size-16 shrink-0 rounded-full object-cover ring-2 ring-gold-light" />
        : <span aria-hidden className="gold-grad grid size-16 shrink-0 place-items-center rounded-full text-xl font-extrabold">{initials}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-bold uppercase tracking-[0.1em] text-gold-deep">{label}</span>
        <span className="block text-[17px] font-extrabold leading-tight text-leather-dark">{expert.name}</span>
        {expert.title && <span className="block text-[13px] leading-snug text-muted">{expert.title}</span>}
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
      </span>
    </ExpertSheet>
  );
}
