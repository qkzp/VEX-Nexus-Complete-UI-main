import { vexEventsClient } from "./client";
import {
  VEX_EVENTS_PUBLIC_STANDINGS_URL,
  type VexEventRankings,
  type VexEventSkills,
  type VexEventsEventRanking,
  type VexEventsFailure,
  type VexEventsResult,
  type VexEventsSkillsRecord,
  type VexTeamSkills,
} from "./types";

const RANKINGS_CACHE_TTL_SECONDS = 5 * 60;

function positiveId(value: number, label: string): VexEventsFailure | null {
  if (Number.isInteger(value) && value > 0) return null;
  return {
    status: "invalid_request",
    code: "VEX_EVENTS_INVALID_REQUEST",
    message: `${label} must be a positive VEX Events ID.`,
  };
}

/** Returns official event qualification rankings; it never derives an event rank from scores. */
export async function getVexEventRankings(eventId: number, divisionId: number): Promise<VexEventsResult<VexEventRankings>> {
  const inputError = positiveId(eventId, "eventId");
  const divisionError = positiveId(divisionId, "divisionId");
  if (inputError || divisionError) return inputError ?? divisionError!;

  const result = await vexEventsClient.collection<VexEventsEventRanking>(
    `events/${eventId}/divisions/${divisionId}/rankings`,
    { per_page: 250 },
    { cacheTtlSeconds: RANKINGS_CACHE_TTL_SECONDS },
  );
  if (result.status !== "ok") return result;
  return {
    status: "ok",
    data: { eventId, divisionId, rankings: result.data.data, pagination: result.data.meta },
    source: result.source,
  };
}

/** Returns the official raw skills records associated with one team. */
export async function getVexTeamSkills(
  teamId: number,
  seasonId?: number,
): Promise<VexEventsResult<VexTeamSkills>> {
  const inputError = positiveId(teamId, "teamId");
  const seasonError = seasonId === undefined ? null : positiveId(seasonId, "seasonId");
  if (inputError || seasonError) return inputError ?? seasonError!;

  const result = await vexEventsClient.collection<VexEventsSkillsRecord>(
    `teams/${teamId}/skills`,
    {
      ...(seasonId ? { "season[]": seasonId } : {}),
      per_page: 250,
    },
    { cacheTtlSeconds: RANKINGS_CACHE_TTL_SECONDS },
  );
  if (result.status !== "ok") return result;
  return {
    status: "ok",
    data: { teamId, skills: result.data.data, pagination: result.data.meta },
    source: result.source,
  };
}

/** Returns the official raw skills records associated with one event. */
export async function getVexEventSkills(eventId: number): Promise<VexEventsResult<VexEventSkills>> {
  const inputError = positiveId(eventId, "eventId");
  if (inputError) return inputError;

  const result = await vexEventsClient.collection<VexEventsSkillsRecord>(
    `events/${eventId}/skills`,
    { per_page: 250 },
    { cacheTtlSeconds: RANKINGS_CACHE_TTL_SECONDS },
  );
  if (result.status !== "ok") return result;
  return {
    status: "ok",
    data: { eventId, skills: result.data.data, pagination: result.data.meta },
    source: result.source,
  };
}

/**
 * The verified API surface here exposes event rankings and skills records, but
 * no token-tested endpoint has been confirmed for the authoritative global
 * World Skills ordering. Do not sort raw skills records locally: that would
 * fabricate standings and miss official tie-breakers.
 */
export function getWorldSkillsStandings(): VexEventsFailure {
  return {
    status: "not_available",
    code: "VEX_EVENTS_NOT_AVAILABLE",
    message:
      "Authoritative World Skills ordering is not available through this configured API foundation yet. Use the official VEX Events standings while the verified endpoint mapping is completed.",
    officialUrl: VEX_EVENTS_PUBLIC_STANDINGS_URL,
  };
}
