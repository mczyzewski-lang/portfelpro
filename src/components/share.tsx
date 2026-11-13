"use client";

import {
  BookOpen, CalendarCheck, Calculator, Check, Copy, ExternalLink, FileText, ListChecks, Mail, MessageCircle,
  MessagesSquare, PenLine, Presentation, Send, ShoppingBag, Video, type LucideIcon,
} from "lucide-react";
import { useState, type CSSProperties, type ReactNode } from "react";
import type { ShareAsset } from "@/app/actions/partner";
import { cn } from "@/lib/cn";
import { assetTypeLabel, stageLabel } from "@/lib/labels";
import { toast } from "./client";

const typeIcon: Record<string, LucideIcon> = {
  article: FileText, guide: BookOpen, webinar: Presentation, video: Video, quiz: ListChecks,
  calculator: Calculator, landing: FileText, form: PenLine, booking: CalendarCheck,
};
const TABS = ["education", "consultation"] as const;
type Tab = (typeof TABS)[number];
const tabMeta: Record<Tab, { icon: LucideIcon; when: string; lead: string }> = {
  education: { icon: BookOpen, when: "Klient nie zna tematu", lead: "Wyślij klientowi coś do przeczytania — dowie się, że jest problem i rozwiązanie." },
  consultation: { icon: MessagesSquare, when: "Klient ma pytania", lead: "Umów klienta na bezpłatny kontakt ze specjalistą — linkiem albo przekazując jego dane." },
};

async function copy(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* starsze przeglądarki */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand("copy"); ta.remove(); return ok;
  } catch { return false; }
}

/** Widoczny link z jednym przyciskiem „Kopiuj”. */
function LinkRow({ asset }: { asset: ShareAsset }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-line bg-cream py-1.5 pl-3.5 pr-1.5">
      <p className="tabular min-w-0 flex-1 truncate text-[13px] font-bold text-leather-dark" data-testid="link-url">{asset.url.replace(/^https?:\/\//, "")}</p>
      <button type="button" data-testid={`copy-${asset.stage}`} data-copy={asset.url}
        onClick={async () => { if (await copy(asset.url)) { setCopied(true); setTimeout(() => setCopied(false), 2400); } }}
        className={cn("press flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-sm font-bold", copied ? "success-grad" : "gold-grad")}>
        {copied ? <Check className="pop size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        <span aria-live="polite">{copied ? "Skopiowano" : "Kopiuj"}</span>
      </button>
    </div>
  );
}

/** Jeden materiał = jeden osobisty link: wyślij klientowi, skopiuj albo podejrzyj. */
function AssetCard({ asset, serviceName, index }: { asset: ShareAsset; serviceName: string; index: number }) {
  const Icon = typeIcon[asset.type] ?? FileText;
  const message = `${asset.shareText} ${asset.url}`.trim();
  const send = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: serviceName, text: asset.shareText, url: asset.url }); return; }
      catch (e) { if ((e as Error).name === "AbortError") return; }
    }
    if (await copy(message)) toast("Skopiowano wiadomość z linkiem — wklej ją klientowi.");
  };
  const quick = "press flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-sand/70 px-2 text-[13px] font-semibold text-leather-dark hover:bg-sand";
  return (
    <li style={{ "--i": index } as CSSProperties} className="rounded-3xl border border-line bg-white p-4 shadow-(--shadow-card)" data-testid={`asset-${asset.stage}`}>
      <div className="flex gap-3">
        <div aria-hidden className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sand text-leather"><Icon className="size-5" /></div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">{assetTypeLabel[asset.type] ?? asset.type}</p>
          <p className="font-extrabold leading-snug text-leather-dark">{asset.title}</p>
          {asset.description && <p className="mt-0.5 text-[13px] leading-snug text-muted">{asset.description}</p>}
        </div>
      </div>
      <div className="mt-3"><LinkRow asset={asset} /></div>
      <button type="button" onClick={send} className="leather-grad press mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-[15px] font-bold">
        <Send className="size-[18px]" aria-hidden />Wyślij klientowi
      </button>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <a className={quick} href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-4" aria-hidden />WhatsApp</a>
        <a className={quick} href={`mailto:?subject=${encodeURIComponent(serviceName)}&body=${encodeURIComponent(message)}`}><Mail className="size-4" aria-hidden />E-mail</a>
        <a className={quick} href={asset.previewUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" aria-hidden />Podgląd</a>
      </div>
    </li>
  );
}

