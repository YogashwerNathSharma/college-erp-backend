import { createClient, RedisClientType } from "redis";

/**
 * Redis client configuration (optional caching layer)
 * Falls back gracefully if Redis is not available
 */

let redisClient: RedisClientType | null = null;
let isConnected = false;

export const getRedisClient = async (): Promise<RedisClientType | null> => {
  if (redisClient && isConnected) return redisClient;

  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST || "localhost";
  const redisPort = parseInt(process.env.REDIS_PORT || "6379");
  const redisPassword = process.env.REDIS_PASSWORD;

  try {
    if (redisUrl) {
      redisClient = createClient({ url: redisUrl }) as RedisClientType;
    } else {
      redisClient = createClient({
        socket: { host: redisHost, port: redisPort },
        password: redisPassword || undefined,
      }) as RedisClientType;
    }

    redisClient.on("error", (err) => {
      console.warn("[Redis] Connection error:", err.message);
      isConnected = false;
    });

    redisClient.on("connect", () => {
      console.log("✅ Redis connected");
      isConnected = true;
    });

    redisClient.on("disconnect", () => {
      isConnected = false;
    });

    await redisClient.connect();
    return redisClient;
  } catch (error: any) {
    console.warn("[Redis] Failed to connect:", error.message);
    console.warn("[Redis] Falling back to no-cache mode");
    return null;
  }
};

/**
 * Cache helper functions
 */
export const cacheGet = async (key: string): Promise<string | null> => {
  const client = await getRedisClient();
  if (!client) return null;

  try {
    return await client.get(key);
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
