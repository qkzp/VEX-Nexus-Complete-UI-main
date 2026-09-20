import Link from "next/link";
import { ArrowRight, Bot, Plus } from "lucide-react";
import { CreateRobotForm } from "@/components/app/workspace-forms";
import { setActiveRobotAction } from "@/lib/actions/workspace";
import { NeedsTeam, TeamScope } from "@/components/app/team-scope";
import { requireCompletedOnboarding } from "@/lib/authz";
import { prisma, withDatabaseFallback } from "@/lib/db";
import { getWorkspaceTeam } from "@/lib/workspace/data";
import { getTeamSharedState } from "@/lib/workspace/state";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";

type PageProps = { searchParams: Promise<{ team?: string; create?: string }> };

export default async function RobotsPage({ searchParams }: PageProps) {
  const { team: requestedTeam, create } = await searchParams;
  const user = await requireCompletedOnboarding("/robots");
  const { team, teams } = await getWorkspaceTeam(user.id, requestedTeam);
  if (!team) return <NeedsTeam title="Create a team before adding robots" body="Robot profiles are private to a team workspace and begin empty for each new team." />;

  const shared = await getTeamSharedState(team.id);
  const robots = await withDatabaseFallback(
    () =>
      prisma.robot.findMany({
        where: { teamId: team.id },
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
        include: {
          configuration: {
            select: {
              drivetrainType: true,
              driveMotorCount: true,
              theoreticalSpeedFtPerSec: true,
              isComplete: true,
              configurationVersion: true,
              motors: { select: { id: true } },
              sensors: { select: { id: true } },
              pneumatics: { select: { id: true } },
            },
          },
        },
      }),
    [],
  );
  const scopePath = create === "1" ? "/robots?create=1" : "/robots";

  return <section className="workspace-page robots-page">
    <header className="page-header">
      <div><span className="page-kicker">Robot profiles</span><h1>Robot workbench</h1><p>Stored hardware is the only hardware shown to code and engineering tools.</p></div>
      <Link href={`/robots?team=${encodeURIComponent(team.id)}&create=1`} className="button button-primary"><Plus size={16} /> New robot</Link>
    </header>
    <TeamScope teams={teams} selectedId={team.id} path={scopePath} />

    {create === "1" ? <section className="creation-panel"><div><span className="section-overline">New private robot profile</span><h2>Start with what you know.</h2><p>You can add hardware incrementally. Configuration checks will distinguish saved facts from missing evidence.</p></div><CreateRobotForm teamId={team.id} /></section> : null}

    {robots.length ? <div className="robot-list">
      {robots.map((robot) => {
        const config = robot.configuration;
        const deviceCount = (config?.motors.length ?? 0) + (config?.sensors.length ?? 0) + (config?.pneumatics.length ?? 0);
        return <article key={robot.id} className={shared.activeRobotId === robot.id ? "robot-list-item is-active-robot" : "robot-list-item"}>
          <Link href={`/robots/${robot.id}?team=${encodeURIComponent(team.id)}`} className="robot-list-main">
            <span className="robot-list-icon"><Bot size={20} /></span>
            <div><span className="section-overline">{shared.activeRobotId === robot.id ? "active competition robot" : robot.status.toLowerCase()}</span><h2>{robot.name}</h2><p>{robot.description || "No working description saved yet."}</p></div>
            <dl><div><dt>Drivetrain</dt><dd>{config?.drivetrainType?.replaceAll("_", " ") || "Not recorded"}</dd></div><div><dt>Hardware</dt><dd>{deviceCount ? `${deviceCount} saved device${deviceCount === 1 ? "" : "s"}` : "Not recorded"}</dd></div><div><dt>Revision</dt><dd>{config ? `v${config.configurationVersion ?? 1}` : "Not configured"}</dd></div></dl>
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
          {shared.activeRobotId !== robot.id ? <form action={setActiveRobotAction} className="active-robot-form"><input type="hidden" name="teamId" value={team.id} /><input type="hidden" name="robotId" value={robot.id} /><input type="hidden" name="returnTo" value={`/robots?team=${encodeURIComponent(team.id)}`} /><PendingSubmitButton className="button button-quiet" pendingLabel="Setting active...">Set active</PendingSubmitButton></form> : <span className="status-chip good">Active</span>}
        </article>;
      })}
    </div> : <div className="large-empty"><Bot size={28} /><h2>No robots yet</h2><p>Create your first profile so BoltCanvas can use your saved hardware instead of relying on placeholder assumptions.</p><Link href={`/robots?team=${encodeURIComponent(team.id)}&create=1`} className="button button-primary">Create robot</Link></div>}
  </section>;
}
