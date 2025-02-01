import { describe, it, expect, vi, beforeEach } from "vitest";
import { processFile } from "@/src/lib/file-processor";
import { POST as chatHandler } from "@/src/app/api/chat/route";

describe("Concurrent Uploads and Rate Limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle concurrent file uploads", async () => {
    // Create multiple files to upload concurrently
    const files = Array.from({ length: 5 }, (_, i) => ({
      content: `Document ${i + 1} content`,
      name: `doc${i + 1}.txt`,
      type: "text/plain",
    }));

    // Process files concurrently
    const startTime = performance.now();
    const results = await Promise.all(
      files.map((file) =>
        processFile(
          new File([file.content], file.name, { type: file.type }),
          Buffer.from(file.content)
        )
      )
    );
    const processingTime = performance.now() - startTime;

    // Verify all files were processed
    expect(results).toHaveLength(5);
    results.forEach((result, i) => {
      expect(result.metadata.originalName).toBe(files[i].name);
    });

    // Verify concurrent processing was faster than sequential
    // (This is a simple heuristic, adjust based on your needs)
    const averageTimePerFile = processingTime / 5;
    expect(averageTimePerFile).toBeLessThan(1000); // Each file should take less than 1s on average
  });

  it("should enforce rate limits on chat requests", async () => {
    // Mock rate limiter
    vi.mock("@upstash/ratelimit", () => ({
      Ratelimit: vi.fn().mockImplementation(() => ({
        limit: vi
          .fn()
          .mockResolvedValueOnce({ success: true }) // First request succeeds
          .mockResolvedValueOnce({ success: true }) // Second request succeeds
          .mockResolvedValue({ success: false }), // Subsequent requests fail
      })),
    }));

    const makeRequest = () =>
      chatHandler(
        new Request("http://localhost:3000/api/chat", {
          method: "POST",
          body: JSON.stringify({
            messages: [{ role: "user", content: "test query" }],
          }),
          headers: {
            "x-forwarded-for": "127.0.0.1",
          },
        })
      );

    // First two requests should succeed
    const response1 = await makeRequest();
    const response2 = await makeRequest();
    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);

    // Third request should be rate limited
    const response3 = await makeRequest();
    expect(response3.status).toBe(429);
    const errorText = await response3.text();
    expect(errorText).toContain("Too many requests");
  });

  it("should handle multiple users concurrently", async () => {
    const users = ["1.2.3.4", "5.6.7.8", "9.10.11.12"];
    const requestsPerUser = 3;

    // Mock rate limiter with per-user tracking
    const rateLimits = new Map();
    vi.mock("@upstash/ratelimit", () => ({
      Ratelimit: vi.fn().mockImplementation(() => ({
        limit: vi.fn().mockImplementation(async (ip) => {
          const count = rateLimits.get(ip) || 0;
          rateLimits.set(ip, count + 1);
          return { success: count < requestsPerUser };
        }),
      })),
    }));

    // Make concurrent requests for each user
    const requests = users.flatMap((ip) =>
      Array.from({ length: requestsPerUser + 1 }, async () => {
        const response = await chatHandler(
          new Request("http://localhost:3000/api/chat", {
            method: "POST",
            body: JSON.stringify({
              messages: [{ role: "user", content: "test query" }],
            }),
            headers: {
              "x-forwarded-for": ip,
            },
          })
        );
        return { ip, status: response.status };
      })
    );

    const results = await Promise.all(requests);

    // Verify rate limiting worked per user
    users.forEach((ip) => {
      const userResults = results.filter((r) => r.ip === ip);
      const successfulRequests = userResults.filter((r) => r.status === 200);
      const limitedRequests = userResults.filter((r) => r.status === 429);

      expect(successfulRequests).toHaveLength(requestsPerUser);
      expect(limitedRequests).toHaveLength(1);
    });
  });

  it("should maintain performance under load", async () => {
    const numRequests = 10;
    const maxResponseTime = 5000; // 5 seconds

    const requests = Array.from({ length: numRequests }, async (_, i) => {
      const startTime = performance.now();
      const response = await chatHandler(
        new Request("http://localhost:3000/api/chat", {
          method: "POST",
          body: JSON.stringify({
            messages: [{ role: "user", content: `test query ${i}` }],
          }),
        })
      );
      const responseTime = performance.now() - startTime;
      return { response, responseTime };
    });

    const results = await Promise.all(requests);

    // Verify response times
    results.forEach(({ responseTime }) => {
      expect(responseTime).toBeLessThan(maxResponseTime);
    });

    // Calculate performance metrics
    const responseTimes = results.map((r) => r.responseTime);
    const averageTime = responseTimes.reduce((a, b) => a + b) / numRequests;
    const maxTime = Math.max(...responseTimes);

    // Log performance metrics
    console.log(`Average response time: ${averageTime}ms`);
    console.log(`Max response time: ${maxTime}ms`);
    console.log(`Requests per second: ${1000 / averageTime}`);
  });
});
