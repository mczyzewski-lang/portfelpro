"use client";

import { LayoutGrid, ListChecks, User, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const items = [
  { href: "/app", label: "Portfel", icon: Wallet, exact: true },
  { href: "/app/uslugi", label: "Usługi", icon: LayoutGrid },
  { href: "/app/polecenia", label: "Polecenia", icon: ListChecks },
  { href: "/app/konto", label: "Konto", icon: User },
];

export function PartnerNav({ variant }: { variant: "bottom" | "top" }) {
  const path = usePathname();
  const active = (i: (typeof items)[number]) => (i.exact ? path === i.href : path.startsWith(i.href));
  if (variant === "top") {
    return (
      <nav aria-label="Główna" className="hidden items-center gap-1 md:flex">
        {items.map((i) => (
          <Link key={i.href} href={i.href} aria-current={active(i) ? "page" : undefined}
            className={cn("press inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-bold", active(i) ? "bg-leather text-white" : "text-leather-dark hover:bg-sand")}>
            <i.icon className="size-4" aria-hidden />{i.label}
          </Link>
        ))}
      </nav>
    );
  }
  const idx = Math.max(0, items.findIndex(active));
  return (
    <nav aria-label="Główna" className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] md:hidden">
      <ul className="relative mx-auto grid max-w-md grid-cols-4 rounded-[26px] border border-line bg-white/95 p-1.5 shadow-[0_10px_30px_-10px_rgba(50,27,18,0.35)] backdrop-blur">
        <li aria-hidden className="stage-pill pointer-events-none absolute bottom-1.5 left-1.5 top-1.5 w-[calc((100%-0.75rem)/4)] rounded-[20px] bg-leather" style={{ transform: `translateX(${idx * 100}%)` }} />
        {items.map((i) => (
          <li key={i.href} className="relative z-10">
            <Link href={i.href} aria-current={active(i) ? "page" : undefined}
              className={cn("press flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-[20px] text-[11px] font-bold transition-colors", active(i) ? "text-white" : "text-muted")}>
              <i.icon className={cn("size-[21px]", active(i) && "text-gold-light")} aria-hidden />{i.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
