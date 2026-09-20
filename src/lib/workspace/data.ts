import type { TeamPermissionRole } from "@prisma/client";
import { databaseErrorMessage, prisma } from "@/lib/db";
import { AuthorizationError } from "@/lib/authz";
import { getTeamSharedState } from "@/lib/workspace/state";
import type { DashboardCompetition, DashboardRoutine, DashboardTestRun } from "@/lib/workspace/dashboard-summary";

const permissionRank: Record<TeamPermissionRole, number> = {
  VIEWER: 0,
  MEMBER: 1,
  TEAM_LEAD: 2,
  ADMIN: 3,
  OWNER: 4,
};

function savedTestRuns(value: unknown): DashboardTestRun[] {
  if (!value || typeof value !== "object") return [];
  const runs = (value as Record<string, unknown>).runs;
  if (!Array.isArray(runs)) return [];

  return runs.flatMap((run) => {
    if (!run || typeof run !== "object") return [];
    const row = run as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id : "";
    const robotId = typeof row.robotId === "string" ? row.robotId : "";
    const route = typeof row.route === "string" ? row.route.trim() : "";
    const revision = Number(row.revision);
    const createdAt = typeof row.createdAt === "string" ? new Date(row.createdAt) : null;

    if (!id || !robotId || !route || !Number.isInteger(revision) || !createdAt || Number.isNaN(createdAt.getTime())) {
      return [];
    }

    return [{ id, robotId, route, revision, type: "AUTONOMOUS", success: row.success === true, createdAt }];
  });
}

function savedAutonomousRoutines(value: unknown): DashboardRoutine[] {
  if (!value || typeof value !== "object") return [];
  const routines = (value as Record<string, unknown>).routines;
  if (!Array.isArray(routines)) return [];

  return routines.flatMap((routine) => {
    if (!routine || typeof routine !== "object") return [];
    const row = routine as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id : "";
    const robotId = typeof row.selectedRobotId === "string" ? row.selectedRobotId : "";
    const name = typeof row.name === "string" ? row.name.trim() : "";
    const updatedAt = typeof row.updatedAt === "string" ? new Date(row.updatedAt) : null;

    if (!id || !robotId || !name || !updatedAt || Number.isNaN(updatedAt.getTime())) return [];
    return [{ id, robotId, name, updatedAt }];
  });
}

function selectedEventCompetition(value: unknown): DashboardCompetition {
  if (!value || typeof value !== "object") return null;
  const selectedEvent = (value as Record<string, unknown>).selectedEvent;
  if (!selectedEvent || typeof selectedEvent !== "object") return null;
  const row = selectedEvent as Record<string, unknown>;
  const rawId = typeof row.id === "number" || typeof row.id === "string" ? String(row.id) : "";
  const name = typeof row.name === "string" ? row.name.trim() : typeof row.sku === "string" ? row.sku.trim() : "";
  const startsAt = typeof row.start === "string" ? new Date(row.start) : null;

  if (!rawId || !name) return null;
  return {
    id: `vex-events-${rawId}`,
    name,
    startsAt: startsAt && !Number.isNaN(startsAt.getTime()) ? startsAt : null,
  };
}

function mergeByKey<T>(items: T[], key: (item: T) => string) {
  return [...new Map(items.map((item) => [key(item), item])).values()];
}

export type WorkspaceTeam = {
  id: string;
  name: string;
  teamNumber: string | null;
  program: string;
  organization: string | null;
  eventRegion: string | null;
  grade: string | null;
  permission: TeamPermissionRole;
  roboticsRoles: string[];
};

export async function getWorkspaceTeams(userId: string): Promise<WorkspaceTeam[]> {
  let memberships;

  try {
    memberships = await prisma.teamMember.findMany({
      where: { userId, status: "ACTIVE" },
      orderBy: { team: { updatedAt: "desc" } },
      select: {
        permission: true,
        roboticsRoles: true,
        team: {
          select: {
            id: true,
            name: true,
            teamNumber: true,
            program: true,
            organization: true,
            eventRegion: true,
            grade: true,
          },
        },
      },
    });
  } catch (error) {
    if (databaseErrorMessage(error)) {
      return [];
    }
    throw error;
  }

  return memberships.map(({ team, permission, roboticsRoles }) => ({
    ...team,
    program: team.program,
    permission,
    roboticsRoles,
  }));
}

/**
 * Resolves a requested team only among the caller's active memberships. It is
 * intentionally used by every page and mutation that accepts a teamId.
 */
export async function getWorkspaceTeam(userId: string, requestedTeamId?: string | null) {
  const teams = await getWorkspaceTeams(userId);
  if (!teams.length) return { team: null, teams };

  let preferredTeamId: string | null = null;
  if (!requestedTeamId) {
    try {
      const preference = await prisma.userPreference.findUnique({
        where: { userId },
        select: { defaultTeamId: true },
      });
      preferredTeamId = preference?.defaultTeamId ?? null;
    } catch (error) {
      if (!databaseErrorMessage(error)) {
        throw error;
      }
    }
  }

  const team = requestedTeamId
    ? teams.find((candidate) => candidate.id === requestedTeamId) ?? null
    : (preferredTeamId ? teams.find((candidate) => candidate.id === preferredTeamId) : null) ?? teams[0];

  if (requestedTeamId && !team) {
    throw new AuthorizationError("You do not have access to that team workspace.");
  }

  return { team, teams };
}

export function hasTeamPermission(role: TeamPermissionRole, minimum: TeamPermissionRole) {
  return permissionRank[role] >= permissionRank[minimum];
}