/**
 * Dwie zakładki — EDUKACJA i KONSULTACJA — połączone z panelem, w którym są linki tego etapu.
 * Link do oferty (dla zdecydowanego klienta) jest pod spodem jako osobny, prosty wiersz.
 */
export function StagePaths({ assets, serviceName, consultationExtra }: { assets: ShareAsset[]; serviceName: string; consultationExtra?: ReactNode }) {
  const [tab, setTab] = useState<Tab>("education");
  const list = assets.filter((a) => a.stage === tab);
  const offers = assets.filter((a) => a.stage === "transaction");
  const M = tabMeta[tab];
  return (
    <div>
      <div className="rounded-[28px] border border-line bg-sand/60 p-1.5">
        <div role="tablist" aria-label="Etap klienta" className="relative grid grid-cols-2">
          <span aria-hidden className="stage-pill leather-grad absolute inset-y-0 left-0 w-1/2 rounded-[22px]" style={{ transform: `translateX(${TABS.indexOf(tab) * 100}%)` }} />
          {TABS.map((s) => {
            const T = tabMeta[s]; const on = tab === s;
            return (
              <button key={s} type="button" role="tab" id={`tab-${s}`} aria-selected={on} aria-controls="stage-panel" onClick={() => setTab(s)} data-testid={`stage-${s}`}
                className={cn("press relative z-10 flex min-h-[68px] flex-col items-center justify-center gap-0.5 rounded-[22px] px-2 text-center transition-colors", on ? "text-white" : "text-leather-dark")}>
                <span className="flex items-center gap-1.5 text-[13px] font-extrabold uppercase tracking-wide"><T.icon className={cn("size-[18px]", on ? "text-gold-light" : "text-leather")} aria-hidden />{stageLabel[s]}</span>
                <span className={cn("text-[11px] font-medium leading-none", on ? "text-white/80" : "text-muted")}>{T.when}</span>
              </button>
            );
          })}
        </div>

        <div id="stage-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} key={tab} className="rise px-2.5 pb-2.5 pt-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gold-deep">Linki dla etapu: {stageLabel[tab]}</p>
          <p className="mt-0.5 text-sm leading-snug text-ink/80">{M.lead}</p>
          {tab === "consultation" && consultationExtra && <div className="mt-3">{consultationExtra}</div>}
          <ul className="stagger mt-3 space-y-3">
            {list.length === 0
              ? <li className="rounded-3xl border border-dashed border-line bg-white/60 px-4 py-8 text-center text-sm text-muted">Na tym etapie nie ma jeszcze materiałów.</li>
              : list.map((a, i) => <AssetCard key={a.id} asset={a} serviceName={serviceName} index={i} />)}
          </ul>
        </div>
      </div>

      {offers.length > 0 && (
        <section className="mt-4 rounded-3xl border border-line bg-white p-4" aria-labelledby="offer-h" data-testid="offer-links">
          <h3 id="offer-h" className="flex items-center gap-2 font-extrabold text-leather-dark"><ShoppingBag className="size-[18px] text-gold-deep" aria-hidden />Link do oferty</h3>
          <p className="mt-0.5 text-[13px] text-muted">Dla klienta, który jest zdecydowany i chce od razu zacząć.</p>
          <div className="mt-3 space-y-2.5">
            {offers.map((a) => (
              <div key={a.id}>
                <p className="mb-1 text-[13px] font-semibold text-ink/85">{a.title}</p>
                <LinkRow asset={a} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
