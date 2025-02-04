import { describe, it, expect, vi, beforeEach } from "vitest";
import { processFile } from "@/src/lib/file-processor";
import { POST as chatHandler } from "@/src/app/api/chat/route";
import {
  Pinecone,
  type Index,
  type RecordMetadata,
} from "@pinecone-database/pinecone";

type MockPineconeIndex = Partial<Index<RecordMetadata>> & {
  query: ReturnType<typeof vi.fn>;
};

describe("Upload to Chat Integration Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockIndex = (): MockPineconeIndex => {
    const mockQuery = vi.fn().mockResolvedValue({
      matches: [{ metadata: { text: "test content" } }],
    });

    return {
      upsert: vi.fn().mockResolvedValue({ upsertedCount: 1 }),
      query: mockQuery,
      _deleteMany: vi.fn(),
      _deleteOne: vi.fn(),
      _describeIndexStats: vi.fn(),
      _listPaginated: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
      fetch: vi.fn(),
      describe: vi.fn(),
    };
  };

  it("should process file and use its content in chat", async () => {
    // Step 1: Process a test file
    const testContent =
      "This is a test document about artificial intelligence.";
    const testFile = new File([testContent], "test.txt", {
      type: "text/plain",
    });
    const testBuffer = Buffer.from(testContent);

    const processResult = await processFile(testFile, testBuffer);
    expect(processResult).toHaveProperty("text");
    expect(processResult.metadata).toHaveProperty("originalName", "test.txt");

    // Step 2: Verify the processed content is indexed in Pinecone
    const mockPinecone = vi.mocked(Pinecone);
    const mockIndex = createMockIndex();
    mockIndex.query.mockResolvedValue({
      matches: [{ metadata: { text: testContent } }],
    });

    mockPinecone.mockImplementation(() => ({
      index: () => mockIndex as Index<RecordMetadata>,
    }));

    // Step 3: Make a chat request related to the uploaded content
    const chatRequest = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "What is the document about?" }],
      }),
    });

    const chatResponse = await chatHandler(chatRequest);
    expect(chatResponse.status).toBe(200);

    // Verify that Pinecone was queried for relevant context
    expect(mockIndex.query).toHaveBeenCalled();
  });

  it("should handle multiple file uploads and use combined context", async () => {
    const files = [
      {
        content: "Document 1 about machine learning.",
        name: "ml.txt",
        type: "text/plain",
      },
      {
        content: "Document 2 about deep learning.",
        name: "dl.txt",
        type: "text/plain",
      },
    ];

    // Process multiple files
    const processResults = await Promise.all(
      files.map((file) =>
        processFile(
          new File([file.content], file.name, { type: file.type }),
          Buffer.from(file.content)
        )
      )
    );

    expect(processResults).toHaveLength(2);
    processResults.forEach((result, index) => {
      expect(result.metadata.originalName).toBe(files[index].name);
    });

    // Setup Pinecone mock to return combined context
    const mockPinecone = vi.mocked(Pinecone);
    const mockIndex = createMockIndex();
    mockIndex.query.mockResolvedValue({
      matches: files.map((file) => ({
        metadata: { text: file.content },
      })),
    });

    mockPinecone.mockImplementation(() => ({
      index: () => mockIndex as Index<RecordMetadata>,
    }));

    // Make a chat request that should use context from both files
    const chatRequest = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: "What topics are covered in the documents?",
          },
        ],
      }),
    });

    const chatResponse = await chatHandler(chatRequest);
    expect(chatResponse.status).toBe(200);

    // Verify that Pinecone was queried
    expect(mockIndex.query).toHaveBeenCalled();
    const queryCall = mockIndex.query.mock.calls[0][0];
    expect(queryCall).toHaveProperty("topK", 3); // Verify we're getting multiple contexts
  });

  it("should handle file processing errors gracefully", async () => {
    // Test with an unsupported file type
    const invalidFile = new File(["test"], "test.xyz", {
      type: "application/xyz",
    });
    const invalidBuffer = Buffer.from("test");

    await expect(processFile(invalidFile, invalidBuffer)).rejects.toThrow(
      "Unsupported file type"
    );

    // Verify chat still works with existing context
    const mockPinecone = vi.mocked(Pinecone);
    mockPinecone.mockImplementation(() => ({
      index: () => ({
        query: vi.fn().mockResolvedValue({
          matches: [{ metadata: { text: "Existing context" } }],
        }),
      }),
    }));

    const chatRequest = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "test query" }],
      }),
    });

    const chatResponse = await chatHandler(chatRequest);
    expect(chatResponse.status).toBe(200);
  });

  it("should handle large files and maintain performance", async () => {
    // Create a large file (1MB)
    const largeContent = "x".repeat(1024 * 1024);
    const largeFile = new File([largeContent], "large.txt", {
      type: "text/plain",
    });
    const largeBuffer = Buffer.from(largeContent);

    const startTime = performance.now();
    const processResult = await processFile(largeFile, largeBuffer);
    const processingTime = performance.now() - startTime;

    // Verify processing time is reasonable (adjust threshold as needed)
    expect(processingTime).toBeLessThan(5000); // Should process within 5 seconds
    expect(processResult).toHaveProperty("text");
    expect(processResult.metadata.sizeBytes).toBeGreaterThan(1000000);
  });
});
