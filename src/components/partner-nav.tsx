"use client";

import { Home, ListChecks, MessageCircle, Trophy, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { MiniConfetti } from "./confetti";

const items = [
  { href: "/app", label: "Pulpit", icon: Home, exact: true },
  { href: "/app/uslugi", label: "Portfel", icon: Wallet },
  { href: "/app/polecenia", label: "Polecenia", icon: ListChecks },
  { href: "/app/poziomy", label: "Poziomy", icon: Trophy },
  { href: "/app/wiadomosci", label: "Wiadomości", icon: MessageCircle },
];

export function PartnerNav({ variant, unread = 0, levelsNew = false }: { variant: "bottom" | "top"; unread?: number; levelsNew?: boolean }) {
  const dot = (href: string) => href === "/app/wiadomosci" && unread > 0
    ? <span className="absolute right-[22%] top-1.5 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold leading-4 text-white" data-testid="unread-badge">{unread}</span> : null;
  const path = usePathname();
  // iOS: po schowaniu klawiatury strona potrafi zostać „podjechana” w górę, przez co przypięte paski wiszą nad dołem ekranu.
  // Po wyjściu z pola i przy zmianie rozmiaru widocznego obszaru przywracamy poprawne położenie.
  useEffect(() => {
    if (variant !== "bottom") return;
    const settle = () => {
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      if (window.scrollY > max || (window.visualViewport?.offsetTop ?? 0) > 0) window.scrollTo({ top: Math.min(window.scrollY, max), behavior: "instant" });
    };
    const later = () => { setTimeout(settle, 80); setTimeout(settle, 350); };
    document.addEventListener("focusout", later);
    window.visualViewport?.addEventListener("resize", later);
    return () => { document.removeEventListener("focusout", later); window.visualViewport?.removeEventListener("resize", later); };
  }, [variant]);
  // Podświetlenie przeskakuje od razu po dotknięciu, nie dopiero po odpowiedzi serwera.
  const [tapped, setTapped] = useState<{ href: string; from: string } | null>(null);
  const shown = tapped && tapped.from === path ? tapped.href : path;
  const active = (i: (typeof items)[number]) => (i.exact ? shown === i.href : shown.startsWith(i.href));
  const tap = (href: string) => () => setTapped({ href, from: path });
  if (variant === "top") {
    return (
      <nav aria-label="Główna" className="hidden items-center gap-1 lg:flex">
        {items.map((i) => (
          <Link key={i.href} href={i.href} onClick={tap(i.href)} aria-current={active(i) ? "page" : undefined}
            className={cn("press inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-bold", active(i) ? "leather-grad" : "text-leather-dark hover:bg-sand")}>
            <span className="relative"><i.icon className="size-4" aria-hidden />{i.href === "/app/poziomy" && levelsNew && <MiniConfetti />}</span>{i.label}{i.href === "/app/wiadomosci" && unread > 0 && <span className="rounded-full bg-danger px-1.5 text-[10px] font-bold text-white">{unread}</span>}
          </Link>
        ))}
      </nav>
    );
  }
  const idx = items.findIndex(active); // -1 = żadna zakładka (np. Konto) — wtedy nic nie podświetlamy
  return (
    <nav aria-label="Główna" className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] lg:hidden">
      <ul className="relative mx-auto grid max-w-md grid-cols-5 rounded-[26px] border border-line bg-white/95 p-1.5 shadow-[0_10px_30px_-10px_rgba(50,27,18,0.35)] backdrop-blur">
        <li aria-hidden className="stage-pill pointer-events-none absolute bottom-1.5 left-1.5 top-1.5 w-[calc((100%-0.75rem)/5)] rounded-[20px] leather-grad" style={{ transform: `translateX(${Math.max(0, idx) * 100}%)`, opacity: idx < 0 ? 0 : 1 }} />
        {items.map((i) => (
          <li key={i.href} className="relative z-10">
            <Link href={i.href} onClick={tap(i.href)} aria-current={active(i) ? "page" : undefined}
              className={cn("press flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-[20px] text-[10.5px] font-bold transition-colors", active(i) ? "text-white" : "text-muted")}>
              <span className="relative"><i.icon className={cn("size-[21px]", active(i) && "text-gold-light")} aria-hidden />{i.href === "/app/poziomy" && levelsNew && <MiniConfetti />}</span>{i.label}{dot(i.href)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
