import {
  getVexEventRankings,
  getVexTeamSkills,
  getWorldSkillsStandings,
} from "@/lib/services/vex-events";
import {
  positiveIntegerParam,
  requireVexEventsApiUser,
  vexEventsResultResponse,
} from "../responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `scope=event` returns official event rankings. `scope=team-skills` returns
 * official raw skills records. `scope=world` remains intentionally unavailable
 * until an authoritative global standings endpoint is token-verified.
 */
export async function GET(request: Request) {
  const viewer = await requireVexEventsApiUser();
  if (viewer instanceof Response) return viewer;

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") ?? "world";

  if (scope === "world") return vexEventsResultResponse(getWorldSkillsStandings());

  if (scope === "event") {
    const eventId = positiveIntegerParam(searchParams.get("eventId"), "eventId");
    const divisionId = positiveIntegerParam(searchParams.get("divisionId"), "divisionId");
    if (eventId instanceof Response) return eventId;
    if (divisionId instanceof Response) return divisionId;
    if (!eventId || !divisionId) {
      return Response.json(
        {
          status: "invalid_request",
          code: "VEX_EVENTS_INVALID_REQUEST",
          message: "eventId and divisionId are required when scope=event.",
        },
        { status: 400, headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } },
      );
    }
    return vexEventsResultResponse(await getVexEventRankings(eventId, divisionId));
  }

  if (scope === "team-skills") {
    const teamId = positiveIntegerParam(searchParams.get("teamId"), "teamId");
    const seasonId = positiveIntegerParam(searchParams.get("seasonId"), "seasonId");
    if (teamId instanceof Response) return teamId;
    if (seasonId instanceof Response) return seasonId;
    if (!teamId) {
      return Response.json(
        {
          status: "invalid_request",
          code: "VEX_EVENTS_INVALID_REQUEST",
          message: "teamId is required when scope=team-skills.",
        },
        { status: 400, headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } },
      );
    }
    return vexEventsResultResponse(await getVexTeamSkills(teamId, seasonId));
  }

  return Response.json(
    {
      status: "invalid_request",
      code: "VEX_EVENTS_INVALID_REQUEST",
      message: "scope must be world, event, or team-skills.",
    },
    { status: 400, headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } },
  );
}
