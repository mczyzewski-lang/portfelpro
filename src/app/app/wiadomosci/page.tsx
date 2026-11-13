import { sendMessageAction } from "@/app/actions/partner";
import { Chat } from "@/components/chat";
import { ManagerCard } from "@/components/manager-card";
import { requirePartner } from "@/lib/auth";
import { toChatItems } from "@/lib/chat-format";
import { getManager, getThread, markRead } from "@/lib/messages";

export const metadata = { title: "Wiadomości" };

/** Rozmowa na całą stronę: opiekun jako nagłówek czatu, wiadomości bez ramek, pole pisania przypięte na dole. */
export default async function MessagesPage() {
  const { partner } = await requirePartner();
  await markRead(partner.id, "partner"); // otwarcie zakładki = przeczytanie wiadomości od opiekuna
  const [manager, thread] = await Promise.all([getManager(partner), getThread(partner.id)]);
  return (
    <div className="mx-auto -mt-4 max-w-2xl">
      <h1 className="sr-only">Wiadomości</h1>
      {manager && <ManagerCard manager={manager} />}
      <Chat variant="page" items={toChatItems(thread, "partner")} action={sendMessageAction}
        emptyText={manager ? `Napisz do opiekuna — ${manager.firstName} odpowie tutaj.` : "Napisz do nas — odpowiemy tutaj."} />
    </div>
  );
}
