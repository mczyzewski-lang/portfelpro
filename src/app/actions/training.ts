"use server";

import { and, eq, isNotNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { partnerTraining, services } from "@/db/schema";
import { requirePartner } from "@/lib/auth";
import { certNumber, getTraining, PASS_SCORE, trainingOf, watchedAll } from "@/lib/training";

async function load(serviceId: string) {
  const { partner } = await requirePartner();
  const [service] = /^[0-9a-f-]{36}$/.test(serviceId) ? await db.select().from(services).where(and(eq(services.id, serviceId), eq(services.status, "published"))) : [];
  const training = service ? trainingOf(service) : null;
  return service && training ? { partner, service, training } : null;
}

/** Film obejrzany do końca — odblokowuje test po obejrzeniu wszystkich. */
export async function markVideoWatchedAction(serviceId: string, index: number): Promise<{ watched: number[] } | null> {
  const ctx = await load(serviceId);
  if (!ctx || !Number.isInteger(index) || index < 0 || index >= ctx.training.videos.length) return null;
  const row = await getTraining(ctx.partner.id, serviceId);
  const watched = [...new Set([...(row?.watched ?? []), index])].sort((a, b) => a - b);
  await db.insert(partnerTraining).values({ partnerId: ctx.partner.id, serviceId, watched })
    .onConflictDoUpdate({ target: [partnerTraining.partnerId, partnerTraining.serviceId], set: { watched, lastActivityAt: new Date() } });
  revalidatePath("/app", "layout");
  return { watched };
}

export type QuizResult = { error: string } | { score: number; total: number; passed: boolean; wrong: number[] };

/** Sprawdzenie testu po stronie serwera (poprawne odpowiedzi nie trafiają do przeglądarki). Zaliczenie wystawia certyfikat. */
export async function submitQuizAction(serviceId: string, answers: number[]): Promise<QuizResult> {
  const ctx = await load(serviceId);
  if (!ctx) return { error: "Szkolenie jest niedostępne." };
  const { partner, service, training } = ctx;
  const row = await getTraining(partner.id, serviceId);
  if (!watchedAll(row?.watched ?? [], training.videos.length)) return { error: "Najpierw obejrzyj wszystkie filmy." };
  if (!Array.isArray(answers) || answers.length !== service.quiz.length) return { error: "Odpowiedz na wszystkie pytania." };
  const wrong = service.quiz.flatMap((q, i) => (answers[i] === q.correct ? [] : [i]));
  const score = service.quiz.length - wrong.length;
  const passed = score >= Math.min(PASS_SCORE, service.quiz.length);
  await db.transaction(async (tx) => {
    const [{ n }] = await tx.select({ n: sql<number>`count(*)::int` }).from(partnerTraining).where(and(eq(partnerTraining.partnerId, partner.id), isNotNull(partnerTraining.certifiedAt)));
    const cert = passed && !row?.certifiedAt ? { certifiedAt: new Date(), certNumber: certNumber(partner.number, n + 1), certArea: training.area } : {};
    await tx.insert(partnerTraining).values({ partnerId: partner.id, serviceId, attempts: 1, bestScore: score, ...cert })
      .onConflictDoUpdate({ target: [partnerTraining.partnerId, partnerTraining.serviceId],
        set: { attempts: sql`${partnerTraining.attempts} + 1`, bestScore: sql`greatest(${partnerTraining.bestScore}, ${score})`, lastActivityAt: new Date(), ...cert } });
  });
  revalidatePath("/app", "layout");
  return { score, total: service.quiz.length, passed, wrong };
}
