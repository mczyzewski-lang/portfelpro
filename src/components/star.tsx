import { useId } from "react";
import { cn } from "@/lib/cn";
import type { StarTier } from "@/lib/gamification";

/** Palety faset dla każdej gwiazdy: jasne i ciemne ścianki oraz cień. */
const PALETTE: Record<StarTier, { light: string[]; dark: string[]; shadow: string; opacity?: number }> = {
  ice: { light: ["#ffffff", "#e6f6ff", "#cdeaff", "#dff3ff", "#f4fbff"], dark: ["#a9d8f5", "#8cc6ec", "#74b4e0", "#93cbee", "#b9e1f8"], shadow: "rgba(60,120,170,.35)", opacity: 0.84 },
  glass: { light: ["#f3fffd", "#d2f5ef", "#b4eae2", "#c8f1ea", "#e6fbf8"], dark: ["#8fd6cc", "#74c5ba", "#5cb3a8", "#7ccbc0", "#a3e0d7"], shadow: "rgba(40,120,110,.3)", opacity: 0.74 },
  bronze: { light: ["#f0c9a0", "#e0a877", "#cf8f5a", "#dba06c", "#ebbb8d"], dark: ["#a8693a", "#93582d", "#7e4822", "#9a5e31", "#b97a48"], shadow: "rgba(90,45,15,.45)" },
  silver: { light: ["#ffffff", "#eceff3", "#d9dee5", "#e4e8ee", "#f6f8fa"], dark: ["#a9b1bd", "#959eab", "#828b99", "#9aa3b0", "#b9c0ca"], shadow: "rgba(60,70,85,.4)" },
  gold: { light: ["#fbe9b0", "#f3d27a", "#e6c15f", "#f0cf78", "#f8e09a"], dark: ["#d9aa45", "#c2912f", "#b07f22", "#c99a3c", "#e1bd6a"], shadow: "rgba(80,45,10,.4)" },
};

// pięć ramion: wierzchołki zewnętrzne (O) i wewnętrzne (I) wokół środka (50,52)
const O = [[50, 6], [94, 38], [77, 90], [23, 90], [6, 38]];
// wewnętrzne wierzchołki odsunięte od środka — gwiazda jest pełniejsza, jak w logo
const I = [[64, 33.5], [74, 60], [50, 76.5], [26, 60], [36, 33.5]];
const C = "50,52";
const tri = (a: number[], b: number[]) => `${a[0]},${a[1]} ${b[0]},${b[1]} ${C}`;
const ICICLES = [[12, 40, 5, 20], [22, 42, 4, 13], [88, 40, 5, 20], [78, 42, 4, 13], [29, 88, 5, 16], [38, 76, 4, 22], [50, 73, 5, 27], [62, 76, 4, 21], [71, 88, 5, 15]];
const SNOW = [[8, 14, 2.2], [24, 4, 1.6], [78, 6, 2], [93, 20, 1.5], [4, 62, 1.6], [96, 66, 2], [16, 84, 1.4], [86, 88, 1.6], [66, 2, 1.3], [36, 18, 1.2]];

/** Obrys gwiazdy z zaokrąglonymi wierzchołkami (mocniej na czubkach ramion) — fasety są do niego przycinane. */
const OUTLINE = (() => {
  const pts = O.flatMap((o, k) => [o, I[k]]);
  const n = pts.length;
  let d = "";
  for (let i = 0; i < n; i++) {
    const p = pts[i], prev = pts[(i + n - 1) % n], next = pts[(i + 1) % n];
    const cut = i % 2 === 0 ? 9 : 4; // czubek ramienia / wcięcie
    const toward = (q: number[]) => { const dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy); return [p[0] + (dx / len) * cut, p[1] + (dy / len) * cut]; };
    const a = toward(prev), b = toward(next);
    d += `${i === 0 ? "M" : "L"}${a[0].toFixed(2)} ${a[1].toFixed(2)} Q${p[0]} ${p[1]} ${b[0].toFixed(2)} ${b[1].toFixed(2)} `;
  }
  return `${d}Z`;
})();

