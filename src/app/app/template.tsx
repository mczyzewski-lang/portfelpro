"use client";

import { usePathname } from "next/navigation";

/**
 * Przejścia między ekranami: wejście „w głąb” (usługa, szczegóły polecenia, zmiana hasła) wsuwa się z prawej,
 * powrót na listę z lewej, pozostałe ekrany łagodnie się pojawiają. Wyłączane przez prefers-reduced-motion.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  // karta usługi animuje się sama (jest pełnoekranową nakładką), więc tutaj jej nie ruszamy
  if (/^\/app\/uslugi\/.+/.test(path)) return <>{children}</>;
  const deep = /^\/app\/(polecenia|konto)\/.+/.test(path);
  const list = path === "/app/uslugi" || path === "/app/polecenia";
  return <div className={deep ? "slide-in-right" : list ? "slide-in-left" : "page-enter"}>{children}</div>;
}
