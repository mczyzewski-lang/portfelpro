/**
 * Czysta logika prowizji — bez dostępu do bazy, w pełni testowalna.
 * Kwoty w groszach, procenty w punktach bazowych (1000 = 10%).
 */
export type CommissionModel = "fixed" | "percent" | "qualified_lead" | "custom";
export type RateStatus = "tbd" | "demo" | "approved";

export type ServiceRate = {
  commissionModel: CommissionModel;
  commissionAmount: number | null;
  commissionBps: number | null;
  commissionNote?: string;
  rateStatus: RateStatus;
};
export type PartnerRate = {
  customModel: CommissionModel | null;
  customAmount: number | null;
  customBps: number | null;
} | null | undefined;

export type EffectiveRate = {
  model: CommissionModel;
  amount: number | null;
  bps: number | null;
  source: "service" | "partner";
  /** false = stawka nieustalona (lub demo poza trybem demo) — nie wolno z niej naliczać automatycznie */
  usable: boolean;
  demo: boolean;
};

export function effectiveRate(service: ServiceRate, partner: PartnerRate, demoMode: boolean): EffectiveRate {
  if (partner?.customModel) {
    return {
      model: partner.customModel, amount: partner.customAmount, bps: partner.customBps,
      source: "partner", usable: partner.customModel !== "custom", demo: false,
    };
  }
  const usable =
    service.commissionModel !== "custom" &&
    (service.rateStatus === "approved" || (service.rateStatus === "demo" && demoMode));
  return {
    model: service.commissionModel, amount: service.commissionAmount, bps: service.commissionBps,
    source: "service", usable, demo: usable && service.rateStatus === "demo",
  };
}

/** Typ zdarzenia, które uruchamia naliczenie prowizji w danym modelu. */
export const triggerFor = (model: CommissionModel): "sale" | "qualified_lead" =>
  model === "qualified_lead" ? "qualified_lead" : "sale";

export type CommissionResult =
  | { ok: true; amount: number; base: number | null; source: "service" | "partner" | "manual" }
  | { ok: false; reason: "no_rate" | "wrong_trigger" | "missing_net_amount" };

export function computeCommission(
  rate: EffectiveRate,
  event: { type: "sale" | "qualified_lead"; netAmount?: number | null; manualAmount?: number | null },
): CommissionResult {
  if (event.manualAmount != null) {
    if (!Number.isInteger(event.manualAmount) || event.manualAmount < 0) return { ok: false, reason: "no_rate" };
    return { ok: true, amount: event.manualAmount, base: event.netAmount ?? null, source: "manual" };
  }
  if (!rate.usable) return { ok: false, reason: "no_rate" };
  if (triggerFor(rate.model) !== event.type) return { ok: false, reason: "wrong_trigger" };
  switch (rate.model) {
    case "fixed":
    case "qualified_lead":
      if (rate.amount == null) return { ok: false, reason: "no_rate" };
      return { ok: true, amount: rate.amount, base: event.netAmount ?? null, source: rate.source };
    case "percent":
      if (rate.bps == null) return { ok: false, reason: "no_rate" };
      if (event.netAmount == null) return { ok: false, reason: "missing_net_amount" };
      return { ok: true, amount: Math.round((event.netAmount * rate.bps) / 10000), base: event.netAmount, source: rate.source };
    default:
      return { ok: false, reason: "no_rate" };
  }
}

const fmtWhole = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 });
const fmtFrac = new Intl.NumberFormat("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** 30000 → "300 zł", 123450 → "1234,50 zł". Pełne złote bez groszy, w pozostałych przypadkach zawsze dwa miejsca. */
export function formatPLN(grosze: number): string {
  const f = grosze % 100 === 0 ? fmtWhole : fmtFrac;
  return `${f.format(grosze / 100).replace(/\u00a0|\u202f/g, " ")} zł`;
}
export const formatPercent = (bps: number) => `${(bps / 100).toLocaleString("pl-PL", { maximumFractionDigits: 2 })}%`;

export type RateDisplay = { value: string; suffix: string; tbd: boolean; demo: boolean; individual: boolean };

/** Jak pokazać stawkę partnerowi / na landingu. Nigdy nie pokazuje stawki demo poza trybem demo. */
export function displayRate(service: ServiceRate, partner: PartnerRate, demoMode: boolean): RateDisplay {
  const r = effectiveRate(service, partner, demoMode);
  const individual = r.source === "partner";
  const tbd: RateDisplay = { value: "Stawka do ustalenia", suffix: "", tbd: true, demo: false, individual };
  if (r.model === "custom") {
    const note = individual ? "" : service.commissionNote?.trim();
    const visible = individual || service.rateStatus === "approved" || (service.rateStatus === "demo" && demoMode);
    return note && visible ? { value: note, suffix: "", tbd: false, demo: service.rateStatus === "demo", individual } : tbd;
  }
  if (!r.usable) return tbd;
  if (r.model === "percent") {
    return r.bps == null ? tbd : { value: formatPercent(r.bps), suffix: "wartości netto", tbd: false, demo: r.demo, individual };
  }
  if (r.amount == null) return tbd;
  return {
    value: formatPLN(r.amount),
    suffix: r.model === "qualified_lead" ? "za zakwalifikowany lead" : "za klienta",
    tbd: false, demo: r.demo, individual,
  };
}

/** "1 234,50" / "1234.5" / "1234" → grosze. Zwraca null dla pustych, NaN dla błędnych. */
export function parsePLN(input: string | null | undefined): number | null {
  const s = (input ?? "").toString().replace(/\s|zł|PLN/gi, "").replace(",", ".");
  if (!s) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return NaN;
  return Math.round(parseFloat(s) * 100);
}
