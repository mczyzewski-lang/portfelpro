import Image from "next/image";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors min-h-11 px-5 text-[15px] disabled:opacity-50 disabled:pointer-events-none select-none";
const btnVariants = {
  primary: "leather-grad",
  gold: "gold-grad",
  secondary: "bg-white text-leather-dark border border-line hover:bg-sand",
  ghost: "text-leather hover:bg-sand",
  danger: "bg-danger text-white hover:opacity-90",
};
export type BtnVariant = keyof typeof btnVariants;
export const btn = (variant: BtnVariant = "primary", extra?: string) => cn(btnBase, btnVariants[variant], extra);
export const btnSm = (variant: BtnVariant = "secondary", extra?: string) =>
  cn(btnBase, btnVariants[variant], "min-h-9 px-3.5 text-sm", extra);

export function LinkButton({ variant = "primary", className, ...p }: ComponentProps<typeof Link> & { variant?: BtnVariant }) {
  return <Link {...p} className={btn(variant, className)} />;
}

export function Card({ className, ...p }: ComponentProps<"div">) {
  return <div {...p} className={cn("rounded-(--radius-card) border border-line bg-white shadow-(--shadow-card)", className)} />;
}

const badgeTones = {
  neutral: "bg-sand text-ink",
  gold: "bg-gold-light/40 text-gold-deep",
  ok: "bg-ok-bg text-ok",
  warn: "bg-warn-bg text-warn",
  danger: "bg-danger-bg text-danger",
  dark: "bg-leather-dark text-gold-light",
  success: "success-grad",
};
export type Tone = keyof typeof badgeTones;
export function Badge({ tone = "neutral", className, ...p }: ComponentProps<"span"> & { tone?: Tone }) {
  return <span {...p} className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", badgeTones[tone], className)} />;
}

export const inputCls =
  "block w-full rounded-xl border border-line bg-white px-3.5 min-h-11 text-base text-ink placeholder:text-muted/70 focus:border-leather focus:outline-none focus:ring-2 focus:ring-leather/20";

export function Field({ label, hint, error, children, className }: { label: string; hint?: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-danger">{error}</span>}
    </label>
  );
}

export function Logo({ size = 36, animated = false, priority = false }: { size?: number; animated?: boolean; priority?: boolean }) {
  const img = <Image src="/brand/logo.png" alt="" width={size} height={size} priority={priority} className="block drop-shadow-[0_6px_10px_rgba(50,27,18,0.25)]" />;
  if (!animated) return img;
  return (
    <span className="logo-3d" aria-hidden>
      <span className="logo-inner block">{img}<span className="logo-glint" /></span>
    </span>
  );
}

export function Wordmark({ href = "/", size = 34 }: { href?: string; size?: number }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5" aria-label="Portfel.pro — strona główna">
      <Logo size={size} priority />
      <span className="text-[19px] font-extrabold tracking-tight text-leather-dark">Portfel<span className="text-gold-deep">.pro</span></span>
    </Link>
  );
}

type CompanyLike = { name: string; color: string; logoUrl?: string | null; iconUrl?: string | null };

/** Kwadratowa ikona spółki (logo z jej strony) lub inicjał na kolorze marki. */
export function CompanyIcon({ name, color, iconUrl, size = 20, className }: CompanyLike & { size?: number; className?: string }) {
  const style = { width: size, height: size, borderRadius: Math.round(size * 0.28) };
  return iconUrl
    // eslint-disable-next-line @next/next/no-img-element -- logo spółki ustawiane w panelu (plik lokalny lub adres zewnętrzny)
    ? <img src={iconUrl} alt="" style={style} className={cn("shrink-0 bg-white object-cover ring-1 ring-black/5", className)} />
    : <span aria-hidden style={{ ...style, background: color, fontSize: size * 0.5 }} className={cn("grid shrink-0 place-items-center font-extrabold text-white", className)}>{name.slice(0, 1)}</span>;
}

export function CompanyMark({ name, color, iconUrl, onDark }: CompanyLike & { onDark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em]", onDark ? "text-white/70" : "text-muted")}>
      <CompanyIcon name={name} color={color} iconUrl={iconUrl} size={18} />
      {name}
    </span>
  );
}

export function Notice({ tone = "warn", children, className }: { tone?: "warn" | "ok" | "danger" | "neutral"; children: ReactNode; className?: string }) {
  const t = { warn: "bg-warn-bg text-warn border-warn/20", ok: "bg-ok-bg text-ok border-ok/20", danger: "bg-danger-bg text-danger border-danger/20", neutral: "bg-sand text-ink border-line" }[tone];
  return <div role="status" className={cn("rounded-2xl border px-4 py-3 text-sm font-medium", t, className)}>{children}</div>;
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-(--radius-card) border border-dashed border-line bg-white/60 px-6 py-10 text-center">
      <p className="text-base font-bold text-leather-dark">{title}</p>
      {children && <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">{children}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
