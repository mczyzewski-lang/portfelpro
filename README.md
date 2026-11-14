# Portfel.pro — Portfel Profesjonalisty

Platforma partnerska: partnerzy polecają usługi spółek z grupy AV i otrzymują prowizję za skuteczne polecenia.
Działające MVP: landing, rejestracja, panel partnera, linki polecające z atrybucją, leady, konwersje, prowizje, wypłaty i panel administratora.

> **Dane demonstracyjne.** Stawki oznaczone „DEMO” oraz strony `/demo/...` są przykładowe i nie są oficjalną ofertą.
> Żadna integracja zewnętrzna (CRM, strony spółek, e-mail) nie jest podłączona — system pokazuje wyłącznie dane, które faktycznie zarejestrował.

## Stack

| Warstwa | Wybór |
|---|---|
| Aplikacja | Next.js 16 (App Router, Server Actions), React 19, TypeScript |
| UI | Tailwind CSS 4, własne lekkie komponenty w stylu shadcn/ui, Lucide, font Manrope (self-hosted) |
| Baza | PostgreSQL + Drizzle ORM, migracje SQL w `drizzle/` |
| Walidacja | Zod (formularze, akcje serwerowe, webhook) |
| Testy | Vitest (logika), Playwright (pełny przepływ e2e) |

Świadome odstępstwa od preferowanego stacku:

- **Autoryzacja jest własna (sesje w bazie, hasła scrypt), a nie Supabase Auth.** Dzięki temu aplikacja działa i jest testowalna bez kluczy zewnętrznych. Baza to zwykły PostgreSQL — `DATABASE_URL` może wskazywać na Supabase. Przejście na Supabase Auth wymaga podmiany `src/lib/auth.ts`.
- Formularze używają Server Actions + `useActionState` zamiast React Hook Form (mniej JS po stronie klienta, działają także przed hydratacją).

## Uruchomienie lokalne

Wymagania: Node.js 20+, PostgreSQL 14+.

```bash
cp .env.example .env        # uzupełnij DATABASE_URL, APP_SECRET, WEBHOOK_SECRET, ADMIN_PASSWORD
npm install
npm run db:migrate          # tworzy schemat
npm run db:seed             # spółki, usługi, materiały demo, konto administratora
npm run dev                 # http://localhost:3000
```

Konto demo partnera (tylko przy `DEMO_MODE=true`): `demo@demo.pl` / `demo` (z pięcioma przykładowymi poleceniami na różnych etapach — klienci z dopiskiem „(demo)”, identyfikatory `DEMO-1…5`; są też widoczne w panelu administratora) — dane są pokazane na stronie logowania; przy `DEMO_MODE=false` konto jest zablokowane.

Logowanie administratora: `ADMIN_EMAIL` / `ADMIN_PASSWORD` z `.env` → `/logowanie` → `/admin`.

| Skrypt | Działanie |
|---|---|
| `npm run db:generate` | generuje migrację po zmianie `src/db/schema.ts` |
| `npm run db:migrate` | stosuje migracje |
| `npm run db:seed` | dodaje brakujące dane demo (nie nadpisuje zmian z panelu) |
| `npm run db:reset` | **usuwa wszystko**, migruje i seeduje (tylko lokalna baza) |
| `npm test` | testy jednostkowe |
| `npm run test:e2e` | test end-to-end (baza `portfelpro_test`, port 3100) |
| `npm run lint`, `npm run typecheck` | jakość kodu |

### Zmienne środowiskowe

| Zmienna | Opis |
|---|---|
| `DATABASE_URL` | connection string PostgreSQL |
| `APP_URL` | publiczny adres aplikacji — z niego budowane są linki `…/r/<token>` |
| `APP_SECRET` | min. 32 losowe znaki; HMAC adresów IP i kontaktów (deduplikacja) |
| `WEBHOOK_SECRET` | token Bearer dla `/api/v1/events`; bez niego webhook odpowiada 503 |
| `DEMO_MODE` | `true` = stawki „Demo” widoczne z etykietą DEMO i używane do naliczeń; `false` = pokazywane jako „Stawka do ustalenia” i nienaliczane automatycznie |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | konto tworzone przez seed |
| `GOOGLE_MAPS_API_KEY` | opcjonalnie: klucz Google z włączonym „Places API (New)” — włącza przycisk „Pobierz z Google” przy spółce |

## Jak to działa

### Role i statusy

