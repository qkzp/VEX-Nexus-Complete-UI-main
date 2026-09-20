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
  return <CodeLab teamId={team.id} activeRobotId={shared.activeRobotId} robots={robots} initialState={(shared.state.codeLab ?? {}) as Record<string, unknown>} />;
}
