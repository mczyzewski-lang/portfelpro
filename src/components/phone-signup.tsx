"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { completeSignupAction, requestCodeAction, verifyCodeAction } from "@/app/actions/phone";
import { cn } from "@/lib/cn";
import { inputCls } from "./ui";

/**
 * Rejestracja (i logowanie) numerem telefonu: numer → kod SMS → pytanie „prowadzisz działalność?” (jeśli tak: NIP).
 * Istniejący numer po wpisaniu kodu od razu loguje.
 */
export function PhoneSignup({ profession = "", cta = "Załóż bezpłatny Portfel" }: { profession?: string; cta?: string }) {
  const [step, setStep] = useState<"phone" | "code" | "details">("phone");
  const [phone, setPhone] = useState(""); const [terms, setTerms] = useState(false);
  const [code, setCode] = useState(""); const [demoCode, setDemoCode] = useState<string | null>(null);
  const [firstName, setFirstName] = useState(""); const [lastName, setLastName] = useState("");
  const [business, setBusiness] = useState<boolean | null>(null); const [nip, setNip] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ error?: string; demoCode?: string | null; next?: "details" } | void>, then?: (r: { demoCode?: string | null; next?: "details" }) => void) =>
    start(async () => { setError(null); const r = await fn(); if (r?.error) setError(r.error); else if (r) then?.(r); });
  const main = "leather-grad press min-h-12 w-full rounded-full px-5 text-[15px] font-bold disabled:opacity-50";
  const choice = (on: boolean) => cn("press min-h-12 flex-1 rounded-2xl border text-[15px] font-bold", on ? "border-leather bg-cream text-leather-dark ring-2 ring-leather/15" : "border-line bg-white text-ink");

  return (
    <div className="rounded-3xl border border-line bg-white p-5 shadow-(--shadow-card)" data-testid="phone-signup">
      {step === "phone" && (
        <form onSubmit={(e) => { e.preventDefault(); run(() => requestCodeAction(phone, terms), (r) => { setDemoCode(r.demoCode ?? null); setStep("code"); }); }} className="space-y-3">
          <label className="block"><span className="mb-1.5 block text-sm font-semibold">Twój numer telefonu</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="600 100 200" required className={cn(inputCls, "tabular text-lg font-bold")} data-testid="phone-input" /></label>
          <label className="flex gap-3 text-[13px] leading-snug">
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-leather" />
            <span>Akceptuję <Link href="/regulamin" target="_blank" className="font-semibold text-leather underline">regulamin</Link> i <Link href="/prywatnosc" target="_blank" className="font-semibold text-leather underline">politykę prywatności</Link>.</span>
          </label>
          <button disabled={pending} className={main} data-testid="phone-send">{pending ? "Wysyłam kod…" : cta}</button>
          <p className="text-center text-xs text-muted">Wyślemy SMS z kodem. Masz już konto? Ten sam numer Cię zaloguje.</p>
        </form>
      )}
      {step === "code" && (
        <form onSubmit={(e) => { e.preventDefault(); run(() => verifyCodeAction(phone, code), (r) => { if (r.next === "details") setStep("details"); }); }} className="space-y-3">
          <p className="text-sm font-semibold">Wpisz kod z SMS-a</p>
          {demoCode && <p className="rounded-xl bg-warn-bg px-3 py-2 text-[13px] font-medium text-warn">Tryb demo — SMS nie jest wysyłany. Twój kod: <b className="tabular" data-testid="demo-code">{demoCode}</b></p>}
          <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••" required
            className={cn(inputCls, "tabular text-center text-2xl font-extrabold tracking-[0.4em]")} data-testid="code-input" />
          <button disabled={pending} className={main} data-testid="code-confirm">{pending ? "Sprawdzam…" : "Potwierdź kod"}</button>
          <button type="button" onClick={() => { setStep("phone"); setCode(""); setError(null); }} className="w-full text-center text-sm font-semibold text-leather">Zmień numer</button>
        </form>
      )}
      {step === "details" && (
        <form onSubmit={(e) => { e.preventDefault(); if (business === null) return setError("Zaznacz, czy prowadzisz działalność."); run(() => completeSignupAction({ phone, code, firstName, lastName, business, nip, profession })); }} className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Imię" aria-label="Imię" autoComplete="given-name" required className={inputCls} data-testid="signup-first" />
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nazwisko" aria-label="Nazwisko" autoComplete="family-name" required className={inputCls} data-testid="signup-last" />
          </div>
          <fieldset><legend className="mb-1.5 text-sm font-semibold">Prowadzisz działalność gospodarczą?</legend>
            <div className="flex gap-2.5">
              <button type="button" onClick={() => setBusiness(true)} aria-pressed={business === true} className={choice(business === true)} data-testid="business-yes">Tak</button>
              <button type="button" onClick={() => setBusiness(false)} aria-pressed={business === false} className={choice(business === false)} data-testid="business-no">Nie</button>
            </div>
          </fieldset>
          {business && <label className="block"><span className="mb-1.5 block text-sm font-semibold">NIP</span>
            <input value={nip} onChange={(e) => setNip(e.target.value)} inputMode="numeric" placeholder="10 cyfr" required className={cn(inputCls, "tabular")} data-testid="signup-nip" /></label>}
          <button disabled={pending} className={main} data-testid="signup-finish">{pending ? "Zakładam konto…" : "Odbierz swój IQ ID"}</button>
        </form>
      )}
      {error && <p role="alert" className="mt-3 rounded-xl bg-danger-bg px-3 py-2 text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}
