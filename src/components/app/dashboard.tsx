import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileClock,
  Flag,
  Plus,
  Radar,
  Route,
  Shield,
  Wrench,
} from "lucide-react";
import { getVexEventsConfiguration } from "@/lib/services/vex-events";
import { VEX_OVERRIDE } from "@/lib/vex-official";
import type { WorkspaceTeam } from "@/lib/workspace/data";

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
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(value);
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

function readinessStatus(progress: number) {
  if (progress >= 80) return { label: "Strong", tone: "good" };
  if (progress >= 45) return { label: "Building", tone: "warn" };
  return { label: "Starting", tone: "neutral" };
}

export function CommandCenter({ userName, team, data }: DashboardProps) {
  if (!team || !data) {
    return (
      <section className="workspace-page command-center empty-command-center">
        <div className="page-kicker">Command center</div>
        <h1>Welcome, {displayName(userName)}.</h1>
        <p className="page-intro">
          Set up your engineering workspace once, then keep the team&apos;s work, robot configuration, and competition
          planning in one place.
        </p>

        <ol className="setup-list">
          <li>
            <span>01</span>
            <div>
              <strong>Join or create a team</strong>
              <p>Private workspaces are shared only with teammates who have a secure invite code.</p>
            </div>
            <Link href="/onboarding/team" className="button button-primary">
              Set up a team <ArrowRight size={15} />
            </Link>
          </li>
          <li className="is-muted">
            <span>02</span>
            <div>
              <strong>Create a robot profile</strong>
              <p>Save real ports, motors, sensors, and drivetrain decisions.</p>
            </div>
          </li>
          <li className="is-muted">
            <span>03</span>
            <div>
              <strong>Start a test or task</strong>
              <p>Record evidence instead of starting with preset activity.</p>
            </div>
          </li>
        </ol>
      </section>
    );
  }

  const vexConfiguration = getVexEventsConfiguration();
  const primaryRobot = data.robots[0];
  const teamLabel = team.teamNumber ? `${team.teamNumber} - ${team.name}` : team.name;
  const teamTasksHref = withTeam("/team/tasks", team.id);
  const robotsHref = withTeam("/robots", team.id);
  const createRobotHref = withTeam("/robots?create=1", team.id);
  const buildLogHref = withTeam("/build-log", team.id);
  const notebookHref = withTeam("/notebook", team.id);
  const rankingsHref = withTeam("/rankings", team.id);
  const fieldLabHref = withTeam("/field-lab", team.id);
  const competitionHref = withTeam("/competition", team.id);
  const readinessChecks = [
    Number(data.robots.length > 0),
    Number(data.robots.some((robot) => robot.configuration?.isComplete)),
    Number(data.tasks.length > 0),
    Number(data.buildLogs.length + data.notebookEntries.length > 0),
    Number(Boolean(data.competition)),
  ];
  const readinessPercent = Math.round((readinessChecks.reduce((sum, item) => sum + item, 0) / readinessChecks.length) * 100);
  const readiness = readinessStatus(readinessPercent);
  const configuredRobotCount = data.robots.filter((robot) => robot.configuration?.isComplete).length;
  const evidenceCount = data.buildLogs.length + data.notebookEntries.length;
  const focusItems = [
    {
      label: "Configured robots",
      value: `${configuredRobotCount}/${data.robots.length || 0}`,
      detail: configuredRobotCount ? "Robots with marked complete hardware." : "No robot is marked complete yet.",
    },
    {
      label: "Open tasks",
      value: String(data.tasks.length),
      detail: data.tasks.length ? "Active team work is already tracked." : "No active task plan is recorded.",
    },
    {
      label: "Evidence entries",
      value: String(evidenceCount),
      detail: evidenceCount ? "Recent build logs and notebook entries exist." : "Engineering evidence has not been logged yet.",
    },
  ];
  const launchCards = [
    {
      href: createRobotHref,
      icon: Bot,
      eyebrow: "Hardware",
      title: "Build a competition-ready robot profile",
      detail: "Lock ports, sensors, drivetrain assumptions, and code generation to the actual machine.",
    },
    {
      href: teamTasksHref,
      icon: ClipboardCheck,
      eyebrow: "Execution",
      title: "Turn goals into assigned work",
      detail: "Keep fixes, driver drills, code cleanup, and pit jobs visible to the whole team.",
    },
    {
      href: fieldLabHref,
      icon: Route,
      eyebrow: "Autonomous",
      title: "Plan an accurate Override route",
      detail: "Use the official field image, waypoint editor, and generated VEX code structure.",
    },
    {
      href: competitionHref,
      icon: Flag,
      eyebrow: "Strategy",
      title: "Review scoring, rules, and field priorities",
      detail: "Keep the manual, Q and A, and field objectives in one decision surface.",
    },
  ];
  const operatingNotes = [
    team.eventRegion
      ? `Region set to ${team.eventRegion}. Keep competition selections aligned with that event area.`
      : "No event region is saved yet. Add one in team settings before heavy event prep.",
    data.competition
      ? `Active competition workspace attached to ${data.competition.name}.`
      : "No planned or active competition is attached to this team yet.",
    `This workspace is scoped to ${team.program}. Season context is tuned for VEX V5RC ${VEX_OVERRIDE.game}.`,
  ];

  return (
    <section className="workspace-page command-center">
      <header className="command-header">
        <div>
          <div className="page-kicker">Command center - {teamLabel}</div>
          <h1>Good work starts with a clear next move.</h1>
          <p>Live workspace data only. No preset robot, activity, or competition record is shown here.</p>
        </div>
        <div className="command-actions">
          <Link href={teamTasksHref} className="button button-quiet">
            <ClipboardCheck size={16} /> Plan work
          </Link>
          <Link href={createRobotHref} className="button button-primary">
            <Plus size={16} /> New robot
          </Link>
        </div>
      </header>

      <section className="command-pulse-panel" aria-label="Team readiness snapshot">
        <div className="command-pulse-hero">
          <span className="section-overline">V5RC readiness snapshot</span>
          <h2>{readinessPercent}% workspace readiness</h2>
          <p>
            This signal comes from saved robot configuration, active work, engineering evidence, and attached competition
            context. It helps the team prioritize what still needs structure.
          </p>
          <div className="command-pulse-badges">
            <span className={`status-chip ${readiness.tone}`}>{readiness.label}</span>
            <span className="status-chip neutral">{team.program}</span>
            <span className="status-chip neutral">
              {VEX_OVERRIDE.season} {VEX_OVERRIDE.game}
            </span>
          </div>
        </div>
        <div className="command-pulse-grid">
          {focusItems.map((item) => (
            <article className="command-pulse-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="command-launch-grid" aria-label="Primary V5RC tools">
        {launchCards.map(({ href, icon: Icon, eyebrow, title, detail }) => (
          <Link className="command-launch-card" href={href} key={title}>
            <span className="command-launch-icon">
              <Icon size={18} />
            </span>
            <span className="section-overline">{eyebrow}</span>
            <strong>{title}</strong>
            <p>{detail}</p>
            <span className="command-launch-link">
              Open tool <ArrowRight size={14} />
            </span>
          </Link>
        ))}
      </section>

      <div className="command-grid">
        <section className="systems-ledger" aria-labelledby="systems-ledger-title">
          <div className="section-line">
            <div>
              <span className="section-overline">Robot workbench</span>
              <h2 id="systems-ledger-title">Systems ledger</h2>
            </div>
            <Link href={robotsHref} className="text-link">
              All robots <ArrowRight size={14} />
            </Link>
          </div>

          {data.robots.length ? (
            <div className="ledger-table" role="table" aria-label="Saved robot profiles">
              <div className="ledger-header" role="row">
                <span role="columnheader">Robot</span>
                <span role="columnheader">Saved configuration</span>
                <span role="columnheader">Evidence</span>
                <span role="columnheader">Next action</span>
              </div>
              {data.robots.map((robot) => {
                const config = robot.configuration;
                const deviceCount = (config?.motors.length ?? 0) + (config?.sensors.length ?? 0) + (config?.pneumatics.length ?? 0);
                const configurationText = config?.drivetrainType
                  ? `${config.drivetrainType.replaceAll("_", " ")} - ${deviceCount} device${deviceCount === 1 ? "" : "s"}`
                  : deviceCount
                    ? `${deviceCount} saved device${deviceCount === 1 ? "" : "s"}`
                    : "No hardware saved";
                const robotHref = withTeam(`/robots/${robot.id}`, team.id);

                return (
                  <div className="ledger-row" role="row" key={robot.id}>
                    <span role="cell">
                      <Bot size={16} />
                      <Link href={robotHref}>{robot.name}</Link>
                    </span>
                    <span role="cell">{configurationText}</span>
                    <span role="cell">
                      <i className={config?.isComplete ? "status-dot verified" : "status-dot pending"} />
                      {config?.isComplete ? "Marked complete" : "No test evidence"}
                    </span>
                    <span role="cell">
                      <Link href={robotHref} className="inline-action">
                        {deviceCount ? "Review hardware" : "Configure"} <ArrowRight size={13} />
                      </Link>
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="inline-empty-state">
              <Bot size={24} aria-hidden="true" />
              <div>
                <strong>No robots yet</strong>
                <p>Create the first team robot profile before asking BoltCanvas to reason about hardware.</p>
              </div>
              <Link href={createRobotHref} className="button button-primary">
                Create robot
              </Link>
            </div>
          )}

          {primaryRobot?.configuration?.theoreticalSpeedFtPerSec ? (
            <div className="calculation-note">
              <Wrench size={15} />{" "}
              <span>
                <b>{primaryRobot.name}</b> has an ideal calculated drivetrain speed of{" "}
                <b>{primaryRobot.configuration.theoreticalSpeedFtPerSec.toFixed(2)} ft/s</b>. It is not a measured field result.
              </span>
            </div>
          ) : null}
        </section>

        <aside className="today-panel" aria-labelledby="today-title">
          <div className="section-line">
            <div>
              <span className="section-overline">Team work</span>
              <h2 id="today-title">Today&apos;s work</h2>
            </div>
            <Link href={teamTasksHref} className="icon-link" aria-label="Open tasks">
              <ArrowRight size={16} />
            </Link>
          </div>
          {data.tasks.length ? (
            <ul className="work-queue">
              {data.tasks.slice(0, 4).map((task) => (
                <li key={task.id}>
                  <span className={`priority-marker ${task.priority.toLowerCase()}`} aria-label={`${task.priority.toLowerCase()} priority`} />
                  <div>
                    <strong>{task.title}</strong>
                    <small>
                      {task.assignees.length ? task.assignees.map(({ user }) => authorLabel(user)).join(", ") : "Unassigned"} -{" "}
                      {dateLabel(task.dueAt)}
                    </small>
                  </div>
                  <span className="task-state">{task.status.toLowerCase().replaceAll("_", " ")}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="compact-empty">
              <ClipboardCheck size={19} />
              <p>No open tasks. Add a task when there is real work to coordinate.</p>
              <Link href={teamTasksHref}>Create task</Link>
            </div>
          )}
          <div className="event-status">
            <CalendarDays size={17} />
            <div>
              <span>Competition</span>
              <strong>{data.competition ? data.competition.name : "No event selected"}</strong>
              <p>
                {data.competition?.startsAt
                  ? `Starts ${dateLabel(data.competition.startsAt)}`
                  : "Attach an official event from Competition when one is selected."}
              </p>
            </div>
          </div>
          <div className="today-focus-note">
            <Radar size={16} />
            <div>
              <strong>Next best use of team time</strong>
              <p>
                {data.tasks.length
                  ? "Finish the top open task, then log the outcome so the decision survives past one meeting."
                  : data.robots.length
                    ? "Convert the next robot improvement into an assigned task before it gets lost in conversation."
                    : "Create the first robot profile so the rest of the workspace can attach to something real."}
              </p>
            </div>
          </div>
        </aside>
      </div>

      <div className="activity-grid">
        <section className="activity-feed" aria-labelledby="engineering-activity-title">
          <div className="section-line">
            <div>
              <span className="section-overline">Evidence</span>
              <h2 id="engineering-activity-title">Engineering record</h2>
            </div>
            <div className="activity-links">
              <Link href={notebookHref}>Notebook</Link>
              <Link href={buildLogHref}>Build log</Link>
            </div>
          </div>
          {data.buildLogs.length || data.notebookEntries.length ? (
            <div className="activity-items">
              {[
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
              ]
                .sort((left, right) => right.date.getTime() - left.date.getTime())
                .slice(0, 5)
                .map((entry) => (
                  <article key={`${entry.kind}-${entry.id}`} className="activity-item">
                    <span className="activity-date">{dateLabel(entry.date)}</span>
                    <div>
                      <small>{entry.kind} - {entry.author}</small>
                      <h3>{entry.title}</h3>
                      <p>{entry.body}</p>
                    </div>
                  </article>
                ))}
            </div>
          ) : (
            <div className="compact-empty">
              <FileClock size={19} />
              <p>The engineering record is empty. Add a build log or notebook entry when work has actually happened.</p>
            </div>
          )}
        </section>

        <aside className="official-data-panel">
          <span className="section-overline">Official VEX Events data</span>
          <h2>Competition context</h2>
          {vexConfiguration.configured ? (
            <>
              <p>Official data is connected server-side. Rankings and event results are displayed only where the verified API returns them.</p>
              <Link href={rankingsHref} className="button button-quiet">
                Open official data <ArrowRight size={15} />
              </Link>
            </>
          ) : (
            <>
              <p>Official data is not configured for this deployment yet, so this workspace does not manufacture standings or event results.</p>
              <a
                href="https://events.vex.com/robot-competitions/vex-robotics-competition/standings/skills"
                target="_blank"
                rel="noreferrer"
                className="text-link"
              >
                View VEX Events standings <ExternalLink size={13} />
              </a>
            </>
          )}
          <div className="official-prep-list">
            {operatingNotes.map((note) => (
              <div key={note}>
                <Shield size={14} />
                <span>{note}</span>
              </div>
            ))}
          </div>
          <div className="official-disclaimer">
            <CheckCircle2 size={15} />
            BoltCanvas is an independent workspace and is not an official VEX Robotics service.
          </div>
        </aside>
      </div>
    </section>
  );
}
