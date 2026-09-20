import { NotebookStudio } from "@/components/app/notebook-studio";
import { NotebookEntryForm, type NotebookEntryDraft } from "@/components/app/workspace-forms";
import { NeedsTeam } from "@/components/app/team-scope";
import { requireCompletedOnboarding } from "@/lib/authz";
import { prisma, withDatabaseFallback } from "@/lib/db";
import { getWorkspaceTeam } from "@/lib/workspace/data";
import { getTeamSharedState } from "@/lib/workspace/state";

type PageProps = { searchParams: Promise<{ team?: string; fromTest?: string }> };

function testDraft(test: {
  id: string;
  name: string;
  type: string;
  durationSeconds: number | null;
  score: number | null;
  passed: boolean;
  notes: string | null;
  createdAt: Date;
  robot: { id: string; name: string };
}): NotebookEntryDraft {
  const facts = [
    `Test type: ${test.type.toLowerCase()}.`,
    test.durationSeconds === null ? null : `Recorded duration: ${test.durationSeconds} seconds.`,
    test.score === null ? null : `Recorded score: ${test.score}.`,
    test.notes ? `Recorded observation: ${test.notes}` : null,
  ].filter((value): value is string => Boolean(value));

  return {
    testRunId: test.id,
    robotId: test.robot.id,
    title: `${test.robot.name}: ${test.name}`,
    occurredOn: test.createdAt.toISOString().slice(0, 10),
    objective: `Record the ${test.type.toLowerCase()} test "${test.name}" for ${test.robot.name}.`,
    testing: facts.join("\n"),
    results: `Recorded result: ${test.passed ? "passed" : "failed"}.`,
  };
}

export default async function NotebookPage({ searchParams }: PageProps) {
  const { team: requestedTeam, fromTest } = await searchParams;
  const user = await requireCompletedOnboarding("/notebook");
  const { team } = await getWorkspaceTeam(user.id, requestedTeam);
  if (!team) return <NeedsTeam title="Join or create a team before connecting a notebook" />;
  const [shared, linkedTest] = await Promise.all([
    getTeamSharedState(team.id),
    fromTest
      ? withDatabaseFallback(
          () => prisma.testRun.findFirst({
            where: { id: fromTest, teamId: team.id },
            select: {
              id: true,
              name: true,
              type: true,
              durationSeconds: true,
              score: true,
              passed: true,
              notes: true,
              createdAt: true,
              notebookEntryId: true,
              robot: { select: { id: true, name: true } },
            },
          }),
          null,
        )
      : Promise.resolve(null),
  ]);
  const draft = linkedTest && !linkedTest.notebookEntryId ? testDraft(linkedTest) : null;

  return <>
    {draft ? <section className="workspace-page suite-page notebook-test-draft">
      <header className="suite-hero compact">
        <div>
          <div className="suite-badges"><span className="analysis-badge">TEST-BASED DRAFT</span></div>
          <p className="page-kicker">Engineering Notebook</p>
          <h1>Review the recorded test before saving.</h1>
          <p>This draft includes only the test facts already saved by the team. Edit it to add the team&apos;s own context and next steps.</p>
        </div>
      </header>
      <section className="suite-panel"><NotebookEntryForm teamId={team.id} draft={draft} /></section>
    </section> : null}
    <NotebookStudio teamId={team.id} initialState={(shared.state.notebook ?? {}) as Record<string, unknown>} />
  </>;
}
