import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

const PORT = 3100;
const TEST_DB = process.env.TEST_DATABASE_URL ?? "postgres://portfel:portfel@localhost:5432/portfelpro_test";
// W środowiskach z preinstalowanym Chromium (np. CI/cloud) używamy go zamiast pobierać przeglądarkę.
const preinstalled = process.env.PW_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";

export const testEnv = {
  DATABASE_URL: TEST_DB,
  APP_URL: `http://localhost:${PORT}`,
  APP_SECRET: "e2e-secret-e2e-secret-e2e-secret-e2e-secret",
  WEBHOOK_SECRET: "e2e-webhook-secret",
  DEMO_MODE: "true",
  ADMIN_EMAIL: "admin@e2e.test",
  ADMIN_PASSWORD: "Admin-e2e-haslo-2026",
};

export default defineConfig({
  testDir: "./e2e",
  timeout: 240_000, // jeden długi scenariusz; zapas na zimną kompilację serwera deweloperskiego
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: testEnv.APP_URL,
    viewport: { width: 390, height: 844 }, // mobile first
    locale: "pl-PL",
    launchOptions: existsSync(preinstalled) ? { executablePath: preinstalled } : {},
  },
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/logowanie`,
    env: { ...testEnv, NEXT_DIST_DIR: ".next-e2e" },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
