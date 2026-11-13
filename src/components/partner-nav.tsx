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
            className={cn("inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-bold", active(i) ? "bg-leather text-white" : "text-leather-dark hover:bg-sand")}>
            <i.icon className="size-4" aria-hidden />{i.label}
          </Link>
        ))}
      </nav>
    );
  }
  return (
    <nav aria-label="Główna" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} aria-current={active(i) ? "page" : undefined}
              className={cn("flex min-h-[58px] flex-col items-center justify-center gap-0.5 text-[11px] font-bold", active(i) ? "text-leather" : "text-muted")}>
              <i.icon className={cn("size-[22px]", active(i) && "fill-gold-light/60")} aria-hidden />{i.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
