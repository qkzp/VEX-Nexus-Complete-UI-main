import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import type { TeamPermissionRole } from "@prisma/client";

const permissionRank: Record<TeamPermissionRole, number> = {
  VIEWER: 0,
  MEMBER: 1,
  TEAM_LEAD: 2,
  ADMIN: 3,
  OWNER: 4,
};

export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to access this team resource.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function requireCurrentUser(callbackUrl = "/app/dashboard") {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=" + encodeURIComponent(callbackUrl));
  }
  return session.user;
}

export async function requireCompletedOnboarding(callbackUrl = "/app/dashboard") {
  const user = await requireCurrentUser(callbackUrl);
  if (!user.onboardingComplete) {
    redirect("/onboarding?callbackUrl=" + encodeURIComponent(callbackUrl));
  }
  return user;
}

export async function requireActiveMembership(teamId: string, minimumRole: TeamPermissionRole = "VIEWER") {
  const user = await requireCurrentUser("/app/dashboard");
  const membership = await prisma.teamMember.findFirst({
    where: { teamId, userId: user.id, status: "ACTIVE" },
    select: {
      id: true,
      teamId: true,
      userId: true,
      permission: true,
      roboticsRoles: true,
      team: { select: { id: true, name: true, teamNumber: true } },
    },
  });

  if (!membership || permissionRank[membership.permission] < permissionRank[minimumRole]) {
    throw new AuthorizationError();
  }

  return membership;
}

export function canManageMembers(role: TeamPermissionRole) {
  return permissionRank[role] >= permissionRank.ADMIN;
}

export function canManageEngineering(role: TeamPermissionRole) {
  return permissionRank[role] >= permissionRank.TEAM_LEAD;
}