- **Partner**: `pending` → `active` → `suspended`. Konto oczekujące przegląda katalog, ale nie dostaje linków. Każdy partner ma stały numer `PP-000123` (sekwencja w bazie).
- **Usługi regulowane** (prawne, finansowe, zdrowotne, rodzinne) mają `access = approval_required`: partner składa wniosek, administrator zatwierdza formę współpracy i ewentualną stawkę indywidualną dla tej pary partner–usługa.
- **Administrator**: `/admin`. Każda strona i każda akcja zaczyna się od `requireAdmin()`.

### Linki, kliknięcia, atrybucja

1. Dla każdego materiału partner ma własny link `APP_URL/r/<token>` (losowy token, bez identyfikatorów z bazy). Opcjonalnie osobne linki per kampania.
2. `/r/<token>` zapisuje kliknięcie, tworzy **atrybucję** i przekierowuje na stronę docelową z parametrem `?pp_ref=<token atrybucji>`.
3. Reguła: **pierwszy partner w oknie atrybucji** (domyślnie 30 dni, ustawiane w panelu), liczona osobno dla każdej usługi. Kolejne kliknięcie w link innego partnera nie przejmuje klienta.
4. Boty i podglądy linków (WhatsApp, Slack itd.) są przekierowywane bez zliczania. Odświeżenia w ciągu 30 minut nie dublują kliknięcia.
5. Lead powstaje z formularza, webhooka, importu CSV lub ręcznie. Duplikaty (ten sam kontakt lub `external_id` w ramach usługi) nie tworzą drugiego leada.

### Atrybucja między domenami

Cookie `pp_vid` działa tylko w domenie Portfel.pro. Na stronach spółek (inna domena) atrybucję niesie parametr `pp_ref`:

```html
<script src="https://portfel.pro/pp-ref.js" defer></script>
<form> … <input type="hidden" name="pp_ref"> … </form>
```

Skrypt zapamiętuje `pp_ref` na czas wizyty i uzupełnia ukryte pola. Backend spółki przekazuje tę wartość jako `ref` w webhooku.

### Webhook dla CRM i formularzy

```
POST /api/v1/events
Authorization: Bearer <WEBHOOK_SECRET>
Idempotency-Key: <unikalny identyfikator zdarzenia, 8–120 znaków>
Content-Type: application/json
```

| `type` | Pola | Skutek |
|---|---|---|
| `lead.created` | `service`, `external_id`, `ref?`, `stage?`, `contact?{name,email,phone}`, `consent?` | lead z atrybucją |
| `lead.status` | `service`, `external_id`, `status` (`contacted`, `qualified`, `in_progress`, `rejected`, `cancelled`), `note?` | zmiana statusu; `qualified` nalicza prowizję w modelu „za lead” |
| `sale.confirmed` | `service`, `external_id`, `net_amount?` (zł), `ref?`, `occurred_at?` | konwersja + prowizja |
| `sale.refunded` | `service`, `external_id`, `reason?` | anulowanie lub korekta prowizji |

`service` to slug usługi. Powtórzenie tego samego `Idempotency-Key` zwraca zapisany wynik (`idempotent_replay: true`). Niezależnie od klucza jedna sprzedaż na lead naliczana jest tylko raz.

### Prowizje

- Modele: stała kwota za klienta, procent wartości netto, kwota za zakwalifikowany lead, model niestandardowy (kwota wpisywana ręcznie).
- Statusy prowizji: `pending` (naliczona) → `approved` (zatwierdzona do wypłaty) → `paid`; `cancelled`. Status klienta (leada) jest osobny.
- Prowizja zapisuje **migawkę stawki** z chwili naliczenia — zmiana stawki usługi lub stawki indywidualnej nie zmienia historii.
- Zwrot: prowizja niewypłacona jest anulowana; wypłacona dostaje ujemną **korektę**, która pomniejsza kolejną wypłatę.
- Ręczna zmiana przypisania partnera wymaga powodu; wszystko trafia do historii leada i dziennika zmian (`/admin/dziennik`).

### Pakiet startowy i poziomy

Każdy nowy partner dostaje losowy kod pakietu startowego (widoczny i edytowalny w widoku partnera w panelu admina). Dopóki go nie wpisze, na pulpicie wisi okienko „Potwierdzenie odbioru pakietu startowego” (zdjęcie → kod → krótkie nagranie odblokowane kodem; adres nagrania ustawia się w `/admin/ustawienia`). Gwiazda Szklana jest za 1 klienta, który zapłacił, albo 3 polecenia; Lodowa topnieje przez 12 tygodni od dołączenia i zostaje po niej woda. Kod konta demo: `F3F4F5`. Poziomom towarzyszą gwiazdy — Lodowa (z soplami), Szklana (1 klient), Brązowa (5), Srebrna (20), Złota (50) — pokazane w karcie poziomu w zakładce Poziomy; gwiazda aktualnego poziomu jest też w okienku pakietu startowego i przy awatarze. Nowe osiągnięcia i poziomy sygnalizuje confetti przy ikonie Poziomy; po wejściu w zakładkę oznaczają się jako obejrzane.

