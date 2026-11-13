import type { ChatItem } from "@/components/chat";
import type { ChatMessage } from "./messages";

const time = new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" });
const day = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Warsaw" });

/** Przygotowuje wątek do wyświetlenia z perspektywy partnera albo opiekuna. */
export function toChatItems(thread: ChatMessage[], viewer: "partner" | "manager", partnerName?: string): ChatItem[] {
  return thread.map((m) => ({
    id: m.id, mine: m.fromPartner === (viewer === "partner"), body: m.body, at: time.format(m.createdAt), day: day.format(m.createdAt),
    author: m.fromPartner ? partnerName ?? null : m.senderName, read: !!m.readAt,
  }));
}