function Facets({ tier }: { tier: StarTier }) {
  const p = PALETTE[tier];
  const id = useId();
  return (
    <g filter={`drop-shadow(0 3px 3px ${p.shadow})`} opacity={p.opacity ?? 1}>
      <clipPath id={id}><path d={OUTLINE} /></clipPath>
      <g clipPath={`url(#${id})`}>
      {O.map((o, k) => (
        <g key={k}>
          <polygon points={tri(o, I[k])} fill={p.light[k]} />
          <polygon points={tri(o, I[(k + 4) % 5])} fill={p.dark[k]} />
        </g>
      ))}
      </g>
    </g>
  );
}

/**
 * Fasetowana gwiazda z logo w materiale poziomu.
 * Lodowa ma sople i śnieg wokół, a z czasem topnieje (`melt` 0→1): maleje, kapie i zostawia kałużę — przy 1 jest już tylko woda.
 */
export function StarMark({ size = 44, tier = "gold", className, dimmed = false, melt = 0 }: {
  size?: number; tier?: StarTier; className?: string; dimmed?: boolean; melt?: number;
}) {
  if (tier !== "ice") {
    return (
      <svg viewBox="0 0 100 100" width={size} height={size} className={cn(dimmed && "opacity-70 saturate-[.85]", className)} aria-hidden data-tier={tier}>
        <Facets tier={tier} />
        </svg>
    );
  }
  const m = Math.min(1, Math.max(0, melt));
  const scale = 1 - 0.72 * m;                 // gwiazda maleje…
  const sink = 30 * m;                        // …i osiada ku kałuży
  const snow = Math.max(0, 1 - m * 2.6);      // śnieg znika w pierwszych tygodniach
  const puddleRx = 6 + 38 * m, puddleRy = 1.5 + 6 * m;
  return (
    <svg viewBox="0 0 100 116" width={size} height={size} className={cn(dimmed && "opacity-70 saturate-[.85]", className)} aria-hidden data-tier="ice" data-melt={m.toFixed(2)}>
      {/* zamrożone otoczenie: zaspa i płatki śniegu */}
      {snow > 0 && (
        <g opacity={snow}>
          <ellipse cx="50" cy="106" rx="44" ry="7" fill="#ffffff" />
          <ellipse cx="30" cy="104" rx="20" ry="5" fill="#f1f9ff" />
          <ellipse cx="72" cy="105" rx="18" ry="4.5" fill="#e6f4fd" />
          {SNOW.map(([x, y, r], k) => <circle key={k} cx={x} cy={y} r={r} fill="#ffffff" opacity={0.9 - (k % 3) * 0.2} />)}
        </g>
      )}
      {/* woda pod gwiazdą */}
      {m > 0 && (
        <g>
          <ellipse cx="50" cy="108" rx={puddleRx} ry={puddleRy} fill="#7fc4ee" />
          <ellipse cx="50" cy="107.3" rx={puddleRx * 0.86} ry={puddleRy * 0.72} fill="#a9dbf7" />
          <ellipse cx={50 - puddleRx * 0.3} cy={107 - puddleRy * 0.2} rx={puddleRx * 0.28} ry={Math.max(0.6, puddleRy * 0.22)} fill="#eaf7ff" opacity="0.9" />
          {m >= 1 && <ellipse cx="62" cy="108.5" rx="9" ry="1.6" fill="none" stroke="#eaf7ff" strokeWidth="0.8" opacity="0.8" />}
        </g>
      )}
      {m < 1 && (
        <g transform={`translate(${50 * (1 - scale)} ${52 * (1 - scale) + sink}) scale(${scale})`}>
          <Facets tier="ice" />
          {ICICLES.map(([x, y, w, h], k) => {
            const len = h * (1 - m * 0.55);
            return (
              <g key={k}>
                <polygon points={`${x - w},${y} ${x + w},${y} ${x},${y + len}`} fill="#bfe4fa" />
                <polygon points={`${x - w},${y} ${x},${y} ${x},${y + len}`} fill="#eef9ff" />
              </g>
            );
          })}
        </g>
      )}
      {/* krople spadające z topniejącej gwiazdy */}
      {m > 0.05 && m < 1 && [[38, 0], [50, 5], [63, 2]].map(([x, d], k) => (
        <path key={k} d={`M${x} ${88 + d + sink * 0.35} q-2.2 4 0 5.6 q2.2 -1.6 0 -5.6z`} fill="#8fd0f5" />
      ))}
    </svg>
  );
}
