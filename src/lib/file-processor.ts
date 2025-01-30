import pdfParse from "pdf-parse";
import * as mammoth from "mammoth";
import * as Papa from "papaparse";
import { createScanner } from "clamscan";
import type { ClamScan } from "clamscan";

// Interface for file processors
interface FileProcessor {
  supports(mimeType: string): boolean;
  extractText(buffer: Buffer): Promise<string>;
}

class VirusScanner {
  private scanner: ClamScan;

  constructor() {
    this.scanner = createScanner({
      debugMode: process.env.NODE_ENV !== "production",
      clamdscan: {
        host: process.env.CLAMAV_HOST || "localhost",
        port: parseInt(process.env.CLAMAV_PORT || "3310"),
        timeout: 30000,
      },
    });
  }

  async scanBuffer(
    buffer: Buffer
  ): Promise<{ isInfected: boolean; viruses?: string[] }> {
    try {
      const { isInfected, viruses } = await this.scanner.scanBuffer(buffer);
      return { isInfected, viruses };
    } catch (error) {
      console.error("Virus scan failed:", error);
      throw new Error("File scanning failed. Please try again later.");
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

// File processor for CSV files. This class uses the PapaParse library to parse CSV data.
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

const scrubPII = (text: string): string => {
  return text
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[EMAIL]")
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[PHONE]");
};

export const processFile = async (file: File, buffer: Buffer) => {
  const virusScanner = new VirusScanner();
  const scanResult = await virusScanner.scanBuffer(buffer);

  if (scanResult.isInfected) {
    throw new Error(`File contains malware: ${scanResult.viruses?.join(", ")}`);
  }

  const processors: FileProcessor[] = [
    new PDFProcessor(),
    new DocxProcessor(),
    new CSVProcessor(),
  ];

  const processor = processors.find((p) => p.supports(file.type));
  if (!processor) throw new Error("Unsupported file type");

  const rawText = await processor.extractText(buffer);
  const sanitizedText = scrubPII(rawText);

  const expirationDate = new Date();
  expirationDate.setHours(expirationDate.getHours() + 24);

  return {
    text: sanitizedText,
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
};

export const deleteFile = async (fileId: string): Promise<void> => {
  console.log(`Deleted file with ID: ${fileId}`);
};
