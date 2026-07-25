// ══════════════════════════════════════════════════════════════════
// SIMPLE IN-MEMORY CACHE (for dashboard performance)
// TTL-based, per-key. No external dependency.
// ══════════════════════════════════════════════════════════════════

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const store = new Map<string, CacheEntry<any>>();

/**
 * Get or compute a value with TTL caching.
 * @param key - Unique cache key (e.g. "dashboard:tenantId")
 * @param ttlMs - Time-to-live in milliseconds (default 30s)
 * @param compute - Async function to compute the value if cache miss
 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  compute: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const existing = store.get(key);
  
  if (existing && existing.expiry > now) {
    return existing.data as T;
  }

  const data = await compute();
  store.set(key, { data, expiry: now + ttlMs });
  return data;
}

/**
 * Invalidate a specific cache key or all keys matching a prefix.
 */
export function invalidateCache(keyOrPrefix: string): void {
  if (store.has(keyOrPrefix)) {
    store.delete(keyOrPrefix);
  } else {
    // Prefix match — invalidate all keys starting with this string
    for (const key of store.keys()) {
      if (key.startsWith(keyOrPrefix)) {
        store.delete(key);
      }
    }
  }
}

/**
 * Clear entire cache.
 */
export function clearCache(): void {
  store.clear();
}

// Auto-cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.expiry < now) store.delete(key);
  }
}, 5 * 60 * 1000);
