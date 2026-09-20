import { requireCurrentUser } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { requireWorkspaceTeam } from "@/lib/workspace/data";
import { getTeamSharedState, updateTeamSharedSection, updateTeamSharedState } from "@/lib/workspace/state";

const allowedSections = new Set([
  "scouting",
  "testing",
  "notebook",
  "eventMode",
  "fieldLab",
  "codeLab",
  "teamOps",
  "community",
]);

export async function GET(request: Request) {
  const user = await requireCurrentUser("/app/dashboard");
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId")?.trim();
  if (!teamId) return Response.json({ error: "teamId is required" }, { status: 400 });
  await requireWorkspaceTeam(user.id, teamId);
  return Response.json(await getTeamSharedState(teamId), { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request) {
  const user = await requireCurrentUser("/app/dashboard");
  const body = await request.json().catch(() => null) as null | { teamId?: string; section?: string; value?: unknown; activeRobotId?: string | null; selectedEventId?: number | null };
  const teamId = body?.teamId?.trim();
  if (!teamId) return Response.json({ error: "teamId is required" }, { status: 400 });
  await requireWorkspaceTeam(user.id, teamId, "MEMBER");

  if (Object.prototype.hasOwnProperty.call(body, "activeRobotId")) {
    const activeRobotId = body?.activeRobotId || null;
    if (activeRobotId) {
      const robot = await prisma.robot.findFirst({ where: { id: activeRobotId, teamId }, select: { id: true } });
      if (!robot) return Response.json({ error: "Robot does not belong to this team." }, { status: 400 });
    }
    await updateTeamSharedState(teamId, { activeRobotId }, user.id);
  }

  if (Object.prototype.hasOwnProperty.call(body, "selectedEventId")) {
    const selectedEventId = typeof body?.selectedEventId === "number" && Number.isInteger(body.selectedEventId) ? body.selectedEventId : null;
    await updateTeamSharedState(teamId, { selectedEventId }, user.id);
  }

  if (body?.section) {
    if (!allowedSections.has(body.section)) return Response.json({ error: "Unsupported workspace section." }, { status: 400 });
    await updateTeamSharedSection(teamId, body.section, body.value ?? null, user.id);
  }

  return Response.json({ ok: true });
}
