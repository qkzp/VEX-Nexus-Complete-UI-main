import type { TeamPermissionRole, TeamRoboticsRole, VexProgram } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createInviteCode, hashInviteCode, normalizeTeamNumber } from "@/lib/security/tokens";
import { createTeamSchema, joinTeamSchema } from "@/lib/validation/team";

export type InviteLookup =
  | { state: "valid"; team: { id: string; name: string; teamNumber: string | null; organization: string | null } }
  | { state: "invalid" }
  | { state: "expired" }
  | { state: "revoked" }
  | { state: "full" };

export type JoinInviteResult =
  | { state: "joined"; teamId: string }
  | { state: "already_member"; teamId: string }
  | Exclude<InviteLookup, { state: "valid" }>;

function slugPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 44) || "team";
}

function inviteState(invite: { expiresAt: Date | null; revokedAt: Date | null; maxUses: number | null; currentUses: number }): Exclude<InviteLookup, { state: "valid" }> | null {
  if (invite.revokedAt) return { state: "revoked" };
  if (invite.expiresAt && invite.expiresAt <= new Date()) return { state: "expired" };
  if (invite.maxUses !== null && invite.currentUses >= invite.maxUses) return { state: "full" };
  return null;
}

export async function createTeamForUser(userId: string, input: unknown) {
  const parsed = createTeamSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Enter the team details." };
  }

  const teamNumber = normalizeTeamNumber(parsed.data.teamNumber);
  const rawInviteCode = createInviteCode(teamNumber);
  const codeHash = hashInviteCode(rawInviteCode);
  const slug = slugPart(teamNumber + "-" + parsed.data.name) + "-" + rawInviteCode.slice(-8).toLowerCase();

  try {
    const team = await prisma.$transaction(async (tx) => {
      const created = await tx.team.create({
        data: {
          name: parsed.data.name,
          slug,
          teamNumber,
          program: parsed.data.program as VexProgram,
          ownerId: userId,
          members: {
            create: {
              userId,
              permission: "OWNER",
              status: "ACTIVE",
              joinedAt: new Date(),
            },
          },
        },
      });

      await tx.teamInvite.create({
        data: {
          teamId: created.id,
          createdById: userId,
          codeHash,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          action: "team.create",
          targetType: "Team",
          targetId: created.id,
          metadata: { teamNumber, program: parsed.data.program },
        },
      });

      return created;
    });

    return { ok: true as const, team, inviteCode: rawInviteCode };
  } catch {
    return { ok: false as const, message: "We could not create that team. Try a different team name and retry." };
  }
}

export async function previewTeamInvite(rawCode: string): Promise<InviteLookup> {
  const parsed = joinTeamSchema.safeParse({ code: rawCode });
  if (!parsed.success) return { state: "invalid" };

  const invite = await prisma.teamInvite.findUnique({
    where: { codeHash: hashInviteCode(parsed.data.code) },
    include: { team: { select: { id: true, name: true, teamNumber: true, organization: true } } },
  });

  if (!invite) return { state: "invalid" };
  const unavailable = inviteState(invite);
  if (unavailable) return unavailable;
  return { state: "valid", team: invite.team };
}

