"use client";

import { useEffect, useState, type CSSProperties } from "react";

const COLORS = ["#e1bd6a", "#c99a3c", "#3fb37e", "#8f4a28", "#f6dd96", "#1f8a5f"];
type Piece = { left: number; dx: number; rot: number; dur: number; delay: number; color: string };

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Jednorazowy deszcz confetti na cały ekran (np. nowy poziom, potwierdzony pakiet). */
export function ConfettiBurst({ fire = true }: { fire?: boolean }) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  useEffect(() => {
    if (!fire || reduced()) return;
    const make = requestAnimationFrame(() => setPieces(Array.from({ length: 70 }, (_, i) => ({
      left: Math.random() * 100, dx: (Math.random() - 0.5) * 160, rot: 360 + Math.random() * 720,
      dur: 2.2 + Math.random() * 1.6, delay: Math.random() * 0.5, color: COLORS[i % COLORS.length],
    }))));
    const clear = setTimeout(() => setPieces([]), 4600);
    return () => { cancelAnimationFrame(make); clearTimeout(clear); };
  }, [fire]);
  if (!pieces.length) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" data-testid="confetti">
      {pieces.map((p, i) => (
        <span key={i} className="confetti-piece" style={{ left: `${p.left}%`, background: p.color, "--dx": `${p.dx}px`, "--rot": `${p.rot}deg`, "--dur": `${p.dur}s`, "--delay": `${p.delay}s` } as CSSProperties} />
      ))}
    </div>
  );
}

const MINI = [[-13, -12, 0], [12, -14, 0.25], [-16, 2, 0.5], [15, 4, 0.75], [0, -18, 1.0], [-8, 12, 1.25]] as const;

/** Lekkie confetti wokół ikony w menu — sygnał, że w Poziomach czeka coś nowego. */
export function MiniConfetti() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0" data-testid="levels-new">
      {MINI.map(([dx, dy, delay], i) => (
        <span key={i} className="confetti-mini" style={{ background: COLORS[i % COLORS.length], "--dx": `${dx}px`, "--dy": `${dy}px`, "--delay": `${delay}s`, "--rot": `${90 + i * 40}deg` } as CSSProperties} />
      ))}
    </span>
  );
}
