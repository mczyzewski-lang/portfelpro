"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const items = [
  ["/admin", "Pulpit"], ["/admin/partnerzy", "Partnerzy"], ["/admin/lejek", "Lejek prospektów"], ["/admin/certyfikaty", "Szkolenia i certyfikaty"], ["/admin/uslugi", "Usługi i materiały"], ["/admin/spolki", "Spółki"],
  ["/admin/polecenia", "Leady i sprzedaż"], ["/admin/wiadomosci", "Wiadomości"], ["/admin/prowizje", "Prowizje i wypłaty"], ["/admin/import", "Import / eksport"],
  ["/admin/ustawienia", "Ustawienia"], ["/admin/dziennik", "Dziennik zmian"],
] as const;

export function AdminNav({ unread = 0 }: { unread?: number }) {
  const path = usePathname();
  return (
    <nav aria-label="Administracja" className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col">
      {items.map(([href, label]) => {
        const active = href === "/admin" ? path === href : path.startsWith(href) || (href === "/admin/uslugi" && path.startsWith("/admin/materialy"));
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined}
            className={cn("inline-flex min-h-10 shrink-0 items-center rounded-xl px-3.5 text-sm font-bold", active ? "bg-leather text-white" : "text-leather-dark hover:bg-sand")}>{label}{href === "/admin/wiadomosci" && unread > 0 && <span className="ml-2 rounded-full bg-danger px-1.5 text-[10px] font-bold text-white">{unread}</span>}</Link>
        );
      })}
    </nav>
  );
}
