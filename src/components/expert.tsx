import { cn } from "@/lib/cn";
import type { Expert } from "@/lib/expert";

/** Hasło skojarzeniowe nad nazwą usługi: co partner słyszy od klienta. */
export function Hook({ text, onDark = false, className }: { text: string | null | undefined; onDark?: boolean; className?: string }) {
  if (!text) return null;
  return (
    <span className={cn("block text-[13px] font-semibold leading-snug", onDark ? "text-gold-light" : "text-gold-deep", className)} data-testid="service-hook">
      Słyszysz: <span className="italic">„{text}”</span>?
    </span>
  );
}

/** Ekspert-twarz usługi: zdjęcie, imię i nazwisko, rola. */
export function ExpertCard({ expert, label = "Ekspert tej usługi", className }: { expert: Expert | null; label?: string; className?: string }) {
  if (!expert) return null;
  const initials = expert.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className={cn("flex items-center gap-3.5 rounded-3xl border border-line bg-white p-3.5 shadow-(--shadow-card)", className)} data-testid="service-expert">
      {expert.photoUrl
        // eslint-disable-next-line @next/next/no-img-element -- zdjęcie eksperta ustawiane w panelu
        ? <img src={expert.photoUrl} alt="" width={64} height={64} className="size-16 shrink-0 rounded-full object-cover ring-2 ring-gold-light" />
        : <span aria-hidden className="gold-grad grid size-16 shrink-0 place-items-center rounded-full text-xl font-extrabold">{initials}</span>}
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gold-deep">{label}</p>
        <p className="text-[17px] font-extrabold leading-tight text-leather-dark">{expert.name}</p>
        {expert.title && <p className="text-[13px] leading-snug text-muted">{expert.title}</p>}
      </div>
    </div>
  );
}
