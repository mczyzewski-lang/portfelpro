import { sendMessageAction } from "@/app/actions/partner";
import { Chat } from "@/components/chat";
import { ManagerCard } from "@/components/manager-card";
import { requirePartner } from "@/lib/auth";
import { toChatItems } from "@/lib/chat-format";
import { getManager, getThread, markRead } from "@/lib/messages";

export const metadata = { title: "Wiadomości" };

export default async function MessagesPage() {
  const { partner } = await requirePartner();
  await markRead(partner.id, "partner"); // otwarcie zakładki = przeczytanie wiadomości od opiekuna
  const [manager, thread] = await Promise.all([getManager(partner), getThread(partner.id)]);
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-[24px] font-extrabold leading-tight text-leather-dark">Wiadomości</h1>
      {manager && <ManagerCard manager={manager} />}
      <Chat items={toChatItems(thread, "partner")} action={sendMessageAction}
        emptyText={manager ? `Napisz do opiekuna — ${manager.firstName} odpowie tutaj.` : "Napisz do nas — odpowiemy tutaj."} />
    </div>
  );
}
