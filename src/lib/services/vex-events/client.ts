import process from "node:process";
import { vexEventsCache, type VexEventsCacheState } from "./cache";
import {
  VEX_EVENTS_API_BASE_URL,
  type VexEventsApiCollection,
  type VexEventsConfiguration,
  type VexEventsFailure,
  type VexEventsPagination,
  type VexEventsResult,
  type VexEventsSource,
} from "./types";

type QueryValue = string | number | boolean | readonly (string | number | boolean)[] | undefined | null;
export type VexEventsQuery = Record<string, QueryValue>;

type RequestOptions = {
  cacheTtlSeconds?: number;
};

const DEFAULT_CACHE_TTL_SECONDS = 10 * 60;
const DEFAULT_TIMEOUT_MS = 8_000;
const MAX_CACHE_TTL_SECONDS = 60 * 60;
const MAX_TIMEOUT_MS = 20_000;

function numberFromEnvironment(name: string, fallback: number, maximum: number) {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.floor(parsed), maximum) : fallback;
}

function normaliseBaseUrl(value: string | undefined) {
  const raw = value?.trim() || VEX_EVENTS_API_BASE_URL;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.hostname !== "events.vex.com") return null;
    return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return null;
  }
}

/** Returns only safe configuration metadata; it never returns the API token. */
export function getVexEventsConfiguration(): VexEventsConfiguration {
  const baseUrl = normaliseBaseUrl(process.env.VEX_EVENTS_API_BASE_URL);
  const cacheTtlSeconds = numberFromEnvironment(
    "VEX_EVENTS_CACHE_TTL_SECONDS",
    DEFAULT_CACHE_TTL_SECONDS,
    MAX_CACHE_TTL_SECONDS,
  );
  const timeoutMs = numberFromEnvironment("VEX_EVENTS_TIMEOUT_MS", DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS);

  if (!baseUrl) {
    return {
      state: "misconfigured",
      configured: false,
      baseUrl: VEX_EVENTS_API_BASE_URL,
      cacheTtlSeconds,
      timeoutMs,
      message: "VEX_EVENTS_API_BASE_URL must be an HTTPS URL on events.vex.com.",
    };
  }

  if (!process.env.VEX_EVENTS_API_TOKEN?.trim()) {
    return {
      state: "unconfigured",
      configured: false,
      baseUrl,
      cacheTtlSeconds,
      timeoutMs,
      message: "Official VEX Events data is unavailable on this deployment right now.",
    };
  }

  return { state: "ready", configured: true, baseUrl, cacheTtlSeconds, timeoutMs };
}

function configurationFailure(configuration: VexEventsConfiguration): VexEventsFailure {
  const status = configuration.state === "misconfigured" ? "misconfigured" : "unconfigured";
  return {
    status,
    code: status === "misconfigured" ? "VEX_EVENTS_MISCONFIGURED" : "VEX_EVENTS_UNCONFIGURED",
    message: configuration.message ?? "Official VEX Events data is unavailable.",
  };
}

function encodeQuery(url: URL, query: VexEventsQuery = {}) {
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === "") continue;
    const values = Array.isArray(value) ? value : [value];
    values.forEach((item) => url.searchParams.append(key, String(item)));
  }
}

function toPagination(value: unknown): VexEventsPagination | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const meta = value as Record<string, unknown>;
  const numberValue = (key: string) => {
    const parsed = Number(meta[key]);
    return Number.isFinite(parsed) ? parsed : undefined;
  };
  return {
    currentPage: numberValue("current_page"),
    from: numberValue("from"),
    lastPage: numberValue("last_page"),
    perPage: numberValue("per_page"),
    to: numberValue("to"),
    total: numberValue("total"),
  };
}

