import pdfParse from "pdf-parse";
import * as mammoth from "mammoth";
import * as Papa from "papaparse";

interface FileProcessor {
  supports(mimeType: string): boolean;
  extractText(buffer: Buffer): Promise<string>;
}

class PDFProcessor implements FileProcessor {
  supports(mimeType: string) {
    return mimeType === "application/pdf";
  }

  async extractText(buffer: Buffer) {
    const data = await pdfParse(buffer);
    return data.text;
  }
}

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
  // Basic PII scrubbing - replace with more comprehensive solution in production
  return text
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[EMAIL]")
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[PHONE]");
};

export const processFile = async (file: File, buffer: Buffer) => {
  const processors: FileProcessor[] = [
    new PDFProcessor(),
    new DocxProcessor(),
    new CSVProcessor(),
  ];

  const processor = processors.find((p) => p.supports(file.type));
  if (!processor) throw new Error("Unsupported file type");

  // GDPR Compliance: Scrub PII before processing
  const rawText = await processor.extractText(buffer);
  const sanitizedText = scrubPII(rawText);

  // Add expiration metadata (24 hours for demo users)
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
    },
  };
};
