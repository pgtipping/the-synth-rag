import redis from "./redis";
import crypto from "crypto";

interface CacheConfig {
  ttl: number; // Time to live in seconds
  namespace: string;
}

export class CacheService {
  private ttl: number;
  private namespace: string;

  constructor(config: CacheConfig) {
    this.ttl = config.ttl;
    this.namespace = config.namespace;
  }

  private generateKey(data: string): string {
    const hash = crypto
      .createHash("sha256")
      .update(`${this.namespace}:${data}`)
      .digest("hex");
    return `cache:${this.namespace}:${hash}`;
  }

  async get<T>(key: string): Promise<T | null> {
    const cacheKey = this.generateKey(key);
    const data = await redis.get(cacheKey);
    return data ? JSON.parse(data as string) : null;
  }

  async set(key: string, value: unknown): Promise<void> {
    const cacheKey = this.generateKey(key);
    await redis
      .multi()
      .set(cacheKey, JSON.stringify(value))
      .expire(cacheKey, this.ttl)
      .exec();
  }

  async delete(key: string): Promise<void> {
    const cacheKey = this.generateKey(key);
    await redis.del(cacheKey);
  }
}

// Create instances for different cache types
export const embeddingCache = new CacheService({
  ttl: 7 * 24 * 60 * 60, // 7 days for embeddings
  namespace: "embeddings",
});

export const chatCache = new CacheService({
  ttl: 24 * 60 * 60, // 24 hours for chat responses
  namespace: "chat",
});

// Helper function to generate a cache key for chat messages
export function generateChatCacheKey(
  messages: Array<{ role: string; content: string }>
): string {
  return messages.map((msg) => `${msg.role}:${msg.content}`).join("|");
}

// Helper function to generate a cache key for embeddings
export function generateEmbeddingCacheKey(text: string): string {
  return text.trim().toLowerCase();
}
