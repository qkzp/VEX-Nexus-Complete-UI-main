"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireActiveMembership, requireCurrentUser } from "@/lib/authz";
import { databaseErrorMessage, ensureDatabaseReady, prisma } from "@/lib/db";
import {
  consumeTeamInvite,
  createTeamForUser,
  regenerateTeamInvite,
  revokeTeamInvites,
  updateTeamMemberPermissions,
} from "@/lib/teams/service";

export type TeamActionState = {
  error?: string;
  success?: string;
  inviteCode?: string;
  teamId?: string;
};

const idSchema = z.string().trim().min(10).max(128);
const accessSchema = z.object({
  permission: z.enum(["ADMIN", "TEAM_LEAD", "MEMBER", "VIEWER"]),
  roboticsRoles: z.array(z.enum(["BUILDER", "PROGRAMMER", "DRIVER", "CAD", "NOTEBOOK", "SCOUT", "TEAM_LEAD", "MENTOR"])).max(8),
});
const settingsSchema = z.object({
  name: z.string().trim().min(2, "Team name must be at least 2 characters.").max(100),
  organization: z.string().trim().max(160).optional(),
  location: z.string().trim().max(160).optional(),
  eventRegion: z.string().trim().max(160).optional(),
  description: z.string().trim().max(4000).optional(),
});

function safeTeamId(value: string) {
  return idSchema.safeParse(value).success;
}

function actionError(error: unknown, fallback: string) {
  const databaseMessage = databaseErrorMessage(error);
  if (databaseMessage) return databaseMessage;
  if (!(error instanceof Error)) return fallback;
  const messages = [
    "Only a team owner or administrator",
    "Only the team owner",
    "That team member",
    "You cannot change",
    "Ownership changes",
  ];
  return messages.some((message) => error.message.startsWith(message)) ? error.message : fallback;
}

function readTeamForm(formData: FormData) {
  return {
    teamNumber: formData.get("teamNumber"),
    name: formData.get("name"),
    program: formData.get("program"),
  };
}

/** Creates one private team and only returns its raw invite code in this response. */
export async function createTeamAction(_: TeamActionState, formData: FormData): Promise<TeamActionState> {
  try {
    await ensureDatabaseReady();
  } catch (error) {
    return { error: actionError(error, "Team setup is not configured yet.") };
  }

  const user = await requireCurrentUser("/onboarding/team");
  const result = await createTeamForUser(user.id, readTeamForm(formData));
  if (!result.ok) return { error: result.message };

  revalidatePath("/team");
  revalidatePath("/app/dashboard");
  return {
    success: "Your private team workspace is ready. Save the invite code before you leave this page.",
    teamId: result.team.id,
    inviteCode: result.inviteCode,
  };
}

export async function joinTeamAction(_: TeamActionState, formData: FormData): Promise<TeamActionState> {
  try {
    await ensureDatabaseReady();
  } catch (error) {
    return { error: actionError(error, "Joining a team is not configured yet.") };
  }

  const user = await requireCurrentUser("/join-team");
  const result = await consumeTeamInvite(user.id, String(formData.get("code") ?? ""));
  if (result.state === "joined") {
    revalidatePath("/team");
    revalidatePath("/app/dashboard");
    return { success: "You joined the team workspace.", teamId: result.teamId };
  }
  if (result.state === "already_member") {
    return { success: "You are already a member of this team.", teamId: result.teamId };
  }

  const messages = {
    invalid: "That invite code is not valid.",
    expired: "That invite code has expired.",
    revoked: "That invite code is no longer active.",
    full: "That invite code has reached its member limit.",
  } as const;
  return { error: messages[result.state] };
}

export async function regenerateTeamInviteAction(
  teamId: string,
  previousState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  void previousState;
  void formData;
  if (!safeTeamId(teamId)) return { error: "That team workspace could not be found." };
  try {
    await ensureDatabaseReady();
    const user = await requireCurrentUser("/team/settings?team=" + encodeURIComponent(teamId));
    const inviteCode = await regenerateTeamInvite(teamId, user.id);
    revalidatePath("/team");
    revalidatePath("/team/settings");
    return {
      success: "The previous invite code was revoked. Save this new code before leaving the page.",
      inviteCode,
      teamId,
    };
  } catch (error) {
    return { error: actionError(error, "We could not regenerate the invite code. Please try again.") };
  }
}

export async function revokeTeamInvitesAction(
  teamId: string,
  previousState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  void previousState;
  void formData;
  if (!safeTeamId(teamId)) return { error: "That team workspace could not be found." };
  try {
    await ensureDatabaseReady();
    const user = await requireCurrentUser("/team/settings?team=" + encodeURIComponent(teamId));
    const count = await revokeTeamInvites(teamId, user.id);
    revalidatePath("/team");
    revalidatePath("/team/settings");
    return { success: count ? "The active invite code was disabled." : "There was no active invite code to disable." };
  } catch (error) {
    return { error: actionError(error, "We could not disable the invite code. Please try again.") };
  }
}

export async function updateTeamMemberAccessAction(
  teamId: string,
  memberId: string,
  _: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  if (!safeTeamId(teamId) || !safeTeamId(memberId)) {
    return { error: "That team member could not be found." };
  }

  const parsed = accessSchema.safeParse({
    permission: formData.get("permission"),
    roboticsRoles: formData.getAll("roboticsRoles").filter((role): role is string => typeof role === "string"),
  });
  if (!parsed.success) return { error: "Choose a valid permission level and robotics role." };

  try {
    await ensureDatabaseReady();
    const user = await requireCurrentUser("/team/members?team=" + encodeURIComponent(teamId));
    await updateTeamMemberPermissions(teamId, user.id, memberId, parsed.data.permission, parsed.data.roboticsRoles);
    revalidatePath("/team");
    revalidatePath("/team/members");
    return { success: "Member access was updated." };
  } catch (error) {
    return { error: actionError(error, "We could not update that member's access. Please try again.") };
  }
}

export async function updateTeamSettingsAction(
  teamId: string,
  _: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  if (!safeTeamId(teamId)) return { error: "That team workspace could not be found." };

  const parsed = settingsSchema.safeParse({
    name: formData.get("name"),
    organization: formData.get("organization"),
    location: formData.get("location"),
    eventRegion: formData.get("eventRegion"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the team settings and try again." };

  try {
    await ensureDatabaseReady();
    const membership = await requireActiveMembership(teamId, "ADMIN");
    const data = parsed.data;
    await prisma.$transaction(async (tx) => {
      await tx.team.update({
        where: { id: teamId },
        data: {
          name: data.name,
          organization: data.organization || null,
          location: data.location || null,
          eventRegion: data.eventRegion || null,
          description: data.description || null,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: membership.userId,
          action: "team.settings.update",
          targetType: "Team",
          targetId: teamId,
        },
      });
    });
    revalidatePath("/team");
    revalidatePath("/team/settings");
    return { success: "Team settings were saved." };
  } catch (error) {
    return { error: actionError(error, "We could not save the team settings. Please try again.") };
  }
}
