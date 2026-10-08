import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  Circle,
  FileClock,
  Flag,
  Gauge,
  ListChecks,
  Plus,
  Route,
  Wrench,
} from "lucide-react";
import type { WorkspaceTeam } from "@/lib/workspace/data";
import { createDashboardSummary, type RobotHealth } from "@/lib/workspace/dashboard-summary";

type DashboardData = Awaited<ReturnType<typeof import("@/lib/workspace/data").getTeamDashboard>>;

type DashboardProps = {
  userName: string;
  team: WorkspaceTeam | null;
  data: DashboardData | null;
};

function displayName(userName: string) {
  return userName.split(/\s+/)[0] || "there";
}

function dateLabel(value: Date | null) {
  if (!value) return "No date set";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(value);
}

function dateTimeLabel(value: Date | null) {
  if (!value) return "No test recorded";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function authorLabel(author: { displayName: string | null; name: string | null; username: string | null }) {
  return author.displayName || author.name || (author.username ? `@${author.username}` : "Team member");
}

function withTeam(path: string, teamId: string | null) {
  if (!teamId) return path;
  const url = new URL(path, "http://localhost");
  url.searchParams.set("team", teamId);
  const query = url.searchParams.toString();
  return `${url.pathname}${query ? `?${query}` : ""}`;
}

function StatusValue({ complete, attention = false, children }: { complete: boolean; attention?: boolean; children: React.ReactNode }) {
  const Icon = complete ? CheckCircle2 : attention ? AlertTriangle : Circle;
  return (
    <dd className={complete ? "is-complete" : attention ? "is-attention" : "is-pending"}>
      <Icon aria-hidden="true" size={14} />
      {children}
    </dd>
  );
}

function autonomousDetail(health: RobotHealth) {
  if (health.autonomousTestRuns) {
    const rate = Math.round((health.successfulAutonomousRuns / health.autonomousTestRuns) * 100);
    return `${health.successfulAutonomousRuns} successful run${health.successfulAutonomousRuns === 1 ? "" : "s"} / ${health.autonomousTestRuns} attempt${health.autonomousTestRuns === 1 ? "" : "s"} (${rate}% success)`;
  }
  if (health.autonomousRoutes) return "No matching autonomous test runs recorded";
  return "No autonomous routes saved";
}

export function CommandCenter({ userName, team, data }: DashboardProps) {
  if (!team || !data) {
    return (
      <section className="workspace-page command-center empty-command-center">
        <div className="page-kicker">Command center</div>
        <h1>Welcome, {displayName(userName)}.</h1>
        <p className="page-intro">Set up your engineering workspace once, then keep the team&apos;s work, robot configuration, and competition planning in one place.</p>
        <ol className="setup-list">
          <li>
            <span>01</span>
            <div><strong>Join or create a team</strong><p>Private workspaces are shared only with teammates who have a secure invite code.</p></div>
            <Link href="/onboarding/team" className="button button-primary">Set up a team <ArrowRight size={15} /></Link>
          </li>
          <li className="is-muted"><span>02</span><div><strong>Create a robot profile</strong><p>Save real ports, motors, sensors, and drivetrain decisions.</p></div></li>
          <li className="is-muted"><span>03</span><div><strong>Start a test or task</strong><p>Record evidence instead of starting with preset activity.</p></div></li>
        </ol>
      </section>
    );
  }

  const primaryRobot = data.robots[0];
  const teamLabel = team.teamNumber ? `${team.teamNumber} - ${team.name}` : team.name;
  const teamTasksHref = withTeam("/team/tasks", team.id);
  const robotsHref = withTeam("/robots", team.id);
  const createRobotHref = withTeam("/robots?create=1", team.id);
  const buildLogHref = withTeam("/build-log", team.id);
  const notebookHref = withTeam("/notebook", team.id);
  const testingHref = withTeam("/testing", team.id);
  const fieldLabHref = withTeam("/field-lab", team.id);
  const eventModeHref = withTeam("/events", team.id);
  const primaryRobotHref = primaryRobot ? withTeam(`/robots/${primaryRobot.id}`, team.id) : robotsHref;
  const summary = createDashboardSummary({
    robots: data.robots,
    tasks: data.tasks,
    evidence: [...data.buildLogs, ...data.notebookEntries],
    routines: data.autonomousRoutines,
    testRuns: data.testRuns,
    competition: data.competition,
    links: {
      createRobot: createRobotHref,
      robots: primaryRobotHref,
      testing: testingHref,
      autonomous: fieldLabHref,
      buildLog: buildLogHref,
      tasks: teamTasksHref,
      eventMode: eventModeHref,
    },
  });
  const readinessGroups = Array.from(new Set(summary.readinessChecks.map((check) => check.group))).map((group) => ({
    group,
    checks: summary.readinessChecks.filter((check) => check.group === group),
  }));
  const primaryHealth = primaryRobot ? summary.robotHealth.find((health) => health.robotId === primaryRobot.id) ?? null : null;
  const nextMoveClass = `next-move-panel is-${summary.nextMove.tone}`;
  const recentActivity = [
    ...data.buildLogs.map((entry) => ({
      kind: "Build log",
      id: entry.id,
      date: entry.occurredOn,
      title: entry.title,
      body: entry.summary || entry.results || "No summary recorded.",
      author: authorLabel(entry.author),
    })),
    ...data.notebookEntries.map((entry) => ({
      kind: "Notebook",
      id: entry.id,
      date: entry.occurredOn,
      title: entry.title,
      body: entry.objective || entry.decision || entry.results || "No structured detail recorded.",
      author: authorLabel(entry.author),
    })),
  ].sort((left, right) => right.date.getTime() - left.date.getTime()).slice(0, 5);

  return (
    <section className="workspace-page command-center">
      <header className="command-header dashboard-header">
        <div>
          <div className="page-kicker">Overview / {teamLabel}</div>
          <h1>Let&apos;s get building, {displayName(userName)}.</h1>
          <p>Your team&apos;s work, readiness, and next steps in one place.</p>
        </div>
        <Link href={teamTasksHref} className="button button-primary"><Plus size={16} aria-hidden="true" /> Plan work</Link>
      </header>

      <nav className="dashboard-shortcuts" aria-label="Quick actions">
        <Link href={testingHref}><Gauge size={18} aria-hidden="true" /><span>Record a test<small>Capture performance</small></span><ArrowRight size={15} aria-hidden="true" /></Link>
        <Link href={fieldLabHref}><Route size={18} aria-hidden="true" /><span>Plan autonomous<small>Build the next route</small></span><ArrowRight size={15} aria-hidden="true" /></Link>
        <Link href={buildLogHref}><Wrench size={18} aria-hidden="true" /><span>Log a build<small>Save what changed</small></span><ArrowRight size={15} aria-hidden="true" /></Link>
        <Link href={notebookHref}><FileClock size={18} aria-hidden="true" /><span>Open notebook<small>Document the decision</small></span><ArrowRight size={15} aria-hidden="true" /></Link>
      </nav>

      <section className={nextMoveClass} aria-labelledby="next-move-title">
        <div className="next-move-icon"><Gauge aria-hidden="true" size={22} /></div>
        <div className="next-move-copy">
          <span className="section-overline">Next move</span>
          <h2 id="next-move-title">{summary.nextMove.title}</h2>
          <p>{summary.nextMove.detail}</p>
        </div>
        <Link href={summary.nextMove.href} className="button button-primary next-move-action">{summary.nextMove.actionLabel} <ArrowRight size={16} /></Link>
      </section>

      <div className="dashboard-brief-grid">
        <details className="readiness-panel">
          <summary>
            <span className="readiness-summary-icon"><ListChecks aria-hidden="true" size={18} /></span>
            <span><span className="section-overline">Readiness</span><strong>{summary.readinessCompleteCount} of {summary.readinessChecks.length} readiness checks complete</strong></span>
            <ChevronDown aria-hidden="true" className="readiness-chevron" size={18} />
          </summary>
          <div className="readiness-progress" aria-hidden="true"><span style={{ width: `${(summary.readinessCompleteCount / summary.readinessChecks.length) * 100}%` }} /></div>
          <div className="readiness-groups">
            {readinessGroups.map(({ group, checks }) => (
              <section key={group}>
                <h3>{group}</h3>
                <ul>
                  {checks.map((check) => {
                    const Icon = check.complete ? CheckCircle2 : Circle;
                    return <li key={check.id} className={check.complete ? "is-complete" : "is-pending"}><Icon aria-hidden="true" size={14} /><span><strong>{check.label}</strong><small>{check.detail}</small></span>{!check.complete ? <Link href={check.href} aria-label={`Work on: ${check.label}`}><ArrowRight aria-hidden="true" size={14} /></Link> : null}</li>;
                  })}
                </ul>
              </section>
            ))}
          </div>
        </details>

        <section className="dashboard-autonomy-status" aria-labelledby="autonomous-status-title">
          <div className="dashboard-status-heading"><span className="status-surface-icon"><Route aria-hidden="true" size={18} /></span><div><span className="section-overline">Autonomous</span><h2 id="autonomous-status-title">{primaryRobot ? primaryRobot.name : "No active robot"}</h2></div></div>
          {primaryHealth ? <><strong>{primaryHealth.autonomousRoutes} saved route{primaryHealth.autonomousRoutes === 1 ? "" : "s"}</strong><p>{autonomousDetail(primaryHealth)}</p><Link href={primaryHealth.autonomousRoutes ? testingHref : fieldLabHref} className="text-link">{primaryHealth.autonomousRoutes ? "Record autonomous test" : "Plan autonomous"} <ArrowRight size={14} /></Link></> : <p>Create a robot profile before planning autonomous.</p>}
        </section>

        <section className="dashboard-competition-status" aria-labelledby="competition-status-title">
          <div className="dashboard-status-heading"><span className="status-surface-icon"><Flag aria-hidden="true" size={18} /></span><div><span className="section-overline">Competition</span><h2 id="competition-status-title">{data.competition?.name || "No event selected"}</h2></div></div>
          <p>{data.competition?.startsAt ? `Starts ${dateLabel(data.competition.startsAt)}.` : "Select a competition before pit preparation begins."}</p>
          <Link href={eventModeHref} className="text-link">Open Event Mode <ArrowRight size={14} /></Link>
        </section>
      </div>

      <div className="dashboard-primary-grid">
        <section className="robot-status-section" aria-labelledby="robot-status-title">
          <div className="section-line"><div><span className="section-overline">Robot workbench</span><h2 id="robot-status-title">Robot status</h2></div><Link href={robotsHref} className="text-link">All robots <ArrowRight size={14} /></Link></div>
          {data.robots.length ? (
            <div className="robot-health-list">
              {summary.robotHealth.map((health) => {
                const robot = data.robots.find((candidate) => candidate.id === health.robotId);
                const robotHref = withTeam(`/robots/${health.robotId}`, team.id);
                return (
                  <article className="robot-health-row" key={health.robotId}>
                    <div className="robot-health-title"><span className="robot-status-icon"><Bot aria-hidden="true" size={18} /></span><div><Link href={robotHref}><h3>{health.name}</h3></Link><p>{health.deviceCount} device{health.deviceCount === 1 ? "" : "s"} saved{robot?.configuration?.drivetrainType ? ` - ${robot.configuration.drivetrainType.replaceAll("_", " ")}` : ""}</p></div></div>
                    <dl className="robot-health-checks">
                      <div><dt>Hardware</dt><StatusValue complete={health.hardwareConfigured}>{health.hardwareConfigured ? "Configured" : "Incomplete"}</StatusValue></div>
                      <div><dt>Drive test</dt><StatusValue complete={health.testRuns > 0 && health.failedRuns === 0} attention={health.failedRuns > 0}>{health.testRuns ? `${health.successfulRuns}/${health.testRuns} passed` : "No test evidence"}</StatusValue></div>
                      <div><dt>Autonomous</dt><StatusValue complete={health.autonomousTestRuns > 0 && health.failedAutonomousRuns === 0} attention={health.failedAutonomousRuns > 0 || (health.autonomousRoutes > 0 && health.autonomousTestRuns === 0)}>{health.autonomousRoutes ? `${health.autonomousRoutes} route${health.autonomousRoutes === 1 ? "" : "s"}` : "No routes"}</StatusValue></div>
                      <div><dt>Evidence</dt><StatusValue complete={health.evidenceEntries > 0}>{health.evidenceEntries ? `${health.evidenceEntries} entr${health.evidenceEntries === 1 ? "y" : "ies"}` : "Not attached"}</StatusValue></div>
                    </dl>
                    <div className="robot-health-meta"><span>Last tested: <strong>{dateTimeLabel(health.lastTestAt)}</strong></span><Link href={robotHref} className="inline-action">Open robot <ArrowRight size={13} /></Link></div>
                  </article>
                );
              })}
            </div>
          ) : <div className="inline-empty-state"><Bot size={24} aria-hidden="true" /><div><strong>No robots yet</strong><p>Create the first team robot profile before asking BoltCanvas to reason about hardware.</p></div><Link href={createRobotHref} className="button button-primary">Create robot</Link></div>}
          {primaryRobot?.configuration?.theoreticalSpeedFtPerSec ? <div className="calculation-note"><Wrench size={15} /><span><b>{primaryRobot.name}</b> has an ideal calculated drivetrain speed of <b>{primaryRobot.configuration.theoreticalSpeedFtPerSec.toFixed(2)} ft/s</b>. It is not a measured field result.</span></div> : null}
        </section>

        <aside className="today-panel" aria-labelledby="today-title">
          <div className="section-line"><div><span className="section-overline">Team work</span><h2 id="today-title">Today&apos;s work</h2></div><Link href={teamTasksHref} className="icon-link" aria-label="Open tasks"><ArrowRight size={16} /></Link></div>
          {data.tasks.length ? <ul className="work-queue">{data.tasks.slice(0, 3).map((task) => <li key={task.id}><span className={`priority-marker ${task.priority.toLowerCase()}`} aria-label={`${task.priority.toLowerCase()} priority`} /><div><strong>{task.title}</strong><small>{task.assignees.length ? task.assignees.map(({ user }) => authorLabel(user)).join(", ") : "Unassigned"} - {dateLabel(task.dueAt)}</small></div><span className="task-state">{task.status.toLowerCase().replaceAll("_", " ")}</span></li>)}</ul> : (
            <div className="suggested-task"><span className="section-overline">Suggested task</span><strong>{summary.nextMove.title}</strong><p>{summary.nextMove.detail}</p><div><Link href={teamTasksHref} className="button button-quiet">Create task</Link><Link href={summary.nextMove.href} className="text-link">{summary.nextMove.actionLabel} <ArrowRight size={14} /></Link></div></div>
          )}
        </aside>
      </div>

      <section className="engineering-activity-section" aria-labelledby="engineering-activity-title">
        <div className="section-line"><div><span className="section-overline">Engineering evidence</span><h2 id="engineering-activity-title">Recent engineering activity</h2></div><div className="activity-links"><Link href={notebookHref}>Notebook</Link><Link href={buildLogHref}>Build log</Link></div></div>
        {recentActivity.length ? <div className="activity-items">{recentActivity.map((entry) => <article key={`${entry.kind}-${entry.id}`} className="activity-item"><span className="activity-date">{dateLabel(entry.date)}</span><div><small>{entry.kind} - {entry.author}</small><h3>{entry.title}</h3><p>{entry.body}</p></div></article>)}</div> : (
          <div className="compact-empty"><FileClock size={19} /><p>No engineering evidence yet. Record the next meaningful build or test result so the team can reuse what it learned.</p><Link href={buildLogHref}>Add build record</Link></div>
        )}
      </section>
    </section>
  );
}
