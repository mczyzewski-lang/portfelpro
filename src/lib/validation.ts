import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("Podaj poprawny adres e-mail").max(200);
export const passwordSchema = z.string().min(10, "Hasło musi mieć co najmniej 10 znaków").max(200);

/** Walidacja NIP z sumą kontrolną. */
export function isValidNip(raw: string): boolean {
  const nip = raw.replace(/[\s-]/g, "");
  if (!/^\d{10}$/.test(nip)) return false;
  const w = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const sum = w.reduce((acc, weight, i) => acc + weight * Number(nip[i]), 0);
  return sum % 11 === Number(nip[9]);
}

export const registerSchema = z.object({
  firstName: z.string().trim().min(2, "Podaj imię").max(80),
  lastName: z.string().trim().min(2, "Podaj nazwisko").max(80),
  email: emailSchema,
  password: passwordSchema,
  activityType: z.enum(["individual", "sole_trader", "company"], { message: "Wybierz rodzaj działalności" }),
  companyName: z.string().trim().max(160).optional(),
  nip: z.string().trim().max(20).optional(),
  profession: z.string().trim().max(80).optional(),
  terms: z.literal("on", { message: "Zaakceptuj regulamin, aby założyć konto" }),
  marketing: z.string().optional(),
}).superRefine((v, ctx) => {
  if (v.activityType !== "individual") {
    if (!v.companyName) ctx.addIssue({ code: "custom", path: ["companyName"], message: "Podaj nazwę firmy" });
    if (!v.nip || !isValidNip(v.nip)) ctx.addIssue({ code: "custom", path: ["nip"], message: "Podaj poprawny NIP (10 cyfr)" });
  }
});

export const leadFormSchema = z.object({
  name: z.string().trim().min(2, "Podaj imię").max(120),
  email: emailSchema,
  phone: z.string().trim().max(40).optional(),
  consent: z.literal("on", { message: "Zgoda jest wymagana, abyśmy mogli się skontaktować" }),
});

export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) { const k = String(i.path[0] ?? "_"); if (!out[k]) out[k] = i.message; }
  return out;
}

export const publicLeadSchema = z.object({
  name: z.string().trim().min(2, "Podaj imię").max(120),
  phone: z.string().trim().max(40).optional(),
  email: z.union([z.literal(""), emailSchema]).optional(),
  consent: z.literal("on", { message: "Zgoda jest wymagana, abyśmy mogli się skontaktować" }),
}).refine((v) => (v.phone && v.phone.replace(/\D/g, "").length >= 7) || v.email, { message: "Podaj telefon lub e-mail" });
