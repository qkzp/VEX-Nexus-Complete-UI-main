import { getVexEventMatches } from "@/lib/services/vex-events";
import { positiveIntegerParam, requireVexEventsApiUser, vexEventsResultResponse } from "../responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const viewer = await requireVexEventsApiUser();
  if (viewer instanceof Response) return viewer;
  const { searchParams } = new URL(request.url);
  const eventId = positiveIntegerParam(searchParams.get("eventId"), "eventId");
  const divisionId = positiveIntegerParam(searchParams.get("divisionId"), "divisionId");
  if (eventId instanceof Response) return eventId;
  if (divisionId instanceof Response) return divisionId;
  if (!eventId || !divisionId) return Response.json({ status: "invalid_request", code: "VEX_EVENTS_INVALID_REQUEST", message: "eventId and divisionId are required." }, { status: 400 });
  return vexEventsResultResponse(await getVexEventMatches(eventId, divisionId));
}
