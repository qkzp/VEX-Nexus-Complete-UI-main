export type SyncStatus = "saved" | "saving" | "offline" | "error";

const cacheKey = (teamId: string, section: string) => `boltcanvas-team-cache:${teamId}:${section}`;
const pendingKey = (teamId: string, section: string) => `boltcanvas-team-pending:${teamId}:${section}`;

export function readTeamCache<T>(teamId: string, section: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(cacheKey(teamId, section));
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function saveTeamSection(teamId: string, section: string, value: unknown): Promise<SyncStatus> {
  if (typeof window !== "undefined") {
    localStorage.setItem(cacheKey(teamId, section), JSON.stringify(value));
  }
  try {
    const response = await fetch("/api/team-workspace", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, section, value }),
    });
    if (!response.ok) throw new Error("save failed");
    if (typeof window !== "undefined") localStorage.removeItem(pendingKey(teamId, section));
    return "saved";
  } catch {
    if (typeof window !== "undefined") localStorage.setItem(pendingKey(teamId, section), JSON.stringify(value));
    return typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error";
  }
}

export async function flushPendingTeamSection(teamId: string, section: string): Promise<SyncStatus | null> {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(pendingKey(teamId, section));
  if (!raw) return null;
  try {
    return await saveTeamSection(teamId, section, JSON.parse(raw));
  } catch {
    return "error";
  }
}
