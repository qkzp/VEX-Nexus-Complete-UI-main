type CacheEntry<T> = {
  value: T;
  storedAt: number;
  expiresAt: number;
};

export type VexEventsCacheState = "hit" | "miss" | "stale";

export type CachedValue<T> = {
  value: T;
  state: VexEventsCacheState;
  storedAt: number;
};

type CacheLoader<T> = () => Promise<T>;

/**
 * A small process-local cache keeps a VEX Events token from being used for
 * duplicate requests. It intentionally stores only official responses and can
 * return a recently expired official response when the upstream is unavailable.
 * A durable cache can be layered behind this contract once database jobs exist.
 */
export class VexEventsCache {
  private readonly entries = new Map<string, CacheEntry<unknown>>();
  private readonly pending = new Map<string, Promise<unknown>>();

  constructor(
    private readonly maxEntries = 250,
    private readonly staleWindowMs = 15 * 60 * 1000,
  ) {}

  async getOrLoad<T>(key: string, ttlMs: number, loader: CacheLoader<T>): Promise<CachedValue<T>> {
    const now = Date.now();
    const current = this.entries.get(key) as CacheEntry<T> | undefined;

    if (current && current.expiresAt > now) {
      return { value: current.value, state: "hit", storedAt: current.storedAt };
    }

    const inFlight = this.pending.get(key) as Promise<T> | undefined;
    if (inFlight) {
      try {
        const value = await inFlight;
        const refreshed = this.entries.get(key) as CacheEntry<T> | undefined;
        return {
          value,
          state: "hit",
          storedAt: refreshed?.storedAt ?? now,
        };
      } catch (error) {
        if (current && current.expiresAt + this.staleWindowMs > now) {
          return { value: current.value, state: "stale", storedAt: current.storedAt };
        }
        throw error;
      }
    }

    const request = loader();
    this.pending.set(key, request);

    try {
      const value = await request;
      this.prune(now);
      this.entries.set(key, {
        value,
        storedAt: now,
        expiresAt: now + Math.max(1_000, ttlMs),
      });
      return { value, state: "miss", storedAt: now };
    } catch (error) {
      if (current && current.expiresAt + this.staleWindowMs > now) {
        return { value: current.value, state: "stale", storedAt: current.storedAt };
      }
      throw error;
    } finally {
      this.pending.delete(key);
    }
  }

  clear(key?: string) {
    if (key) {
      this.entries.delete(key);
      return;
    }
    this.entries.clear();
  }

  snapshot() {
    const now = Date.now();
    let freshEntries = 0;
    let staleEntries = 0;
    this.entries.forEach((entry) => {
      if (entry.expiresAt > now) freshEntries += 1;
      else staleEntries += 1;
    });
    return {
      entries: this.entries.size,
      freshEntries,
      staleEntries,
      pendingRequests: this.pending.size,
    };
  }

  private prune(now: number) {
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt + this.staleWindowMs <= now) this.entries.delete(key);
    }

    while (this.entries.size >= this.maxEntries) {
      const oldest = this.entries.keys().next().value as string | undefined;
      if (!oldest) break;
      this.entries.delete(oldest);
    }
  }
}

export const vexEventsCache = new VexEventsCache();
