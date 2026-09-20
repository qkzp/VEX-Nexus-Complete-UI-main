import { lookupVexTeams } from "@/lib/services/vex-events";
import { requireVexEventsApiUser, vexEventsResultResponse } from "../responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Protected to avoid turning the VEX token into an unauthenticated proxy.
 * A match only links public VEX Events data; it never verifies team ownership.
 */
export async function GET(request: Request) {
  const viewer = await requireVexEventsApiUser();
  if (viewer instanceof Response) return viewer;

  const { searchParams } = new URL(request.url);
  const teamNumber = searchParams.get("number") ?? "";
  const program = searchParams.get("program")?.trim() || undefined;
  return vexEventsResultResponse(await lookupVexTeams(teamNumber, { program }));
}
