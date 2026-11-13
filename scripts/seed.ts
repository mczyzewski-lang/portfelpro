import "dotenv/config";
import { eq } from "drizzle-orm";

async function main() {
  const { db } = await import("../src/db");
  const s = await import("../src/db/schema");
  const { COMPANIES, LANDING_FAQ, PROFESSIONS, SERVICES } = await import("../src/db/seed-data");
  const { hashPassword } = await import("../src/lib/crypto");
  const { SETTING_DEFAULTS } = await import("../src/lib/settings");

  for (const [i, p] of PROFESSIONS.entries()) {
    await db.insert(s.professions).values({ ...p, sort: i }).onConflictDoNothing();
  }
  const companyIds: Record<string, string> = {};
  for (const [i, c] of COMPANIES.entries()) {
    await db.insert(s.companies).values({ ...c, sort: i }).onConflictDoNothing();
    const [row] = await db.select().from(s.companies).where(eq(s.companies.slug, c.slug));
    companyIds[c.slug] = row.id;
    // Logotypy uzupełniamy tylko tam, gdzie administrator nie ustawił własnych.
    if (!row.logoUrl && !row.iconUrl && (c.logoUrl || c.iconUrl)) {
      await db.update(s.companies).set({ logoUrl: c.logoUrl, iconUrl: c.iconUrl, color: c.color }).where(eq(s.companies.id, row.id));
    }
  }
  // Usługi dodajemy tylko, jeśli jeszcze nie istnieją — seed nie nadpisuje zmian z panelu administratora.
  for (const [i, sv] of SERVICES.entries()) {
    const { company, professions, assets, ...rest } = sv;
    const [created] = await db.insert(s.services)
      .values({ ...rest, companyId: companyIds[company], status: "published", sort: i })
      .onConflictDoNothing().returning();
    if (!created) continue;
    for (const [slug, reason] of Object.entries(professions)) {
      await db.insert(s.serviceProfessions).values({ serviceId: created.id, professionSlug: slug, reason });
    }
    for (const [j, a] of assets.entries()) {
      await db.insert(s.contentAssets).values({ ...a, serviceId: created.id, status: "published", sort: j });
    }
  }
  const [faqCount] = await db.select({ id: s.landingFaqs.id }).from(s.landingFaqs).limit(1);
  if (!faqCount) {
    for (const [i, f] of LANDING_FAQ.entries()) await db.insert(s.landingFaqs).values({ question: f.q, answer: f.a, sort: i });
  }
  for (const [key, value] of Object.entries(SETTING_DEFAULTS)) {
    await db.insert(s.settings).values({ key, value }).onConflictDoNothing();
  }

  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@portfel.pro").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 10 || adminPassword.startsWith("change-me")) {
    // Nie blokujemy wdrożenia — ale bez tej zmiennej nie powstanie konto administratora.
    console.warn("! Pominięto tworzenie administratora: ustaw ADMIN_PASSWORD (min. 10 znaków) i uruchom seed ponownie.");
  } else {
    const [admin] = await db.insert(s.users).values({
      email: adminEmail, passwordHash: await hashPassword(adminPassword), role: "admin", firstName: "Administrator", lastName: "Portfel.pro",
    }).onConflictDoNothing().returning();
    console.log(admin ? `✓ Utworzono administratora: ${adminEmail}` : `• Konto ${adminEmail} już istnieje`);
  }
  // Konto demo partnera — tylko w trybie demo. Poza nim logowanie na to konto jest zablokowane.
  const { DEMO_ACCOUNT } = await import("../src/lib/demo");
  if (process.env.DEMO_MODE === "true") {
    const [demo] = await db.insert(s.users).values({
      email: DEMO_ACCOUNT.email, passwordHash: await hashPassword(DEMO_ACCOUNT.password), role: "partner", firstName: "Demo", lastName: "Partner",
    }).onConflictDoNothing().returning();
    if (demo) {
      await db.insert(s.partners).values({
        userId: demo.id, status: "active", activityType: "individual", professionSlug: "finanse", onboardedAt: new Date(),
        termsAcceptedAt: new Date(), termsVersion: SETTING_DEFAULTS.terms_version, adminNote: "Publiczne konto demonstracyjne",
      });
      console.log(`✓ Utworzono konto demo: ${DEMO_ACCOUNT.email}`);
    }
  }
  console.log(`✓ Seed zakończony: ${COMPANIES.length} spółki, ${SERVICES.length} usług`);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
