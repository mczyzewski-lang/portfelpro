import { describe, expect, it } from "vitest";
import { parseCsv, slugify, toCsv } from "@/lib/csv";
import { partnerId } from "@/lib/labels";
import { isValidNip, registerSchema } from "@/lib/validation";
import { randomToken } from "@/lib/crypto";

describe("csv", () => {
  it("parsuje separator ; z cudzysłowami i BOM", () => {
    const rows = parseCsv('﻿type;service;name\nlead;znak-towarowy;"Kowalski; Jan ""JK"""\n\n');
    expect(rows).toEqual([{ type: "lead", service: "znak-towarowy", name: 'Kowalski; Jan "JK"' }]);
  });
  it("wykrywa separator przecinkowy", () => {
    expect(parseCsv("a,b\n1,2")).toEqual([{ a: "1", b: "2" }]);
  });
  it("eksport neutralizuje formuły arkusza", () => {
    expect(toCsv(["x"], [["=SUM(A1)"]])).toContain("'=SUM(A1)");
  });
  it("slugify obsługuje polskie znaki", () => {
    expect(slugify("Zastrzeżenie znaku — łódź")).toBe("zastrzezenie-znaku-lodz");
  });
});

describe("identyfikatory", () => {
  it("IQ ID ma stały format", () => expect(partnerId(123)).toBe("iqid-123"));
  it("tokeny są losowe i z bezpiecznego alfabetu", () => {
    const a = randomToken(7), b = randomToken(7);
    expect(a).toMatch(/^[A-Za-z0-9]{7}$/);
    expect(a).not.toBe(b);
  });
});

describe("walidacja", () => {
  it("NIP z sumą kontrolną", () => {
    expect(isValidNip("526-104-08-28")).toBe(true);
    expect(isValidNip("1234567890")).toBe(false);
  });
  it("rejestracja firmy wymaga nazwy i NIP, osoba fizyczna nie", () => {
    const base = { firstName: "Jan", lastName: "Kowalski", email: "JAN@Example.com", password: "bardzo-dlugie-haslo", terms: "on" };
    expect(registerSchema.safeParse({ ...base, activityType: "individual" }).success).toBe(true);
    expect(registerSchema.safeParse({ ...base, activityType: "company" }).success).toBe(false);
    const ok = registerSchema.safeParse({ ...base, activityType: "company", companyName: "ACME", nip: "5261040828" });
    expect(ok.success && ok.data.email).toBe("jan@example.com");
    expect(registerSchema.safeParse({ ...base, activityType: "individual", terms: undefined }).success).toBe(false);
  });
});
