import "dotenv/config";
import { eq } from "drizzle-orm";

async function main() {
  const { db } = await import("../src/db");
  const s = await import("../src/db/schema");
  const { COMPANIES, GOOGLE_CHECKED_AT, LANDING_FAQ, PROFESSIONS, SERVICES } = await import("../src/db/seed-data");
  const { hashPassword } = await import("../src/lib/crypto");
  const { SETTING_DEFAULTS } = await import("../src/lib/settings");

  for (const [i, p] of PROFESSIONS.entries()) {
    await db.insert(s.professions).values({ ...p, sort: i }).onConflictDoNothing();
  }
  const companyIds: Record<string, string> = {};
  for (const [i, c] of COMPANIES.entries()) {
    await db.insert(s.companies).values({ ...c, sort: i, googleCheckedAt: GOOGLE_CHECKED_AT }).onConflictDoNothing();
    const [row] = await db.select().from(s.companies).where(eq(s.companies.slug, c.slug));
    companyIds[c.slug] = row.id;
    // Ocenę Google uzupełniamy tylko, gdy spółka nie ma jeszcze żadnych danych (nie nadpisujemy zmian z panelu).
    if (row.googleRating == null && row.googleReviews == null) {
      await db.update(s.companies).set({ googleRating: c.googleRating, googleReviews: c.googleReviews, googleCheckedAt: GOOGLE_CHECKED_AT }).where(eq(s.companies.id, row.id));
    }
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
    await seedDemoLeads(DEMO_ACCOUNT.email);
  }
  console.log(`✓ Seed zakończony: ${COMPANIES.length} spółki, ${SERVICES.length} usług`);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });

/**
 * Pięć przykładowych poleceń na koncie demo — każde na innym etapie procesu.
 * Tworzone tylko w trybie demo i tylko raz; klienci mają dopisek „(demo)”, a identyfikatory zaczynają się od DEMO-.
 */
async function seedDemoLeads(email: string) {
  const { and, asc, eq } = await import("drizzle-orm");
  const { db } = await import("../src/db");
  const s = await import("../src/db/schema");
  const { createLead } = await import("../src/lib/tracking");
  const { recordConversion, setLeadStatus } = await import("../src/lib/conversions");
  const [row] = await db.select({ p: s.partners }).from(s.partners).innerJoin(s.users, eq(s.users.id, s.partners.userId)).where(eq(s.users.email, email));
  if (!row) return;
  const [has] = await db.select({ id: s.leads.id }).from(s.leads).where(eq(s.leads.partnerId, row.p.id)).limit(1);
  if (has) return;
  const actor = { userId: null, label: "dane demo" };
  type Status = "contacted" | "qualified" | "in_progress";
  const plan: { service: string; name: string; path: Status[]; sale?: number; daysAgo: number }[] = [
    { service: "znak-towarowy", name: "Marta Kowalczyk (demo)", path: ["contacted", "qualified", "in_progress"], sale: 250000, daysAgo: 2 },
    { service: "ip-box", name: "Tomasz Wójcik (demo)", path: ["contacted", "qualified", "in_progress"], daysAgo: 3 },
    { service: "domy-modulowe", name: "Anna i Piotr Lis (demo)", path: ["contacted", "qualified"], daysAgo: 1 },
    { service: "restrukturyzacja", name: "Biuro Projekt Sp. z o.o. (demo)", path: ["contacted"], daysAgo: 1 },
    { service: "znak-towarowy", name: "Karol Nowicki (demo)", path: [], daysAgo: 0 },
  ];
  for (const [i, d] of plan.entries()) {
    const [service] = await db.select().from(s.services).where(eq(s.services.slug, d.service));
    if (!service) continue;
    const { lead } = await createLead({
      serviceId: service.id, source: "partner", stage: "consultation", partnerId: row.p.id, externalId: `DEMO-${i + 1}`,
      contact: { name: d.name, phone: `60000000${i + 1}` }, consent: true, actor,
    });
    for (const st of d.path) await setLeadStatus(lead.id, st, actor);
    if (d.sale) await recordConversion({ leadId: lead.id, type: "sale", netAmount: d.sale, source: "manual", actor });
    // Rozkładamy historię w czasie: kolejne kroki co ok. dobę, ostatni `daysAgo` dni temu.
    const events = await db.select().from(s.leadEvents).where(eq(s.leadEvents.leadId, lead.id)).orderBy(asc(s.leadEvents.createdAt));
    const steps = [...new Set(events.map((e) => e.createdAt.getTime()))];
    const end = Date.now() - d.daysAgo * 86400_000 - i * 3600_000;
    for (const e of events) {
      const at = new Date(end - (steps.length - 1 - steps.indexOf(e.createdAt.getTime())) * 26 * 3600_000);
      await db.update(s.leadEvents).set({ createdAt: at }).where(eq(s.leadEvents.id, e.id));
    }
    const first = new Date(end - (steps.length - 1) * 26 * 3600_000);
    await db.update(s.leads).set({ createdAt: first, updatedAt: new Date(end) }).where(and(eq(s.leads.id, lead.id)));
    await db.update(s.commissions).set({ createdAt: new Date(end) }).where(eq(s.commissions.leadId, lead.id));
  }
  await db.update(s.partners).set({ firstSuccessSeenAt: new Date() }).where(eq(s.partners.id, row.p.id)); // bez ekranu „pierwszy sukces” na koncie demo
  console.log("✓ Dodano 5 przykładowych poleceń na koncie demo");
}
