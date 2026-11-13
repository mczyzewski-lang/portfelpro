import { expect, test, type Browser, type Page } from "@playwright/test";
import { testEnv } from "../playwright.config";

/**
 * Najważniejszy scenariusz MVP od początku do końca (kroki 1–17 ze specyfikacji):
 * rejestracja → zatwierdzenie → link → kliknięcie → lead z atrybucją → sprzedaż → prowizja → zatwierdzenie → wypłata.
 */
const PASSWORD = "haslo-partnera-2026";
const SERVICE = "Zastrzeżenie znaku towarowego";

async function register(page: Page, email: string, first: string) {
  await page.goto("/rejestracja");
  await page.locator("input[name=firstName]").fill(first);
  await page.locator("input[name=lastName]").fill("Testowa");
  await page.locator("input[name=email]").fill(email);
  await page.locator("input[name=password]").fill(PASSWORD);
  await page.getByLabel("Osoba fizyczna").check();
  await page.getByLabel(/Akceptuję/).check();
  await page.getByRole("button", { name: "Załóż bezpłatny Portfel" }).click();
  await page.waitForURL("**/app/onboarding");
  const pid = (await page.getByTestId("onboarding-partner-id").innerText()).trim();
  expect(pid).toMatch(/^PP-\d{6}$/);
  await page.getByRole("radiogroup").getByText("Agencje marketingowe").click();
  await page.getByRole("button", { name: "Dalej" }).click();
  await page.waitForURL("**/app/onboarding?krok=2");
  await expect(page.getByRole("heading", { name: "Polecane dla Ciebie" })).toBeVisible();
  await expect(page.getByText(SERVICE)).toBeVisible();
  return pid;
}

