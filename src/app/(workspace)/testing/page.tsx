import { TestingCenter } from "@/components/app/testing-center";
import { NeedsTeam } from "@/components/app/team-scope";
import { requireCompletedOnboarding } from "@/lib/authz";
import { prisma, withDatabaseFallback } from "@/lib/db";
import { getWorkspaceTeam } from "@/lib/workspace/data";
import { getTeamSharedState } from "@/lib/workspace/state";

type PageProps = { searchParams: Promise<{ team?: string }> };

export default async function TestingPage({ searchParams }: PageProps) {
  const { team: requestedTeam } = await searchParams;
  const user = await requireCompletedOnboarding("/testing");
  const { team } = await getWorkspaceTeam(user.id, requestedTeam);
  if (!team) return <NeedsTeam title="Join or create a team before logging tests" />;
  const shared = await getTeamSharedState(team.id);
  const [robots, testRuns, openTasks] = await withDatabaseFallback(
    () => prisma.$transaction([
      prisma.robot.findMany({
        where: { teamId: team.id, status: { notIn: ["ARCHIVED", "RETIRED"] } },
        orderBy: { updatedAt: "desc" },
        include: { configuration: { include: { mechanisms: true } } },
      }),
      prisma.testRun.findMany({
        where: { teamId: team.id },
        orderBy: { createdAt: "desc" },
        take: 120,
        select: {
          id: true,
          robotId: true,
          configurationVersion: true,
          type: true,
          name: true,
          durationSeconds: true,
          score: true,
          passed: true,
          notes: true,
          createdAt: true,
          buildLogId: true,
          notebookEntryId: true,
          task: { select: { id: true, title: true, status: true } },
        },
      }),
      prisma.task.findMany({
        where: { teamId: team.id, status: { notIn: ["COMPLETE", "CANCELLED"] } },
        orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
        select: { id: true, title: true, robotId: true, status: true },
      }),
    ]),
    [[], [], []],
  );
  return <TestingCenter
    teamId={team.id}
    activeRobotId={shared.activeRobotId}
    robots={robots}
    initialState={(shared.state.testing ?? {}) as Record<string, unknown>}
    persistedRuns={testRuns.map((run) => ({ ...run, createdAt: run.createdAt.toISOString() }))}
    openTasks={openTasks}
  />;
}
