import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { OpenAI } from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { Ratelimit } from "@upstash/ratelimit";
import { embeddingCache, chatCache } from "@/src/lib/cache";
import { NextRequest } from "next/server";
import type { Mock } from "vitest";

vi.mock("openai");
vi.mock("@pinecone-database/pinecone");
vi.mock("@upstash/ratelimit");
vi.mock("@/src/lib/cache");

describe("Chat API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";

    // Reset cache mocks
    (embeddingCache.get as Mock).mockReset();
    (embeddingCache.set as Mock).mockReset();
    (chatCache.get as Mock).mockReset();
    (chatCache.set as Mock).mockReset();
  });

  it("should return cached response if available", async () => {
    const cachedResponse = "This is a cached response";
    (chatCache.get as Mock).mockResolvedValue(cachedResponse);

    const response = await POST(
      new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Test message" }],
        }),
      })
    );

    expect(response.status).toBe(200);
    const reader = response.body?.getReader();
    const { value } = (await reader?.read()) || {};
    const text = new TextDecoder().decode(value);
    expect(text).toContain(cachedResponse);
    expect(chatCache.get).toHaveBeenCalled();
    expect(embeddingCache.get).not.toHaveBeenCalled();
  });

  it("should use cached embedding if available", async () => {
    const cachedEmbedding = new Array(1536).fill(0.1);
    (chatCache.get as Mock).mockResolvedValue(null);
    (embeddingCache.get as Mock).mockResolvedValue(cachedEmbedding);

    const mockPineconeQuery = vi.fn().mockResolvedValue({
      matches: [
        {
          id: "test-id",
          score: 0.9,
          metadata: {
            text: "Test context",
            source: "test.pdf",
          },
        },
      ],
    });

    (Pinecone as unknown as Mock).mockImplementation(() => ({
      index: vi.fn().mockReturnValue({
        query: mockPineconeQuery,
      }),
    }));

    (OpenAI as unknown as Mock).mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [
              {
                message: { content: "Test response" },
                finish_reason: "stop",
              },
            ],
          }),
        },
      },
    }));

    const response = await POST(
      new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Test message" }],
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(embeddingCache.get).toHaveBeenCalled();
    expect(embeddingCache.set).not.toHaveBeenCalled();
  });

  it("should cache new embedding when not in cache", async () => {
    (chatCache.get as Mock).mockResolvedValue(null);
    (embeddingCache.get as Mock).mockResolvedValue(null);

    const mockPineconeQuery = vi.fn().mockResolvedValue({
      matches: [
        {
          id: "test-id",
          score: 0.9,
          metadata: {
            text: "Test context",
            source: "test.pdf",
          },
        },
      ],
    });

    (Pinecone as unknown as Mock).mockImplementation(() => ({
      index: vi.fn().mockReturnValue({
        query: mockPineconeQuery,
      }),
    }));

    (OpenAI as unknown as Mock).mockImplementation(() => ({
      embeddings: {
        create: vi.fn().mockResolvedValue({
          data: [{ embedding: new Array(1536).fill(0.1) }],
        }),
      },
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [
              {
                message: { content: "Test response" },
                finish_reason: "stop",
              },
            ],
          }),
        },
      },
    }));

    const response = await POST(
      new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Test message" }],
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(embeddingCache.get).toHaveBeenCalled();
    expect(embeddingCache.set).toHaveBeenCalled();
  });

  it("should handle valid chat request", async () => {
    const mockPineconeQuery = vi.fn().mockResolvedValue({
      matches: [
        {
          id: "test-id",
          score: 0.9,
          metadata: {
            text: "Test context",
            source: "test.pdf",
          },
        },
      ],
    });

    (Pinecone as unknown as Mock).mockImplementation(() => ({
      index: vi.fn().mockReturnValue({
        query: mockPineconeQuery,
      }),
    }));

    (OpenAI as unknown as Mock).mockImplementation(() => ({
      embeddings: {
        create: vi.fn().mockResolvedValue({
          data: [{ embedding: new Array(1536).fill(0.1) }],
        }),
      },
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [
              {
                message: { content: "Test response" },
                finish_reason: "stop",
              },
            ],
          }),
        },
      },
    }));

    (Ratelimit as unknown as Mock).mockImplementation(() => ({
      limit: vi.fn().mockResolvedValue({
        success: true,
        limit: 10,
        remaining: 9,
        reset: Date.now() + 60000,
      }),
    }));

    const response = await POST(
      new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Test message" }],
        }),
      })
    );

    expect(response.status).toBe(200);
    const reader = response.body?.getReader();
    const { value } = (await reader?.read()) || {};
    const text = new TextDecoder().decode(value);
    expect(text).toContain("Test response");
  });

  it("should handle Pinecone query error", async () => {
    (OpenAI as unknown as Mock).mockImplementation(() => ({
      embeddings: {
        create: vi.fn().mockResolvedValue({
          data: [{ embedding: new Array(1536).fill(0.1) }],
        }),
      },
    }));

    (Pinecone as unknown as Mock).mockImplementation(() => ({
      index: vi.fn().mockReturnValue({
        query: vi.fn().mockRejectedValue(new Error("Vector database error")),
      }),
    }));

    (Ratelimit as unknown as Mock).mockImplementation(() => ({
      limit: vi.fn().mockResolvedValue({
        success: true,
        limit: 10,
        remaining: 9,
        reset: Date.now() + 60000,
      }),
    }));

    const response = await POST(
      new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Test message" }],
        }),
      })
    );

    expect(response.status).toBe(500);
    const text = await response.text();
    expect(text).toContain("Vector database error");
  });

  it("should handle OpenAI embedding error", async () => {
    (OpenAI as unknown as Mock).mockImplementation(() => ({
      embeddings: {
        create: vi
          .fn()
          .mockRejectedValue(new Error("Embedding generation error")),
      },
    }));

    (Ratelimit as unknown as Mock).mockImplementation(() => ({
      limit: vi.fn().mockResolvedValue({
        success: true,
        limit: 10,
        remaining: 9,
        reset: Date.now() + 60000,
      }),
    }));

    const response = await POST(
      new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Test message" }],
        }),
      })
    );

    expect(response.status).toBe(500);
    const text = await response.text();
    expect(text).toContain("Embedding generation error");
  });

  it("should handle rate limiting", async () => {
    (Ratelimit as unknown as Mock).mockImplementation(() => ({
      limit: vi.fn().mockResolvedValue({
        success: false,
        limit: 10,
        remaining: 0,
        reset: Date.now() + 60000,
      }),
    }));

    const response = await POST(
      new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Test message" }],
        }),
      })
    );

    expect(response.status).toBe(429);
    const text = await response.text();
    expect(text).toContain("Too many requests");
  });
});
