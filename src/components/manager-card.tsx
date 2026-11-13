import { Mail, Phone } from "lucide-react";
import type { Manager } from "@/lib/messages";

/** „Twój opiekun” — osoba do bezpośredniego kontaktu, z telefonem. */
export function ManagerCard({ manager }: { manager: Manager }) {
  const initials = `${manager.firstName[0] ?? ""}${manager.lastName[0] ?? ""}`.toUpperCase();
  const tel = manager.phone?.replace(/[^\d+]/g, "");
  return (
    <section className="wallet rounded-[28px] p-5" aria-label="Twój opiekun" data-testid="manager-card">
      <p className="relative z-10 text-[11px] font-bold uppercase tracking-[0.12em] text-gold-light">Twój opiekun</p>
      <div className="relative z-10 mt-2.5 flex items-center gap-3.5">
        {manager.photoVersion
          // eslint-disable-next-line @next/next/no-img-element -- zdjęcie opiekuna serwowane z trasy wymagającej zalogowania
          ? <img src={`/api/manager-photo/${manager.id}?v=${manager.photoVersion}`} alt="" width={64} height={64} className="size-16 shrink-0 rounded-full object-cover ring-2 ring-gold-light" data-testid="manager-photo" />
          : <span aria-hidden className="grid size-16 shrink-0 place-items-center rounded-full bg-gold-light text-xl font-extrabold text-leather-dark">{initials}</span>}
        <div className="min-w-0">
          <p className="text-xl font-extrabold leading-tight">{manager.firstName} {manager.lastName}</p>
          <p className="text-sm text-white/75">{manager.jobTitle || "Opiekun partnerów"}</p>
        </div>
      </div>
      <div className="relative z-10 mt-4 grid gap-2 sm:grid-cols-2">
        {tel
          ? <a href={`tel:${tel}`} className="press flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold-light px-4 font-bold text-leather-dark"><Phone className="size-[18px]" aria-hidden /><span className="tabular">{manager.phone}</span></a>
          : <p className="flex min-h-12 items-center justify-center rounded-full bg-white/10 px-4 text-sm text-white/70">Numer telefonu pojawi się wkrótce</p>}
        <a href={`mailto:${manager.email}`} className="press flex min-h-12 items-center justify-center gap-2 rounded-full bg-white/15 px-4 text-sm font-bold text-white"><Mail className="size-[18px]" aria-hidden /><span className="truncate">{manager.email}</span></a>
      </div>
      <p className="relative z-10 mt-3 text-xs text-white/65">Pytania o usługi, prowizje albo konkretnego klienta — napisz poniżej lub zadzwoń.</p>
    </section>
  );
}
