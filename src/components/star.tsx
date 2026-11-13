/** Złota, fasetowana gwiazda z logo — rysowana wektorowo, żeby można ją było animować. */
export function StarMark({ size = 44, className }: { size?: number; className?: string }) {
  // pięć ramion: wierzchołki zewnętrzne (O) i wewnętrzne (I) wokół środka (50,52)
  const O = [[50, 6], [94, 38], [77, 90], [23, 90], [6, 38]];
  const I = [[62, 36], [71, 59], [50, 73], [29, 59], [38, 36]];
  const C = "50,52";
  const tri = (a: number[], b: number[]) => `${a[0]},${a[1]} ${b[0]},${b[1]} ${C}`;
  const light = ["#fbe9b0", "#f3d27a", "#e6c15f", "#f0cf78", "#f8e09a"];
  const dark = ["#d9aa45", "#c2912f", "#b07f22", "#c99a3c", "#e1bd6a"];
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden>
      <g filter="drop-shadow(0 3px 3px rgba(80,45,10,.35))">
        {O.map((o, k) => (
          <g key={k}>
            <polygon points={tri(o, I[k])} fill={light[k]} />
            <polygon points={tri(o, I[(k + 4) % 5])} fill={dark[k]} />
          </g>
        ))}
      </g>
    </svg>
  );
}
