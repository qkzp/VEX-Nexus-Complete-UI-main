import { FieldLab } from "@/components/app/field-lab";
import { NeedsTeam } from "@/components/app/team-scope";
import { requireCompletedOnboarding } from "@/lib/authz";
import { prisma, withDatabaseFallback } from "@/lib/db";
import { getWorkspaceTeam } from "@/lib/workspace/data";
import { getTeamSharedState } from "@/lib/workspace/state";

type PageProps = { searchParams: Promise<{ team?: string }> };

export default async function FieldLabPage({ searchParams }: PageProps) {
  const { team: requestedTeam } = await searchParams;
  const user = await requireCompletedOnboarding("/field-lab");
  const { team } = await getWorkspaceTeam(user.id, requestedTeam);
  if (!team) return <NeedsTeam title="Choose a team before planning autonomous" body="Autonomous routes are stored in the selected team workspace." />;
  const shared = await getTeamSharedState(team.id);
  const robots = await withDatabaseFallback(
    () =>
      prisma.robot.findMany({
        where: { teamId: team.id, status: { notIn: ["ARCHIVED", "RETIRED"] } },
        orderBy: { updatedAt: "desc" },
        select: { id: true, name: true, configuration: { select: { configurationVersion: true } } },
      }),
    [],
  );
  const initialState = shared.state.fieldLab && typeof shared.state.fieldLab === "object" && !Array.isArray(shared.state.fieldLab)
    ? shared.state.fieldLab as Record<string, unknown>
    : {};
  const eventState = shared.state.eventMode && typeof shared.state.eventMode === "object" && !Array.isArray(shared.state.eventMode)
    ? shared.state.eventMode as Record<string, unknown>
    : {};
  const rawSelectedEvent = eventState.selectedEvent && typeof eventState.selectedEvent === "object" && !Array.isArray(eventState.selectedEvent)
    ? eventState.selectedEvent as Record<string, unknown>
    : null;
  const selectedEvent = rawSelectedEvent
    ? {
        id: typeof rawSelectedEvent.id === "number" ? rawSelectedEvent.id : 0,
        name: typeof rawSelectedEvent.name === "string" ? rawSelectedEvent.name : (typeof rawSelectedEvent.sku === "string" ? rawSelectedEvent.sku : "Selected event"),
        sku: typeof rawSelectedEvent.sku === "string" ? rawSelectedEvent.sku : "",
        divisionName:
          typeof eventState.divisionId === "number" && Array.isArray(rawSelectedEvent.divisions)
            ? (() => {
                const division = rawSelectedEvent.divisions.find((entry) => entry && typeof entry === "object" && (entry as Record<string, unknown>).id === eventState.divisionId) as Record<string, unknown> | undefined;
                return typeof division?.name === "string" ? division.name : typeof division?.code === "string" ? division.code : "Selected division";
              })()
            : "Division not selected",
        start: typeof rawSelectedEvent.start === "string" ? rawSelectedEvent.start : null,
        venue:
          rawSelectedEvent.location && typeof rawSelectedEvent.location === "object"
            ? [("venue" in rawSelectedEvent.location ? (rawSelectedEvent.location as Record<string, unknown>).venue : null), ("city" in rawSelectedEvent.location ? (rawSelectedEvent.location as Record<string, unknown>).city : null), ("region" in rawSelectedEvent.location ? (rawSelectedEvent.location as Record<string, unknown>).region : null)].filter((value): value is string => typeof value === "string" && value.length > 0).join(", ")
            : "",
      }
    : null;
  return <FieldLab teamId={team.id} robots={robots.map((r)=>({ id:r.id, name:r.name, revision:r.configuration?.configurationVersion ?? 0 }))} activeRobotId={shared.activeRobotId} initialState={initialState} selectedEvent={selectedEvent} />;
}
