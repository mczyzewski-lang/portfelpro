import { execSync } from "node:child_process";
import { testEnv } from "../playwright.config";

/** Czysta baza testowa z migracjami i danymi demo przed każdym uruchomieniem. */
export default function globalSetup() {
  const env = { ...process.env, ...testEnv };
  for (const script of ["reset", "migrate", "seed"]) {
    execSync(`npx tsx scripts/${script}.ts`, { env, stdio: "inherit" });
  }
}
