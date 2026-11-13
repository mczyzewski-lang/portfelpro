import { cn } from "@/lib/cn";
import type { StarTier } from "@/lib/gamification";

/** Palety faset dla każdej gwiazdy: [jasne ścianki ×5, ciemne ścianki ×5, cień]. */
const PALETTE: Record<StarTier, { light: string[]; dark: string[]; shadow: string; opacity?: number }> = {
  ice: { light: ["#ffffff", "#e6f6ff", "#cdeaff", "#dff3ff", "#f4fbff"], dark: ["#a9d8f5", "#8cc6ec", "#74b4e0", "#93cbee", "#b9e1f8"], shadow: "rgba(60,120,170,.35)" },
  glass: { light: ["#f3fffd", "#d2f5ef", "#b4eae2", "#c8f1ea", "#e6fbf8"], dark: ["#8fd6cc", "#74c5ba", "#5cb3a8", "#7ccbc0", "#a3e0d7"], shadow: "rgba(40,120,110,.3)", opacity: 0.82 },
  stone: { light: ["#e2ded7", "#cfcac1", "#bdb7ad", "#c9c4ba", "#d9d5cc"], dark: ["#9d968a", "#8a8377", "#787165", "#8e877b", "#a8a195"], shadow: "rgba(60,55,45,.4)" },
  steel: { light: ["#e9eef4", "#cfd8e3", "#b5c2d1", "#c6d1de", "#dde5ee"], dark: ["#8496ab", "#6f8298", "#5c6f85", "#75889e", "#93a4b8"], shadow: "rgba(40,60,85,.4)" },
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
    <svg viewBox="0 0 100 100" width={size} height={size} className={cn(dimmed && "opacity-70 saturate-[.85]", className)} aria-hidden data-tier={tier}>
      <g filter={`drop-shadow(0 3px 3px ${p.shadow})`} opacity={p.opacity ?? 1}>
        {O.map((o, k) => (
          <g key={k}>
            <polygon points={tri(o, I[k])} fill={p.light[k]} />
            <polygon points={tri(o, I[(k + 4) % 5])} fill={p.dark[k]} />
          </g>
        ))}
      </g>
      {tier === "glass" && <polygon points="50,6 62,36 50,52" fill="#ffffff" opacity="0.55" />}
    </svg>
  );
}
