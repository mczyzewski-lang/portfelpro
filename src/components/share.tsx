"use client";

import {
  BookOpen, CalendarCheck, Calculator, Check, Copy, ExternalLink, FileText, Handshake, ListChecks, Mail, MessageCircle,
  MessagesSquare, PenLine, Presentation, Send, Video, type LucideIcon,
} from "lucide-react";
import { useState, type CSSProperties } from "react";
import type { ShareAsset } from "@/app/actions/partner";
import { cn } from "@/lib/cn";
import { assetTypeLabel, stageCopyLabel, stageLabel, STAGES, type Stage } from "@/lib/labels";
import { toast } from "./client";

const typeIcon: Record<string, LucideIcon> = {
  article: FileText, guide: BookOpen, webinar: Presentation, video: Video, quiz: ListChecks,
  calculator: Calculator, landing: FileText, form: PenLine, booking: CalendarCheck,
};
const stageMeta: Record<Stage, { icon: LucideIcon; when: string; lead: string }> = {
  education: { icon: BookOpen, when: "Nie zna tematu", lead: "Klient jeszcze nie wie, że ma problem albo że jest na niego rozwiązanie. Wyślij mu coś do przeczytania." },
  consultation: { icon: MessagesSquare, when: "Ma pytania", lead: "Klient widzi potrzebę, ale chce porozmawiać. Wyślij mu zaproszenie do bezpłatnego kontaktu ze specjalistą." },
  transaction: { icon: Handshake, when: "Chce zacząć", lead: "Klient zna usługę i jest zdecydowany. Wyślij mu bezpośrednie wejście do oferty." },
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

/** Jeden materiał = jeden osobisty link. Główna akcja: wyślij klientowi; obok: kopiuj, WhatsApp, e-mail, podgląd. */
function AssetCard({ asset, serviceName, index }: { asset: ShareAsset; serviceName: string; index: number }) {
  const [copied, setCopied] = useState(false);
  const Icon = typeIcon[asset.type] ?? FileText;
  const message = `${asset.shareText} ${asset.url}`.trim();

  const send = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: serviceName, text: asset.shareText, url: asset.url }); return; }
      catch (e) { if ((e as Error).name === "AbortError") return; }
    }
    if (await copy(message)) toast("Skopiowano wiadomość z linkiem — wklej ją klientowi.");
  };
  const copyLink = async () => {
    if (await copy(asset.url)) { setCopied(true); setTimeout(() => setCopied(false), 2400); }
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

      {asset.shareText && <p className="mt-3 rounded-2xl bg-cream px-3.5 py-2.5 text-[13px] italic leading-snug text-ink/80">„{asset.shareText}”</p>}

      <button type="button" onClick={send} className="press mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-leather px-5 text-[15px] font-bold text-white shadow-sm hover:bg-leather-600">
        <Send className="size-[18px]" aria-hidden />Wyślij klientowi
      </button>
      <button type="button" onClick={copyLink} data-testid={`copy-${asset.stage}`} data-copy={asset.url}
        className={cn("press mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-full border px-4 text-sm font-bold", copied ? "border-gold bg-gold-light text-leather-dark" : "border-line bg-white text-leather-dark hover:bg-sand")}>
        {copied ? <Check className="pop size-4 shrink-0" aria-hidden /> : <Copy className="size-4 shrink-0" aria-hidden />}
        <span aria-live="polite">{copied ? "Link skopiowany" : stageCopyLabel[asset.stage]}</span>
      </button>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <a className={quick} href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-4" aria-hidden />WhatsApp</a>
        <a className={quick} href={`mailto:?subject=${encodeURIComponent(serviceName)}&body=${encodeURIComponent(message)}`}><Mail className="size-4" aria-hidden />E-mail</a>
        <a className={quick} href={asset.previewUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" aria-hidden />Podgląd</a>
      </div>
      <p className="tabular mt-2 truncate text-center text-[11px] font-semibold text-muted" data-testid="link-url">{asset.url.replace(/^https?:\/\//, "")}</p>
    </li>
  );
}

/**
 * EDUKACJA → KONSULTACJA → TRANSAKCJA.
 * Partner najpierw odpowiada sobie na pytanie „na jakim etapie jest klient?”, potem wysyła właściwy link.
 */
export function StagePaths({ assets, serviceName, initial = "education" }: { assets: ShareAsset[]; serviceName: string; initial?: Stage }) {
  const [stage, setStage] = useState<Stage>(initial);
  const idx = STAGES.indexOf(stage);
  const list = assets.filter((a) => a.stage === stage);
  return (
    <div>
      <div role="tablist" aria-label="Na jakim etapie jest klient" className="relative grid grid-cols-3 rounded-3xl bg-sand p-1.5">
        <span aria-hidden className="stage-pill absolute bottom-1.5 left-1.5 top-1.5 w-[calc((100%-0.75rem)/3)] rounded-[18px] bg-leather shadow-md" style={{ transform: `translateX(${idx * 100}%)` }} />
        {STAGES.map((s) => {
          const M = stageMeta[s]; const on = stage === s;
          return (
            <button key={s} type="button" role="tab" aria-selected={on} onClick={() => setStage(s)} data-testid={`stage-${s}`}
              className={cn("press relative z-10 flex min-h-[76px] flex-col items-center justify-center gap-0.5 rounded-[18px] px-1 text-center transition-colors", on ? "text-white" : "text-leather-dark")}>
              <M.icon className={cn("size-5", on ? "text-gold-light" : "text-leather")} aria-hidden />
              <span className="text-[12px] font-extrabold uppercase tracking-wide">{stageLabel[s]}</span>
              <span className={cn("text-[11px] font-medium leading-none", on ? "text-white/75" : "text-muted")}>{M.when}</span>
            </button>
          );
        })}
      </div>

      <p key={`lead-${stage}`} className="rise mt-3 px-1 text-sm leading-snug text-ink/80">{stageMeta[stage].lead}</p>
      <ul key={stage} role="tabpanel" className="stagger mt-3 space-y-3">
        {list.length === 0
          ? <li className="rounded-3xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">Na tym etapie nie ma jeszcze materiałów.</li>
          : list.map((a, i) => <AssetCard key={a.id} asset={a} serviceName={serviceName} index={i} />)}
      </ul>
    </div>
  );
}
