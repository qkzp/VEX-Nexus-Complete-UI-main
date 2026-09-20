/**
 * Types deliberately model only fields returned by VEX Events.  UI layers must
 * render omitted values as unavailable rather than synthesising a value.
 */

export const VEX_EVENTS_API_BASE_URL = "https://events.vex.com/api/v2";
export const VEX_EVENTS_PUBLIC_STANDINGS_URL =
  "https://events.vex.com/robot-competitions/vex-robotics-competition/standings/skills";

export type VexEventsConfigurationState = "ready" | "unconfigured" | "misconfigured";

export type VexEventsConfiguration = {
  state: VexEventsConfigurationState;
  configured: boolean;
  baseUrl: string;
  cacheTtlSeconds: number;
  timeoutMs: number;
  message?: string;
};

export type VexEventsPagination = {
  currentPage?: number;
  from?: number;
  lastPage?: number;
  perPage?: number;
  to?: number;
  total?: number;
};

export type VexEventsApiCollection<T> = {
  data: T[];
  meta?: VexEventsPagination;
};

export type VexEventsSource = {
  provider: "VEX Events";
  apiBaseUrl: string;
  fetchedAt: string;
  cache: "hit" | "miss" | "stale";
};

export type VexEventsSuccess<T> = {
  status: "ok";
  data: T;
  source: VexEventsSource;
};

export type VexEventsFailureCode =
  | "VEX_EVENTS_UNCONFIGURED"
  | "VEX_EVENTS_MISCONFIGURED"
  | "VEX_EVENTS_INVALID_REQUEST"
  | "VEX_EVENTS_UPSTREAM_UNAVAILABLE"
  | "VEX_EVENTS_RATE_LIMITED"
  | "VEX_EVENTS_MALFORMED_RESPONSE"
  | "VEX_EVENTS_NOT_AVAILABLE";

export type VexEventsFailureStatus =
  | "unconfigured"
  | "misconfigured"
  | "invalid_request"
  | "unavailable"
  | "rate_limited"
  | "malformed_response"
  | "not_available";

export type VexEventsFailure = {
  status: VexEventsFailureStatus;
  code: VexEventsFailureCode;
  message: string;
  retryAfterSeconds?: number;
  officialUrl?: string;
};

export type VexEventsResult<T> = VexEventsSuccess<T> | VexEventsFailure;

export type VexEventsProgram = {
  id?: number;
  code?: string;
  name?: string;
};

export type VexEventsLocation = {
  venue?: string | null;
  address_1?: string | null;
  address_2?: string | null;
  city?: string | null;
  region?: string | null;
  postcode?: string | null;
  country?: string | null;
};

export type VexEventsSeason = {
  id?: number;
  name?: string;
  start?: string;
  end?: string;
};

export type VexEventsTeam = {
  id: number;
  number: string;
  team_name?: string | null;
  robot_name?: string | null;
  organization?: string | null;
  location?: VexEventsLocation | null;
  registered?: boolean;
  program?: VexEventsProgram | null;
  grade?: string | null;
};

export type VexEventsDivision = { id: number; name?: string | null; code?: string | null };

export type VexEventsEvent = {
  id: number;
  sku?: string | null;
  name?: string | null;
  season?: VexEventsSeason | null;
  program?: VexEventsProgram | null;
  start?: string | null;
  end?: string | null;
  location?: VexEventsLocation | null;
  event_region?: string | null;
  grade?: string | null;
  divisions?: VexEventsDivision[] | null;
};


export type VexEventsMatchTeam = { team?: VexEventsTeam | null; sitting?: boolean | null };
export type VexEventsMatchAlliance = {
  color?: "red" | "blue" | string | null;
  score?: number | null;
  teams?: VexEventsMatchTeam[] | null;
};
export type VexEventsMatch = {
  id: number;
  event?: { id?: number; name?: string | null; code?: string | null } | null;
  division?: VexEventsDivision | null;
  round?: number | null;
  instance?: number | null;
  matchnum?: number | null;
  scheduled?: string | null;
  started?: string | null;
  scored?: string | null;
  alliances?: VexEventsMatchAlliance[] | null;
};

export type VexEventMatches = {
  eventId: number;
  divisionId: number;
  matches: VexEventsMatch[];
  pagination?: VexEventsPagination;
};

/** Event ranking fields differ by program and event format, so no rank is inferred. */
export type VexEventsEventRanking = {
  id?: number;
  rank?: number | null;
  team?: VexEventsTeam | null;
  wins?: number | null;
  losses?: number | null;
  ties?: number | null;
  wp?: number | null;
  ap?: number | null;
  sp?: number | null;
};

/** Raw skills records are official observations, not a global standings table. */
export type VexEventsSkillsRecord = {
  id?: number;
  type?: string | null;
  score?: number | null;
  team?: VexEventsTeam | null;
  event?: VexEventsEvent | null;
  season?: VexEventsSeason | null;
  created_at?: string | null;
};

export type VexTeamLookup = {
  query: string;
  teams: VexEventsTeam[];
  pagination?: VexEventsPagination;
};

export type VexEventSearch = {
  events: VexEventsEvent[];
  pagination?: VexEventsPagination;
};

export type VexEventRankings = {
  eventId: number;
  divisionId: number;
  rankings: VexEventsEventRanking[];
  pagination?: VexEventsPagination;
};

export type VexTeamSkills = {
  teamId: number;
  skills: VexEventsSkillsRecord[];
  pagination?: VexEventsPagination;
};

export type VexEventSkills = {
  eventId: number;
  skills: VexEventsSkillsRecord[];
  pagination?: VexEventsPagination;
};
