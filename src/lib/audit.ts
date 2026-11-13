import { db, type Tx } from "@/db";
import { adminAuditLogs } from "@/db/schema";

export type Actor = { userId: string | null; label: string };
export const SYSTEM_ACTOR = (label: string): Actor => ({ userId: null, label });

export async function logAudit(
  exec: Tx | typeof db,
  actor: Actor,
  action: string,
  entity: string,
  entityId: string | null,
  data: { before?: unknown; after?: unknown; reason?: string | null } = {},
) {
  await exec.insert(adminAuditLogs).values({
    actorUserId: actor.userId, actorLabel: actor.label, action, entity, entityId,
    before: data.before ?? null, after: data.after ?? null, reason: data.reason ?? null,
  });
}