async function adminPage(browser: Browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on("dialog", (d) => d.accept());
  await page.goto("/logowanie");
  await page.locator("input[type=email]").fill(testEnv.ADMIN_EMAIL);
  await page.locator("input[type=password]").fill(testEnv.ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Zaloguj się", exact: true }).click();
  await page.waitForURL("**/admin");
  return page;
}

async function approvePartner(admin: Page, pid: string) {
  await admin.goto(`/admin/partnerzy?q=${pid}`);
  await admin.getByRole("link", { name: "Otwórz" }).first().click();
  await admin.getByTestId("partner-status").selectOption("active");
  await admin.getByTestId("partner-status-save").click();
  await expect(admin.getByText("Konto partnera jest aktywne.")).toBeVisible();
}

async function educationLink(page: Page) {
  await page.goto("/app/uslugi/znak-towarowy");
  await page.getByTestId("stage-education").click();
  const copy = page.getByTestId("copy-education").first();
  const url = await copy.getAttribute("data-copy");
  expect(url).toMatch(/\/r\/[A-Za-z0-9]{7}$/);
  return { url: url!, copy };
}

test("pełny przepływ: od rejestracji partnera do wypłaty prowizji", async ({ browser, page, context, request }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  // 1–2. Landing na telefonie: idea, usługi i stawki widoczne bez logowania
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Poszerz swój portfel usług");
  const preview = page.getByLabel("Usługi i prowizje");
  await expect(preview.getByText(SERVICE)).toBeVisible();
  await expect(preview.getByText("300 zł").first()).toBeVisible();
  await expect(preview.getByText("DEMO").first()).toBeVisible();
  await expect(preview.getByText("Stawka do ustalenia").first()).toBeVisible(); // brak wymyślonych kwot
  await expect(page.getByTestId("google-criteria")).toContainText("min. 100 opinii");
  await expect(page.getByTestId("google-criteria")).toContainText("powyżej 4,7/5");
  await expect(page.locator('img[src="/brands/risify.svg"]')).toHaveCount(1); // logotypy spółek
  await expect(page.getByTestId("google-trust")).toContainText(">4,7/5");
  await expect(page.getByTestId("google-trust").getByRole("img", { name: "Google" })).toBeVisible();
  await expect(page.getByLabel("Ocena w Google: 4,8 na 5, 964 opinii").first()).toBeVisible(); // rzeczywiste oceny spółek

  // 3–4. Rejestracja i unikalny numer partnera
  const pid = await register(page, "anna@e2e.test", "Anna");
  await page.goto("/app");
  await expect(page.getByTestId("partner-id")).toHaveText(pid);

  // Konto oczekujące: usługa widoczna, linki zablokowane
  await page.goto("/app/uslugi/znak-towarowy");
  await expect(page.getByText("Linki aktywują się po zatwierdzeniu Twojego konta")).toBeVisible();
  await expect(page.getByTestId("copy-education")).toHaveCount(0);

  // Zatwierdzenie partnera w panelu admina
  const admin = await adminPage(browser);
  await approvePartner(admin, pid);

  // 5–8. Z portfela wchodzę w usługę; dopiero w niej wybieram etap i kopiuję osobisty link
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "Pulpit" })).toBeVisible();
  await expect(page.getByText("Wersja demonstracyjna")).toHaveCount(0); // belka demo ukryta
  await page.getByTestId("go-wallet").click(); // Portfel = lista usług
  await page.waitForURL("**/app/uslugi");
  await expect(page.getByTestId("google-trust")).toContainText("Tylko firmy sprawdzone przez klientów"); // także w panelu partnera
  await page.getByTestId("service-znak-towarowy").click();
  await page.waitForURL("**/app/uslugi/znak-towarowy");
  await expect(page.getByRole("heading", { name: "Na jakim etapie jest Twój klient?" })).toBeVisible();
  await page.getByTestId("stage-consultation").click();
  await expect(page.getByTestId("copy-consultation")).toHaveCount(1);
  await expect(page.getByTestId("copy-education")).toHaveCount(0); // każdy etap to inne linki
  await expect(page.getByTestId("service-rate")).toContainText("300 zł");
  await expect(page.getByText("Za zakończoną i opłaconą usługę")).toBeVisible();
  const { url: link, copy } = await educationLink(page);
  await copy.click();
  await expect(copy).toContainText("Link skopiowany");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(link);

  // Usługa regulowana wymaga odrębnego zatwierdzenia
  await page.goto("/app/uslugi/psychoterapia-online");
  await expect(page.getByTestId("service-rate")).toContainText("Stawka do ustalenia");
  await expect(page.getByRole("button", { name: "Poproś o dostęp do usługi" })).toBeVisible();

  // 9–11. Klient (anonimowy) otwiera materiał — kliknięcie i atrybucja
  const clientCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const client = await clientCtx.newPage();
  await client.goto(link);
  await expect(client).toHaveURL(/\/demo\/znak-towarowy\/ryzyko-niezarejestrowanej-marki\?pp_ref=[A-Za-z0-9]{20}/);
  await client.goto(link); // odświeżenie nie dubluje kliknięcia

  // 12–13. Klient przechodzi do konsultacji — powiązanie z partnerem zostaje
  await client.getByTestId("go-consultation").click();
  await expect(client).toHaveURL(/ocena-mozliwosci-rejestracji\?pp_ref=/);
  await client.locator("input[name=name]").fill("Klient Testowy");
  await client.locator("input[name=email]").fill("klient@e2e.test");
  await client.getByLabel(/Zgadzam się/).check();
  await client.getByTestId("lead-submit").click();
  await expect(client.getByTestId("lead-success")).toBeVisible();

  // Ponowne zgłoszenie tego samego klienta nie tworzy drugiego leada
  await client.reload();
  await client.locator("input[name=name]").fill("Klient Testowy");
  await client.locator("input[name=email]").fill("KLIENT@e2e.test");
  await client.getByLabel(/Zgadzam się/).check();
  await client.getByTestId("lead-submit").click();
  await expect(client.getByTestId("lead-success")).toBeVisible();

  // First touch: link drugiego partnera nie przejmuje klienta w oknie atrybucji
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p2 = await ctx2.newPage();
  const pid2 = await register(p2, "bartek@e2e.test", "Bartek");
  expect(pid2).not.toBe(pid);
  await approvePartner(admin, pid2);
  const { url: link2 } = await educationLink(p2);
  expect(link2).not.toBe(link);
  await client.goto(link2);
  await client.getByTestId("go-consultation").click();
  await client.locator("input[name=name]").fill("Drugi Klient");
  await client.locator("input[name=email]").fill("klient2@e2e.test");
  await client.getByLabel(/Zgadzam się/).check();
  await client.getByTestId("lead-submit").click();
  await expect(client.getByTestId("lead-success")).toBeVisible();

  // Panel partnera: kliknięcie i polecenia widoczne, prowizji jeszcze brak; dane klienta ukryte
  await page.goto("/app");
  await expect(page.getByTestId("stat-clicks")).toHaveText("1");
  await expect(page.getByTestId("stat-leads")).toHaveText("2");
  await expect(page.getByTestId("sum-pending")).toHaveText("0 zł");
  await page.goto("/app/polecenia");
  const table = page.getByTestId("referrals-table");
  await expect(table.getByText(SERVICE).first()).toBeVisible();
  await expect(table.getByText("Zarejestrowany").first()).toBeVisible();
  await expect(page.getByText("klient@e2e.test")).toHaveCount(0);
  await expect(page.getByText("Klient Testowy")).toHaveCount(0);
  // Drugi partner nie dostał klienta i nie widzi cudzych danych
  await p2.goto("/app");
  await expect(p2.getByTestId("stat-leads")).toHaveText("0");
  await expect(p2.getByTestId("stat-clicks")).toHaveText("1");

  // Dziennik zdarzeń na pulpicie i pełny przebieg polecenia (nie tylko wejście i sprzedaż)
  await page.goto("/app");
  await expect(page.getByTestId("activity").getByText("Klient otworzył Twój link")).toBeVisible();
  await expect(page.getByTestId("activity").getByText("Nowe polecenie").first()).toBeVisible();
  await admin.goto("/admin/polecenia");
  await admin.getByRole("row", { name: /klient@e2e\.test/ }).getByTestId("open-lead").click();
  await admin.getByTestId("lead-status").selectOption("contacted");
  await admin.getByTestId("lead-status-save").click();
  await expect(admin.getByText("Zmieniono status.")).toBeVisible();
  await page.goto("/app");
  await page.getByTestId("activity").getByText("Kontakt nawiązany").click();
  await page.waitForURL("**/app/polecenia/**");
  await expect(page.getByTestId("process").locator('[aria-current="step"]')).toContainText("Kontakt");
  await expect(page.getByTestId("timeline")).toContainText("Kontakt nawiązany");
  await expect(page.getByText("klient@e2e.test")).toHaveCount(0);

  // 14–15. Administrator potwierdza sprzedaż → prowizja naliczona wg obowiązującej stawki
  await admin.goto("/admin/polecenia");
  await admin.getByRole("row", { name: /klient@e2e\.test/ }).getByTestId("open-lead").click();
  await expect(admin.getByText("Przypisany automatycznie na podstawie linku polecającego.")).toBeVisible();
  const leadUrl = admin.url();
  await admin.getByTestId("net-amount").fill("2500");
  await admin.getByTestId("confirm-sale").click();
  await expect(admin.getByText("Sprzedaż potwierdzona, prowizja naliczona.")).toBeVisible();
  await admin.goto(leadUrl);
  await expect(admin.getByTestId("confirm-sale")).toHaveCount(0); // brak możliwości podwójnego naliczenia
  await expect(admin.getByTestId("commission-row")).toContainText("300 zł");

  // 16. Partner widzi prowizję (oczekującą) i ekran pierwszego sukcesu
  await page.goto("/app");
  await expect(page.getByTestId("first-success")).toBeVisible();
  await expect(page.getByTestId("sum-pending")).toHaveText("300 zł");
  await expect(page.getByTestId("stat-clients")).toHaveText("1");
  await page.getByRole("button", { name: "Świetnie, dalej" }).click();
  await expect(page.getByTestId("first-success")).toHaveCount(0);

  // Zmiana stawki w panelu admina nie zmienia prowizji już naliczonej
  await admin.goto("/admin/uslugi");
  await admin.getByRole("row", { name: new RegExp(SERVICE) }).getByRole("link", { name: "Edytuj" }).click();
  await admin.locator("input[name=amount]").first().fill("450");
  await admin.getByTestId("service-save").click();
  await expect(admin.getByText(/Zapisano usługę/)).toBeVisible();
  // …oraz edycja materiału
  await admin.getByRole("row", { name: /Co ryzykujesz/ }).getByRole("link", { name: "Edytuj" }).click();
  await admin.locator("input[name=title]").fill("Czy Twoja nazwa firmy jest chroniona?");
  await admin.getByRole("button", { name: "Zapisz materiał" }).click();
  await expect(admin.getByText("Zapisano.")).toBeVisible();

  await page.goto("/app/uslugi/znak-towarowy");
  await expect(page.getByTestId("service-rate")).toContainText("450 zł");
  await expect(page.getByText("Czy Twoja nazwa firmy jest chroniona?")).toBeVisible();
  await page.goto("/app");
  await expect(page.getByTestId("sum-pending")).toHaveText("300 zł");

  // 17. Zatwierdzenie i wypłata
  await admin.goto(leadUrl);
  await admin.getByTestId("approve-commission").click();
  await expect(admin.getByText("Prowizja zatwierdzona do wypłaty.")).toBeVisible();
  await page.goto("/app");
  await expect(page.getByTestId("sum-approved")).toHaveText("300 zł");
  await expect(page.getByTestId("sum-pending")).toHaveText("0 zł");

  await admin.goto("/admin/prowizje");
  const payRow = admin.getByTestId("payout-row").filter({ hasText: "Anna Testowa" });
  await payRow.locator("input[name=reference]").fill("E2E-1");
  await payRow.getByTestId("mark-paid").click();
  await expect(admin.getByText(/Oznaczono wypłatę 300,00 zł/)).toBeVisible();
  await page.goto("/app");
  await expect(page.getByTestId("sum-paid")).toHaveText("300 zł");
  await expect(page.getByTestId("sum-approved")).toHaveText("0 zł");
  await page.goto("/app/polecenia?tab=prowizje");
  await expect(page.getByText("Wypłacona")).toBeVisible();

  // Webhook: autoryzacja, idempotencja, sprzedaż z zewnętrznego CRM dla drugiego klienta
  const body = { type: "lead.created", service: "znak-towarowy", external_id: "CRM-77", contact: { email: "klient2@e2e.test" } };
  expect((await request.post("/api/v1/events", { data: body, headers: { "Idempotency-Key": "evt-00000001" } })).status()).toBe(401);
  const auth = { Authorization: `Bearer ${testEnv.WEBHOOK_SECRET}` };
  expect((await request.post("/api/v1/events", { data: body, headers: auth })).status()).toBe(400); // brak klucza idempotencji
  const first = await request.post("/api/v1/events", { data: body, headers: { ...auth, "Idempotency-Key": "evt-00000001" } });
  expect(await first.json()).toMatchObject({ ok: true, duplicate: true, attributed: true }); // dopasowany do leada z formularza
  const sale = { type: "sale.confirmed", service: "znak-towarowy", external_id: "CRM-77", net_amount: 3000 };
  const s1 = await request.post("/api/v1/events", { data: sale, headers: { ...auth, "Idempotency-Key": "evt-00000002" } });
  expect(await s1.json()).toMatchObject({ ok: true, duplicate: false, commission_accrued: true });
  const replay = await request.post("/api/v1/events", { data: sale, headers: { ...auth, "Idempotency-Key": "evt-00000002" } });
  expect(await replay.json()).toMatchObject({ idempotent_replay: true });
  const again = await request.post("/api/v1/events", { data: sale, headers: { ...auth, "Idempotency-Key": "evt-00000003" } });
  expect(await again.json()).toMatchObject({ ok: true, duplicate: true, commission_accrued: false }); // inny klucz, ta sama sprzedaż

  // Druga prowizja naliczona już po nowej stawce (450 zł); pierwsza pozostała 300 zł
  await page.goto("/app");
  await expect(page.getByTestId("sum-pending")).toHaveText("450 zł");
  await expect(page.getByTestId("sum-paid")).toHaveText("300 zł");

  // Partner przekazuje dane klienta do konsultacji i od razu widzi przebieg
  await page.goto("/app/uslugi/znak-towarowy");
  await page.getByTestId("stage-consultation").click();
  await page.getByTestId("handoff").locator("summary").click();
  await page.getByTestId("handoff").locator("input[name=name]").fill("Piotr Przekazany");
  await page.getByTestId("handoff").locator("input[name=phone]").fill("600 700 800");
  await page.getByTestId("handoff").getByLabel(/Klient zgodził się/).check();
  await page.getByTestId("handoff-submit").click();
  await page.waitForURL("**/app/polecenia/**");
  await expect(page.getByTestId("handoff-success")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Piotr Przekazany" })).toBeVisible(); // własne zgłoszenie — widzi nazwisko
  await expect(page.getByTestId("process").locator('[aria-current="step"]')).toContainText("Zgłoszenie");
  const handoffUrl = page.url();
  await p2.goto(handoffUrl); // inny partner nie zobaczy cudzego polecenia
  await expect(p2.getByRole("heading", { name: "Nie znaleźliśmy tej strony" })).toBeVisible();
  await admin.goto("/admin/polecenia");
  await expect(admin.getByRole("row", { name: /Piotr Przekazany/ })).toContainText("Anna Testowa");
  // Wiadomości: opiekun z telefonem nad czatem, rozmowa w obie strony
  await admin.goto("/admin/ustawienia");
  await admin.getByTestId("my-phone").fill("+48 600 100 200");
  await admin.getByTestId("my-profile-save").click();
  await expect(admin.getByText("Zapisano profil opiekuna.")).toBeVisible();
  await page.goto("/app/wiadomosci");
  await expect(page.getByTestId("manager-card")).toContainText("Twój opiekun");
  await expect(page.getByTestId("manager-card").getByRole("link", { name: "+48 600 100 200" })).toHaveAttribute("href", "tel:+48600100200");
  await page.getByLabel("Treść wiadomości").fill("Dzień dobry, kiedy wypłata za L-01001?");
  await page.getByTestId("chat-send").click();
  await expect(page.getByTestId("chat-thread")).toContainText("kiedy wypłata");
  await admin.goto("/admin/wiadomosci");
  await expect(admin.getByTestId("inbox-row").filter({ hasText: "Anna Testowa" })).toContainText("1 nowe");
  await admin.getByTestId("inbox-row").filter({ hasText: "Anna Testowa" }).click();
  await admin.getByLabel("Treść wiadomości").fill("Dzień dobry! Wypłata jest już zrealizowana.");
  await admin.getByTestId("chat-send").click();
  await expect(admin.getByTestId("chat-thread")).toContainText("już zrealizowana");
  await page.goto("/app");
  await expect(page.getByTestId("unread-badge")).toHaveText("1"); // nieprzeczytana odpowiedź opiekuna
  await page.goto("/app/wiadomosci");
  await expect(page.getByTestId("chat-thread")).toContainText("już zrealizowana");
  await p2.goto("/app/wiadomosci"); // inny partner nie widzi cudzej rozmowy
  await expect(p2.getByTestId("chat-thread")).not.toContainText("kiedy wypłata");

  // Konto: zdjęcie z kadrowaniem, branża z ikonami nad statusem, zmiana hasła jako link
  await page.goto("/app/konto");
  await page.getByTestId("avatar-file").setInputFiles("public/brand/logo-512.png");
  await expect(page.getByTestId("avatar-crop")).toBeVisible();
  await page.getByLabel("Powiększ", { exact: true }).click();
  await page.getByTestId("avatar-save").click();
  await expect(page.locator('header img[src^="/app/avatar"]')).toBeVisible();
  const avatar = await page.request.get("/app/avatar");
  expect(avatar.headers()["content-type"]).toBe("image/jpeg");
  expect((await request.get("/app/avatar")).status()).toBe(404); // bez sesji brak dostępu
  const select = page.getByTestId("profession-select");
  await expect(select.getByRole("button", { expanded: false })).toContainText("Agencje marketingowe"); // widać wybraną pozycję
  await select.getByRole("button").first().click();
  await expect(select.getByRole("option").last()).toHaveText("Inne");
  await select.getByRole("option", { name: "Biura rachunkowe i księgowi" }).click(); // zapis od razu po wyborze
  await expect(select.getByRole("button", { expanded: false })).toContainText("Biura rachunkowe");
  await expect(page.getByTestId("logout")).toBeVisible(); // wylogowanie w kontenerze pod zmianą hasła
  await expect(page.locator('nav[aria-label="Główna"] [aria-current="page"]')).toHaveCount(0); // w Koncie żadna zakładka nie jest podświetlona
  await page.getByTestId("change-password-link").click();
  await expect(page.getByRole("heading", { name: "Zmiana hasła" })).toBeVisible();

  // Poziomy: liczone z faktycznych danych (2 potwierdzonych klientów → Brązowy)
  await page.goto("/app/poziomy");
  await expect(page.getByTestId("level-name")).toHaveText("Brązowy");
  await expect(page.locator('[data-done="true"]')).toHaveCount(5); // link, polecenie, klient, wypłata, przekazanie

  // Izolacja: partner nie wejdzie do panelu admina, anonim nie wejdzie do panelu partnera
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/app$/);
  expect((await request.get("/admin/eksport/leady")).status()).toBe(403);
  await client.goto("/app");
  await expect(client).toHaveURL(/\/logowanie/);

  // Konto demo (tylko w trybie demo): logowanie jednym przyciskiem, bez dostępu do admina
  const demoCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const demo = await demoCtx.newPage();
  await demo.goto("/logowanie");
  await expect(demo.getByTestId("demo-login")).toContainText("demo@demo.pl");
  await demo.getByRole("button", { name: "Zaloguj na konto demo" }).click();
  await demo.waitForURL("**/app");
  await expect(demo.getByTestId("sum-paid")).toHaveText("0 zł"); // nie widzi danych innych partnerów
  await expect(demo.getByTestId("stat-leads")).toHaveText("5"); // pięć przykładowych poleceń na różnych etapach
  await expect(demo.getByTestId("service-stats")).toContainText("Zastrzeżenie znaku towarowego"); // statystyka per usługa
  await demo.goto("/app/wiadomosci");
  await expect(demo.getByTestId("manager-card")).toContainText("Karolina Wysocka");
  await expect(demo.getByTestId("manager-card").getByRole("link", { name: "+48 600 000 000" })).toBeVisible();
  await expect(demo.getByTestId("manager-photo")).toBeVisible();
  expect((await demo.request.get(await demo.getByTestId("manager-photo").getAttribute("src") as string)).headers()["content-type"]).toBe("image/jpeg");
  await demo.goto("/app/polecenia");
  await expect(demo.getByTestId("referral-row")).toHaveCount(5);
  await expect(demo.getByText("Marta Kowalczyk (demo)")).toBeVisible();
  await demo.goto("/admin");
  await expect(demo).toHaveURL(/\/app$/);

  // Błędny link polecający
  await client.goto("/r/NieIstnieje1");
  await expect(client.getByRole("heading", { name: "Ten link jest nieaktywny" })).toBeVisible();
});
