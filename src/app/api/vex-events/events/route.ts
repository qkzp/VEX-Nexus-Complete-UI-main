import { searchVexEvents } from "@/lib/services/vex-events";
import {
  positiveIntegerParam,
  requireVexEventsApiUser,
  vexEventsResultResponse,
} from "../responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Searches official event records only; it does not create local placeholder events. */
export async function GET(request: Request) {
  const viewer = await requireVexEventsApiUser();
  if (viewer instanceof Response) return viewer;

  const { searchParams } = new URL(request.url);
  const seasonId = positiveIntegerParam(searchParams.get("seasonId"), "seasonId");
  const programId = positiveIntegerParam(searchParams.get("programId"), "programId");
  const page = positiveIntegerParam(searchParams.get("page"), "page");
  const perPage = positiveIntegerParam(searchParams.get("perPage"), "perPage");
  if (seasonId instanceof Response) return seasonId;
  if (programId instanceof Response) return programId;
  if (page instanceof Response) return page;
  if (perPage instanceof Response) return perPage;

  return vexEventsResultResponse(
    await searchVexEvents({
      seasonId,
      programId,
      page,
      perPage,
      region: searchParams.get("region") ?? undefined,
      start: searchParams.get("start") ?? undefined,
      end: searchParams.get("end") ?? undefined,
    }),
  );
}
