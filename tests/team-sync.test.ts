import assert from "node:assert/strict";
import test from "node:test";
import { saveTeamSection, readPendingTeamSection, flushPendingTeamSection } from "../src/lib/client/team-sync.ts";

test("rapid saves preserve newest data, survive reload recovery, and reject login redirects", async () => {
  const storage = new Map<string, string>();
  const originalFetch = globalThis.fetch;
  Object.defineProperty(globalThis, "window", { value: {}, configurable: true });
  Object.defineProperty(globalThis, "localStorage", { value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  }, configurable: true });
  try {
    const requests: number[] = [];
    globalThis.fetch = async (_url, options) => {
      requests.push(JSON.parse(String(options?.body)).value.version);
      return Response.json({ ok: true });
    };
    const first = saveTeamSection("team", "fieldLab", { version: 1 });
    const last = saveTeamSection("team", "fieldLab", { version: 2 });
    assert.deepEqual(readPendingTeamSection("team", "fieldLab"), { version: 2 });
    assert.equal(await first, "saving");
    assert.equal(await last, "saved");
    assert.deepEqual(requests, [2]);
    assert.equal(readPendingTeamSection("team", "fieldLab"), null);

    globalThis.fetch = async () => new Response("<html>Sign in</html>", { headers: { "content-type": "text/html" } });
    assert.equal(await saveTeamSection("team", "fieldLab", { version: 3 }), "error");
    assert.deepEqual(readPendingTeamSection("team", "fieldLab"), { version: 3 });
    globalThis.fetch = async () => Response.json({ ok: true });
    assert.equal(await flushPendingTeamSection("team", "fieldLab"), "saved");
    assert.equal(readPendingTeamSection("team", "fieldLab"), null);

    Object.defineProperty(globalThis, "localStorage", { get: () => { throw new Error("Storage disabled"); }, configurable: true });
    assert.equal(await saveTeamSection("team", "codeLab", {}), "saved");
  } finally {
    globalThis.fetch = originalFetch;
    Reflect.deleteProperty(globalThis, "window");
    Reflect.deleteProperty(globalThis, "localStorage");
  }
});
