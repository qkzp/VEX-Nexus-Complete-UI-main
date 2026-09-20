import { EventMode } from "@/components/app/event-mode";
import { NeedsTeam } from "@/components/app/team-scope";
import { requireCompletedOnboarding } from "@/lib/authz";
import { getVexEventsConfiguration } from "@/lib/services/vex-events";
import { createDashboardSummary } from "@/lib/workspace/dashboard-summary";
import { getTeamDashboard, getWorkspaceTeam } from "@/lib/workspace/data";

type PageProps = { searchParams: Promise<{ team?: string }> };

export default async function EventsPage({ searchParams }: PageProps) {
  const { team: requestedTeam } = await searchParams;
  const user = await requireCompletedOnboarding("/events");
  const { team } = await getWorkspaceTeam(user.id, requestedTeam);
  if (!team) return <NeedsTeam title="Choose a team before using Event Mode" body="Official event data and team notes are scoped to the selected team workspace." />;
  const data = await getTeamDashboard(team.id);
  const vexConfiguration = getVexEventsConfiguration();
  const initialState = data.eventModeState && typeof data.eventModeState === "object" && !Array.isArray(data.eventModeState)
    ? data.eventModeState as Record<string, unknown>
    : {};
  const withTeam = (path: string) => {
    const url = new URL(path, "http://localhost");
    url.searchParams.set("team", team.id);
    return `${url.pathname}?${url.searchParams.toString()}`;
  };
  const summary = createDashboardSummary({
    robots: data.robots,
    tasks: data.tasks,
    evidence: [...data.buildLogs, ...data.notebookEntries],
    routines: data.autonomousRoutines,
    testRuns: data.testRuns,
    competition: data.competition,
    links: {
      createRobot: withTeam("/robots?create=1"),
      robots: withTeam("/robots"),
      testing: withTeam("/testing"),
      autonomous: withTeam("/field-lab"),
      buildLog: withTeam("/build-log"),
      tasks: withTeam("/team/tasks"),
      eventMode: withTeam("/events"),
    },
  });
  return <EventMode teamId={team.id} teamNumber={team.teamNumber ?? ""} initialState={initialState} selectedEventId={data.selectedEventId} officialConfigured={vexConfiguration.configured} officialMessage={vexConfiguration.message ?? "Official VEX Events data is unavailable."} robotHealth={summary.robotHealth} />;
}
