"use client";

import { ArrowRight, ExternalLink, Share2, X } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { getShareData, type ShareAsset, type ShareData } from "@/app/actions/partner";
import { cn } from "@/lib/cn";
import { assetTypeLabel, stageCopyLabel, stageHint, stageLabel, STAGES, type Stage } from "@/lib/labels";
import { CopyButton, ShareRow } from "./client";
import { Badge, btnSm } from "./ui";

/** Jeden materiał z osobistym linkiem: kopiowanie jednym kliknięciem, podgląd i udostępnianie. */
export function AssetShareCard({ asset, serviceName }: { asset: ShareAsset; serviceName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-line bg-white p-4" data-testid={`asset-${asset.stage}`}>
      <div className="flex gap-3">
        <div aria-hidden className="grid size-12 shrink-0 place-items-center rounded-xl bg-sand text-[10px] font-extrabold uppercase tracking-wide text-leather">
          {assetTypeLabel[asset.type]?.slice(0, 4)}
        </div>
        <div className="min-w-0">
          <Badge>{assetTypeLabel[asset.type] ?? asset.type}</Badge>
          <p className="mt-1 font-bold leading-snug text-leather-dark">{asset.title}</p>
          {asset.description && <p className="mt-0.5 text-sm text-muted">{asset.description}</p>}
        </div>
      </div>
      <p className="tabular mt-3 truncate rounded-lg bg-cream px-3 py-2 text-[13px] font-semibold text-leather" data-testid="link-url">{asset.url.replace(/^https?:\/\//, "")}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <CopyButton text={asset.url} label={stageCopyLabel[asset.stage]} copiedLabel="Link skopiowany" className="flex-1 sm:flex-none" testId={`copy-${asset.stage}`} />
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className={btnSm("secondary", "min-h-11")}>
          <Share2 className="size-4" aria-hidden /> Wyślij
        </button>
        <a href={asset.previewUrl} target="_blank" rel="noopener noreferrer" className={btnSm("ghost", "min-h-11")}>
          <ExternalLink className="size-4" aria-hidden /> Podgląd
        </a>
      </div>
      {open && (
        <div className="mt-3 border-t border-line pt-3">
          {asset.shareText && <p className="mb-2.5 rounded-xl bg-cream px-3 py-2 text-sm italic text-ink/85">„{asset.shareText}”</p>}
          <ShareRow url={asset.url} text={asset.shareText} title={serviceName} />
        </div>
      )}
    </div>
  );
}

/** Schemat EDUKACJA → KONSULTACJA → TRANSAKCJA: partner wybiera punkt wejścia pasujący do gotowości klienta. */
export function StagePaths({ assets, serviceName, initial = "education" }: { assets: ShareAsset[]; serviceName: string; initial?: Stage }) {
  const [stage, setStage] = useState<Stage>(initial);
  const list = assets.filter((a) => a.stage === stage);
  return (
    <div>
      <div role="tablist" aria-label="Droga polecenia" className="flex items-stretch gap-1">
        {STAGES.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-1">
            <button type="button" role="tab" aria-selected={stage === s} onClick={() => setStage(s)} data-testid={`stage-${s}`}
              className={cn("min-h-12 w-full rounded-2xl border px-1 text-center text-[13px] font-extrabold uppercase tracking-wide transition-colors sm:text-sm",
                stage === s ? "border-leather bg-leather text-white" : "border-line bg-white text-leather-dark hover:bg-sand")}>
              {stageLabel[s]}
              <span className={cn("block text-[10px] font-semibold normal-case tracking-normal", stage === s ? "text-white/70" : "text-muted")}>
                {assets.filter((a) => a.stage === s).length} mat.
              </span>
            </button>
            {i < 2 && <ArrowRight className="size-4 shrink-0 text-gold" aria-hidden />}
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted"><span className="font-bold text-ink">{stageLabel[stage]}:</span> {stageHint[stage].toLowerCase()}.</p>
      <div role="tabpanel" className="mt-3 space-y-3">
        {list.length === 0
          ? <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">Brak materiałów na tym etapie.</p>
          : list.map((a) => <AssetShareCard key={a.id} asset={a} serviceName={serviceName} />)}
      </div>
    </div>
  );
}

/** Natychmiastowe udostępnianie z listy usług — arkusz z linkami na trzech etapach. */
export function QuickShare({ serviceId, serviceName, slug }: { serviceId: string; serviceName: string; slug: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [data, setData] = useState<ShareData | null>(null);
  const open = async () => {
    ref.current?.showModal();
    if (!data) setData(await getShareData(serviceId));
  };
  return (
    <>
      <button type="button" onClick={open} className={btnSm("primary")} aria-label={`Udostępnij: ${serviceName}`}>
        <Share2 className="size-4" aria-hidden /> Udostępnij
      </button>
      <dialog ref={ref} onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}
        className="m-0 mt-auto max-h-[88dvh] w-full max-w-none rounded-t-3xl bg-cream p-0 sm:m-auto sm:max-w-lg sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <p className="font-extrabold text-leather-dark">{serviceName}</p>
          <button type="button" onClick={() => ref.current?.close()} aria-label="Zamknij" className="grid size-10 place-items-center rounded-full hover:bg-sand"><X className="size-5" /></button>
        </div>
        <div className="overflow-y-auto p-5">
          {!data && <p className="py-8 text-center text-sm text-muted">Przygotowuję Twoje linki…</p>}
          {data && !data.ok && (
            <div className="py-4 text-center">
              <p className="text-sm font-semibold">{data.message}</p>
              <Link href={`/app/uslugi/${slug}`} className={btnSm("secondary", "mt-4")}>Zobacz kartę usługi</Link>
            </div>
          )}
          {data?.ok && <StagePaths assets={data.assets} serviceName={serviceName} />}
        </div>
      </dialog>
    </>
  );
}
