/**
 * In-memory client-side API cache with in-flight request deduplication
 * and instant cache invalidation upon Create/Delete/Upload operations.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cacheStore = new Map<string, CacheEntry<any>>();
const inFlightRequests = new Map<string, Promise<any>>();

// Default cache TTL: 15 minutes (or until invalidated on Upload/Delete)
const DEFAULT_TTL_MS = 15 * 60 * 1000;

export async function fetchWithCache<T = any>(
  url: string,
  options?: {
    forceFresh?: boolean;
    ttlMs?: number;
    init?: RequestInit;
  }
): Promise<T> {
  const { forceFresh = false, ttlMs = DEFAULT_TTL_MS, init } = options || {};

  // 1. If not forcing fresh, check memory cache
  if (!forceFresh) {
    const cached = cacheStore.get(url);
    if (cached && Date.now() - cached.timestamp < ttlMs) {
      return cached.data as T;
    }
  }

  // 2. In-flight request deduplication (prevents duplicate simultaneous calls)
  if (!forceFresh && inFlightRequests.has(url)) {
    return inFlightRequests.get(url) as Promise<T>;
  }

  // 3. Perform network fetch
  const fetchPromise = (async () => {
    try {
      const res = await fetch(url, init);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      cacheStore.set(url, {
        data,
        timestamp: Date.now(),
      });
      return data as T;
    } finally {
      inFlightRequests.delete(url);
    }
  })();

  inFlightRequests.set(url, fetchPromise);
  return fetchPromise;
}

/**
 * Invalidate cached endpoints matching an optional prefix/pattern,
 * or clear the entire API cache.
 */
export function invalidateApiCache(pattern?: string | RegExp): void {
  if (!pattern) {
    cacheStore.clear();
    return;
  }

  for (const key of cacheStore.keys()) {
    if (typeof pattern === "string") {
      if (key.includes(pattern)) {
        cacheStore.delete(key);
      }
    } else if (pattern.test(key)) {
      cacheStore.delete(key);
    }
  }
}

export function getCachedData<T = any>(url: string): T | null {
  const entry = cacheStore.get(url);
  return entry ? (entry.data as T) : null;
}

export function setCachedData<T = any>(url: string, data: T): void {
  cacheStore.set(url, {
    data,
    timestamp: Date.now(),
  });
}
