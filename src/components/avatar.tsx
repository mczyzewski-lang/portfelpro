"use client";

import { Camera, Minus, Plus, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { removeAvatarAction, saveAvatarAction } from "@/app/actions/partner";
import { cn } from "@/lib/cn";
import { toast } from "./client";
import { btn } from "./ui";

const VIEW = 280;   // rozmiar okna kadrowania (px)
const OUT = 320;    // rozmiar zapisywanego zdjęcia (px)

export function Avatar({ src, initials, size = 40, className }: { src: string | null; initials: string; size?: number; className?: string }) {
  return src
    // eslint-disable-next-line @next/next/no-img-element -- prywatne zdjęcie partnera serwowane z trasy /app/avatar
    ? <img src={src} alt="" width={size} height={size} style={{ width: size, height: size }} className={cn("shrink-0 rounded-full object-cover ring-2 ring-gold-light/70", className)} />
    : <span aria-hidden style={{ width: size, height: size, fontSize: size * 0.38 }} className={cn("grid shrink-0 place-items-center rounded-full bg-gold-light font-extrabold text-leather-dark", className)}>{initials}</span>;
}

/** Zdjęcie profilowe: wybór pliku → kadrowanie (przesuwanie i powiększanie) → zapis kwadratu 320×320. */
export function AvatarEditor({ src, initials }: { src: string | null; initials: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const [pending, start] = useTransition();

  const base = img ? VIEW / Math.min(img.naturalWidth, img.naturalHeight) : 1; // skala, przy której zdjęcie wypełnia okno
  const scale = base * zoom;
  const clamp = (p: { x: number; y: number }, s = scale) => {
    if (!img) return p;
    const mx = Math.max(0, (img.naturalWidth * s - VIEW) / 2), my = Math.max(0, (img.naturalHeight * s - VIEW) / 2);
    return { x: Math.min(mx, Math.max(-mx, p.x)), y: Math.min(my, Math.max(-my, p.y)) };
  };
  const setZoomClamped = (z: number) => { const nz = Math.min(4, Math.max(1, z)); setZoom(nz); setPos((p) => clamp(p, base * nz)); };

  useEffect(() => () => { if (img) URL.revokeObjectURL(img.src); }, [img]);

  const pick = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast("Wybierz plik graficzny (JPG, PNG, HEIC).", "error");
    if (f.size > 15 * 1024 * 1024) return toast("Zdjęcie jest za duże (limit 15 MB).", "error");
    const el = new Image();
    el.onload = () => { setImg(el); setZoom(1); setPos({ x: 0, y: 0 }); dialog.current?.showModal(); };
    el.onerror = () => toast("Nie udało się wczytać tego zdjęcia. Spróbuj z plikiem JPG lub PNG.", "error");
    el.src = URL.createObjectURL(f);
  };

  const save = () => {
    if (!img) return;
    const c = document.createElement("canvas"); c.width = OUT; c.height = OUT;
    const ctx = c.getContext("2d")!;
    const k = OUT / VIEW;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, OUT, OUT);
    const w = img.naturalWidth * scale * k, h = img.naturalHeight * scale * k;
    ctx.drawImage(img, OUT / 2 - w / 2 + pos.x * k, OUT / 2 - h / 2 + pos.y * k, w, h);
    const data = c.toDataURL("image/jpeg", 0.86);
    start(async () => {
      const res = await saveAvatarAction(data);
      if (res?.error) return toast(res.error, "error");
      toast("Zdjęcie zapisane."); dialog.current?.close();
    });
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar src={src} initials={initials} size={72} />
      <div className="flex flex-wrap gap-2">
        <input ref={file} type="file" accept="image/*" className="sr-only" aria-label="Wybierz zdjęcie" data-testid="avatar-file"
          onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
        <button type="button" onClick={() => file.current?.click()} className="press inline-flex min-h-10 items-center gap-2 rounded-full bg-white/15 px-4 text-sm font-bold text-white hover:bg-white/25">
          <Camera className="size-4" aria-hidden />{src ? "Zmień zdjęcie" : "Dodaj zdjęcie"}
        </button>
        {src && (
          <button type="button" disabled={pending} aria-label="Usuń zdjęcie" onClick={() => start(async () => { await removeAvatarAction(); toast("Zdjęcie usunięte."); })}
            className="press grid size-10 place-items-center rounded-full bg-white/10 text-white/80 hover:bg-white/20"><Trash2 className="size-4" aria-hidden /></button>
        )}
      </div>

      <dialog ref={dialog} onClose={() => setImg(null)} className="m-auto w-[min(92vw,360px)] rounded-3xl bg-cream p-0 text-ink">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <p className="font-extrabold text-leather-dark">Wykadruj zdjęcie</p>
          <button type="button" onClick={() => dialog.current?.close()} aria-label="Zamknij" className="grid size-10 place-items-center rounded-full hover:bg-sand"><X className="size-5" /></button>
        </div>
        <div className="p-5">
          <div className="relative mx-auto touch-none select-none overflow-hidden rounded-2xl bg-leather-dark" style={{ width: VIEW, height: VIEW, cursor: "grab" }} data-testid="avatar-crop"
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y }; }}
            onPointerMove={(e) => { const d = drag.current; if (d) setPos(clamp({ x: d.px + e.clientX - d.x, y: d.py + e.clientY - d.y })); }}
            onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
            onWheel={(e) => setZoomClamped(zoom - e.deltaY * 0.002)}>
            {img && (
              // eslint-disable-next-line @next/next/no-img-element -- lokalny podgląd wybranego pliku
              <img src={img.src} alt="" draggable={false} className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
                style={{ width: img.naturalWidth * scale, height: img.naturalHeight * scale, transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))` }} />
            )}
            {/* okrągła maska pokazująca, jak zdjęcie będzie wyglądać w aplikacji */}
            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_999px_rgba(50,27,18,0.55)] ring-2 ring-gold-light" />
          </div>
          <p className="mt-3 text-center text-xs text-muted">Przesuń zdjęcie palcem i ustaw powiększenie.</p>
          <div className="mt-2 flex items-center gap-3">
            <button type="button" aria-label="Pomniejsz" onClick={() => setZoomClamped(zoom - 0.2)} className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-white"><Minus className="size-4" /></button>
            <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZoomClamped(Number(e.target.value))} aria-label="Powiększenie" className="w-full accent-leather" />
            <button type="button" aria-label="Powiększ" onClick={() => setZoomClamped(zoom + 0.2)} className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-white"><Plus className="size-4" /></button>
          </div>
          <button type="button" onClick={save} disabled={pending} className={btn("primary", "press mt-4 w-full")} data-testid="avatar-save">{pending ? "Zapisuję…" : "Zapisz zdjęcie"}</button>
        </div>
      </dialog>
    </div>
  );
}
