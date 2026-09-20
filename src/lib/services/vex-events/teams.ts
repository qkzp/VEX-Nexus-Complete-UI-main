import { vexEventsClient } from "./client";
import type {
  VexEventsEvent,
  VexEventsFailure,
  VexEventsResult,
  VexEventsTeam,
  VexTeamLookup,
} from "./types";

const TEAM_NUMBER_PATTERN = /^[A-Z0-9][A-Z0-9-]{0,15}$/;
const TEAM_CACHE_TTL_SECONDS = 45 * 60;

export function normaliseVexTeamNumber(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function invalidTeamNumber(): VexEventsFailure {
  return {
    status: "invalid_request",
    code: "VEX_EVENTS_INVALID_REQUEST",
    message: "Enter a valid VEX team number using letters, numbers, and an optional hyphen.",
  };
}

function sameProgram(team: VexEventsTeam, program?: string) {
  if (!program) return true;
  const expected = program.trim().toUpperCase();
  return team.program?.code?.trim().toUpperCase() === expected;
}

/**
 * Looks up public VEX team records by exact number. A match links a private
 * Nexus team to public VEX Events data; it does not prove account ownership.
 */
export async function lookupVexTeams(
  teamNumber: string,
  options: { program?: string } = {},
): Promise<VexEventsResult<VexTeamLookup>> {
  const query = normaliseVexTeamNumber(teamNumber);
  if (!TEAM_NUMBER_PATTERN.test(query)) return invalidTeamNumber();

  const result = await vexEventsClient.collection<VexEventsTeam>(
    "teams",
    {
      "number[]": query,
      per_page: 100,
    },
    { cacheTtlSeconds: TEAM_CACHE_TTL_SECONDS },
  );
  if (result.status !== "ok") return result;

  return {
    status: "ok",
    data: {
      query,
      teams: result.data.data.filter(
        (team) => normaliseVexTeamNumber(team.number) === query && sameProgram(team, options.program),
      ),
      pagination: result.data.meta,
    },
    source: result.source,
  };
}

export async function getVexTeam(teamId: number): Promise<VexEventsResult<VexEventsTeam | null>> {
  if (!Number.isInteger(teamId) || teamId <= 0) {
    return {
      status: "invalid_request",
      code: "VEX_EVENTS_INVALID_REQUEST",
      message: "A positive VEX Events team ID is required.",
    };
  }

  const result = await vexEventsClient.resource<VexEventsTeam>(
    `teams/${teamId}`,
    {},
    { cacheTtlSeconds: TEAM_CACHE_TTL_SECONDS },
  );
  if (result.status !== "ok") return result;

  return {
    status: "ok",
    data: result.data,
    source: result.source,
  };
}

export async function getVexTeamEvents(
  teamId: number,
  seasonId?: number,
): Promise<VexEventsResult<VexEventsEvent[]>> {
  if (!Number.isInteger(teamId) || teamId <= 0) {
    return {
      status: "invalid_request",
      code: "VEX_EVENTS_INVALID_REQUEST",
      message: "A positive VEX Events team ID is required.",
    };
  }

  const result = await vexEventsClient.collection<VexEventsEvent>(
    `teams/${teamId}/events`,
    {
      ...(seasonId ? { "season[]": seasonId } : {}),
      per_page: 250,
    },
    { cacheTtlSeconds: 30 * 60 },
  );
  if (result.status !== "ok") return result;
  return { status: "ok", data: result.data.data, source: result.source };
}
