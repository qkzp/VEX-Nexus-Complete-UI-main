import { auth } from "@/auth";
import { AuthorizationError } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { requireWorkspaceTeam } from "@/lib/workspace/data";
import { getTeamSharedState, updateTeamSharedSection, updateTeamSharedState } from "@/lib/workspace/state";
import { z } from "zod";

const allowedSections = ["scouting", "testing", "notebook", "eventMode", "fieldLab", "codeLab", "teamOps", "community"] as const;
const patchSchema = z.object({
  teamId: z.string().trim().min(1).max(200),
  section: z.enum(allowedSections).optional(),
  value: z.unknown().optional(),
  activeRobotId: z.string().min(1).max(200).nullable().optional(),
  selectedEventId: z.number().int().positive().nullable().optional(),
}).strict().refine(body => Boolean(body.section) || Object.hasOwn(body, "activeRobotId") || Object.hasOwn(body, "selectedEventId"), "No workspace change supplied.");

function failure(error: unknown) {
  if (error instanceof AuthorizationError) return Response.json({ error: "You do not have access to edit this team workspace." }, { status: 403 });
  console.error("Workspace request failed", error instanceof Error ? error.name : "Unknown error");
  return Response.json({ error: "Workspace unavailable. Your changes have not been saved yet." }, { status: 503 });
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Sign in to access your workspace." }, { status: 401 });
  const teamId = new URL(request.url).searchParams.get("teamId")?.trim();
  if (!teamId) return Response.json({ error: "teamId is required" }, { status: 400 });
  try {
    await requireWorkspaceTeam(session.user.id, teamId);
    return Response.json(await getTeamSharedState(teamId), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return failure(error); }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Sign in to save your workspace." }, { status: 401 });
  if (!request.headers.get("content-type")?.includes("application/json")) return Response.json({ error: "JSON is required." }, { status: 415 });
  const raw = await request.text();
  if (raw.length > 1_000_000) return Response.json({ error: "Workspace update is too large." }, { status: 413 });
  let json: unknown;
  try { json = JSON.parse(raw); } catch { return Response.json({ error: "Invalid JSON." }, { status: 400 }); }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid update." }, { status: 400 });
  const body = parsed.data;
  try {
    await requireWorkspaceTeam(session.user.id, body.teamId, "MEMBER");
    if (body.activeRobotId) {
      const robot = await prisma.robot.findFirst({ where: { id: body.activeRobotId, teamId: body.teamId }, select: { id: true } });
      if (!robot) return Response.json({ error: "Robot does not belong to this team." }, { status: 400 });
    }
    const patch = {
      ...(Object.hasOwn(body, "activeRobotId") ? { activeRobotId: body.activeRobotId } : {}),
      ...(Object.hasOwn(body, "selectedEventId") ? { selectedEventId: body.selectedEventId } : {}),
    };
    if (Object.keys(patch).length) await updateTeamSharedState(body.teamId, patch, session.user.id);
    if (body.section) await updateTeamSharedSection(body.teamId, body.section, body.value ?? null, session.user.id);
    return Response.json({ ok: true });
  } catch (error) { return failure(error); }
}
