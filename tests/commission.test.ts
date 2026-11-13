import { describe, expect, it } from "vitest";
import { computeCommission, displayRate, effectiveRate, formatPLN, parsePLN, triggerFor, type ServiceRate } from "@/lib/commission";

const fixed: ServiceRate = { commissionModel: "fixed", commissionAmount: 30000, commissionBps: null, rateStatus: "approved" };
const percent: ServiceRate = { commissionModel: "percent", commissionAmount: null, commissionBps: 1000, rateStatus: "approved" };
const perLead: ServiceRate = { commissionModel: "qualified_lead", commissionAmount: 15000, commissionBps: null, rateStatus: "approved" };
const demo: ServiceRate = { ...fixed, rateStatus: "demo" };
const tbd: ServiceRate = { commissionModel: "custom", commissionAmount: null, commissionBps: null, rateStatus: "tbd" };

describe("effectiveRate", () => {
  it("stawka indywidualna partnera zastępuje standardową", () => {
    const r = effectiveRate(fixed, { customModel: "fixed", customAmount: 45000, customBps: null }, false);
    expect(r).toMatchObject({ amount: 45000, source: "partner", usable: true });
  });
  it("stawka demo jest używana tylko w trybie demo", () => {
    expect(effectiveRate(demo, null, true)).toMatchObject({ usable: true, demo: true });
    expect(effectiveRate(demo, null, false).usable).toBe(false);
  });
  it("wpis partnera bez indywidualnej stawki nie zmienia stawki usługi", () => {
    expect(effectiveRate(fixed, { customModel: null, customAmount: null, customBps: null }, false).source).toBe("service");
  });
});

describe("computeCommission", () => {
  it("stała kwota za sprzedaż", () => {
    expect(computeCommission(effectiveRate(fixed, null, false), { type: "sale" })).toMatchObject({ ok: true, amount: 30000 });
  });
  it("procent wartości netto, z zaokrągleniem do grosza", () => {
    expect(computeCommission(effectiveRate(percent, null, false), { type: "sale", netAmount: 123455 })).toMatchObject({ ok: true, amount: 12346, base: 123455 });
  });
  it("model procentowy wymaga wartości netto", () => {
    expect(computeCommission(effectiveRate(percent, null, false), { type: "sale" })).toEqual({ ok: false, reason: "missing_net_amount" });
  });
  it("model za lead nalicza się przy kwalifikacji, nie przy sprzedaży", () => {
    const r = effectiveRate(perLead, null, false);
    expect(triggerFor(r.model)).toBe("qualified_lead");
    expect(computeCommission(r, { type: "qualified_lead" })).toMatchObject({ ok: true, amount: 15000 });
    expect(computeCommission(r, { type: "sale" })).toEqual({ ok: false, reason: "wrong_trigger" });
  });
  it("stawka nieustalona lub demo poza trybem demo nie nalicza się automatycznie", () => {
    expect(computeCommission(effectiveRate(tbd, null, true), { type: "sale" })).toEqual({ ok: false, reason: "no_rate" });
    expect(computeCommission(effectiveRate(demo, null, false), { type: "sale" })).toEqual({ ok: false, reason: "no_rate" });
  });
  it("kwota ręczna ma pierwszeństwo i jest oznaczona jako ręczna", () => {
    expect(computeCommission(effectiveRate(tbd, null, false), { type: "sale", manualAmount: 12000 })).toMatchObject({ ok: true, amount: 12000, source: "manual" });
    expect(computeCommission(effectiveRate(fixed, null, false), { type: "sale", manualAmount: -5 }).ok).toBe(false);
  });
});

describe("displayRate", () => {
  it("nigdy nie pokazuje stawki demo poza trybem demo", () => {
    expect(displayRate(demo, null, false)).toMatchObject({ tbd: true, value: "Stawka do ustalenia" });
    expect(displayRate(demo, null, true)).toMatchObject({ tbd: false, demo: true, value: "300 zł" });
  });
  it("formatuje procent i kwoty", () => {
    expect(displayRate(percent, null, false)).toMatchObject({ value: "10%", suffix: "wartości netto" });
    expect(displayRate(tbd, null, true).tbd).toBe(true);
    expect(formatPLN(123450)).toBe("1234,50 zł");
    expect(formatPLN(0)).toBe("0 zł");
  });
});

describe("parsePLN", () => {
  it("parsuje polski zapis kwot", () => {
    expect(parsePLN("2 500,00 zł")).toBe(250000);
    expect(parsePLN("1234.5")).toBe(123450);
    expect(parsePLN("")).toBeNull();
    expect(parsePLN("abc")).toBeNaN();
    expect(parsePLN("-10")).toBeNaN();
  });
});