### Portfel Publiczny

W Koncie partner może włączyć „Portfel Publiczny”: stronę `/p/imie-nazwisko` (przy powtórce nazwiska z dopiskiem `-2`, `-3`…) ze swoim zdjęciem, imieniem i nazwiskiem, podpisem oraz usługami, które może polecać. Każda usługa ma przyciski „Dowiedz się więcej” (link edukacyjny) i „Porozmawiaj” (link do konsultacji) — to linki polecające partnera, liczone osobno jako kampania „portfel publiczny”. Każda usługa ma też własny adres `/p/imie-nazwisko/<usługa>` (ikona „otwórz w nowym oknie”) — stronę samej usługi do wysłania klientowi bez całego katalogu. W szczegółach każdej usługi jest też formularz „Zostaw kontakt” — zgłoszenie trafia jako polecenie przypisane do partnera (z zachowaniem reguły pierwszego partnera). Strona nie pokazuje prowizji, a po wyłączeniu przełącznika przestaje istnieć (także zdjęcie).

### Hasło skojarzeniowe i ekspert usługi

Każda usługa ma hasło „Słyszysz: „…”?” (co partner słyszy od klienta — np. „długi osobiste” przy upadłości) pokazywane nad nazwą usługi w panelu i katalogu, oraz eksperta-twarz usługi (imię i nazwisko, rola, zdjęcie). Oba ustawia się w edycji usługi. Eksperci z danych startowych są fikcyjni: mają dopisek „(demo)”, wygenerowane portrety w `public/demo/eksperci/` i są widoczni tylko przy `DEMO_MODE=true`.

### Wideo (reels 9:16)

- **Usługa:** pole „Wideo o usłudze” w edycji usługi — w karcie usługi pojawia się kafelek, który otwiera pionowe wideo na cały ekran.
- **Opiekun:** pole „Wideo powitalne” w `/admin/ustawienia` — partner odtwarza je, dotykając zdjęcia opiekuna w Wiadomościach.

Podaje się bezpośredni adres pliku mp4/webm (aplikacja nie przechowuje wideo). Pliki w `public/demo/` to krótkie plansze przykładowe bez dźwięku; są pokazywane tylko przy `DEMO_MODE=true`.

### Wiadomości i opiekun

Zakładka „Wiadomości” w panelu partnera pokazuje kartę opiekuna (imię, stanowisko, telefon, e-mail) i czat z nim. Opiekunem jest konto administratora: domyślnie pierwszy administrator, innego przypisuje się w widoku partnera. Swój telefon i stanowisko opiekun ustawia w `/admin/ustawienia`, na rozmowy odpowiada w `/admin/wiadomosci`. Czat odświeża się co kilka sekund; powiadomień e-mail ani push nie ma.

### Prywatność

- Partner nie widzi danych klienta, który zgłosił się przez link — tylko numer polecenia, usługę, etap procesu i prowizję. Przy zgłoszeniach, które sam przekazał do konsultacji (za zgodą klienta), widzi wpisane przez siebie imię i nazwisko. Przy usługach wrażliwych formularz wymaga dodatkowego potwierdzenia, że klient wie, iż partner zobaczy etap zgłoszenia.
- Partner widzi cały przebieg polecenia (Zgłoszenie → Kontakt → Kwalifikacja → Realizacja → Sprzedaż oraz kroki prowizji), ale bez notatek administratora.
- Poziomy i osiągnięcia (`/app/poziomy`) są liczone z faktycznych danych i nie wpływają na stawki.
- Formularze nie zbierają opisu sytuacji klienta (istotne dla usług zdrowotnych i rodzinnych).
- Adresy IP są przechowywane wyłącznie jako HMAC. Brak zewnętrznych skryptów analitycznych.
- Cookies: `pp_session` (logowanie, HttpOnly) i `pp_vid` (atrybucja, HttpOnly, ważne przez okno atrybucji).

### Oceny Google

