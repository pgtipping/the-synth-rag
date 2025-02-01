import { describe, it, expect, vi, beforeEach } from "vitest";
import { processFile } from "./file-processor";

describe("File Processor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should process PDF files correctly", async () => {
    const mockFile = new File(["test pdf content"], "test.pdf", {
      type: "application/pdf",
    });
    const mockBuffer = Buffer.from("test pdf content");

    const result = await processFile(mockFile, mockBuffer);

    expect(result).toHaveProperty("text", "Mocked PDF content");
    expect(result).toHaveProperty("metadata");
    expect(result.metadata).toHaveProperty("originalName", "test.pdf");
    expect(result.metadata).toHaveProperty("mimeType", "application/pdf");
  });

  it("should process DOCX files correctly", async () => {
    const mockFile = new File(["test docx content"], "test.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const mockBuffer = Buffer.from("test docx content");

    const result = await processFile(mockFile, mockBuffer);

    expect(result).toHaveProperty("text", "Mocked DOCX content");
    expect(result.metadata).toHaveProperty("originalName", "test.docx");
  });

  it("should process CSV files correctly", async () => {
    const mockFile = new File(["test,csv,content"], "test.csv", {
      type: "text/csv",
    });
    const mockBuffer = Buffer.from("test,csv,content");

    const result = await processFile(mockFile, mockBuffer);

    expect(result).toHaveProperty("text", "mocked, csv, content");
    expect(result.metadata).toHaveProperty("originalName", "test.csv");
  });

  it("should throw error for unsupported file types", async () => {
    const mockFile = new File(["test content"], "test.xyz", {
      type: "application/xyz",
    });
    const mockBuffer = Buffer.from("test content");

    await expect(processFile(mockFile, mockBuffer)).rejects.toThrow(
      "Unsupported file type"
    );
  });

  it("should scrub PII from processed text", async () => {
    const mockFile = new File(
      ["Contact: test@email.com and phone: 123-456-7890"],
      "test.txt",
      { type: "text/plain" }
    );
    const mockBuffer = Buffer.from(
      "Contact: test@email.com and phone: 123-456-7890"
    );

    const result = await processFile(mockFile, mockBuffer);

    expect(result.text).not.toContain("test@email.com");
    expect(result.text).not.toContain("123-456-7890");
    expect(result.text).toContain("[EMAIL]");
    expect(result.text).toContain("[PHONE]");
    expect(result.metadata).toHaveProperty("originalName", "test.txt");
    expect(result.metadata).toHaveProperty("mimeType", "text/plain");
  });

  it("should include correct metadata in the result", async () => {
    const mockFile = new File(["test content"], "test.pdf", {
      type: "application/pdf",
    });
    const mockBuffer = Buffer.from("test content");

    const result = await processFile(mockFile, mockBuffer);

    expect(result.metadata).toMatchObject({
      originalName: "test.pdf",
      mimeType: "application/pdf",
      sizeBytes: expect.any(Number),
      processedAt: expect.any(String),
      expiresAt: expect.any(String),
      scanResult: {
        scannedAt: expect.any(String),
        isInfected: false,
        viruses: [],
      },
    });
  });
});