export async function consumeTeamInvite(userId: string, rawCode: string): Promise<JoinInviteResult> {
  const parsed = joinTeamSchema.safeParse({ code: rawCode });
  if (!parsed.success) return { state: "invalid" };
  const codeHash = hashInviteCode(parsed.data.code);

  return prisma.$transaction(async (tx) => {
    const invite = await tx.teamInvite.findUnique({
      where: { codeHash },
      include: { team: { select: { id: true } } },
    });
    if (!invite) return { state: "invalid" };

    const unavailable = inviteState(invite);
    if (unavailable) return unavailable;

    const existing = await tx.teamMember.findUnique({
      where: { teamId_userId: { teamId: invite.teamId, userId } },
      select: { id: true, status: true },
    });

    if (existing?.status === "ACTIVE") {
      return { state: "already_member", teamId: invite.teamId };
    }

    const capacity = await tx.teamInvite.updateMany({
      where: {
        id: invite.id,
        revokedAt: null,
        ...(invite.expiresAt ? { expiresAt: { gt: new Date() } } : {}),
        ...(invite.maxUses === null ? {} : { currentUses: { lt: invite.maxUses } }),
      },
      data: { currentUses: { increment: 1 } },
    });

    if (!capacity.count) return { state: "full" };

    if (existing) {
      await tx.teamMember.update({
        where: { id: existing.id },
        data: { status: "ACTIVE", permission: "MEMBER", joinedAt: new Date() },
      });
    } else {
      await tx.teamMember.create({
        data: {
          teamId: invite.teamId,
          userId,
          permission: "MEMBER",
          status: "ACTIVE",
          joinedAt: new Date(),
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: userId,
        action: "team.invite.consume",
        targetType: "TeamInvite",
        targetId: invite.id,
        metadata: { teamId: invite.teamId },
      },
    });

    return { state: "joined", teamId: invite.teamId };
  });
}

async function requireInviteManager(teamId: string, actorId: string) {
  const membership = await prisma.teamMember.findFirst({
    where: { teamId, userId: actorId, status: "ACTIVE", permission: { in: ["OWNER", "ADMIN"] } },
    select: { id: true, permission: true },
  });
  if (!membership) throw new Error("Only a team owner or administrator can manage invite codes.");

  return membership;
}

export async function regenerateTeamInvite(teamId: string, actorId: string, options?: { expiresAt?: Date | null; maxUses?: number | null }) {
  await requireInviteManager(teamId, actorId);

  const team = await prisma.team.findUniqueOrThrow({
    where: { id: teamId },
    select: { id: true, teamNumber: true },
  });
  const inviteCode = createInviteCode(team.teamNumber ?? "TEAM");

  await prisma.$transaction(async (tx) => {
    await tx.teamInvite.updateMany({
      where: { teamId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await tx.teamInvite.create({
      data: {
        teamId,
        createdById: actorId,
        codeHash: hashInviteCode(inviteCode),
        expiresAt: options?.expiresAt ?? null,
        maxUses: options?.maxUses ?? null,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId,
        action: "team.invite.regenerate",
        targetType: "Team",
        targetId: teamId,
      },
    });
  });

  return inviteCode;
}

export async function revokeTeamInvites(teamId: string, actorId: string) {
  await requireInviteManager(teamId, actorId);

  return prisma.$transaction(async (tx) => {
    const revoked = await tx.teamInvite.updateMany({
      where: { teamId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await tx.auditLog.create({
      data: {
        actorId,
        action: "team.invite.revoke",
        targetType: "Team",
        targetId: teamId,
        metadata: { count: revoked.count },
      },
    });
    return revoked.count;
  });
}

export async function updateTeamMemberPermissions(
  teamId: string,
  actorId: string,
  memberId: string,
  permission: TeamPermissionRole,
  roboticsRoles: TeamRoboticsRole[],
) {
  const actor = await prisma.teamMember.findFirst({
    where: { teamId, userId: actorId, status: "ACTIVE", permission: { in: ["OWNER", "ADMIN"] } },
    select: { userId: true, permission: true },
  });
  if (!actor) throw new Error("Only a team owner or administrator can update member access.");

  const member = await prisma.teamMember.findFirst({
    where: { id: memberId, teamId, status: "ACTIVE" },
    select: { id: true, userId: true, permission: true },
  });
  if (!member) throw new Error("That team member is no longer active.");
  if (member.permission === "OWNER" || permission === "OWNER") {
    throw new Error("Ownership changes require the dedicated ownership transfer flow.");
  }
  if (member.userId === actor.userId && permission !== actor.permission) {
    throw new Error("You cannot change your own permission level from this screen.");
  }
  if (actor.permission !== "OWNER" && (member.permission === "ADMIN" || permission === "ADMIN")) {
    throw new Error("Only the team owner can manage administrator access.");
  }
  return prisma.$transaction(async (tx) => {
    const updated = await tx.teamMember.update({
      where: { id: member.id },
      data: { permission, roboticsRoles },
    });
    await tx.auditLog.create({
      data: {
        actorId,
        action: "team.member.access.update",
        targetType: "TeamMember",
        targetId: member.id,
        metadata: { teamId, permission, roboticsRoles },
      },
    });
    return updated;
  });
}

export async function getUserTeams(userId: string) {
  return prisma.teamMember.findMany({
    where: { userId, status: "ACTIVE" },
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
          updatedAt: true,
        },
      },
    },
    orderBy: { team: { updatedAt: "desc" } },
  });
}
