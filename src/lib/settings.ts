import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";

export const SETTING_DEFAULTS = {
  attribution_window_days: 30,
  attribution_rule: "first_touch" as const,
  auto_approve_partners: false,
  terms_version: "2026-11-demo",
};
export type SettingKey = keyof typeof SETTING_DEFAULTS;

export async function getSettings(): Promise<typeof SETTING_DEFAULTS> {
  const rows = await db.select().from(settings);
  const out: Record<string, unknown> = { ...SETTING_DEFAULTS };
  for (const r of rows) if (r.key in SETTING_DEFAULTS) out[r.key] = r.value;
  return out as typeof SETTING_DEFAULTS;
}

export async function setSetting<K extends SettingKey>(key: K, value: (typeof SETTING_DEFAULTS)[K]) {
  await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
}
export async function getSetting<K extends SettingKey>(key: K): Promise<(typeof SETTING_DEFAULTS)[K]> {
  const [row] = await db.select().from(settings).where(eq(settings.key, key));
  return (row?.value as (typeof SETTING_DEFAULTS)[K]) ?? SETTING_DEFAULTS[key];
}
