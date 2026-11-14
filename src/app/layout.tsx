import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope/wght.css";
import "./globals.css";
import { Toaster } from "@/components/client";

export const metadata: Metadata = {
  title: { default: "Portfel.pro — Portfel Profesjonalisty", template: "%s · Portfel.pro" },
  description: "Poszerz swój portfel usług. Polecaj rozwiązania sprawdzonych specjalistów i otrzymuj prowizję za skuteczne polecenia.",
};
export const viewport: Viewport = { themeColor: "#F8F5EF", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" data-scroll-behavior="smooth" className="antialiased">
      <body className="flex min-h-dvh flex-col">
        <a href="#tresc" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-leather focus:px-4 focus:py-2 focus:text-white">Przejdź do treści</a>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
