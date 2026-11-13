import { cn } from "@/lib/cn";
import type { StarTier } from "@/lib/gamification";

/** Palety faset dla każdej gwiazdy: [jasne ścianki ×5, ciemne ścianki ×5, cień]. */
const PALETTE: Record<StarTier, { light: string[]; dark: string[]; shadow: string; opacity?: number }> = {
  ice: { light: ["#ffffff", "#e6f6ff", "#cdeaff", "#dff3ff", "#f4fbff"], dark: ["#a9d8f5", "#8cc6ec", "#74b4e0", "#93cbee", "#b9e1f8"], shadow: "rgba(60,120,170,.35)" },
  glass: { light: ["#f3fffd", "#d2f5ef", "#b4eae2", "#c8f1ea", "#e6fbf8"], dark: ["#8fd6cc", "#74c5ba", "#5cb3a8", "#7ccbc0", "#a3e0d7"], shadow: "rgba(40,120,110,.3)", opacity: 0.82 },
  bronze: { light: ["#f0c9a0", "#e0a877", "#cf8f5a", "#dba06c", "#ebbb8d"], dark: ["#a8693a", "#93582d", "#7e4822", "#9a5e31", "#b97a48"], shadow: "rgba(90,45,15,.45)" },
  silver: { light: ["#ffffff", "#eceff3", "#d9dee5", "#e4e8ee", "#f6f8fa"], dark: ["#a9b1bd", "#959eab", "#828b99", "#9aa3b0", "#b9c0ca"], shadow: "rgba(60,70,85,.4)" },
  gold: { light: ["#fbe9b0", "#f3d27a", "#e6c15f", "#f0cf78", "#f8e09a"], dark: ["#d9aa45", "#c2912f", "#b07f22", "#c99a3c", "#e1bd6a"], shadow: "rgba(80,45,10,.4)" },
};

/** Fasetowana gwiazda z logo, rysowana wektorowo — w materiale odpowiadającym poziomowi partnera. */
export function StarMark({ size = 44, tier = "gold", className, dimmed = false }: { size?: number; tier?: StarTier; className?: string; dimmed?: boolean }) {
  // pięć ramion: wierzchołki zewnętrzne (O) i wewnętrzne (I) wokół środka (50,52)
  const O = [[50, 6], [94, 38], [77, 90], [23, 90], [6, 38]];
  const I = [[62, 36], [71, 59], [50, 73], [29, 59], [38, 36]];
  const C = "50,52";
  const tri = (a: number[], b: number[]) => `${a[0]},${a[1]} ${b[0]},${b[1]} ${C}`;
  const p = PALETTE[tier];
  return (
    <svg viewBox={tier === "ice" ? "0 0 100 108" : "0 0 100 100"} width={size} height={size} className={cn(dimmed && "opacity-70 saturate-[.85]", className)} aria-hidden data-tier={tier}>
      <g filter={`drop-shadow(0 3px 3px ${p.shadow})`} opacity={p.opacity ?? 1}>
        {O.map((o, k) => (
          <g key={k}>
            <polygon points={tri(o, I[k])} fill={p.light[k]} />
            <polygon points={tri(o, I[(k + 4) % 5])} fill={p.dark[k]} />
          </g>
        ))}
      </g>
      {tier === "glass" && <polygon points="50,6 62,36 50,52" fill="#ffffff" opacity="0.55" />}
      {tier === "ice" && (
        // sople zwisające z ramion i dolnych krawędzi gwiazdy
        <g>
          {[[12, 40, 5, 20], [22, 42, 4, 13], [88, 40, 5, 20], [78, 42, 4, 13], [29, 88, 5, 16], [38, 76, 4, 22], [50, 73, 5, 27], [62, 76, 4, 21], [71, 88, 5, 15]].map(([x, y, w, h], k) => (
            <g key={k}>
              <polygon points={`${x - w},${y} ${x + w},${y} ${x},${y + h}`} fill="#bfe4fa" />
              <polygon points={`${x - w},${y} ${x},${y} ${x},${y + h}`} fill="#eef9ff" />
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}
