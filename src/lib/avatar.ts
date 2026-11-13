import type { Partner, User } from "@/db/schema";

/** Adres zdjęcia partnera z parametrem wersji (zmienia się po każdej podmianie, więc przeglądarka może je trwale cache'ować). */
export const avatarSrc = (p: Pick<Partner, "avatar" | "avatarUpdatedAt">) =>
  p.avatar ? `/app/avatar?v=${p.avatarUpdatedAt?.getTime() ?? 1}` : null;
export const initialsOf = (u: Pick<User, "firstName" | "lastName">) => `${u.firstName[0] ?? ""}${u.lastName[0] ?? ""}`.toUpperCase();
