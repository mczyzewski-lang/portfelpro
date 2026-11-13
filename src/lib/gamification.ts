/**
 * Poziomy i osiągnięcia partnera — liczone wyłącznie z faktycznych danych (kliknięcia, polecenia, potwierdzone sprzedaże).
 * Mają charakter informacyjny: nie zmieniają stawek ani warunków prowizji.
 */
export type PartnerStats = {
  clicks: number; leads: number; clients: number; paid: number;
  servicesShared: number; stagesUsed: number; handoffs: number;
  starterConfirmed: boolean; hasPhoto: boolean;
};

export type StarTier = "ice" | "glass" | "bronze" | "silver" | "gold";

/** Gwiazdy partnera — miły dodatek graficzny do poziomów; złota przy 50 potwierdzonych klientach. */
export const LEVELS = [
  { tier: "ice", name: "Lodowa", min: 0 },
  { tier: "glass", name: "Szklana", min: 1 },
  { tier: "bronze", name: "Brązowa", min: 5 },
  { tier: "silver", name: "Srebrna", min: 20 },
  { tier: "gold", name: "Złota", min: 50 },
] as const satisfies readonly { tier: StarTier; name: string; min: number }[];

export function levelFor(clients: number) {
  let index = 0;
  LEVELS.forEach((l, i) => { if (clients >= l.min) index = i; });
  const current = LEVELS[index];
  const next = LEVELS[index + 1] ?? null;
  const progress = next ? Math.min(1, (clients - current.min) / (next.min - current.min)) : 1;
  return { index, current, next, progress, missing: next ? next.min - clients : 0 };
}

export type Achievement = {
  id: string; title: string; description: string; done: boolean; current: number; target: number;
  /** dalekie progi: dopóki nie są zdobyte, pokazujemy je tylko jako zasłoniętą zapowiedź */
  teaser?: boolean;
};

export function achievementsFor(s: PartnerStats): Achievement[] {
  const a = (id: string, title: string, description: string, current: number, target: number): Achievement =>
    ({ id, title, description, current: Math.min(current, target), target, done: current >= target });
  return [
    a("starter-pack", "Pakiet startowy odebrany", "Potwierdziłeś odbiór pakietu startowego kodem z przesyłki.", s.starterConfirmed ? 1 : 0, 1),
    a("photo", "Zdjęcie profilowe", "Dodałeś swoje zdjęcie — klienci i opiekun wiedzą, z kim rozmawiają.", s.hasPhoto ? 1 : 0, 1),
    a("first-click", "Pierwszy otwarty link", "Klient otworzył materiał z Twojego linku.", s.clicks, 1),
    a("first-lead", "Pierwsze polecenie", "Klient zostawił kontakt albo przekazałeś go do konsultacji.", s.leads, 1),
    a("first-client", "Pierwszy klient", "Pierwsza potwierdzona sprzedaż z Twojego polecenia.", s.clients, 1),
    a("first-payout", "Pierwsza wypłata", "Prowizja trafiła na Twoje konto.", s.paid > 0 ? 1 : 0, 1),
    a("two-paths", "Dwie drogi", "Klienci otworzyli Twoje linki z edukacji i z konsultacji.", s.stagesUsed, 2),
    a("wide-wallet", "Szeroki portfel", "Twoje linki do 3 różnych usług zostały otwarte.", s.servicesShared, 3),
    a("handoff", "Ciepłe przekazanie", "Przekazałeś kontakt klienta bezpośrednio do konsultacji.", s.handoffs, 1),
    a("ten-leads", "10 poleceń", "Dziesięć osób trafiło do specjalistów dzięki Tobie.", s.leads, 10),
    a("five-clients", "5 klientów", "Pięć potwierdzonych sprzedaży.", s.clients, 5),
    a("ten-clients", "10 klientów", "Dziesięć potwierdzonych sprzedaży — tu czeka na Ciebie niespodzianka.", s.clients, 10),
    { ...a("twenty-clients", "20 klientów", "Dwadzieścia potwierdzonych sprzedaży.", s.clients, 20), teaser: true },
    { ...a("thirty-clients", "30 klientów", "Trzydzieści potwierdzonych sprzedaży.", s.clients, 30), teaser: true },
    { ...a("forty-five-clients", "45 klientów", "Czterdzieści pięć potwierdzonych sprzedaży.", s.clients, 45), teaser: true },
  ];
}

export type Seen = { level: number; achievements: string[] } | null | undefined;

/** Co jest nowe względem tego, co partner już widział w zakładce Poziomy. */
export function newSince(seen: Seen, s: PartnerStats) {
  const level = levelFor(s.clients).index;
  const done = achievementsFor(s).filter((a) => a.done).map((a) => a.id);
  const newAchievements = done.filter((id) => !seen?.achievements.includes(id));
  const levelUp = level > (seen?.level ?? 0);
  return { level, done, newAchievements, levelUp, any: levelUp || newAchievements.length > 0 };
}
