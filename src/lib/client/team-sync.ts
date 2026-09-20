export type SyncStatus = "saved" | "saving" | "offline" | "error";

const cacheKey = (teamId: string, section: string) => `boltcanvas-team-cache:${teamId}:${section}`;
const pendingKey = (teamId: string, section: string) => `boltcanvas-team-pending:${teamId}:${section}`;
const queues = new Map<string, Promise<SyncStatus>>();
const revisions = new Map<string, number>();

function get(key: string): string | null {
  try { return typeof window === "undefined" ? null : localStorage.getItem(key); } catch { return null; }
}
function put(key: string, value: string | null) {
  try {
    if (typeof window === "undefined") return;
    if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value);
  } catch { /* Storage may be full or disabled. Server saves must still work. */ }
}

export function readTeamCache<T>(teamId: string, section: string, fallback: T): T {
  try { const raw = get(pendingKey(teamId, section)) ?? get(cacheKey(teamId, section)); return raw ? JSON.parse(raw) as T : fallback; }
  catch { return fallback; }
}

export function readPendingTeamSection<T>(teamId: string, section: string): T | null {
  try { const raw = get(pendingKey(teamId, section)); return raw ? JSON.parse(raw) as T : null; }
  catch { return null; }
}

export function saveTeamSection(teamId: string, section: string, value: unknown): Promise<SyncStatus> {
  const key = pendingKey(teamId, section);
  const serialized = JSON.stringify(value);
  const revision = (revisions.get(key) ?? 0) + 1;
  revisions.set(key, revision);
  put(cacheKey(teamId, section), serialized);
  // Persist before sending so interrupted requests can be recovered after reload.
  put(key, serialized);
  const previous = queues.get(teamId) ?? Promise.resolve<SyncStatus>("saved");
  const next = previous.then(async (): Promise<SyncStatus> => {
    if (revisions.get(key) !== revision) return "saving";
    try {
      const response = await fetch("/api/team-workspace", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, section, value }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok || response.redirected || !response.headers.get("content-type")?.includes("application/json")) throw new Error("Save failed");
      const result = await response.json();
      if (result.ok !== true) throw new Error("Save not acknowledged");
      if (revisions.get(key) !== revision) return "saving";
      if (get(key) === serialized) put(key, null);
      return "saved";
    } catch {
      if (revisions.get(key) !== revision) return "saving";
      return typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "error";
    }
  });
  queues.set(teamId, next);
  void next.finally(() => { if (queues.get(teamId) === next) queues.delete(teamId); });
  return next;
}

export async function flushPendingTeamSection(teamId: string, section: string): Promise<SyncStatus | null> {
  const raw = get(pendingKey(teamId, section));
  if (!raw) return null;
  try { return await saveTeamSection(teamId, section, JSON.parse(raw)); } catch { return "error"; }
}
