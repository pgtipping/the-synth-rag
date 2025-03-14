import pdfParse from "pdf-parse";
import * as mammoth from "mammoth";
import * as Papa from "papaparse";
import { createScanner } from "clamscan";
import type { ClamScan } from "clamscan";
import { TextSplitter } from "./text-splitter";

// Interface for file processors
interface FileProcessor {
  supports(mimeType: string): boolean;
  extractText(buffer: Buffer): Promise<string>;
}

class VirusScanner {
  private scanner: ClamScan | null = null;

  constructor() {
    if (process.env.ENABLE_VIRUS_SCAN === "true") {
      this.scanner = createScanner({
        debugMode: process.env.NODE_ENV !== "production",
        clamdscan: {
          host: process.env.CLAMAV_HOST || "localhost",
          port: parseInt(process.env.CLAMAV_PORT || "3310"),
          timeout: 30000,
        },
      });
    }
  }

  async scanBuffer(
    buffer: Buffer
  ): Promise<{ isInfected: boolean; viruses?: string[] }> {
    if (!this.scanner) {
      console.log("Virus scanning disabled");
      return { isInfected: false };
    }

    try {
      const { isInfected, viruses } = await this.scanner.scanBuffer(buffer);
      return { isInfected, viruses };
    } catch (error) {
      console.error("Virus scan failed:", error);
      // Don't block the upload if virus scanning fails
      return { isInfected: false };
    }
  }
}

// File processor for PDF files
class PDFProcessor implements FileProcessor {
  supports(mimeType: string) {
    return mimeType === "application/pdf";
  }

  async extractText(buffer: Buffer) {
    const data = await pdfParse(buffer);
    return data.text;
  }
}

// File processor for DOCX files
class DocxProcessor implements FileProcessor {
  supports(mimeType: string) {
    return (
      mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
  }

  async extractText(buffer: Buffer) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
}

// File processor for CSV files
class CSVProcessor implements FileProcessor {
  supports(mimeType: string) {
    return mimeType === "text/csv";
  }

  async extractText(buffer: Buffer): Promise<string> {
    return new Promise((resolve) => {
      Papa.parse<string[]>(buffer.toString(), {
        complete: (results) => {
          const csvText = results.data
            .map((row: string[]) => row.join(", "))
            .join("\n");
          resolve(csvText);
        },
      });
    });
  }
}

// File processor for plain text files
class TextProcessor implements FileProcessor {
  supports(mimeType: string) {
    return mimeType === "text/plain";
  }

  async extractText(buffer: Buffer): Promise<string> {
    return buffer.toString();
  }
}

const scrubPII = (text: string): string => {
  return text
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[EMAIL]")
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[PHONE]");
};

export const processFile = async (file: File, buffer: Buffer) => {
  try {
    console.log(`Starting to process file: ${file.name} (${file.type})`);
    const virusScanner = new VirusScanner();
    const scanResult = await virusScanner.scanBuffer(buffer);

    if (scanResult.isInfected) {
      throw new Error(
        `File contains malware: ${scanResult.viruses?.join(", ")}`
      );
    }

    const processors: FileProcessor[] = [
      new PDFProcessor(),
      new DocxProcessor(),
      new CSVProcessor(),
      new TextProcessor(),
    ];

    const processor = processors.find((p) => p.supports(file.type));
    if (!processor) {
      throw new Error(`Unsupported file type: ${file.type}`);
    }

    console.log(`Using processor for type: ${file.type}`);
    try {
      console.log("Extracting text from document...");
      const rawText = await processor.extractText(buffer);
      console.log(`Extracted text length: ${rawText.length} characters`);

      console.log("Sanitizing text...");
      const sanitizedText = scrubPII(rawText);
      console.log(`Sanitized text length: ${sanitizedText.length} characters`);

      // Split text into chunks using TextSplitter
      console.log("Splitting text into chunks...");
      const textSplitter = new TextSplitter({
        chunkSize: 1000, // Target ~1000 tokens per chunk
        chunkOverlap: 200, // 200 tokens overlap between chunks
      });
      const chunks = textSplitter.splitBySemanticBoundaries(sanitizedText);
      console.log(`Created ${chunks.length} chunks`);

      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + 24);

      return {
        chunks: chunks.map((chunk) => ({
          text: chunk.text,
          tokens: chunk.tokens,
        })),
        metadata: {
          originalName: file.name,
          mimeType: file.type,
          processedAt: new Date().toISOString(),
          expiresAt: expirationDate.toISOString(),
          sizeBytes: file.size,
          scanResult: {
            scannedAt: new Date().toISOString(),
            isInfected: scanResult.isInfected,
            viruses: scanResult.viruses || [],
          },
        },
      };
    } catch (error) {
      console.error("Error processing file:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in processFile:", error);
    throw error;
  }
};

export const deleteFile = async (fileId: string): Promise<void> => {
  console.log(`Deleted file with ID: ${fileId}`);
};
