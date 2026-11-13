import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

/** Kryterium wejścia do katalogu — jedno miejsce prawdy dla strony i panelu. */
export const GOOGLE_MIN_REVIEWS = 100;
export const GOOGLE_MIN_RATING = 47; // 4,7 (średnia × 10)

export function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Google">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

const fmtRating = (r: number) => (r / 10).toFixed(1).replace(".", ",");

/** Rzeczywista ocena spółki w Google. Bez danych nie renderuje nic — nie pokazujemy liczb, których nie znamy. */
export function GoogleRating({ rating, reviews, url, compact = false, onDark = false, className }: {
  rating: number | null | undefined; reviews: number | null | undefined; url?: string | null; compact?: boolean; onDark?: boolean; className?: string;
}) {
  if (rating == null || reviews == null) return null;
  const body = (
    <>
      <GoogleG className={compact ? "size-3.5" : "size-4"} />
      <span className={cn("tabular font-extrabold", onDark ? "text-white" : "text-leather-dark")}>{fmtRating(rating)}</span>
      <Star className={cn("fill-gold text-gold", compact ? "size-3" : "size-3.5")} aria-hidden />
      <span className={onDark ? "text-white/70" : "text-muted"}>{compact ? `(${reviews})` : `${reviews} opinii`}</span>
    </>
  );
  const cls = cn("inline-flex items-center gap-1 whitespace-nowrap", compact ? "text-[12px]" : "text-[13px]", className);
  const label = `Ocena w Google: ${fmtRating(rating)} na 5, ${reviews} opinii`;
  return url
    ? <a href={url} target="_blank" rel="noopener noreferrer" aria-label={label} className={cn(cls, "hover:underline")}>{body}</a>
    : <span aria-label={label} className={cls}>{body}</span>;
}

/** Karta „Tylko firmy sprawdzone przez klientów” — na stronie głównej i w panelu partnera. */
export function GoogleTrustCard({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("rounded-(--radius-card) border border-gold/40 bg-white", compact ? "p-4" : "p-5", className)} data-testid="google-trust">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cream ring-1 ring-line"><GoogleG className="size-6" /></span>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="tabular text-lg font-extrabold leading-none text-leather-dark">&gt;4,7/5</span>
            <span className="flex text-gold" aria-hidden>{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="size-4 fill-current" />)}</span>
          </div>
          <p className="mt-0.5 text-xs font-semibold text-muted">min. {GOOGLE_MIN_REVIEWS} opinii w Google</p>
        </div>
      </div>
      <p className={cn("font-extrabold leading-snug text-leather-dark", compact ? "mt-3 text-base" : "mt-3 text-lg")}>Tylko firmy sprawdzone przez klientów</p>
      <p className="mt-1 text-sm leading-relaxed text-ink/80">Do katalogu trafiają wyłącznie usługi firm ocenionych w Google: co najmniej <b>{GOOGLE_MIN_REVIEWS} opinii</b> i średnia ocena <b>powyżej 4,7/5</b>. Polecasz marki, którym klienci już zaufali.</p>
    </div>
  );
}
