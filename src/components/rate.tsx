import type { RateDisplay } from "@/lib/commission";
import { cn } from "@/lib/cn";
import { Badge } from "./ui";

/** Wyraźna prezentacja prowizji. Stawki demonstracyjne zawsze mają etykietę DEMO. */
export function Rate({ rate, size = "md", onDark = false }: { rate: RateDisplay; size?: "sm" | "md" | "lg"; onDark?: boolean }) {
  const valueCls = { sm: "text-base", md: "text-xl", lg: "text-4xl" }[size];
  if (rate.tbd) {
    return <span className={cn("font-bold", size === "lg" ? "text-2xl" : "text-sm", onDark ? "text-white/80" : "text-muted")}>Stawka do ustalenia</span>;
  }
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
      <span className={cn("tabular font-extrabold tracking-tight", valueCls, onDark ? "text-gold-light" : "text-leather")}>{rate.value}</span>
      {rate.suffix && <span className={cn("text-xs font-medium", onDark ? "text-white/75" : "text-muted")}>{rate.suffix}</span>}
      {rate.demo && <Badge tone={onDark ? "dark" : "warn"} title="Stawka demonstracyjna — nie jest oficjalną stawką" className={onDark ? "border border-gold-light/40" : ""}>DEMO</Badge>}
      {rate.individual && <Badge tone="gold">Twoja stawka</Badge>}
    </span>
  );
}
