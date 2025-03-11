import { Ratelimit } from "@upstash/ratelimit";
import redis from "./redis";

interface RateLimiter {
  limit: (identifier?: string) => Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }>;
  remaining: (identifier?: string) => Promise<number>;
}

/**
 * Creates a rate limiter for the specified feature
 * @param feature The feature to rate limit (e.g., "chat", "admin", etc.)
 * @param maxRequests Maximum number of requests allowed in the time window
 * @param window Time window in seconds
 * @returns A rate limiter instance
 */
export async function rateLimit(
  feature: string,
  maxRequests: number = 10,
  window: number = 60
): Promise<RateLimiter> {
  try {
    // Create a sliding window rate limiter with Redis
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, `${window}s`),
      analytics: true,
      prefix: `ratelimit:${feature}`,
    });

    return {
      limit: async (identifier = "default") => {
        try {
          return await limiter.limit(`${identifier}`);
        } catch (error) {
          console.error("Rate limit error:", error);
          return {
            success: true,
            limit: maxRequests,
            remaining: maxRequests,
            reset: Date.now() + window * 1000,
          };
        }
      },
      remaining: async (identifier = "default") => {
        try {
          const result = await limiter.limit(`${identifier}`);
          return result.remaining;
        } catch (error) {
          console.error("Rate limit remaining error:", error);
          return maxRequests;
        }
      },
    };
  } catch (error) {
    console.error("Failed to create rate limiter:", error);
    return createFallbackRateLimiter(maxRequests);
  }
}

/**
 * Creates a fallback rate limiter that doesn't actually limit
 * Used when Redis is not available
 */
function createFallbackRateLimiter(maxRequests: number): RateLimiter {
  return {
    limit: async () => ({
      success: true,
      limit: maxRequests,
      remaining: maxRequests,
      reset: Date.now() + 60 * 1000,
    }),
    remaining: async () => maxRequests,
  };
}