function isCollection<T>(value: unknown): value is { data: T[]; meta?: unknown } {
  return Boolean(value && typeof value === "object" && Array.isArray((value as { data?: unknown }).data));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function safePath(path: string) {
  const normalised = path.replace(/^\/+/, "");
  if (!normalised || normalised.includes("..") || normalised.includes("?") || normalised.includes("#")) {
    throw new Error("The VEX Events API path is invalid.");
  }
  return normalised;
}

function errorFromStatus(status: number, retryAfter: string | null): VexEventsFailure {
  const retryAfterSeconds = retryAfter && Number.isFinite(Number(retryAfter)) ? Number(retryAfter) : undefined;
  if (status === 401 || status === 403) {
    return {
      status: "misconfigured",
      code: "VEX_EVENTS_MISCONFIGURED",
      message: "Official VEX Events data is temporarily unavailable on this deployment.",
    };
  }
  if (status === 429) {
    return {
      status: "rate_limited",
      code: "VEX_EVENTS_RATE_LIMITED",
      message: "VEX Events is rate limiting this request. Try again shortly.",
      retryAfterSeconds,
    };
  }
  return {
    status: "unavailable",
    code: "VEX_EVENTS_UPSTREAM_UNAVAILABLE",
    message:
      status >= 500
        ? "VEX Events is temporarily unavailable. Try again later."
        : "VEX Events could not complete this request. Verify the query and try again.",
    retryAfterSeconds,
  };
}

function malformedResponse(): VexEventsFailure {
  return {
    status: "malformed_response",
    code: "VEX_EVENTS_MALFORMED_RESPONSE",
    message: "VEX Events returned data in an unexpected format. No ranking or team information was inferred.",
  };
}

function sourceFor(configuration: VexEventsConfiguration, cache: VexEventsCacheState, storedAt: number): VexEventsSource {
  return {
    provider: "VEX Events",
    apiBaseUrl: configuration.baseUrl,
    fetchedAt: new Date(storedAt).toISOString(),
    cache,
  };
}

/**
 * Server-only VEX Events client. It intentionally has no public token getter
 * and only accepts relative API paths, preventing it from becoming an open
 * proxy when exposed through an application route handler.
 */
export class VexEventsClient {
  async resource<T>(
    path: string,
    query: VexEventsQuery = {},
    options: RequestOptions = {},
  ): Promise<VexEventsResult<T>> {
    if (typeof window !== "undefined") {
      throw new Error("VexEventsClient may only run on the server.");
    }

    const configuration = getVexEventsConfiguration();
    if (!configuration.configured) return configurationFailure(configuration);

    const url = new URL(`${configuration.baseUrl}/${safePath(path)}`);
    encodeQuery(url, query);
    const cacheKey = url.toString();
    const ttlMs = Math.max(1, options.cacheTtlSeconds ?? configuration.cacheTtlSeconds) * 1_000;

    try {
      const cached = await vexEventsCache.getOrLoad(cacheKey, ttlMs, async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), configuration.timeoutMs);
        try {
          const response = await fetch(url, {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${process.env.VEX_EVENTS_API_TOKEN!.trim()}`,
            },
            cache: "no-store",
            signal: controller.signal,
          });
          if (!response.ok) throw errorFromStatus(response.status, response.headers.get("retry-after"));
          const payload: unknown = await response.json();
          if (!isRecord(payload) || Array.isArray(payload.data) || !isRecord(payload.data)) {
            throw malformedResponse();
          }
          return payload.data as T;
        } finally {
          clearTimeout(timeout);
        }
      });

      return {
        status: "ok",
        data: cached.value,
        source: sourceFor(configuration, cached.state, cached.storedAt),
      };
    } catch (error) {
      return requestFailure(error);
    }
  }

  async collection<T>(
    path: string,
    query: VexEventsQuery = {},
    options: RequestOptions = {},
  ): Promise<VexEventsResult<VexEventsApiCollection<T>>> {
    if (typeof window !== "undefined") {
      throw new Error("VexEventsClient may only run on the server.");
    }

    const configuration = getVexEventsConfiguration();
    if (!configuration.configured) return configurationFailure(configuration);

    const url = new URL(`${configuration.baseUrl}/${safePath(path)}`);
    encodeQuery(url, query);
    const cacheKey = url.toString();
    const ttlMs = Math.max(1, options.cacheTtlSeconds ?? configuration.cacheTtlSeconds) * 1_000;

    try {
      const cached = await vexEventsCache.getOrLoad(cacheKey, ttlMs, async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), configuration.timeoutMs);
        try {
          const response = await fetch(url, {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${process.env.VEX_EVENTS_API_TOKEN!.trim()}`,
            },
            cache: "no-store",
            signal: controller.signal,
          });

          if (!response.ok) throw errorFromStatus(response.status, response.headers.get("retry-after"));
          const payload: unknown = await response.json();
          if (!isCollection<T>(payload)) throw malformedResponse();
          return { data: payload.data, meta: toPagination(payload.meta) } satisfies VexEventsApiCollection<T>;
        } finally {
          clearTimeout(timeout);
        }
      });

      return {
        status: "ok",
        data: cached.value,
        source: sourceFor(configuration, cached.state, cached.storedAt),
      };
    } catch (error) {
      return requestFailure(error);
    }
  }
}

function requestFailure(error: unknown): VexEventsFailure {
  if (isVexEventsFailure(error)) return error;
  if (error instanceof Error && error.name === "AbortError") {
    return {
      status: "unavailable",
      code: "VEX_EVENTS_UPSTREAM_UNAVAILABLE",
      message: "VEX Events did not respond before the configured timeout.",
    };
  }
  return {
    status: "unavailable",
    code: "VEX_EVENTS_UPSTREAM_UNAVAILABLE",
    message: "VEX Events data is temporarily unavailable. Try again later.",
  };
}

function isVexEventsFailure(value: unknown): value is VexEventsFailure {
  return Boolean(
    value &&
      typeof value === "object" &&
      "status" in value &&
      "code" in value &&
      typeof (value as { status?: unknown }).status === "string" &&
      typeof (value as { code?: unknown }).code === "string",
  );
}

export const vexEventsClient = new VexEventsClient();
