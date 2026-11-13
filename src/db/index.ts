import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Brak zmiennej DATABASE_URL");
  return drizzle(postgres(url, { max: 10, prepare: false, onnotice: () => {} }), { schema });
}

export type Db = ReturnType<typeof connect>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

const g = globalThis as unknown as { __ppDb?: Db };

/**
 * Połączenie powstaje dopiero przy pierwszym użyciu, a nie przy imporcie modułu —
 * dzięki temu `next build` nie wymaga DATABASE_URL (np. na Railway zmienne bywają dostępne dopiero w runtime).
 */
export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    const real = (g.__ppDb ??= connect());
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
