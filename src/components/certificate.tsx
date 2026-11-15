import { Logo } from "./ui";

/** Certyfikat „Certyfikowany Profesjonalista” — papier w kolorze kremowym ze złotą ramką, jak dyplom. */
export function Certificate({ name, area, number, date, title = "Certyfikowany Profesjonalista" }: { name: string; area: string; number: string; date: string; title?: string }) {
  return (
    <figure className="rounded-[22px] bg-linear-to-br from-[#e9c979] via-[#c99a3c] to-[#8f6a1e] p-[3px] shadow-(--shadow-wallet)" data-testid="certificate">
      <div className="rounded-[19px] bg-[#fdfaf2] p-1.5">
        <div className="rounded-[14px] border border-gold/60 px-5 py-7 text-center">
          <div className="flex justify-center"><Logo size={44} /></div>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.32em] text-gold-deep">Certyfikat</p>
          <p className="mt-2 text-[24px] font-extrabold leading-tight text-leather-dark" data-testid="certificate-title">{title}</p>
          <p className="mt-1 text-[15px] text-ink/80">obszar: <b className="font-extrabold text-leather-dark" data-testid="certificate-area">{area}</b></p>
          <div className="mx-auto my-4 h-px w-24 bg-gold/60" />
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">otrzymuje</p>
          <p className="mt-0.5 text-[20px] font-extrabold text-leather-dark" data-testid="certificate-name">{name}</p>
          <p className="mx-auto mt-3 max-w-xs text-[12px] leading-snug text-muted">za zapoznanie się z materiałami szkoleniowymi i zaliczenie testu wiedzy z tego obszaru.</p>
          <p className="tabular mt-4 text-[11px] font-semibold text-muted">{date} · nr {number} · Portfel.pro</p>
        </div>
      </div>
    </figure>
  );
}
