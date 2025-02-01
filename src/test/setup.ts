import "@testing-library/jest-dom";
import { beforeAll, afterAll, afterEach, vi } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

// Mock environment variables
vi.mock("process.env", () => ({
  OPENAI_API_KEY: "test-openai-key",
  PINECONE_API_KEY: "test-pinecone-key",
  PINECONE_INDEX: "test-index",
  UPSTASH_REDIS_REST_URL: "test-redis-url",
  CLAMAV_HOST: "localhost",
  CLAMAV_PORT: "3310",
  NODE_ENV: "test",
}));

// Mock ClamAV scanner
vi.mock("clamscan", () => ({
  createScanner: () => ({
    scanBuffer: vi.fn().mockResolvedValue({ isInfected: false, viruses: [] }),
  }),
}));

// Mock PDF parser
vi.mock("pdf-parse", () => ({
  default: vi.fn().mockResolvedValue({ text: "Mocked PDF content" }),
}));

// Mock DOCX processor
vi.mock("mammoth", () => ({
  extractRawText: vi.fn().mockResolvedValue({ value: "Mocked DOCX content" }),
}));

// Mock CSV parser
vi.mock("papaparse", () => ({
  parse: vi.fn().mockImplementation((_input, options) => {
    options.complete({
      data: [["mocked", "csv", "content"]],
    });
  }),
}));

// Mock OpenAI
vi.mock("openai", () => ({
  OpenAI: vi.fn().mockImplementation(() => ({
    embeddings: {
      create: vi.fn().mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0) }],
      }),
    },
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: "Mocked response" } }],
        }),
      },
    },
  })),
}));

// Mock Pinecone
vi.mock("@pinecone-database/pinecone", () => ({
  Pinecone: vi.fn().mockImplementation(() => ({
    index: vi.fn().mockReturnValue({
      query: vi.fn().mockResolvedValue({
        matches: [
          {
            id: "test-id",
            score: 0.9,
            metadata: { text: "Mocked context" },
          },
        ],
      }),
      upsert: vi.fn().mockResolvedValue({ upsertedCount: 1 }),
    }),
  })),
}));

// Mock Redis and Upstash Ratelimit
vi.mock("@upstash/redis", () => ({
  Redis: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue("OK"),
  })),
}));

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: vi.fn().mockImplementation(() => ({
    limit: vi.fn().mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60000,
    }),
  })),
}));

// Setup MSW server for API mocking
export const server = setupServer(
  http.post("/api/upload", async () => {
    return HttpResponse.json({ success: true, fileId: "test-file-id" });
  }),

  http.post("/api/chat", async () => {
    return HttpResponse.json({
      text: "Mocked AI response",
    });
  })
);

// Start MSW server before tests
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});

// Clean up after all tests are done
afterAll(() => server.close());
