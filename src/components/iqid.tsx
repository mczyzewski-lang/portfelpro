"use client";

import { useEffect, useRef } from "react";

/*
 * Znak IQ ID: sześcian z węzłami w narożnikach połączonymi liniami — prosty, a przypomina sieć neuronów.
 * IqidMark — statyczny rzut izometryczny (ikona; od większych rozmiarów z napisami IQ i ID na ścianach).
 * IqidCube — duża, obracająca się wersja z węzłem w środku.
 */
const HEX: [number, number][] = [[12, 3], [19.8, 7.5], [19.8, 16.5], [12, 21], [4.2, 16.5], [4.2, 7.5]];
const C: [number, number] = [12, 12];

export function IqidMark({ size = 16, labels = false, onDark = false, className }: { size?: number; labels?: boolean; onDark?: boolean; className?: string }) {
  const line = onDark ? "#e1bd6a" : "#713b20", node = onDark ? "#f6dd96" : "#c99a3c", text = onDark ? "#ffffff" : "#321b12";
  const sw = size < 24 ? 1.5 : 1.1, r = size < 24 ? 1.9 : 1.5;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} role="img" aria-label="IQ ID" className={className} data-testid="iqid-mark">
      <g fill="none" stroke={line} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <polygon points={HEX.map((p) => p.join(",")).join(" ")} />
        {[HEX[5], HEX[1], HEX[3]].map((p, i) => <line key={i} x1={C[0]} y1={C[1]} x2={p[0]} y2={p[1]} />)}
      </g>
      {labels && (
        <g fill={text} fontSize="4.6" fontWeight="800" fontFamily="inherit" textAnchor="middle">
          <text transform="matrix(0.866 0.5 0 1 8.1 16.3)">IQ</text>
          <text transform="matrix(0.866 -0.5 0 1 15.9 16.3)">ID</text>
        </g>
      )}
      {[...HEX, C].map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={r} fill={node} />)}
    </svg>
  );
}

const V = [-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) => [x, y, z] as const)));
const EDGES = V.flatMap((a, i) => V.flatMap((b, j) => (j > i && a.filter((v, k) => v !== b[k]).length === 1 ? [[i, j] as const] : [])));

/** Obracający się sześcian IQ ID. Rysowany w SVG i przeliczany w pętli animacji — bez przerysowań Reacta. */
export function IqidCube({ size = 120, onDark = false, className }: { size?: number; onDark?: boolean; className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const line = onDark ? "#e1bd6a" : "#713b20", node = onDark ? "#f6dd96" : "#c99a3c";
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const edges = svg.querySelectorAll<SVGLineElement>("[data-e]"), spokes = svg.querySelectorAll<SVGLineElement>("[data-s]"), nodes = svg.querySelectorAll<SVGCircleElement>("[data-n]");
    const tilt = 0.5, ct = Math.cos(tilt), st = Math.sin(tilt);
    const draw = (a: number) => {
      const ca = Math.cos(a), sa = Math.sin(a);
      const pts = V.map(([x, y, z]) => {
        const x1 = x * ca + z * sa, z1 = -x * sa + z * ca, y1 = y * ct - z1 * st, z2 = y * st + z1 * ct;
        const k = 8 / (8 - z2); // lekka perspektywa
        return [50 + x1 * 23 * k, 50 + y1 * 23 * k, z2] as const;
      });
      EDGES.forEach(([i, j], n) => { const e = edges[n]; e.setAttribute("x1", pts[i][0].toFixed(2)); e.setAttribute("y1", pts[i][1].toFixed(2)); e.setAttribute("x2", pts[j][0].toFixed(2)); e.setAttribute("y2", pts[j][1].toFixed(2)); e.setAttribute("opacity", (0.55 + 0.2 * (pts[i][2] + pts[j][2]) / 2).toFixed(2)); });
      pts.forEach((p, n) => {
        spokes[n].setAttribute("x2", p[0].toFixed(2)); spokes[n].setAttribute("y2", p[1].toFixed(2));
        nodes[n].setAttribute("cx", p[0].toFixed(2)); nodes[n].setAttribute("cy", p[1].toFixed(2)); nodes[n].setAttribute("r", (3.6 + p[2] * 0.9).toFixed(2));
      });
    };
    draw(0.6);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const loop = (t: number) => { draw(0.6 + t / 2600); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <svg ref={ref} viewBox="0 0 100 100" width={size} height={size} role="img" aria-label="IQ ID" className={className} data-testid="iqid-cube">
      <g stroke={line} strokeWidth="1" opacity="0.28">{V.map((_, i) => <line key={i} data-s x1="50" y1="50" x2="50" y2="50" />)}</g>
      <g stroke={line} strokeWidth="1.6" strokeLinecap="round">{EDGES.map((_, i) => <line key={i} data-e />)}</g>
      <circle cx="50" cy="50" r="4.4" fill={node} />
      {V.map((_, i) => <circle key={i} data-n cx="50" cy="50" r="3.6" fill={node} />)}
    </svg>
  );
}
