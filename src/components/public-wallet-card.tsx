"use client";

import { ExternalLink, Globe } from "lucide-react";
import { savePublicWalletAction } from "@/app/actions/partner";
import { ActionForm, CopyButton, SubmitButton } from "./client";
import { btnSm, inputCls } from "./ui";

/** Kontener „Portfel Publiczny” w Koncie: przełącznik, podpis i link do strony dla klientów. */
export function PublicWalletCard({ enabled, url, bio, canEnable }: { enabled: boolean; url: string | null; bio: string; canEnable: boolean }) {
  return (
    <section className="rounded-(--radius-card) border border-line bg-white p-5 shadow-(--shadow-card)" aria-labelledby="pub-h" data-testid="public-wallet-card">
      <ActionForm action={savePublicWalletAction} key={`${enabled}|${bio}`}>
        <div className="flex items-start gap-3">
          <span className="gold-grad grid size-11 shrink-0 place-items-center rounded-2xl"><Globe className="size-5" aria-hidden /></span>
          <div className="min-w-0 flex-1">
            <h2 id="pub-h" className="font-extrabold text-leather-dark">Portfel Publiczny</h2>
            <p className="mt-0.5 text-[13px] leading-snug text-muted">Jedna strona z Twoim zdjęciem i wszystkimi usługami, które polecasz — do wysłania klientowi.</p>
          </div>
          <label className="relative inline-flex shrink-0 cursor-pointer items-center" aria-label="Portfel Publiczny aktywny">
            <input type="checkbox" name="enabled" defaultChecked={enabled} disabled={!canEnable} className="peer sr-only" data-testid="public-toggle" />
            <span className="h-7 w-12 rounded-full bg-line transition-colors peer-checked:bg-ok peer-disabled:opacity-50" />
            <span className="absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
          </label>
        </div>
        {!canEnable && <p className="mt-3 rounded-xl bg-warn-bg px-3 py-2 text-xs font-medium text-warn">Portfel Publiczny włączysz po zatwierdzeniu konta.</p>}
        <label className="mt-4 block">
          <span className="mb-1.5 block text-sm font-semibold">Podpis pod nazwiskiem</span>
          <input name="bio" defaultValue={bio} maxLength={160} placeholder="np. Doradca kredytowy · Poznań" className={inputCls} />
        </label>
        <SubmitButton small variant="secondary" className="mt-3" data-testid="public-save">Zapisz</SubmitButton>
      </ActionForm>
      {enabled && url && (
        <div className="mt-4 border-t border-line pt-4">
          <p className="tabular truncate rounded-2xl bg-cream px-3.5 py-2.5 text-[13px] font-bold text-leather-dark" data-testid="public-url">{url.replace(/^https?:\/\//, "")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a href={url} target="_blank" rel="noopener noreferrer" className={btnSm("primary", "press")} data-testid="public-open"><ExternalLink className="size-4" aria-hidden />Otwórz</a>
            <CopyButton small variant="gold" text={url} label="Kopiuj link" />
          </div>
        </div>
      )}
    </section>
  );
}
