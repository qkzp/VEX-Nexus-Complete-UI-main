import { Prisma } from "@prisma/client";
import { prisma, withDatabaseFallback } from "@/lib/db";

export type TeamSharedState = Record<string, unknown>;

type TeamWorkspaceSnapshot = {
  activeRobotId: string | null;
  selectedEventId: number | null;
  state: TeamSharedState;
  updatedAt: Date | null;
};

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

/**
 * Team workspace state is stored as append-only AuditLog snapshots. AuditLog is
 * already part of the deployed schema, so this works without a schema migration
 * while keeping the server/database as the source of truth. Browser storage is
 * only an offline cache.
 */
export async function getTeamSharedState(teamId: string): Promise<TeamWorkspaceSnapshot> {
  const row = await withDatabaseFallback(
    () =>
      prisma.auditLog.findFirst({
        where: { targetType: "TEAM_WORKSPACE_STATE", targetId: teamId, action: "workspace.state" },
        orderBy: { createdAt: "desc" },
        select: { metadata: true, createdAt: true },
      }),
    null,
  );
  const meta = asObject(row?.metadata);
  const state = asObject(meta.state);
  return {
    activeRobotId: typeof meta.activeRobotId === "string" ? meta.activeRobotId : null,
    selectedEventId: typeof meta.selectedEventId === "number" && Number.isInteger(meta.selectedEventId) ? meta.selectedEventId : null,
    state,
    updatedAt: row?.createdAt ?? null,
  };
}

export async function updateTeamSharedState(
  teamId: string,
  patch: { activeRobotId?: string | null; selectedEventId?: number | null; state?: TeamSharedState },
  actorId?: string | null,
) {
  const current = await getTeamSharedState(teamId);
  const next = {
    activeRobotId: Object.prototype.hasOwnProperty.call(patch, "activeRobotId") ? patch.activeRobotId ?? null : current.activeRobotId,
    selectedEventId: Object.prototype.hasOwnProperty.call(patch, "selectedEventId") ? patch.selectedEventId ?? null : current.selectedEventId,
    state: patch.state ?? current.state,
  };
  await prisma.auditLog.create({
    data: {
      actorId: actorId ?? null,
      action: "workspace.state",
      targetType: "TEAM_WORKSPACE_STATE",
      targetId: teamId,
      metadata: next as Prisma.InputJsonValue,
    },
  });
  return next;
}

export async function updateTeamSharedSection(teamId: string, section: string, value: unknown, actorId?: string | null) {
  const current = await getTeamSharedState(teamId);
  return updateTeamSharedState(teamId, { state: { ...current.state, [section]: value } }, actorId);
}
