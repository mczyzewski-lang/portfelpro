export const STAGES = ["education", "consultation", "transaction"] as const;
export type Stage = (typeof STAGES)[number];

export const stageLabel: Record<Stage, string> = {
  education: "Edukacja", consultation: "Konsultacja", transaction: "Transakcja",
};
export const stageHint: Record<Stage, string> = {
  education: "Klient jeszcze nie zna problemu ani rozwiązania",
  consultation: "Klient widzi potrzebę, ale ma pytania",
  transaction: "Klient zna usługę i chce zacząć",
};
export const stageCopyLabel: Record<Stage, string> = {
  education: "Kopiuj link edukacyjny", consultation: "Kopiuj link do konsultacji", transaction: "Kopiuj link do oferty",
};

export const assetTypeLabel: Record<string, string> = {
  article: "Artykuł", guide: "Poradnik", webinar: "Webinar", video: "Film", quiz: "Quiz",
  calculator: "Kalkulator", landing: "Strona oferty", form: "Formularz", booking: "Rezerwacja rozmowy",
};

export const leadStatusLabel: Record<string, string> = {
  registered: "Lead zarejestrowany", contacted: "Kontakt nawiązany", qualified: "Lead zakwalifikowany", in_progress: "W trakcie obsługi",
  won: "Sprzedaż potwierdzona", rejected: "Odrzucony", cancelled: "Anulowany",
};
export const leadStatusShort: Record<string, string> = {
  registered: "Zarejestrowany", contacted: "Po kontakcie", qualified: "Zakwalifikowany", in_progress: "W trakcie",
  won: "Potwierdzona", rejected: "Odrzucony", cancelled: "Anulowany",
};
export const commissionStatusLabel: Record<string, string> = {
  pending: "Naliczona — oczekuje", approved: "Zatwierdzona", paid: "Wypłacona", cancelled: "Anulowana",
};
export const partnerStatusLabel: Record<string, string> = {
  pending: "Oczekuje na zatwierdzenie", active: "Aktywne", suspended: "Zawieszone",
};
export const activityLabel: Record<string, string> = {
  individual: "Osoba fizyczna", sole_trader: "Jednoosobowa działalność", company: "Spółka / firma",
};
export const modelLabel: Record<string, string> = {
  fixed: "Stała kwota za klienta", percent: "Procent wartości netto sprzedaży",
  qualified_lead: "Kwota za zakwalifikowany lead", custom: "Model niestandardowy",
};
export const rateStatusLabel: Record<string, string> = {
  tbd: "Do ustalenia", demo: "Demo (niezatwierdzona)", approved: "Zatwierdzona",
};
export const publishLabel: Record<string, string> = { draft: "Szkic", published: "Opublikowana", hidden: "Ukryta" };
export const accessLabel: Record<string, string> = { requested: "Wniosek oczekuje", approved: "Dostęp przyznany", rejected: "Odmowa" };

/** IQ ID — inteligentny identyfikator partnera, np. iqid-101. */
export const partnerId = (n: number) => `iqid-${n}`;
export const leadRef = (n: number) => `L-${String(n).padStart(5, "0")}`;

const dFmt = new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Warsaw" });
const dtFmt = new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" });
export const fmtDate = (d: Date | string) => dFmt.format(new Date(d));
export const fmtDateTime = (d: Date | string) => dtFmt.format(new Date(d));

/** Kroki procesu widoczne dla partnera — od zgłoszenia do sprzedaży. */
export const PROCESS_STEPS = [
  { status: "registered", label: "Zgłoszenie", hint: "Klient zostawił kontakt. Specjalista odezwie się do niego." },
  { status: "contacted", label: "Kontakt", hint: "Specjalista rozmawiał z klientem i ustala, czy usługa jest dla niego." },
  { status: "qualified", label: "Kwalifikacja", hint: "Potwierdzono, że klient może skorzystać z usługi. Trwają ustalenia." },
  { status: "in_progress", label: "Realizacja", hint: "Klient rozpoczął współpracę. Usługa jest w toku." },
  { status: "won", label: "Sprzedaż", hint: "Sprzedaż potwierdzona. Prowizja przechodzi przez zatwierdzenie i wypłatę." },
] as const;
export const leadSourceLabel: Record<string, string> = {
  form: "formularz", webhook: "integracja", csv: "import", manual: "ręcznie", partner: "zgłoszenie partnera",
};
