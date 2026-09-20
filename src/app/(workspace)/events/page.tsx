import { EventMode } from "@/components/app/event-mode";
import { NeedsTeam } from "@/components/app/team-scope";
import { requireCompletedOnboarding } from "@/lib/authz";
import { getVexEventsConfiguration } from "@/lib/services/vex-events";
import { getWorkspaceTeam } from "@/lib/workspace/data";
import { getTeamSharedState } from "@/lib/workspace/state";

type PageProps = { searchParams: Promise<{ team?: string }> };

export default async function EventsPage({ searchParams }: PageProps) {
  const { team: requestedTeam } = await searchParams;
  const user = await requireCompletedOnboarding("/events");
  const { team } = await getWorkspaceTeam(user.id, requestedTeam);
  if (!team) return <NeedsTeam title="Choose a team before using Event Mode" body="Official event data and team notes are scoped to the selected team workspace." />;
  const shared = await getTeamSharedState(team.id);
  const vexConfiguration = getVexEventsConfiguration();
  const initialState = shared.state.eventMode && typeof shared.state.eventMode === "object" && !Array.isArray(shared.state.eventMode)
    ? shared.state.eventMode as Record<string, unknown>
    : {};
  return <EventMode teamId={team.id} teamNumber={team.teamNumber ?? ""} initialState={initialState} selectedEventId={shared.selectedEventId} officialConfigured={vexConfiguration.configured} officialMessage={vexConfiguration.message ?? "Official VEX Events data is unavailable."} />;
}
