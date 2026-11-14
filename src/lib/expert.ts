import type { Service } from "@/db/schema";
import { visibleVideo } from "./video";

export type Expert = { name: string; title: string | null; photoUrl: string | null };

/** Ekspert usługi. Eksperci demo (zdjęcia w /demo/) są pokazywani wyłącznie w trybie demo. */
export function expertOf(s: Pick<Service, "expertName" | "expertTitle" | "expertPhotoUrl">): Expert | null {
  if (!s.expertName) return null;
  const demoPhoto = s.expertPhotoUrl?.startsWith("/demo/");
  const photoUrl = visibleVideo(s.expertPhotoUrl); // ta sama reguła: pliki z /demo/ tylko w trybie demo
  if (demoPhoto && !photoUrl) return null;
  return { name: s.expertName, title: s.expertTitle, photoUrl };
}
