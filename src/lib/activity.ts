import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Log an activity to the activity log.
 * Fails silently — activity logging should never break the main flow.
 */
export async function logActivity({
  orgId,
  userId,
  action,
  entity,
  entityId,
  metadata,
}: {
  orgId: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        orgId,
        userId: userId || null,
        action,
        entity,
        entityId: entityId || null,
        metadata: metadata as Prisma.InputJsonValue ?? undefined,
      },
    });
  } catch {
    // Never fail on activity logging
  }
}
