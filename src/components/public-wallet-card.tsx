"use client";

import { ExternalLink, Globe, GripVertical } from "lucide-react";
import { useRef, useState } from "react";
import { savePublicWalletAction } from "@/app/actions/partner";
import { cn } from "@/lib/cn";
import { ActionForm, CopyButton, SubmitButton } from "./client";
import { btnSm, CompanyIcon, inputCls } from "./ui";

export type PublicServiceRow = { id: string; slug: string; name: string; on: boolean; company: { name: string; color: string; iconUrl: string | null } };
const ROW = 60; // stała wysokość wiersza — na niej opiera się przeciąganie

/** Zakładka „Portfel Publiczny” w Koncie: włącznik, podpis, link oraz wybór i kolejność usług (przeciąganie). */
export function PublicWalletManager({ enabled, url, bio, canEnable, services }: { enabled: boolean; url: string | null; bio: string; canEnable: boolean; services: PublicServiceRow[] }) {
  const [rows, setRows] = useState(services);
  const drag = useRef<{ id: string; y: number } | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  const move = (id: string, delta: number) => setRows((list) => {
    const i = list.findIndex((r) => r.id === id), j = Math.max(0, Math.min(list.length - 1, i + delta));
    if (i < 0 || i === j) return list;
    const next = [...list]; const [x] = next.splice(i, 1); next.splice(j, 0, x); return next;
  });

  return (
    <section className="rounded-(--radius-card) border border-line bg-white p-5 shadow-(--shadow-card)" aria-labelledby="pub-h" data-testid="public-wallet-card">
      <ActionForm action={savePublicWalletAction} key={`${enabled}|${bio}|${services.map((s) => s.id + s.on).join()}`}>
        <input type="hidden" name="services" value={JSON.stringify(rows.map((r) => ({ id: r.id, on: r.on })))} />
        <div className="flex items-start gap-3">
          <span className="gold-grad grid size-11 shrink-0 place-items-center rounded-2xl"><Globe className="size-5" aria-hidden /></span>
          <div className="min-w-0 flex-1">
            <h2 id="pub-h" className="font-extrabold text-leather-dark">Portfel Publiczny</h2>
            <p className="mt-0.5 text-[13px] leading-snug text-muted">Jedna strona z Twoim zdjęciem i usługami, które polecasz — do wysłania klientowi.</p>
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

        <p className="mt-5 text-sm font-semibold">Usługi na stronie publicznej</p>
        <p className="text-xs text-muted">Włącz te, które chcesz pokazywać, i ustaw kolejność, przeciągając za uchwyt.</p>
        {rows.length === 0 ? <p className="mt-2 rounded-xl bg-cream px-3 py-3 text-sm text-muted">Brak usług, które możesz już polecać.</p> : (
          <ul className="mt-2.5 select-none" data-testid="public-services">
            {rows.map((r) => (
              <li key={r.id} style={{ height: ROW }} className={cn("flex items-center gap-2.5 border-b border-line last:border-0", dragging === r.id && "relative z-10 rounded-xl bg-cream shadow-md")}>
                <button type="button" aria-label={`Zmień kolejność: ${r.name}. Użyj strzałek w górę i w dół.`}
                  className="grid size-10 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-muted active:cursor-grabbing"
                  onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { id: r.id, y: e.clientY }; setDragging(r.id); }}
                  onPointerMove={(e) => { const d = drag.current; if (!d) return; const steps = Math.round((e.clientY - d.y) / ROW); if (steps) { move(d.id, steps); d.y += steps * ROW; } }}
                  onPointerUp={() => { drag.current = null; setDragging(null); }} onPointerCancel={() => { drag.current = null; setDragging(null); }}
                  onKeyDown={(e) => { if (e.key === "ArrowUp") { e.preventDefault(); move(r.id, -1); } if (e.key === "ArrowDown") { e.preventDefault(); move(r.id, 1); } }}>
                  <GripVertical className="size-5" aria-hidden />
                </button>
                <CompanyIcon name={r.company.name} color={r.company.color} iconUrl={r.company.iconUrl} size={30} />
                <span className={cn("min-w-0 flex-1 truncate text-[14px] font-bold", r.on ? "text-leather-dark" : "text-muted line-through decoration-line")}>{r.name}</span>
                <label className="relative inline-flex shrink-0 cursor-pointer items-center" aria-label={`Pokaż publicznie: ${r.name}`}>
                  <input type="checkbox" checked={r.on} onChange={(e) => setRows((list) => list.map((x) => (x.id === r.id ? { ...x, on: e.target.checked } : x)))} className="peer sr-only" data-testid={`public-svc-${r.slug}`} />
                  <span className="h-6 w-10 rounded-full bg-line transition-colors peer-checked:bg-ok" />
                  <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                </label>
              </li>
            ))}
          </ul>
        )}
        <SubmitButton className="mt-4 w-full sm:w-auto" data-testid="public-save">Zapisz</SubmitButton>
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