export async function requireWorkspaceTeam(
  userId: string,
  teamId: string,
  minimum: TeamPermissionRole = "VIEWER",
) {
  const membership = await prisma.teamMember.findFirst({
    where: { teamId, userId, status: "ACTIVE" },
    select: {
      permission: true,
      roboticsRoles: true,
      team: {
        select: {
          id: true,
          name: true,
          teamNumber: true,
          program: true,
          organization: true,
          eventRegion: true,
          grade: true,
        },
      },
    },
  });

  if (!membership || !hasTeamPermission(membership.permission, minimum)) {
    throw new AuthorizationError();
  }

  return {
    team: { ...membership.team, program: membership.team.program },
    permission: membership.permission,
    roboticsRoles: membership.roboticsRoles,
  };
}

export async function requireRobotWriteAccess(userId: string, robotId: string) {
  const robot = await prisma.robot.findUnique({
    where: { id: robotId },
    select: { id: true, teamId: true, ownerId: true, name: true },
  });
  if (!robot) throw new AuthorizationError("That robot no longer exists.");

  if (!robot.teamId) {
    if (robot.ownerId !== userId) throw new AuthorizationError();
    return robot;
  }

  await requireWorkspaceTeam(userId, robot.teamId, "TEAM_LEAD");
  return robot;
}

export async function requireRobotReadAccess(userId: string, robotId: string) {
  const robot = await prisma.robot.findUnique({
    where: { id: robotId },
    select: { id: true, teamId: true, ownerId: true, name: true },
  });
  if (!robot) throw new AuthorizationError("That robot no longer exists.");

  if (!robot.teamId) {
    if (robot.ownerId !== userId) throw new AuthorizationError();
    return robot;
  }

  await requireWorkspaceTeam(userId, robot.teamId);
  return robot;
}

export async function getTeamDashboard(teamId: string) {
  const [robots, tasks, buildLogs, notebookEntries, competition, autonomousRoutines, persistedTestRuns] = await prisma.$transaction([
    prisma.robot.findMany({
      where: { teamId, status: { notIn: ["ARCHIVED", "RETIRED"] } },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        configuration: {
          select: {
            drivetrainType: true,
            driveMotorCount: true,
            theoreticalSpeedFtPerSec: true,
            configurationVersion: true,
            isComplete: true,
            motors: { select: { id: true, port: true, label: true }, orderBy: { port: "asc" } },
            sensors: { select: { id: true, smartPort: true, threeWirePort: true, label: true } },
            pneumatics: { select: { id: true, threeWirePort: true, label: true } },
          },
        },
      },
    }),
    prisma.task.findMany({
      where: { teamId, status: { notIn: ["COMPLETE", "CANCELLED"] } },
      orderBy: [{ priority: "desc" }, { dueAt: "asc" }, { updatedAt: "desc" }],
      take: 7,
      include: {
        assignees: {
          select: { user: { select: { displayName: true, name: true, username: true } } },
        },
      },
    }),
    prisma.buildLog.findMany({
      where: { teamId },
      orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
      take: 5,
      include: { author: { select: { displayName: true, name: true, username: true } } },
    }),
    prisma.notebookEntry.findMany({
      where: { teamId },
      orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
      take: 3,
      include: { author: { select: { displayName: true, name: true, username: true } } },
    }),
    prisma.competition.findFirst({
      where: { teamId, status: { in: ["PLANNED", "ACTIVE"] } },
      orderBy: { startsAt: "asc" },
    }),
    prisma.autonomousRoutine.findMany({
      where: {
        robot: {
          teamId,
          status: { notIn: ["ARCHIVED", "RETIRED"] },
        },
      },
      orderBy: { updatedAt: "desc" },
      select: { id: true, robotId: true, name: true, updatedAt: true },
    }),
    prisma.testRun.findMany({
      where: { teamId },
      orderBy: { createdAt: "desc" },
      take: 240,
      select: { id: true, robotId: true, configurationVersion: true, type: true, name: true, passed: true, createdAt: true },
    }),
  ]);

  const shared = await getTeamSharedState(teamId);
  const fieldLabRoutines = savedAutonomousRoutines(shared.state.fieldLab);
  const routineKeys = new Set(fieldLabRoutines.map((routine) => `${routine.robotId}:${routine.name.trim().toLocaleLowerCase()}`));
  const mergedRoutines = [
    ...fieldLabRoutines,
    ...autonomousRoutines.filter((routine) => !routineKeys.has(`${routine.robotId}:${routine.name.trim().toLocaleLowerCase()}`)),
  ];
  const mergedTestRuns = mergeByKey(
    [
      ...savedTestRuns(shared.state.testing),
      ...persistedTestRuns.map((run) => ({
        id: run.id,
        robotId: run.robotId,
        route: run.name,
        revision: run.configurationVersion,
        type: run.type,
        success: run.passed,
        createdAt: run.createdAt,
      })),
    ],
    (run) => run.id,
  );
  const orderedRobots = shared.activeRobotId
    ? [...robots].sort((a, b) => Number(b.id === shared.activeRobotId) - Number(a.id === shared.activeRobotId))
    : robots;
  return {
    robots: orderedRobots,
    tasks,
    buildLogs,
    notebookEntries,
    competition: competition ?? selectedEventCompetition(shared.state.eventMode),
    autonomousRoutines: mergedRoutines,
    testRuns: mergedTestRuns,
    activeRobotId: shared.activeRobotId,
    eventModeState: shared.state.eventMode,
    selectedEventId: shared.selectedEventId,
  };
}
