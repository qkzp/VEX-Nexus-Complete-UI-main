import { auth } from "@/auth";
import type { VexEventsResult } from "@/lib/services/vex-events";

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie",
};

export async function requireVexEventsApiUser(): Promise<Response | { id: string }> {
  try {
    const session = await auth();
    if (session?.user?.id) return { id: session.user.id };
  } catch {
    return Response.json(
      {
        status: "unavailable",
        code: "AUTH_SESSION_UNAVAILABLE",
        message: "Your session could not be verified. Sign in again and retry.",
      },
      { status: 503, headers: PRIVATE_HEADERS },
    );
  }

  return Response.json(
    {
      status: "unauthorized",
      code: "AUTHENTICATION_REQUIRED",
      message: "Sign in before requesting official VEX Events data.",
    },
    { status: 401, headers: PRIVATE_HEADERS },
  );
}

export function vexEventsResultResponse<T>(result: VexEventsResult<T>) {
  if (result.status === "ok") {
    return Response.json(result, { status: 200, headers: PRIVATE_HEADERS });
  }

  const statusByResult = {
    unconfigured: 503,
    misconfigured: 503,
    invalid_request: 400,
    unavailable: 502,
    rate_limited: 429,
    malformed_response: 502,
    not_available: 503,
  } as const;
  const headers: Record<string, string> = { ...PRIVATE_HEADERS };
  if (result.retryAfterSeconds) headers["Retry-After"] = String(result.retryAfterSeconds);
  return Response.json(result, { status: statusByResult[result.status], headers });
}

export function positiveIntegerParam(
  value: string | null,
  name: string,
): number | Response | undefined {
  if (value === null || value === "") return undefined;
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed > 0) return parsed;
  return Response.json(
    {
      status: "invalid_request",
      code: "VEX_EVENTS_INVALID_REQUEST",
      message: `${name} must be a positive integer.`,
    },
    { status: 400, headers: PRIVATE_HEADERS },
  );
}
