import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { replyMessageAction } from "@/app/actions/admin";
import { PageHeader } from "@/components/admin";
import { Chat } from "@/components/chat";
import { db } from "@/db";
import { partners, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { toChatItems } from "@/lib/chat-format";
import { partnerId } from "@/lib/labels";
import { getThread, markRead } from "@/lib/messages";

export default async function AdminThread({ params }: { params: Promise<{ partnerId: string }> }) {
  await requireAdmin();
  const { partnerId: id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [row] = await db.select({ p: partners, u: users }).from(partners).innerJoin(users, eq(users.id, partners.userId)).where(eq(partners.id, id));
  if (!row) notFound();
  await markRead(id, "manager");
  const thread = await getThread(id);
  return (
    <div className="max-w-2xl">
      <PageHeader title={`${row.u.firstName} ${row.u.lastName}`}
        sub={<><Link href="/admin/wiadomosci" className="underline">← Wiadomości</Link> · <Link href={`/admin/partnerzy/${id}`} className="underline">{partnerId(row.p.number)}</Link> · {row.u.email}</>} />
      <Chat items={toChatItems(thread, "manager", row.u.firstName)} action={replyMessageAction} hidden={{ partnerId: id }}
        emptyText="Brak wiadomości. Napisz pierwszy — partner zobaczy to w zakładce Wiadomości." placeholder="Odpowiedz partnerowi…" />
    </div>
  );
}
