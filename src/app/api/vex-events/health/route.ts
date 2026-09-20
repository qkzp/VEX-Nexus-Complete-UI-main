import { getVexEventsConfiguration, vexEventsCache } from "@/lib/services/vex-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public and intentionally secret-free configuration signal for deployment checks. */
export async function GET() {
  const configuration = getVexEventsConfiguration();
  return Response.json(
    {
      provider: "VEX Events",
      state: configuration.state,
      configured: configuration.configured,
      message: configuration.message ?? "Official VEX Events data is configured.",
      cache: vexEventsCache.snapshot(),
    },
    {
      status: configuration.configured ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
