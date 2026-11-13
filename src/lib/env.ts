export const env = {
  appUrl: (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  appSecret: process.env.APP_SECRET ?? "",
  webhookSecret: process.env.WEBHOOK_SECRET ?? "",
  demoMode: process.env.DEMO_MODE === "true",
  isProd: process.env.NODE_ENV === "production",
};

if (env.isProd && env.appSecret.length < 32 && process.env.NEXT_PHASE !== "phase-production-build") {
  console.warn("[portfel.pro] APP_SECRET powinien mieć co najmniej 32 znaki.");
}
