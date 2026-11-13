import "dotenv/config";
import postgres from "postgres";

// Usuwa WSZYSTKIE dane. Tylko do środowisk deweloperskich i testowych.
async function main() {
  const url = process.env.DATABASE_URL!;
  if (process.env.NODE_ENV === "production" || !/localhost|127\.0\.0\.1/.test(url)) {
    if (process.env.ALLOW_DB_RESET !== "yes") throw new Error("Reset zablokowany poza lokalną bazą (ustaw ALLOW_DB_RESET=yes, jeśli na pewno).");
  }
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  await sql.unsafe("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; DROP SCHEMA IF EXISTS drizzle CASCADE;");
  await sql.end();
  console.log("✓ Baza wyczyszczona");
}
main().catch((e) => { console.error(e); process.exit(1); });
