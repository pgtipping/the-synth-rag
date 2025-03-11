import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { OpenAI } from "openai";
import { Ratelimit } from "@upstash/ratelimit";
import { chatCache } from "@/src/lib/cache";
import { hybridSearch } from "@/src/lib/hybrid-search";
import { NextRequest } from "next/server";
import type { Mock } from "vitest";

vi.mock("openai");
vi.mock("@upstash/ratelimit");
vi.mock("@/src/lib/cache");
vi.mock("@/src/lib/hybrid-search");

describe("Chat API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
    process.env.PINECONE_API_KEY = "test-pinecone-key";
    process.env.PINECONE_INDEX = "test-index";

    // Reset cache mocks
    (chatCache.get as Mock).mockReset();
    (chatCache.set as Mock).mockReset();
    (hybridSearch as Mock).mockReset();
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
    expect(hybridSearch).not.toHaveBeenCalled();
  });

  it("should use hybrid search for context retrieval", async () => {
    (chatCache.get as Mock).mockResolvedValue(null);

    const mockSearchResults = [
      {
        id: "test-id",
        score: 0.9,
        text: "Test context",
        source: "test.pdf",
        metadata: {
          text: "Test context",
          originalName: "test.pdf",
        },
      },
    ];

    (hybridSearch as Mock).mockResolvedValue(mockSearchResults);

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
          useCase: "test-use-case",
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(hybridSearch).toHaveBeenCalledWith({
      query: "Test message",
      useCase: "test-use-case",
      topK: 5,
      minScore: 0.3,
      vectorWeight: 0.7,
      keywordWeight: 0.3,
    });
  });

  it("should handle no search results", async () => {
    (chatCache.get as Mock).mockResolvedValue(null);
    (hybridSearch as Mock).mockResolvedValue([]);

    const response = await POST(
      new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Test message" }],
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(hybridSearch).toHaveBeenCalled();
    expect(chatCache.set).toHaveBeenCalled();

    const reader = response.body?.getReader();
    const { value } = (await reader?.read()) || {};
    const text = new TextDecoder().decode(value);
    expect(text).toContain(
      "I apologize, but I couldn't find any relevant information"
    );
  });

  it("should handle search errors", async () => {
    (chatCache.get as Mock).mockResolvedValue(null);
    (hybridSearch as Mock).mockRejectedValue(new Error("Search failed"));

    const response = await POST(
      new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Test message" }],
        }),
      })
    );

    expect(response.status).toBe(500);
    expect(hybridSearch).toHaveBeenCalled();
    const text = await response.text();
    expect(text).toContain("Search error");
  });
});
