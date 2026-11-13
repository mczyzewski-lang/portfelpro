/**
 * Poziomy i osiągnięcia partnera — liczone wyłącznie z faktycznych danych (kliknięcia, polecenia, potwierdzone sprzedaże).
 * Mają charakter informacyjny: nie zmieniają stawek ani warunków prowizji.
 */
export type PartnerStats = {
  clicks: number; leads: number; clients: number; paid: number;
  servicesShared: number; stagesUsed: number; handoffs: number;
};

export const LEVELS = [
  { name: "Start", min: 0 },
  { name: "Brązowy", min: 1 },
  { name: "Srebrny", min: 3 },
  { name: "Złoty", min: 10 },
  { name: "Platynowy", min: 25 },
] as const;

export function levelFor(clients: number) {
  let index = 0;
  LEVELS.forEach((l, i) => { if (clients >= l.min) index = i; });
  const current = LEVELS[index];
  const next = LEVELS[index + 1] ?? null;
  const progress = next ? Math.min(1, (clients - current.min) / (next.min - current.min)) : 1;
  return { index, current, next, progress, missing: next ? next.min - clients : 0 };
}

export type Achievement = { id: string; title: string; description: string; done: boolean; current: number; target: number };

export function achievementsFor(s: PartnerStats): Achievement[] {
  const a = (id: string, title: string, description: string, current: number, target: number): Achievement =>
    ({ id, title, description, current: Math.min(current, target), target, done: current >= target });
  return [
    a("first-click", "Pierwszy otwarty link", "Klient otworzył materiał z Twojego linku.", s.clicks, 1),
    a("first-lead", "Pierwsze polecenie", "Klient zostawił kontakt albo przekazałeś go do konsultacji.", s.leads, 1),
    a("first-client", "Pierwszy klient", "Pierwsza potwierdzona sprzedaż z Twojego polecenia.", s.clients, 1),
    a("first-payout", "Pierwsza wypłata", "Prowizja trafiła na Twoje konto.", s.paid > 0 ? 1 : 0, 1),
    a("three-paths", "Trzy drogi", "Użyłeś linków z edukacji, konsultacji i transakcji.", s.stagesUsed, 3),
    a("wide-wallet", "Szeroki portfel", "Twoje linki do 3 różnych usług zostały otwarte.", s.servicesShared, 3),
    a("handoff", "Ciepłe przekazanie", "Przekazałeś kontakt klienta bezpośrednio do konsultacji.", s.handoffs, 1),
    a("ten-leads", "10 poleceń", "Dziesięć osób trafiło do specjalistów dzięki Tobie.", s.leads, 10),
    a("five-clients", "5 klientów", "Pięć potwierdzonych sprzedaży.", s.clients, 5),
  ];
}
