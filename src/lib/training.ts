import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { partnerTraining, type services } from "@/db/schema";
import { env } from "./env";
import { visibleVideo } from "./video";

export const QUIZ_SIZE = 10;
export const PASS_SCORE = 8; // ile poprawnych odpowiedzi (z 10) daje certyfikat
export const CERT_TITLE = "Certyfikowany Profesjonalista";

type Service = typeof services.$inferSelect;

/** Szkolenie usługi widoczne dla partnera; null, gdy go nie ma (treści startowe są pokazywane tylko w trybie demo). */
export function trainingOf(s: Service) {
  if (!s.quiz.length || (s.trainingDemo && !env.demoMode)) return null;
  const videos = s.trainingVideos.filter((v) => visibleVideo(v.url));
  return { area: s.certArea || s.name, videos, questions: s.quiz.length, demo: s.trainingDemo };
}

export type TrainingState = "none" | "started" | "quiz" | "certified";
export function trainingState(row: { watched: number[]; certifiedAt: Date | null } | undefined, videoCount: number): TrainingState {
  if (row?.certifiedAt) return "certified";
  if (!row) return "none";
  return watchedAll(row.watched, videoCount) ? "quiz" : "started";
}
export const watchedAll = (watched: number[], videoCount: number) => Array.from({ length: videoCount }, (_, i) => i).every((i) => watched.includes(i));

export const getTraining = async (partnerId: string, serviceId: string) =>
  (await db.select().from(partnerTraining).where(and(eq(partnerTraining.partnerId, partnerId), eq(partnerTraining.serviceId, serviceId))))[0];
export const getTrainings = (partnerId: string) => db.select().from(partnerTraining).where(eq(partnerTraining.partnerId, partnerId));

/** Numer certyfikatu: CP-<numer partnera>-<kolejny certyfikat partnera>. */
export const certNumber = (partnerNumber: number, seq: number) => `CP-${partnerNumber}-${String(seq).padStart(2, "0")}`;
