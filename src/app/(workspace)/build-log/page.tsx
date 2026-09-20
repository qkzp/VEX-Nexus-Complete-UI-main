import { Hammer } from "lucide-react";
import { BuildLogEntryForm } from "@/components/app/workspace-forms";
import { NeedsTeam, TeamScope } from "@/components/app/team-scope";
import { requireCompletedOnboarding } from "@/lib/authz";
import { prisma, withDatabaseFallback } from "@/lib/db";
import { getWorkspaceTeam } from "@/lib/workspace/data";

type PageProps = { searchParams: Promise<{ team?: string }> };

export default async function BuildLogPage({ searchParams }: PageProps) {
  const { team: requestedTeam } = await searchParams;
  const user = await requireCompletedOnboarding("/build-log");
  const { team, teams } = await getWorkspaceTeam(user.id, requestedTeam);
  if (!team) return <NeedsTeam title="Create or join a team first" body="Build logs belong to the selected team workspace." />;
  const entries = await withDatabaseFallback(
    () => prisma.buildLog.findMany({ where: { teamId: team.id }, orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }], take: 60, include: { author: { select: { displayName: true, name: true, username: true } } } }),
    [],
  );
  return <section className="workspace-page suite-page"><header className="suite-hero compact"><div><div className="suite-badges"><span className="analysis-badge">TEAM-ENTERED EVIDENCE</span></div><p className="page-kicker">Build Log</p><h1>Record what changed and what was actually tested.</h1><p>This log stores team-entered engineering evidence. It does not invent measurements or rewrite your competition notebook.</p></div><Hammer size={28}/></header><TeamScope teams={teams} selectedId={team.id} path="/build-log"/><section className="suite-panel"><div className="suite-panel-heading"><div><span className="section-overline">New record</span><h2>Build session</h2></div></div><BuildLogEntryForm teamId={team.id}/></section><section className="suite-panel"><div className="suite-panel-heading"><div><span className="section-overline">History</span><h2>Recent build records</h2></div></div><div className="build-log-list">{entries.map((entry) => <article key={entry.id}><span>{entry.occurredOn.toLocaleDateString()} · {entry.author.displayName || entry.author.name || entry.author.username || "Team member"}</span><h3>{entry.title}</h3>{entry.summary ? <p>{entry.summary}</p> : null}<dl>{entry.reason ? <div><dt>Reason</dt><dd>{entry.reason}</dd></div> : null}{entry.testing ? <div><dt>Testing</dt><dd>{entry.testing}</dd></div> : null}{entry.results ? <div><dt>Results</dt><dd>{entry.results}</dd></div> : null}{entry.nextSteps ? <div><dt>Next</dt><dd>{entry.nextSteps}</dd></div> : null}</dl></article>)}{!entries.length ? <div className="suite-empty">No build records yet.</div> : null}</div></section></section>;
}
