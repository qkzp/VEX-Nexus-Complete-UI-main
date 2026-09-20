import { prisma, withDatabaseFallback } from "@/lib/db";
import { requireCurrentUser } from "@/lib/authz";

type RequestedTeam = string | string[] | undefined;

function firstQueryValue(value: RequestedTeam) {
  return typeof value === "string" && value.length <= 128 ? value : undefined;
}

/**
 * Fetches only data that the signed-in member may see. A requested team id is
 * always resolved through that member's active memberships, never directly.
 */
export async function getTeamWorkspace(requestedTeam: RequestedTeam, callbackUrl = "/team") {
  const user = await requireCurrentUser(callbackUrl);
  const memberships = await withDatabaseFallback(
    () =>
      prisma.teamMember.findMany({
        where: { userId: user.id, status: "ACTIVE" },
        select: {
          teamId: true,
          permission: true,
          roboticsRoles: true,
          team: {
            select: {
              id: true,
              name: true,
              teamNumber: true,
              program: true,
              updatedAt: true,
            },
          },
        },
        orderBy: { team: { updatedAt: "desc" } },
      }),
    [],
  );

  const requestedId = firstQueryValue(requestedTeam);
  const activeMembership = requestedId
    ? memberships.find((membership) => membership.teamId === requestedId)
    : memberships[0];

  if (!activeMembership) {
    return { user, memberships, workspace: null };
  }

  const team = await withDatabaseFallback(
    () =>
      prisma.team.findFirst({
        where: {
          id: activeMembership.teamId,
          members: { some: { userId: user.id, status: "ACTIVE" } },
        },
        select: {
          id: true,
          name: true,
          teamNumber: true,
          program: true,
          organization: true,
          location: true,
          eventRegion: true,
          description: true,
          updatedAt: true,
          members: {
            where: { status: "ACTIVE" },
            select: {
              id: true,
              userId: true,
              permission: true,
              roboticsRoles: true,
              joinedAt: true,
              user: {
                select: { displayName: true, name: true, username: true, image: true, imageUrl: true },
              },
            },
            orderBy: [{ permission: "asc" }, { createdAt: "asc" }],
          },
          invites: {
            select: { id: true, expiresAt: true, revokedAt: true, maxUses: true, currentUses: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      }),
    null,
  );

  // The membership filter above protects this branch. The null fallback avoids
  // leaking team existence if a membership changes between the two queries.
  if (!team) return { user, memberships, workspace: null };

  const now = new Date();
  const activeInvite = team.invites.find(
    (invite) =>
      !invite.revokedAt &&
      (!invite.expiresAt || invite.expiresAt > now) &&
      (invite.maxUses === null || invite.currentUses < invite.maxUses),
  );

  return {
    user,
    memberships,
    workspace: {
      team: {
        id: team.id,
        name: team.name,
        teamNumber: team.teamNumber,
        program: team.program,
        organization: team.organization,
        location: team.location,
        eventRegion: team.eventRegion,
        description: team.description,
        updatedAt: team.updatedAt,
      },
      membership: {
        id: activeMembership.teamId,
        permission: activeMembership.permission,
        roboticsRoles: activeMembership.roboticsRoles,
      },
      members: team.members.map((member) => ({
        id: member.id,
        userId: member.userId,
        displayName: member.user.displayName ?? member.user.name ?? member.user.username ?? "Team member",
        username: member.user.username,
        image: member.user.image ?? member.user.imageUrl,
        permission: member.permission,
        roboticsRoles: member.roboticsRoles,
        joinedAt: member.joinedAt,
      })),
      invite: activeInvite
        ? {
            active: true as const,
            currentUses: activeInvite.currentUses,
            maxUses: activeInvite.maxUses,
            expiresAt: activeInvite.expiresAt,
          }
        : { active: false as const },
    },
  };
}

export function teamHref(pathname: string, teamId: string) {
  return pathname + "?team=" + encodeURIComponent(teamId);
}
