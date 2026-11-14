/**
 * Obszycie skórzanej karty: przerywana nić biegnąca równo wzdłuż krawędzi.
 * SVG zamiast `border: dashed`, bo pathLength rozkłada ściegi równo na całym obwodzie —
 * bez ściśniętych kresek w narożnikach i urwanego ściegu na łączeniu.
 */
export function Stitch({ radius = 20, inset = 9, stitches = 128 }: { radius?: number; inset?: number; stitches?: number }) {
  const common = { x: 0, y: 0, width: "100%", height: "100%", rx: radius, fill: "none", pathLength: stitches * 2, strokeDasharray: "1.25 0.75", strokeLinecap: "round" as const };
  return (
    <svg aria-hidden className="pointer-events-none absolute overflow-visible" style={{ inset, width: `calc(100% - ${inset * 2}px)`, height: `calc(100% - ${inset * 2}px)` }}>
      {/* cień nici wciśniętej w skórę */}
      <rect {...common} stroke="rgba(0,0,0,0.42)" strokeWidth="1.35" transform="translate(0 0.9)" />
      <rect {...common} stroke="#ecca7c" strokeOpacity="0.85" strokeWidth="1.2" />
    </svg>
  );
}
