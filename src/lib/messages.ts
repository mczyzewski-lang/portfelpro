import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { messages, partners, users, type Partner } from "@/db/schema";

export type Manager = { id: string; firstName: string; lastName: string; email: string; phone: string | null; jobTitle: string | null; photoVersion: number | null };
const managerCols = { id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email, phone: users.phone, jobTitle: users.jobTitle,
  photoVersion: sql<number | null>`case when ${users.avatar} is not null then extract(epoch from coalesce(${users.avatarUpdatedAt}, ${users.createdAt}))::bigint end`.mapWith((v) => (v == null ? null : Number(v))) };

export const listManagers = (): Promise<Manager[]> =>
  db.select(managerCols).from(users).where(eq(users.role, "admin")).orderBy(asc(users.createdAt));

/** Opiekun partnera: przypisany indywidualnie, a gdy go brak — pierwszy administrator. */
export async function getManager(partner: Pick<Partner, "managerUserId">): Promise<Manager | null> {
  if (partner.managerUserId) {
    const [m] = await db.select(managerCols).from(users).where(and(eq(users.id, partner.managerUserId), eq(users.role, "admin")));
    if (m) return m;
  }
  return (await listManagers())[0] ?? null;
}

export type ChatMessage = { id: string; fromPartner: boolean; body: string; createdAt: Date; senderName: string | null; readAt: Date | null };

export async function getThread(partnerId: string, limit = 200): Promise<ChatMessage[]> {
  const rows = await db.select({
    id: messages.id, fromPartner: messages.fromPartner, body: messages.body, createdAt: messages.createdAt, readAt: messages.readAt, senderName: users.firstName,
  }).from(messages).leftJoin(users, eq(users.id, messages.senderUserId)).where(eq(messages.partnerId, partnerId))
    .orderBy(sql`${messages.createdAt} desc`).limit(limit);
  return rows.reverse();
}

/** Oznacza jako przeczytane wiadomości od drugiej strony. */
export async function markRead(partnerId: string, reader: "partner" | "manager") {
  await db.update(messages).set({ readAt: new Date() })
    .where(and(eq(messages.partnerId, partnerId), eq(messages.fromPartner, reader === "manager"), isNull(messages.readAt)));
}

export async function unreadForPartner(partnerId: string): Promise<number> {
  const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(messages)
    .where(and(eq(messages.partnerId, partnerId), eq(messages.fromPartner, false), isNull(messages.readAt)));
  return r.n;
}

export async function unreadForManagers(): Promise<number> {
  const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(messages).where(and(eq(messages.fromPartner, true), isNull(messages.readAt)));
  return r.n;
}

export async function postMessage(partnerId: string, fromPartner: boolean, senderUserId: string, body: string) {
  const text = body.replace(/\r\n/g, "\n").trim();
  if (!text) return { error: "Napisz wiadomość." } as const;
  if (text.length > 2000) return { error: "Wiadomość jest za długa (limit 2000 znaków)." } as const;
  await db.insert(messages).values({ partnerId, fromPartner, senderUserId, body: text });
  return { ok: true } as const;
}

/** Skrzynka opiekuna: partnerzy z ostatnią wiadomością i liczbą nieprzeczytanych. */
export async function getInbox() {
  return db.select({
    partnerId: partners.id, number: partners.number, firstName: users.firstName, lastName: users.lastName,
    last: sql<string>`(select body from messages m where m.partner_id = "partners"."id" order by m.created_at desc limit 1)`,
    lastAt: sql<Date>`(select max(m.created_at) from messages m where m.partner_id = "partners"."id")`.mapWith((v) => new Date(v)),
    unread: sql<number>`(select count(*)::int from messages m where m.partner_id = "partners"."id" and m.from_partner and m.read_at is null)`,
  }).from(partners).innerJoin(users, eq(users.id, partners.userId))
    .where(sql`exists (select 1 from messages m where m.partner_id = "partners"."id")`)
    .orderBy(sql`(select count(*) from messages m where m.partner_id = "partners"."id" and m.from_partner and m.read_at is null) desc`,
      sql`(select max(m.created_at) from messages m where m.partner_id = "partners"."id") desc`).limit(200);
}
