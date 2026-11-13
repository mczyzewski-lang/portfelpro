import { env } from "./env";

/** Nagrania przykładowe leżą w /demo/ i są pokazywane wyłącznie w trybie demo. */
export const visibleVideo = (url: string | null | undefined): string | null =>
  !url ? null : url.startsWith("/demo/") && !env.demoMode ? null : url;
