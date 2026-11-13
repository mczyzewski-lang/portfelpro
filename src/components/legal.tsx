import type { ReactNode } from "react";
import { SiteFooter } from "./site";
import { Notice, Wordmark } from "./ui";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <header className="mx-auto w-full max-w-3xl px-5 py-4"><Wordmark /></header>
      <main id="tresc" className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16">
        <h1 className="text-[28px] font-extrabold text-leather-dark">{title}</h1>
        <Notice className="mt-4">Dokument roboczy (wzór demonstracyjny). Przed uruchomieniem produkcyjnym wymaga weryfikacji i uzupełnienia przez prawnika oraz podania danych administratora.</Notice>
        <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-ink/90 [&_h2]:text-lg [&_h2]:font-extrabold [&_h2]:text-leather-dark [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}