Na stronie i w panelu widnieje kryterium katalogu (min. 100 opinii, średnia powyżej 4,7/5). Rzeczywistą ocenę i liczbę opinii każdej spółki ustawia się w `/admin/spolki`: ręcznie albo przyciskiem „Pobierz z Google” (wymaga `GOOGLE_MAPS_API_KEY`). Dopóki spółka nie ma danych, jej ocena nie jest nigdzie pokazywana; spółka poniżej kryterium dostaje w panelu ostrzeżenie.

### Logotypy spółek

Pliki w `public/brands/` pochodzą ze stron spółek (pravna.pl, nowy-etap.pl, risify.pl, budaro.pl). Każda spółka ma w panelu dwa pola: pełny znak (strona główna) i kwadratową ikonę (karty usług). PRAVNA i NOWY ETAP mają tylko ikonę — pełny znak Nowego Etapu jest przygotowany na ciemne tło, a pravna.pl nie udostępnia osobnego pliku logo.

## Struktura

```
src/db/schema.ts          schemat bazy (użytkownicy, partnerzy, usługi, materiały, linki, kliknięcia,
                          atrybucje, leady, konwersje, prowizje, wypłaty, audyt, ustawienia)
src/db/seed-data.ts       treści demonstracyjne
src/lib/commission.ts     czysta logika stawek i naliczeń
src/lib/tracking.ts       linki, kliknięcia, atrybucja, leady
src/lib/conversions.ts    konwersje, prowizje, zwroty, wypłaty
src/lib/webhook.ts        zdarzenia zewnętrzne z idempotencją
src/app/                  landing, /app (partner), /admin, /r/[token], /demo, /api/v1/events
e2e/flow.spec.ts          pełny scenariusz: rejestracja → link → lead → sprzedaż → prowizja → wypłata
```

## Wdrożenie

Aplikacja nie jest wdrożona produkcyjnie. Do wdrożenia potrzebne są:

1. PostgreSQL (np. Supabase, Neon, RDS) i `DATABASE_URL`; `npm run db:migrate` w pipeline.
2. Hosting Node (Vercel lub `npm run build && npm start`). Limity zapytań działają w bazie, więc są poprawne także na wielu instancjach.
3. Silne `APP_SECRET`, `WEBHOOK_SECRET`, `ADMIN_PASSWORD`; `APP_URL` z docelową domeną; `DEMO_MODE=false`.
4. Reverse proxy musi ustawiać `X-Forwarded-For` (limity i hash IP).

### Railway

Repo zawiera `railway.json`: przed każdym wdrożeniem uruchamia się `npm run db:deploy` (migracje + seed brakujących danych), start to `npm start`. Build nie wymaga żadnych zmiennych. W usłudze aplikacji ustaw zmienne:

| Zmienna | Wartość |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (referencja do usługi Postgres) |
| `APP_URL` | publiczny adres, np. `https://${{RAILWAY_PUBLIC_DOMAIN}}` lub własna domena |
| `APP_SECRET`, `WEBHOOK_SECRET` | losowe ciągi (`openssl rand -hex 32`) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | dane pierwszego administratora (hasło min. 10 znaków) |
| `DEMO_MODE` | `true` na czas testów, `false` przy starcie produkcyjnym |

Następnie w Settings → Networking wygeneruj domenę (usługa jest domyślnie niewystawiona). Aplikacja nie zapisuje nic na dysku — wolumen przy usłudze aplikacji nie jest potrzebny.

### Przed startem produkcyjnym

- [ ] Potwierdzić, że każda spółka w katalogu faktycznie spełnia deklarowane na stronie głównej kryterium opinii Google (min. 100 opinii, średnia powyżej 4,7/5) — aplikacja tego nie weryfikuje automatycznie.

- [ ] Zatwierdzić rzeczywiste stawki i ustawić im status „Zatwierdzona” (inaczej partnerzy widzą „Stawka do ustalenia”).
- [ ] **Weryfikacja prawna**: dopuszczalność i forma wynagradzania za polecenia usług prawnych, finansowych i zdrowotnych; regulamin i polityka prywatności (`/regulamin`, `/prywatnosc` to wzory robocze); podstawa prawna cookie `pp_vid`.
- [ ] Podmienić adresy materiałów (`URL docelowy`) na strony spółek i osadzić `pp-ref.js` w ich formularzach.
- [ ] Podłączyć CRM spółek do webhooka.
- [ ] Dodać e-maile transakcyjne (potwierdzenie rejestracji, reset hasła, powiadomienia) — obecnie nie ma wysyłki poczty ani resetu hasła przez e-mail.
- [ ] Dane do wypłat i fakturowanie partnerów — obecnie wypłata jest oznaczana ręcznie z tytułem przelewu.
