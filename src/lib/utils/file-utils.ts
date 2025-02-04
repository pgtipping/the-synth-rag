import { storage } from "../storage";

export interface FileValidationResult {
  exists: boolean;
  error?: string;
  isExpired?: boolean;
}

export type FileStatus = "uploading" | "indexing" | "completed" | "error";
export type ProcessingStage =
  | "uploading"
  | "processing"
  | "indexing"
  | "completed";

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  preview?: string;
  status: FileStatus;
  processingStage?: ProcessingStage;
  error?: string;
  uploadedAt: Date;
  expiresAt?: Date;
}

export async function validateFileUrl(
  url: string
): Promise<FileValidationResult> {
  try {
    // Extract UUID from URL
    const matches = url.match(
      /\/files\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
    );
    if (!matches) {
      return {
        exists: false,
        error: "Invalid file URL format",
      };
    }

    const response = await fetch(url, { method: "HEAD" });
    if (!response.ok) {
      return {
        exists: false,
        error: `File not found: ${response.statusText}`,
      };
    }

    // Check for expiration header if available
    const expiresHeader = response.headers.get("expires");
    if (expiresHeader) {
      const expirationDate = new Date(expiresHeader);
      if (expirationDate < new Date()) {
        return {
          exists: true,
          isExpired: true,
          error: "File has expired",
        };
      }
    }

    return { exists: true };
  } catch (error) {
    return {
      exists: false,
      error:
        error instanceof Error ? error.message : "Failed to validate file URL",
    };
  }
}

export function generateFileId(originalName: string): string {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 15)}-${originalName.replace(/[^a-zA-Z0-9]/g, "")}`;
}

export type SupportedExtension =
  | "pdf"
  | "doc"
  | "docx"
  | "xls"
  | "xlsx"
  | "txt"
  | "csv"
  | "json"
  | "md"
  | "markdown";

export const SUPPORTED_FILE_TYPES = {
  "application/pdf": ["pdf"],
  "application/msword": ["doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    "docx",
  ],
  "application/vnd.ms-excel": ["xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["xlsx"],
  "text/plain": ["txt"],
  "text/csv": ["csv"],
  "application/json": ["json"],
  "text/markdown": ["md", "markdown"],
} as const;

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export function isFileTypeSupported(file: File): boolean {
  const extension = getFileExtension(file.name);
  const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES).flat();
  return supportedExtensions.includes(extension as SupportedExtension);
}

export function getFileSizeLimit(fileType: string): number {
  // Size limits in bytes
  const MB = 1024 * 1024;

  switch (fileType) {
    case "application/pdf":
      return 50 * MB; // 50MB for PDFs
    case "text/plain":
    case "text/csv":
    case "application/json":
    case "text/markdown":
      return 10 * MB; // 10MB for text files
    default:
      return 25 * MB; // 25MB default limit
  }
}

export async function cleanupExpiredFiles(
  files: FileMetadata[]
): Promise<string[]> {
  const deletedFiles: string[] = [];

  for (const file of files) {
    if (file.expiresAt && new Date(file.expiresAt) < new Date()) {
      try {
        if (file.url) {
          await storage.delete(file.id);
          deletedFiles.push(file.id);
        }
      } catch (error) {
        console.error(`Failed to delete expired file ${file.id}:`, error);
      }
    }
  }

  return deletedFiles;
}

export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
