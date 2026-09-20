import { vexEventsClient } from "./client";
import type {
  VexEventSearch,
  VexEventMatches,
  VexEventsEvent,
  VexEventsMatch,
  VexEventsFailure,
  VexEventsResult,
} from "./types";

const EVENT_CACHE_TTL_SECONDS = 15 * 60;

export type VexEventSearchInput = {
  seasonId?: number;
  programId?: number;
  region?: string;
  start?: string;
  end?: string;
  page?: number;
  perPage?: number;
};

function positiveInteger(value: number | undefined, field: string): VexEventsFailure | null {
  if (value === undefined) return null;
  if (Number.isInteger(value) && value > 0) return null;
  return {
    status: "invalid_request",
    code: "VEX_EVENTS_INVALID_REQUEST",
    message: `${field} must be a positive integer.`,
  };
}

function normaliseDate(value: string | undefined, field: string): string | VexEventsFailure | undefined {
  if (!value?.trim()) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return {
      status: "invalid_request",
      code: "VEX_EVENTS_INVALID_REQUEST",
      message: `${field} must be a valid ISO date or timestamp.`,
    };
  }
  return date.toISOString();
}

/** Searches official events. No local event, schedule, or registration data is generated. */
export async function searchVexEvents(
  input: VexEventSearchInput = {},
): Promise<VexEventsResult<VexEventSearch>> {
  const seasonError = positiveInteger(input.seasonId, "seasonId");
  const programError = positiveInteger(input.programId, "programId");
  const pageError = positiveInteger(input.page, "page");
  const perPageError = positiveInteger(input.perPage, "perPage");
  const start = normaliseDate(input.start, "start");
  const end = normaliseDate(input.end, "end");
  const error = [seasonError, programError, pageError, perPageError, start, end].find(
    (candidate): candidate is VexEventsFailure =>
      Boolean(candidate && typeof candidate === "object" && "code" in candidate),
  );
  if (error) return error;

  const result = await vexEventsClient.collection<VexEventsEvent>(
    "events",
    {
      ...(input.seasonId ? { "season[]": input.seasonId } : {}),
      ...(input.programId ? { "program[]": input.programId } : {}),
      ...(input.region?.trim() ? { "region[]": input.region.trim() } : {}),
      ...(typeof start === "string" ? { start } : {}),
      ...(typeof end === "string" ? { end } : {}),
      page: input.page ?? 1,
      per_page: Math.min(input.perPage ?? 50, 250),
    },
    { cacheTtlSeconds: EVENT_CACHE_TTL_SECONDS },
  );
  if (result.status !== "ok") return result;

  return {
    status: "ok",
    data: { events: result.data.data, pagination: result.data.meta },
    source: result.source,
  };
}

export async function getVexEvent(eventId: number): Promise<VexEventsResult<VexEventsEvent | null>> {
  const idError = positiveInteger(eventId, "eventId");
  if (idError) return idError;

  const result = await vexEventsClient.resource<VexEventsEvent>(
    `events/${eventId}`,
    {},
    { cacheTtlSeconds: EVENT_CACHE_TTL_SECONDS },
  );
  if (result.status !== "ok") return result;
  return {
    status: "ok",
    data: result.data,
    source: result.source,
  };
}

export async function getVexEventTeams(eventId: number) {
  const idError = positiveInteger(eventId, "eventId");
  if (idError) return idError;
  return vexEventsClient.collection(
    `events/${eventId}/teams`,
    { per_page: 250 },
    { cacheTtlSeconds: EVENT_CACHE_TTL_SECONDS },
  );
}

export async function getVexEventMatches(eventId: number, divisionId: number): Promise<VexEventsResult<VexEventMatches>> {
  const eventError = positiveInteger(eventId, "eventId");
  const divisionError = positiveInteger(divisionId, "divisionId");
  if (eventError || divisionError) return eventError ?? divisionError!;
  const result = await vexEventsClient.collection<VexEventsMatch>(
    `events/${eventId}/divisions/${divisionId}/matches`,
    { per_page: 250 },
    { cacheTtlSeconds: 5 * 60 },
  );
  if (result.status !== "ok") return result;
  return { status: "ok", data: { eventId, divisionId, matches: result.data.data, pagination: result.data.meta }, source: result.source };
}
