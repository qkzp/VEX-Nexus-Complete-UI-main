import { validateRoute, type AutonomousRoute } from "@/lib/autonomous";
import { CodeLab } from "@/components/app/code-lab";
import { NeedsTeam } from "@/components/app/team-scope";
import { requireCompletedOnboarding } from "@/lib/authz";
import { prisma, withDatabaseFallback } from "@/lib/db";
import { getWorkspaceTeam } from "@/lib/workspace/data";
import { getTeamSharedState } from "@/lib/workspace/state";

type PageProps = { searchParams: Promise<{ team?: string }> };

export default async function CodePage({ searchParams }: PageProps) {
  const { team: requestedTeam } = await searchParams;
  const user = await requireCompletedOnboarding("/code");
  const { team } = await getWorkspaceTeam(user.id, requestedTeam);
  if (!team) return <NeedsTeam title="Join or create a team before using Code Lab" />;
  const shared = await getTeamSharedState(team.id);
  const robots = await withDatabaseFallback(
    () =>
      prisma.robot.findMany({
        where: { teamId: team.id, status: { notIn: ["ARCHIVED", "RETIRED"] } },
        orderBy: { updatedAt: "desc" },
        include: { configuration: { include: { motors: { orderBy: { port: "asc" } }, sensors: true, pneumatics: true, mechanisms: true } } },
      }),
    [],
  );
  const field = shared.state.fieldLab as { routines?: unknown[] } | undefined;
  const routines = (Array.isArray(field?.routines) ? field.routines : []).filter((value): value is AutonomousRoute & { id: string; selectedRobotId: string | null } => {
    if (!value || typeof value !== "object") return false;
    const r = value as AutonomousRoute & { id: string; selectedRobotId: string | null };
    return typeof r.id === "string" && typeof r.name === "string" && typeof r.selectedRobotId === "string" && Array.isArray(r.routePoints) && validateRoute(r).length === 0;
  });
  return <CodeLab key={team.id} routines={routines} teamId={team.id} activeRobotId={shared.activeRobotId} robots={robots} initialState={(shared.state.codeLab ?? {}) as Record<string, unknown>} />;
}
