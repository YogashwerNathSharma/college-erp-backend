import { createClient, RedisClientType } from "redis";

/**
 * Redis client configuration (optional caching layer)
 * Falls back gracefully if Redis is not available
 * ⚡ PERF FIX: No retry spam — if Redis is unavailable, uses in-memory fallback
 */

let redisClient: RedisClientType | null = null;
let isConnected = false;
let connectionFailed = false; // ⚡ Prevent repeated connection attempts

export const getRedisClient = async (): Promise<RedisClientType | null> => {
  // ⚡ If already connected, return immediately
  if (redisClient && isConnected) return redisClient;

  // ⚡ If connection previously failed, don't retry (prevents spam)
  // Will retry after 5 minutes
  if (connectionFailed) return null;

  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST || "localhost";
  const redisPort = parseInt(process.env.REDIS_PORT || "6379");
  const redisPassword = process.env.REDIS_PASSWORD || "";

  // ⚡ If no Redis URL/config explicitly set in production, skip entirely
  if (!redisUrl && !process.env.REDIS_HOST) {
    // Local dev without Redis — silently skip
    if (!connectionFailed) {
      console.log("ℹ️  [Redis] No REDIS_URL set — using in-memory cache fallback (this is fine for local dev)");
      connectionFailed = true;

      // Retry after 5 minutes in case Redis comes up later
      setTimeout(() => { connectionFailed = false; }, 5 * 60 * 1000);
    }
    return null;
  }

  try {
    if (redisUrl) {
      redisClient = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            // ⚡ Stop retrying after 3 attempts (prevents infinite spam)
            if (retries > 3) {
              connectionFailed = true;
              setTimeout(() => { connectionFailed = false; }, 5 * 60 * 1000);
              return new Error("Redis max retries reached");
            }
            return Math.min(retries * 500, 3000); // 500ms, 1s, 1.5s then stop
          },
        },
      }) as RedisClientType;
    } else {
      redisClient = createClient({
        socket: {
          host: redisHost,
          port: redisPort,
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              connectionFailed = true;
              setTimeout(() => { connectionFailed = false; }, 5 * 60 * 1000);
              return new Error("Redis max retries reached");
            }
            return Math.min(retries * 500, 3000);
          },
        },
        password: redisPassword || undefined,
      }) as RedisClientType;
    }

    redisClient.on("error", (err) => {
      // ⚡ Only log ONCE, not every retry
      if (isConnected) {
        console.warn("[Redis] Connection lost:", err.message);
      }
      isConnected = false;
    });

    redisClient.on("connect", () => {
      console.log("✅ Redis connected");
      isConnected = true;
      connectionFailed = false;
    });

    redisClient.on("disconnect", () => {
      isConnected = false;
    });

    await redisClient.connect();
    return redisClient;
  } catch (error: any) {
    console.warn("[Redis] Not available:", error.message || "Connection refused");
    console.log("ℹ️  [Redis] Running without cache — dashboard uses in-memory fallback");
    connectionFailed = true;

    // Retry connection after 5 minutes
    setTimeout(() => { connectionFailed = false; }, 5 * 60 * 1000);

    // Cleanup failed client
    if (redisClient) {
      try { await redisClient.quit(); } catch {}
      redisClient = null;
    }

    return null;
  }
};

/**
 * Cache helper functions — all gracefully return null/void if Redis unavailable
 */
export const cacheGet = async (key: string): Promise<string | null> => {
  const client = await getRedisClient();
  if (!client) return null;

  try {
    return await client.get(key) as string | null;
  } catch {
    return null;
  }
};

export const cacheSet = async (key: string, value: string, ttlSeconds: number = 300): Promise<void> => {
  const client = await getRedisClient();
  if (!client) return;

  try {
    await client.setEx(key, ttlSeconds, value);
  } catch (err) {
    // Silently fail — cache is optional
  }
};

export const cacheDel = async (key: string): Promise<void> => {
  const client = await getRedisClient();
  if (!client) return;

  try {
    await client.del(key);
  } catch (err) {
    // Silently fail
  }
};

export const cacheDelPattern = async (pattern: string): Promise<void> => {
  const client = await getRedisClient();
  if (!client) return;

  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (err) {
    // Silently fail
  }
};

/**
 * JSON cache helpers
 */
export const cacheGetJSON = async <T>(key: string): Promise<T | null> => {
  const data = await cacheGet(key);
  if (!data) return null;
  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
};

export const cacheSetJSON = async (key: string, value: any, ttlSeconds: number = 300): Promise<void> => {
  await cacheSet(key, JSON.stringify(value), ttlSeconds);
};

export default { getRedisClient, cacheGet, cacheSet, cacheDel, cacheDelPattern, cacheGetJSON, cacheSetJSON };
